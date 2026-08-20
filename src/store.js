/* ===== Smart Food — global reactive store (live /api/smartfood backend) =====
   The catalog, orders, addresses, loyalty and profile all come from the API.
   The cart is the only client-owned state (BACKEND_API.md §6.3 — there is no
   server cart): we keep the lines locally and call POST /cart/quote for the
   authoritative price. Client-only conveniences (favorites, notification
   toggles, language, theme) are persisted to localStorage. */

import { reactive, computed, watch } from "vue";
import { t } from "./data/strings.js";
import { haptic } from "./telegram.js";
import { ds, ApiError, ClosedError, ConflictError, NetworkError, NoTelegramError, ensureSession, clearSession } from "./api/index.js";
import { ALLOW_BROWSER } from "./config.js";
import { clientOrderIdFor, clearClientOrderId } from "./orderAttempt.js";
import { applyCategoryArt } from "./api/normalize.js";
import {
  isFullCatalogQuery,
  productCanBeOrdered,
  reconcileCatalogAvailability,
} from "./catalogAvailability.js";

const TWEAK_DEFAULTS = {
  accent: "#ff4d8d",
  dark: true,
  displayFont: "Unbounded",
  cardRadius: 26,
  homeLayout: "cozy",
};

const PERSIST_KEY = "smartfood:v2";

function loadPersisted() {
  try { return JSON.parse(localStorage.getItem(PERSIST_KEY) || "{}") || {}; }
  catch { return {}; }
}
const saved = loadPersisted();

export const store = reactive({
  // ---- boot / session ----
  booted: false,                 // splash animation finished (UI gate)
  bootState: "loading",          // loading | ready | no_telegram | blocked | error
  bootError: "",
  browser: false,                // opened in a plain browser (no Telegram session)
  apiNote: "",                   // browser probe result: ok | auth | http<code> | error
  me: null,                      // normalized customer (/me)

  // ---- config ----
  config: null,                  // normalized /config
  catalogClosed: false,          // a catalog/quote call returned bot_off

  // ---- i18n + theme (persisted) ----
  lang: saved.lang || "uz",
  // Fresh installs distinguish a Telegram-derived default from a choice made
  // in Settings. Existing saved languages are preserved as explicit choices.
  langExplicit: saved.langExplicit ?? !!saved.lang,
  tweaks: { ...TWEAK_DEFAULTS, ...(saved.tweaks || {}) },

  // ---- catalog ----
  categories: [],
  products: [],
  productCache: {},              // id -> detail product
  banners: [],                   // scheduled home promotions from the server
  catalogReady: false,           // a complete live product list was loaded
  availableProductIds: [],       // IDs from that complete sellable list
  catalogLoading: false,
  catalogError: "",

  // ---- cart (persisted, client-side) ----
  cart: saved.cart || [],
  quote: null,                   // last /cart/quote result
  quoting: false,
  quoteError: null,              // { code, message } | null

  // ---- orders ----
  orders: [],
  ordersLoading: false,
  orderCache: {},                // id -> order

  // ---- addresses ----
  addresses: [],
  addressesLoading: false,
  addressesLoaded: false,
  addressesError: "",
  selectedAddressId: saved.selectedAddressId || null,

  // ---- loyalty / support ----
  loyalty: null,
  rewards: { points: 0, items: [] },   // gift catalog
  support: null,
  tickets: [],

  // ---- client-only prefs (persisted; these have no backend endpoint) ----
  favorites: saved.favorites || [],   // array of product snapshots
  notif: saved.notif || { orders: true, promos: true, news: false, sound: true },
  cards: saved.cards || [],           // saved payment cards (cash-only launch, local only)

  // ---- ui ----
  toast: null,
  _uid: saved._uid || 0,
});

/* ---------------- derived ---------------- */
export const theme = computed(() => (store.tweaks.dark ? "dark" : "light"));
export const isReady = computed(() => store.bootState === "ready");
export const storeOpen = computed(() => !!(store.config && store.config.enabled) && !store.catalogClosed);

export const selectedAddress = computed(() => {
  const list = store.addresses;
  if (!list.length) return null;
  return (
    list.find((a) => a.id === store.selectedAddressId) ||
    list.find((a) => a.isDefault) ||
    list[0] ||
    null
  );
});
export const profileComplete = computed(() => !!(store.me && store.me.profileComplete));
export const deliverableAddresses = computed(() =>
  store.addresses.filter((address) => address.lat != null && address.lng != null)
);
export const selectedAddressIsDeliverable = computed(() => {
  const address = selectedAddress.value;
  return !!(address && address.lat != null && address.lng != null);
});

