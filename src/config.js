/* ===== Smart Food — runtime configuration =====
   Values can be overridden at build time via Vite env vars (.env). */

// Yandex Maps JavaScript API + Geocoder key.
// Client-side map keys are public by design; restrict by HTTP-Referer in the Yandex cabinet.
export const YANDEX_MAPS_KEY =
  import.meta.env.VITE_YANDEX_MAPS_KEY || "706468ed-e62d-4917-b002-7459a1f4da99";

// Backend base URL. Used by the (future) API client.
export const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

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
