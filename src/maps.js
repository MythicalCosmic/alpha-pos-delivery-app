/* ===== Smart Food — Yandex Maps (JS API 2.1) loader + geocoding =====
   The interactive map uses the JS API. Geocoding tries the JS API first
   (CORS-safe, works with a combined "JS API + Geocoder" key) and falls back to
   the HTTP Geocoder API (works with a geocoder-only key).

   NOTE: for ymaps.geocode() to work, the key must be a "JavaScript API and
   Geocoder API" key. A plain "JavaScript API" key renders the map but rejects
   geocoding — in that case the HTTP fallback below handles addresses.

   Coordinate order in this module is ALWAYS [latitude, longitude] — matching the
   Yandex JS API default and Telegram's LocationData. The HTTP geocoder uses
   lon,lat internally; we convert at that boundary only. */

import { YANDEX_MAPS_KEY } from "./config.js";

// Yandex has no Uzbek locale; ru_RU gives the best coverage for Uzbekistan.
const LANG_MAP = { uz: "ru_RU", ru: "ru_RU", en: "en_US" };
const ylang = (appLang) => LANG_MAP[appLang] || "ru_RU";

let loaderPromise = null;

// Inject the Yandex Maps script once and resolve with the global `ymaps` (after ready()).
export function loadYmaps(appLang = "ru") {
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") { reject(new Error("no window")); return; }
    if (window.ymaps && window.ymaps.Map) { window.ymaps.ready(() => resolve(window.ymaps)); return; }
    const s = document.createElement("script");
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(YANDEX_MAPS_KEY)}&lang=${ylang(appLang)}`;
    s.async = true;
    s.onload = () => {
      if (!window.ymaps) { loaderPromise = null; reject(new Error("ymaps missing after load")); return; }
      window.ymaps.ready(() => resolve(window.ymaps));
    };
    s.onerror = () => { loaderPromise = null; reject(new Error("Yandex Maps failed to load")); };
    document.head.appendChild(s);
  });
  return loaderPromise;
}

function emptyResult(coords) {
  return { formatted: "", country: "", province: "", city: "", street: "", house: "",
    precision: "", kind: "", lat: coords ? coords[0] : null, lng: coords ? coords[1] : null };
}

// Reject if a promise doesn't settle in time, so a stalled JS-API call falls back to HTTP.
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error((label || "op") + " timeout")), ms)),
  ]);
}

/* ---------- JS API geocoding (preferred) ---------- */

function parseJsGeoObject(go, coords) {
  if (!go) return null;
  const safe = (fn) => { try { return fn(); } catch (e) { return undefined; } };
  const meta = safe(() => go.properties.get("metaDataProperty.GeocoderMetaData")) || {};
  const c = safe(() => go.geometry.getCoordinates());
  return {
    formatted: safe(() => go.getAddressLine()) || meta.text || "",
    country: safe(() => go.getCountry()) || "",
    province: safe(() => (go.getAdministrativeAreas() || [])[0]) || "",
    city: safe(() => (go.getLocalities() || [])[0]) || "",
    street: safe(() => go.getThoroughfare()) || "",
    house: safe(() => go.getPremiseNumber()) || "",
    precision: meta.precision || "",
    kind: meta.kind || "",
    lat: c ? c[0] : (coords ? coords[0] : null),
    lng: c ? c[1] : (coords ? coords[1] : null),
  };
}

async function jsReverse(coords, appLang) {
  const ymaps = await loadYmaps(appLang);
  let res = await ymaps.geocode(coords, { results: 1, kind: "house" });
  let go = res.geoObjects.get(0);
  if (!go) { res = await ymaps.geocode(coords, { results: 1 }); go = res.geoObjects.get(0); }
  return parseJsGeoObject(go, coords);
}

async function jsForward(text, appLang, opts) {
  const ymaps = await loadYmaps(appLang);
  const req = { results: opts.results || 1 };
  if (opts.boundedBy) { req.boundedBy = opts.boundedBy; req.strictBounds = false; }
  const res = await ymaps.geocode(text, req);
  if (opts.results && opts.results > 1) {
    const out = []; res.geoObjects.each((go) => out.push(parseJsGeoObject(go))); return out.filter(Boolean);
  }
  return parseJsGeoObject(res.geoObjects.get(0));
}

/* ---------- HTTP Geocoder API (fallback) ---------- */

function parseHttpGeoObject(go) {
  if (!go) return null;
  const meta = (go.metaDataProperty && go.metaDataProperty.GeocoderMetaData) || {};
  const comps = (meta.Address && meta.Address.Components) || [];
  const byKind = (k) => { const c = comps.find((x) => x.kind === k); return c ? c.name : ""; };
  let lat = null, lng = null;
  if (go.Point && go.Point.pos) { const p = go.Point.pos.split(" "); lng = parseFloat(p[0]); lat = parseFloat(p[1]); }
  return {
    formatted: meta.text || "",
    country: byKind("country"),
    province: byKind("province"),
    city: byKind("locality"),
    street: byKind("street"),
    house: byKind("house"),
    precision: meta.precision || "",
    kind: meta.kind || "",
    lat, lng,
  };
}

async function httpGeocode(geocodeParam, appLang, extra = {}) {
  const params = new URLSearchParams({
    apikey: YANDEX_MAPS_KEY, format: "json", lang: ylang(appLang),
    geocode: geocodeParam, results: String(extra.results || 1),
  });
  if (extra.kind) params.set("kind", extra.kind);
  const url = `https://geocode-maps.yandex.ru/1.x/?${params.toString()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("http geocoder " + r.status);
  const data = await r.json();
  const members = data?.response?.GeoObjectCollection?.featureMember || [];
  return members.map((m) => m.GeoObject);
}