export const cartCount = computed(() => store.cart.reduce((s, i) => s + i.qty, 0));
export const cartSubtotal = computed(() => store.cart.reduce((s, i) => s + i.unit * i.qty, 0));
export const freeDeliveryThreshold = computed(() => (store.config ? store.config.freeDeliveryThreshold : 0));
export const minOrderAmount = computed(() => (store.config ? store.config.minOrderAmount : 0));
export const cartDelivery = computed(() => {
  const cfg = store.config;
  if (!cfg) return 0;
  if (freeDeliveryThreshold.value && cartSubtotal.value >= freeDeliveryThreshold.value) return 0;
  return cfg.deliveryFee;
});
// Local estimate shown before/without a server quote. The quote (when present)
// is authoritative and should be preferred by checkout.
export const cartTotalEstimate = computed(() => cartSubtotal.value + cartDelivery.value);

/* ---------------- persistence ---------------- */
watch(
  () => [store.lang, store.langExplicit, store.tweaks, store.favorites, store.notif, store.cards, store.cart, store.selectedAddressId, store._uid],
  () => {
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify({
        lang: store.lang,
        langExplicit: store.langExplicit,
        tweaks: store.tweaks,
        favorites: store.favorites,
        notif: store.notif,
        cards: store.cards,
        cart: store.cart,
        selectedAddressId: store.selectedAddressId,
        _uid: store._uid,
      }));
    } catch { /* storage full / unavailable */ }
  },
  { deep: true }
);

/* ---------------- toast ---------------- */
let toastTimer = null;
export function flash(msg) {
  store.toast = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { store.toast = null; }, 1700);
}

/* ---------------- prefs ---------------- */
export function setLang(l) {
  store.lang = l;
  store.langExplicit = true;
  // Best-effort: persist the choice to the profile too (non-blocking).
  if (store.me && store.bootState === "ready") ds.updateMe({ language: l }).catch(() => {});
  if (store.bootState === "ready") {
    loadBanners();
    loadRewards();
  }
}
export function setTweak(key, val) { store.tweaks[key] = val; }
export function setNotif(key, val) { store.notif[key] = val; }

export async function setBroadcastOptIn(value) {
  const previous = store.notif.promos;
  store.notif.promos = !!value;
  try {
    store.me = await ds.updateMe({ broadcast_opted_in: !!value });
    store.notif.promos = store.me.broadcastOptedIn;
    haptic("success");
    return true;
  } catch (error) {
    store.notif.promos = previous;
    haptic("error");
    throw error;
  }
}

// Favorites are stored as lightweight product snapshots so the Favorites screen
// can render without re-fetching the catalog.
function favSnapshot(p) {
  return { id: p.id, names: p.names, name: p.name, price: p.price, kind: p.kind, hue: p.hue, image_url: p.image_url, tag: p.tag, kcal: p.kcal ?? null, categoryId: p.categoryId };
}
export function isFav(id) { return store.favorites.some((f) => f.id === id); }
export function toggleFav(product) {
  haptic("light");
  const id = typeof product === "object" && product ? product.id : product;
  const i = store.favorites.findIndex((f) => f.id === id);
  if (i >= 0) store.favorites.splice(i, 1);
  else if (typeof product === "object" && product) store.favorites.push(favSnapshot(product));
}

// ---- payment cards (client-only; cash-only launch has no card API) ----
export function addCard(brand, last4) {
  store.cards.push({ id: "c" + (++store._uid), brand: brand || "Card", last4, default: store.cards.length === 0 });
  haptic("success");
}
export function setCardDefault(id) {
  store.cards.forEach((c) => { c.default = c.id === id; });
  haptic("light");
}
export function removeCard(id) {
  const i = store.cards.findIndex((c) => c.id === id);
  if (i < 0) return;
  const wasDefault = store.cards[i].default;
  store.cards.splice(i, 1);
  if (wasDefault && store.cards[0]) store.cards[0].default = true;
}

