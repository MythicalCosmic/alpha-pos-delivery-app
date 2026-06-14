/* ===== Smart Food — runtime configuration =====
   Values can be overridden at build time via Vite env vars (.env). */

// Yandex Maps JavaScript API + Geocoder key.
// Client-side map keys are public by design; restrict by HTTP-Referer in the Yandex cabinet.
export const YANDEX_MAPS_KEY =
  import.meta.env.VITE_YANDEX_MAPS_KEY || "706468ed-e62d-4917-b002-7459a1f4da99";

// Backend base URL for the Smart Food customer API. Every customer route lives
// under this prefix (no trailing slash), e.g. `${API_BASE}/config`.
// In production the Mini App is served behind nginx which reverse-proxies this
// same-origin path to the backend, so a relative path is the default. Point it
// at a full origin (https://host/api/smartfood) to talk to a remote backend.
export const API_BASE = (import.meta.env.VITE_API_BASE || "/api/smartfood").replace(/\/+$/, "");

// How often (ms) to re-poll an active order's tracking endpoint.
export const TRACK_POLL_MS = Number(import.meta.env.VITE_TRACK_POLL_MS) || 8000;

// When true (the default), the app may be opened in a plain browser (outside
// Telegram) instead of showing the "open from Telegram" wall — it boots, probes
// the live backend and reports reachability, so you can verify the API works.
// Set VITE_ALLOW_BROWSER=0 to enforce Telegram-only (production) gating.
export const ALLOW_BROWSER = !(
  import.meta.env.VITE_ALLOW_BROWSER === "0" || import.meta.env.VITE_ALLOW_BROWSER === "false"
);

// Default map view — Tashkent city center [latitude, longitude].
export const DEFAULT_CENTER = [41.311081, 69.240562];

// House-level default zoom (16–17 shows individual buildings).
export const DEFAULT_ZOOM = 17;

// Bias geocoding/search to a city box so results stay local.
// [SW[lat,lng], NE[lat,lng]] — Greater Tashkent.
export const GEO_BOUNDS = [
  [41.15, 69.10],
  [41.42, 69.50],
];
