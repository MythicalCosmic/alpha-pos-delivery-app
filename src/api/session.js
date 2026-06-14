/* ===== Smart Food — session / auth handshake =====
   Two-step auth (BACKEND_API.md §4): POST the Telegram initData once to /auth,
   receive a bearer token (~24h), then send it on every call. initData is NOT
   resent. The raw token is persisted locally so a reload reuses the session
   until it expires; on a 401 we transparently re-login with fresh initData. */

import { api } from "./endpoints.js";
import { setToken, getToken, ApiError } from "./http.js";
import { normalizeMe } from "./normalize.js";

const TOKEN_KEY = "smartfood:token";

// Latest authenticated customer (normalized /auth or /me payload). null until login.
let _customer = null;
export function getCustomer() { return _customer; }

// Raised when we have no Telegram launch payload to authenticate with
// (app opened outside Telegram, or initData stripped). The UI shows a
// "open from Telegram" / retry screen.
export class NoTelegramError extends Error {
  constructor() {
    super("No Telegram init data available");
    this.name = "NoTelegramError";
  }
}

// Pull a captured initData out of the page URL, so the authenticated flow can be
// exercised from a desktop browser:  ?init_data=<verbatim>  (or Telegram's
// ?tgWebAppData=... / #tgWebAppData=...). The value must be the raw, unmodified
// signed string — URLSearchParams decodes it once, which is what /auth expects.
function initDataFromUrl() {
  if (typeof window === "undefined") return "";
  try {
    const q = new URLSearchParams(window.location.search);
    const fromQuery = q.get("init_data") || q.get("tgWebAppData");
    if (fromQuery) return fromQuery;
    const m = (window.location.hash || "").match(/tgWebAppData=([^&]+)/);
    if (m) return decodeURIComponent(m[1]);
  } catch { /* ignore */ }
  return "";
}

// The verbatim signed launch string. Resolution order: dev override (.env) →
// URL param → live Telegram WebApp. The first two let you test in a browser.
export function getInitData() {
  const dev = import.meta.env.VITE_DEV_INIT_DATA;
  if (dev) return dev;
  const url = initDataFromUrl();
  if (url) return url;
  const tg = typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp;
  return (tg && tg.initData) || "";
}

export function hasTelegram() { return !!getInitData(); }

function loadStoredToken() {
  try { return localStorage.getItem(TOKEN_KEY) || null; } catch { return null; }
}
function storeToken(t) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

// Exchange initData for a fresh bearer token. Throws NoTelegramError if there is
// nothing to sign with, or ApiError (401 invalid initData / 403 blocked).
export async function login() {
  const initData = getInitData();
  if (!initData) throw new NoTelegramError();
  const data = await api.login(initData);
  setToken(data.token);
  storeToken(data.token);
  _customer = normalizeMe(data.customer);
  _customer.isNew = !!data.is_new;
  return _customer;
}

/**
 * Ensure we hold a valid session before authenticated calls.
 * Reuses a stored token when still valid (verified via /me); otherwise logs in.
 * @returns the normalized customer
 */
export async function ensureSession() {
  const stored = loadStoredToken();
  if (stored) {
    setToken(stored);
    try {
      _customer = normalizeMe(await api.me());
      return _customer;
    } catch (e) {
      // Only an expired/invalid session (401) should drop the token and re-login.
      // A 403 (blocked), a transient 5xx, or a network error must NOT destroy a
      // still-valid session — rethrow so boot() can surface the real state.
      if (e instanceof ApiError && e.httpStatus === 401) {
        setToken(null);
        storeToken(null);
      } else {
        throw e;
      }
    }
  }
  return login();
}

export function clearSession() {
  _customer = null;
  setToken(null);
  storeToken(null);
}

/**
 * Run an authenticated call, transparently re-authenticating once on a 401
 * (expired session). Use this to wrap every API call made after boot.
 */
export async function authed(fn) {
  try {
    if (!getToken()) await ensureSession();
    return await fn();
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 401) {
      await login();        // fresh initData, new token
      return fn();          // retry exactly once
    }
    throw e;
  }
}