/* ---------------- boot ---------------- */
async function applyServerLanguage() {
  // With no local choice, follow Telegram via the server profile (unknown
  // Telegram languages already fall back to Uzbek). A previous explicit local
  // choice is synchronized back so chat notifications use the same language.
  if (!store.langExplicit && store.me && store.me.language) {
    store.lang = store.me.language;
    return;
  }
  if (store.langExplicit && store.me && store.me.language !== store.lang) {
    try { store.me = await ds.updateMe({ language: store.lang }); }
    catch { /* the visible local choice remains usable while offline */ }
  }
}

function newVisitId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // UUID-shaped fallback for older Telegram WebViews. The server still treats
  // it as an opaque idempotency key and validates the UUID syntax.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === "x" ? value : ((value & 0x3) | 0x8)).toString(16);
  });
}

const clientVisitId = newVisitId();

export async function boot() {
  store.bootState = "loading";
  store.bootError = "";
  try {
    store.me = await ensureSession();
    store.browser = false;
    store.notif.promos = store.me.broadcastOptedIn;
    await applyServerLanguage();
    // One event per Mini App page boot. Best-effort keeps analytics from ever
    // becoming an availability dependency for the customer experience.
    ds.trackVisit(clientVisitId).catch(() => {});
    store.config = await ds.getConfig();
    store.bootState = "ready";
    warmData();
  } catch (e) {
    // No Telegram session — open in the browser to probe the live API instead of
    // showing the "open from Telegram" wall (unless gating is forced on).
    if (e instanceof NoTelegramError) {
      if (ALLOW_BROWSER) return bootBrowser();
      store.bootState = "no_telegram";
    } else if (e instanceof ApiError && e.httpStatus === 403) { store.bootState = "blocked"; store.bootError = e.message; }
    else if (e instanceof NetworkError) { store.bootState = "error"; store.bootError = "network"; }
    else { store.bootState = "error"; store.bootError = (e && e.message) || "error"; }
  }
}

// Minimal config so the UI can render when the backend can't be authenticated
// from a browser (no Telegram initData). Only used as a fallback in browser mode.
function browserDefaultConfig() {
  return {
    currency: "UZS", enabled: true,
    deliveryFee: 0, freeDeliveryThreshold: 0, minOrderAmount: 0,
    defaultTipOptions: [], supportedLanguages: ["uz", "ru", "en"], defaultLanguage: store.lang,
    serviceArea: {}, featureFlags: { loyalty: true }, support: {},
  };
}

// Browser preview: probe the live backend and report whether it answers. A
// reachable-but-401 means the API works and only Telegram sign-in is missing.
async function bootBrowser() {
  store.browser = true;
  try {
    store.config = await ds.probeConfig();
    store.apiNote = "ok";
  } catch (e) {
    if (e instanceof NetworkError) { store.bootState = "error"; store.bootError = "network"; return; }
    store.config = browserDefaultConfig();
    if (e instanceof ApiError) store.apiNote = e.httpStatus === 401 ? "auth" : "http" + e.httpStatus;
    else if (e instanceof ClosedError) store.apiNote = "ok";
    else store.apiNote = "error";
  }
  if (!store.me) store.me = {
    id: 0,
    telegramId: 0,
    name: "",
    firstName: "",
    lastName: "",
    phone: "",
    language: store.lang,
    photoUrl: "",
    points: 0,
    profileComplete: false,
    profileMissing: ["first_name", "last_name", "phone", "confirmation"],
    broadcastOptedIn: true,
  };
  store.bootState = "ready";
  warmData();
}

function warmData() {
  // Warm the data the tab screens need, in the background.
  loadCategories();
  loadOrders();
  loadAddresses();
}

export function retryBoot() { return boot(); }

/* ---------------- catalog ---------------- */
export async function loadCategories() {
  try {
    store.categories = await ds.getCategories(store.lang);
    store.catalogClosed = false;
  } catch (e) {
    handleCatalogError(e);
  }
}

export async function loadProducts(query = {}) {
  store.catalogLoading = true;
  store.catalogError = "";
  try {
    // Load categories alongside the first product request so unmatched product
    // names can inherit a meaningful category icon without adding latency.
    const categoriesReady = store.categories.length ? Promise.resolve() : loadCategories();
    const [products] = await Promise.all([
      ds.getProducts({ lang: store.lang, ...query }),
      categoriesReady,
    ]);
    applyCategoryArt(products, store.categories);
    store.products = products;
    if (isFullCatalogQuery(query)) {
      const availability = reconcileCatalogAvailability(
        products,
        store.cart,
        store.favorites,
        store.productCache,
      );
      store.availableProductIds = availability.availableProductIds;
      store.catalogReady = true;
    }
    store.catalogClosed = false;
    return store.products;
  } catch (e) {
    handleCatalogError(e);
    store.products = [];
    return [];
  } finally {
    store.catalogLoading = false;
  }
}

