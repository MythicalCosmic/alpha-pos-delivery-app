/* ===== Smart Food — low-level HTTP client for the /api/smartfood API =====

   Implements the response-envelope contract from BACKEND_API.md §2–§3:
     • success            -> unwrap and return `data`
     • closed (HTTP 200)  -> { success:false, closed:true, reason }   → ClosedError
     • cart/order conflict -> { success:false, code, message }        → ConflictError
     • everything else 4xx/5xx                                        → ApiError

   Branch order matters: closed first, then conflict code, then generic failure.
   The bearer token is held in-memory here; session.js owns its persistence. */

import { API_BASE } from "../config.js";

let _token = null;
export function setToken(t) { _token = t || null; }
export function getToken() { return _token; }

/* Thrown for genuine 4xx/5xx envelopes (auth, validation, not-found, server). */
export class ApiError extends Error {
  constructor(envelope, httpStatus) {
    // Framework-level errors (e.g. 405) use {status, status_code, ...} with no
    // top-level `message`, so fall back to `status` then a generic phrase.
    super((envelope && (envelope.message || envelope.status)) || "Request failed");
    this.name = "ApiError";
    this.envelope = envelope || null;
    this.httpStatus = httpStatus;
    this.errors = envelope && envelope.errors;          // field errors (422)
  }
}

/* Store/bot is closed or no cashier on duty. Carries the gating `reason`
   (bot_off | no_cashier). Returned by gated routes as HTTP 200. */
export class ClosedError extends Error {
  constructor(reason, httpStatus) {
    super("closed:" + (reason || "bot_off"));
    this.name = "ClosedError";
    this.reason = reason || "bot_off";
    this.httpStatus = httpStatus;
  }
}

/* Cart/order validation conflict carrying a stable machine `code`
   (item_unavailable, min_order, topping_required, empty_cart, …). */
export class ConflictError extends Error {
  constructor(code, message, httpStatus) {
    super(message || code || "conflict");
    this.name = "ConflictError";
    this.code = code;
    this.serverMessage = message || "";
    this.httpStatus = httpStatus;
  }
}

/* Raised when the backend can't be reached at all (offline, DNS, CORS, TLS).
   Distinct from an ApiError so the UI can offer "retry" vs. surfacing a 4xx. */
export class NetworkError extends Error {
  constructor(cause) {
    super("Network request failed");
    this.name = "NetworkError";
    this.cause = cause;
  }
}

function buildUrl(path, query) {
  let url = API_BASE + path;
  if (query) {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    if (qs) url += "?" + qs;
  }
  return url;
}

/**
 * Issue a request and resolve to the unwrapped `data` on success.
 * @throws ClosedError | ConflictError | ApiError | NetworkError
 */
export async function request(method, path, { body, query, signal } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = "Bearer " + _token;

  let res;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    if (e && e.name === "AbortError") throw e;
    throw new NetworkError(e);
  }

  let env;
  try {
    env = await res.json();
  } catch {
    env = null;
  }

  // 1) Gating: store/bot closed or no cashier. HTTP 200, closed:true.
  if (env && env.closed === true) {
    throw new ClosedError(env.reason, res.status);
  }

  // 2) Cart/order conflict: flat body with a top-level `code`.
  if (env && env.success === false && env.code) {
    throw new ConflictError(env.code, env.message, res.status);
  }

  // 3) Any other failure.
  if (!res.ok || !env || env.success === false) {
    throw new ApiError(env || { message: "Bad response" }, res.status);
  }

  // Success -> unwrap. `data` is omitted on message-only responses (deletes etc.).
  return env.data;
}

export const http = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
  put: (path, body, opts) => request("PUT", path, { ...opts, body }),
  del: (path, opts) => request("DELETE", path, opts),
};