async function httpReverse(coords, appLang) {
  const members = await httpGeocode(`${coords[1]},${coords[0]}`, appLang, { kind: "house", results: 1 });
  const parsed = parseHttpGeoObject(members[0]);
  if (parsed && (parsed.lat == null || parsed.lng == null)) { parsed.lat = coords[0]; parsed.lng = coords[1]; }
  return parsed;
}

async function httpForward(text, appLang, opts) {
  const members = await httpGeocode(text, appLang, { results: opts.results || 1 });
  if (opts.results && opts.results > 1) return members.map(parseHttpGeoObject).filter(Boolean);
  return parseHttpGeoObject(members[0]);
}

/* ---------- public API: try JS first, then HTTP ---------- */

// Coordinates -> address.
export async function reverseGeocode(coords, appLang = "ru") {
  try {
    const p = await withTimeout(jsReverse(coords, appLang), 6000, "js reverse");
    if (p && (p.formatted || p.street || p.house)) return p;
  } catch (e) { console.warn("[maps] JS reverse geocode failed:", e?.message || e); }
  try {
    const p = await httpReverse(coords, appLang);
    if (p) return p;
  } catch (e) { console.warn("[maps] HTTP reverse geocode failed:", e?.message || e); }
  return emptyResult(coords);
}

// Address text -> coordinates (single, or list when opts.results > 1).
export async function forwardGeocode(text, appLang = "ru", opts = {}) {
  try {
    const p = await withTimeout(jsForward(text, appLang, opts), 6000, "js forward");
    if (p && (Array.isArray(p) ? p.length : p.lat != null)) return p;
  } catch (e) { console.warn("[maps] JS forward geocode failed:", e?.message || e); }
  try {
    const p = await httpForward(text, appLang, opts);
    if (p) return p;
  } catch (e) { console.warn("[maps] HTTP forward geocode failed:", e?.message || e); }
  return opts.results && opts.results > 1 ? [] : null;
}

// "Street 12" short line, falling back to the full formatted address.
export function addressLine(p) {
  if (!p) return "";
  return [p.street, p.house].filter(Boolean).join(" ") || p.formatted || "";
}

export function isExact(p) { return !!p && p.precision === "exact"; }