export async function loadProduct(id) {
  // Always re-check the server. A cached detail must not let a product that was
  // stopped after browsing be added from Favorites, Reorder, or browser history.
  const p = await ds.getProduct(id, store.lang);
  store.productCache[id] = p;
  return p;
}

export async function loadBanners() {
  try {
    store.banners = await ds.getBanners(store.lang);
  } catch {
    // Promotions are optional content; a catalog/order flow must remain usable
    // if this one request is temporarily unavailable.
    store.banners = [];
  }
}

function handleCatalogError(e) {
  if (e instanceof ClosedError) { store.catalogClosed = true; store.catalogError = ""; }
  else if (e instanceof NetworkError) store.catalogError = "network";
  else store.catalogError = (e && e.message) || "error";
}

/* ---------------- cart ---------------- */
function lineKey(productId, sizeId, toppingIds) {
  return [productId, sizeId || 0, (toppingIds || []).slice().sort((a, b) => a - b).join(",")].join("|");
}

// Build a persisted cart line from a (list or detail) product + a selection.
export function buildLine(product, { sizeId = null, toppingIds = [], qty = 1 } = {}) {
  const size = (product.sizes || []).find((s) => s.id === sizeId) || null;
  const allToppings = (product.toppingGroups || []).flatMap((g) => g.toppings);
  const toppings = (toppingIds || []).map((id) => allToppings.find((tp) => tp.id === id)).filter(Boolean);
  const unit = product.price + (size ? size.priceDelta : 0) + toppings.reduce((s, tp) => s + tp.price, 0);
  const detail = [size && size.name, ...toppings.map((tp) => tp.name)].filter(Boolean).join(" · ");
  return {
    uid: ++store._uid,
    productId: product.id,
    sizeId: size ? size.id : null,
    toppingIds: toppings.map((tp) => tp.id),
    qty,
    unit,
    detail,
    snapshot: {
      id: product.id,
      names: product.names,
      name: product.name,
      kind: product.kind,
      hue: product.hue,
      image_url: product.image_url,
      categoryId: product.categoryId,
      price: product.price,
      available: product.available !== false,
    },
    unavailable: product.available === false,
  };
}

export function addLine(line) {
  const key = lineKey(line.productId, line.sizeId, line.toppingIds);
  const existing = store.cart.find((x) => lineKey(x.productId, x.sizeId, x.toppingIds) === key);
  if (existing) existing.qty += line.qty;
  else store.cart.push(line);
  store.quote = null; // totals are stale until re-quoted
}

export function quickAdd(product) {
  if (!isProductOrderable(product)) { haptic("warning"); flash(t("cf_item_unavailable", store.lang)); return; }
  addLine(buildLine(product, { qty: 1 }));
  haptic("success");
  flash(t("added", store.lang));
}

export function isProductOrderable(product) {
  return productCanBeOrdered(product, store.availableProductIds, store.catalogReady);
}

export function changeQty(uid, d) {
  const it = store.cart.find((x) => x.uid === uid);
  if (!it) return;
  if (d > 0 && it.unavailable) {
    haptic("warning");
    flash(t("cf_item_unavailable", store.lang));
    return;
  }
  it.qty = Math.max(1, it.qty + d);
  store.quote = null;
}
export function removeItem(uid) {
  const i = store.cart.findIndex((x) => x.uid === uid);
  if (i >= 0) { store.cart.splice(i, 1); store.quote = null; }
}
export function clearCart() {
  store.cart.splice(0, store.cart.length);
  store.quote = null;
  store.quoteError = null;
}

// Server item payload for quote/order. size_id only when a real size is chosen.
function cartItemsPayload() {
  return store.cart.map((it) => {
    const item = { product_id: it.productId, quantity: it.qty };
    if (it.sizeId) item.size_id = it.sizeId;
    if (it.toppingIds && it.toppingIds.length) item.topping_ids = it.toppingIds.slice();
    return item;
  });
}

