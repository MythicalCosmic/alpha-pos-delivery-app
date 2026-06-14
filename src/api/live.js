/* ===== Smart Food — LIVE data source =====
   Normalizes every /api/smartfood response and wraps calls in the 401-reauth
   guard. Selected by api/index.js when the app runs inside Telegram. */

import { api } from "./endpoints.js";
import { authed } from "./session.js";
import * as N from "./normalize.js";

const items = (d) => (d && Array.isArray(d.items) ? d.items : []);

export const liveDs = {
  // config + profile
  getConfig: () => authed(() => api.config()).then(N.normalizeConfig),
  getMe: () => authed(() => api.me()).then(N.normalizeMe),
  updateMe: (patch) => authed(() => api.updateMe(patch)).then(N.normalizeMe),

  // catalog
  getCategories: (lang) => authed(() => api.categories(lang)).then((d) => items(d).map(N.normalizeCategory)),
  getProducts: (query) => authed(() => api.products(query)).then((d) => items(d).map(N.normalizeProduct)),
  getProduct: (id, lang) => authed(() => api.product(id, lang)).then(N.normalizeProduct),

  // cart + orders
  quote: (body) => authed(() => api.quote(body)).then(N.normalizeQuote),
  createOrder: (body) => authed(() => api.createOrder(body)).then(N.normalizeOrder),
  listOrders: (status) => authed(() => api.listOrders(status)).then((d) => items(d).map(N.normalizeOrder)),
  getOrder: (id) => authed(() => api.order(id)).then(N.normalizeOrder),
  trackOrder: (id, opts) => authed(() => api.trackOrder(id, opts)).then(N.normalizeOrder),
  cancelOrder: (id) => authed(() => api.cancelOrder(id)),

  // addresses + geo
  getAddresses: () => authed(() => api.addresses()).then((d) => items(d).map(N.normalizeAddress)),
  createAddress: (body) => authed(() => api.createAddress(body)).then(N.normalizeAddress),
  updateAddress: (id, body) => authed(() => api.updateAddress(id, body)).then(N.normalizeAddress),
  deleteAddress: (id) => authed(() => api.deleteAddress(id)),
  setDefaultAddress: (id) => authed(() => api.setDefaultAddress(id)),
  geoReverse: (lat, lng, lang) =>
    authed(() => api.geoReverse(lat, lng, lang)).then((d) => (d && d.results ? d.results : []).map(N.normalizeGeoResult)),
  geoForward: (q, lang, limit) =>
    authed(() => api.geoForward(q, lang, limit)).then((d) => (d && d.results ? d.results : []).map(N.normalizeGeoResult)),

  // loyalty + support
  getLoyalty: () => authed(() => api.loyalty()).then(N.normalizeLoyalty),
  getSupport: () => authed(() => api.support()).then(N.normalizeSupport),
  listTickets: () => authed(() => api.tickets()).then((d) => items(d).map(N.normalizeTicket)),
  createTicket: (body) => authed(() => api.createTicket(body)).then(N.normalizeTicket),
  addTicketMessage: (id, text) => authed(() => api.addTicketMessage(id, text)).then(N.normalizeTicket),
};
