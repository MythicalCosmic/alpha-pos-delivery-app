/* ===== Smart Food — customer API endpoints (/api/smartfood) =====
   Thin wrappers over http.js. Each returns the raw server `data` payload
   (already unwrapped from the envelope) or throws Closed/Conflict/Api/Network.
   Endpoint list & shapes per BACKEND_API.md §6. */

import { http } from "./http.js";

export const api = {
  // ---- auth ----
  // POST /auth is HTTP 200 / "Success" (not 201) — never assert on 201.
  login: (initData) => http.post("/auth", { init_data: initData }),
  logout: () => http.post("/auth/logout"),

  // ---- profile + config ----
  me: () => http.get("/me"),
  updateMe: (patch) => http.patch("/me", patch),
  config: () => http.get("/config"),

  // ---- catalog (store-open gated) ----
  categories: (lang) => http.get("/catalog/categories", { query: { lang } }),
  products: (q) => http.get("/catalog/products", { query: q }),
  product: (id, lang) => http.get(`/catalog/products/${id}`, { query: { lang } }),

  // ---- cart + orders ----
  quote: (body) => http.post("/cart/quote", body),
  createOrder: (body) => http.post("/orders", body),
  listOrders: (status) => http.get("/orders", { query: { status } }),
  order: (id) => http.get(`/orders/${id}`),
  trackOrder: (id, opts) => http.get(`/orders/${id}/track`, opts),
  cancelOrder: (id) => http.post(`/orders/${id}/cancel`),

  // ---- addresses + geo ----
  addresses: () => http.get("/addresses"),
  createAddress: (body) => http.post("/addresses", body),
  updateAddress: (id, body) => http.put(`/addresses/${id}`, body),
  deleteAddress: (id) => http.del(`/addresses/${id}`),
  setDefaultAddress: (id) => http.put(`/addresses/${id}/default`),
  geoReverse: (lat, lng, lang) => http.get("/geo/reverse", { query: { lat, lng, lang } }),
  geoForward: (q, lang, limit) => http.get("/geo/forward", { query: { q, lang, limit } }),

  // ---- loyalty + rewards + support ----
  loyalty: () => http.get("/loyalty"),
  rewards: (lang) => http.get("/rewards", { query: { lang } }),
  redeemReward: (id) => http.post(`/rewards/${id}/redeem`),
  redemptions: () => http.get("/redemptions"),
  support: () => http.get("/support"),
  tickets: () => http.get("/support/tickets"),
  createTicket: (body) => http.post("/support/tickets", body),
  addTicketMessage: (id, text) => http.post(`/support/tickets/${id}/messages`, { text }),
};