/**
 * Authoritative reprice. Returns the normalized quote, or null on a handled
 * conflict/closed (stored in store.quoteError / store.catalogClosed).
 */
let _quoteSeq = 0;
export async function requestQuote({ orderType = "DELIVERY", tip = 0, pointsUsed = 0 } = {}) {
  const seq = ++_quoteSeq; // newest-wins guard against out-of-order responses
  if (!store.cart.length) { store.quote = null; store.quoteError = { code: "empty_cart" }; return null; }
  store.quoting = true;
  store.quoteError = null;
  try {
    const q = await ds.quote({
      items: cartItemsPayload(),
      order_type: orderType,
      tip,
      points_used: pointsUsed,
    });
    if (seq !== _quoteSeq) return q; // a newer quote superseded this one
    store.quote = q;
    store.catalogClosed = false;
    return q;
  } catch (e) {
    if (seq !== _quoteSeq) return null;
    store.quote = null;
    if (e instanceof ClosedError) store.catalogClosed = true;
    else if (e instanceof ConflictError) {
      store.quoteError = { code: e.code, message: e.serverMessage };
      // A full catalog refresh marks persisted cart/favorite snapshots that the
      // server no longer exposes because selling or publishing was switched off.
      if (e.code === "item_unavailable") await loadProducts();
    }
    else store.quoteError = { code: "error", message: (e && e.message) || "" };
    return null;
  } finally {
    if (seq === _quoteSeq) store.quoting = false;
  }
}

/* ---------------- orders ---------------- */
/**
 * Place the order. On success clears the cart, refreshes the order list and
 * returns the created order. Throws ClosedError / ConflictError / ApiError so
 * the checkout view can present the precise reason.
 */
export async function submitOrder({ orderType = "DELIVERY", addressId = null, phone, note, tip = 0, pointsUsed = 0, paymentMethod = "CASH" } = {}) {
  const body = {
    items: cartItemsPayload(),
    order_type: orderType,
    tip,
    points_used: pointsUsed,
    payment_method: paymentMethod,
  };
  if (orderType === "DELIVERY" && addressId != null) body.address_id = addressId;
  if (phone) body.phone = phone;
  if (note) body.note = note;

  const clientOrderId = clientOrderIdFor(body);
  body.client_order_id = clientOrderId;
  const order = await ds.createOrder(body);
  clearClientOrderId(clientOrderId);
  store.orderCache[order.id] = order;
  clearCart();
  store.quote = null;
  loadOrders();
  loadLoyalty();
  haptic("success");
  return order;
}

export async function loadOrders(status) {
  store.ordersLoading = true;
  try {
    store.orders = await ds.listOrders(status);
  } catch { /* keep previous list */ }
  finally { store.ordersLoading = false; }
}

export async function loadOrder(id) {
  const order = await ds.getOrder(id);
  store.orderCache[id] = order;
  return order;
}

export async function trackOrder(id, opts) {
  const order = await ds.trackOrder(id, opts);
  store.orderCache[id] = order;
  // keep the list copy in sync if present
  const i = store.orders.findIndex((o) => o.id === order.id);
  if (i >= 0) store.orders[i] = order;
  return order;
}

export async function cancelOrder(id) {
  const res = await ds.cancelOrder(id);
  if (store.orderCache[id]) store.orderCache[id].status = "CANCELED";
  const i = store.orders.findIndex((o) => o.id === id);
  if (i >= 0) store.orders[i].status = "CANCELED";
  haptic("success");
  loadLoyalty();
  return res;
}

// Re-add a past order's items to the cart (best-effort; re-quotes server-side).
export async function reorder(order) {
  for (const it of order.items) {
    try {
      const product = await loadProduct(it.productId);
      addLine(buildLine(product, {
        sizeId: it.sizeId || null,
        toppingIds: (it.toppings || []).map((tp) => tp.topping_id),
        qty: it.quantity,
      }));
    } catch { /* product gone — skip */ }
  }
  flash(t("added", store.lang));
}

/* ---------------- addresses ---------------- */
let addressLoadRequest = 0;

export async function loadAddresses() {
  const requestId = ++addressLoadRequest;
  store.addressesLoading = true;
  store.addressesError = "";
  try {
    const addresses = await ds.getAddresses();
    if (requestId !== addressLoadRequest) return false;
    store.addresses = addresses;
    store.addressesLoaded = true;
    if (!store.selectedAddressId || !store.addresses.some((a) => a.id === store.selectedAddressId)) {
      const def = store.addresses.find((a) => a.isDefault) || store.addresses[0];
      store.selectedAddressId = def ? def.id : null;
    }
    return true;
  } catch (error) {
    // Existing screens keep their last known list; callers that need a fresh
    // record (such as an edit deep-link) can render a recoverable error.
    if (requestId === addressLoadRequest) {
      store.addressesError = (error && error.message) || "load_failed";
    }
    return false;
  }
  finally {
    if (requestId === addressLoadRequest) store.addressesLoading = false;
  }
}

export function selectAddress(id) {
  store.selectedAddressId = id;
  haptic("light");
}

// Map the address-edit form (door-level fields) to the API body.
function addressBody(form) {
  return {
    label: (form.tag || form.label || "").trim(),
    line: (form.text || form.line || "").trim(),
    lat: form.lat ?? null,
    lng: form.lng ?? null,
    city: form.city || "",
    street: form.street || "",
    house: form.house || "",
    apartment: (form.apartment || "").trim(),
    entrance: (form.entrance || "").trim(),
    floor: (form.floor || "").trim(),
    intercom: (form.intercom || "").trim(),
    comment: (form.comment || "").trim(),
    precision: form.precision || "",
  };
}

export async function saveAddress(form) {
  const body = addressBody(form);
  let rec;
  if (form.id) rec = await ds.updateAddress(form.id, body);
  else { body.make_default = store.addresses.length === 0; rec = await ds.createAddress(body); }
  const refreshed = await loadAddresses();
  if (!refreshed) {
    // The write succeeded; keep the returned canonical record locally so a
    // transient list-refresh failure cannot send checkout back into address
    // creation and duplicate the same location.
    const index = store.addresses.findIndex((address) => address.id === rec.id);
    if (index >= 0) store.addresses[index] = rec;
    else store.addresses.unshift(rec);
  }
  store.selectedAddressId = rec.id;
  haptic("success");
  return rec;
}

export async function removeAddress(id) {
  await ds.deleteAddress(id);
  const index = store.addresses.findIndex((address) => address.id === id);
  if (index >= 0) store.addresses.splice(index, 1);
  if (store.selectedAddressId === id || !store.addresses.some((address) => address.id === store.selectedAddressId)) {
    const fallback = store.addresses.find((address) => address.isDefault) || store.addresses[0];
    store.selectedAddressId = fallback ? fallback.id : null;
  }
  // The local removal is already truthful if this refresh fails; loadAddresses
  // preserves it and exposes a retryable stale-data warning.
  await loadAddresses();
  haptic("success");
}

export async function setDefaultAddress(id) {
  await ds.setDefaultAddress(id);
  store.selectedAddressId = id;
  await loadAddresses();
}

/* ---------------- loyalty / support / profile ---------------- */
export async function loadLoyalty() {
  try { store.loyalty = await ds.getLoyalty(); } catch { /* ignore */ }
}

export async function loadRewards() {
  try { store.rewards = await ds.getRewards(store.lang); } catch { /* ignore */ }
}

// Redeem a gift: spend points -> a redemption code. Refreshes loyalty + rewards
// so the new balance, the issued code, and affordability flags update at once.
// Returns the new redemption (with .code) or throws (caller shows the message).
export async function redeemReward(rewardId) {
  const redemption = await ds.redeemReward(rewardId);
  await Promise.all([loadLoyalty(), loadRewards()]);
  return redemption;
}
export async function loadSupport() {
  try { store.support = await ds.getSupport(); } catch { /* ignore */ }
}
export async function loadTickets() {
  try { store.tickets = await ds.listTickets(); } catch { /* ignore */ }
}
export async function createTicket(subject, text) {
  const ticket = await ds.createTicket({ subject, text });
  await loadTickets();
  return ticket;
}
export async function addTicketMessage(id, text) {
  const ticket = await ds.addTicketMessage(id, text);
  const i = store.tickets.findIndex((x) => x.id === id);
  if (i >= 0) store.tickets[i] = ticket;
  return ticket;
}

export async function updateProfile(patch) {
  store.me = await ds.updateMe(patch);
  if (patch.language) store.lang = store.me.language;
  haptic("success");
  flash(t("savedOk", store.lang));
  return store.me;
}

export function logout() {
  clearSession();
  store.me = null;
  store.bootState = "no_telegram";
}
