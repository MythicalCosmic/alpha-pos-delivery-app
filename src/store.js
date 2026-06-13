/* ===== Smart Food — global reactive store ===== */
import { reactive, computed, watch } from "vue";
import { FOODS, DELIVERY_FEE, FREE_DELIVERY_AT } from "./data/foods.js";
import { t } from "./data/strings.js";
import { haptic } from "./telegram.js";

const SEED_ORDERS = [
  { id: "SF-2048", date: "Bugun · 13:24", status: "ontheway", total: 98000,
    items: [{ foodId: "f1", qty: 1 }, { foodId: "f10", qty: 2 }, { foodId: "f8", qty: 1 }] },
  { id: "SF-1991", date: "Kecha · 19:50", status: "preparing", total: 156000,
    items: [{ foodId: "f4", qty: 1 }, { foodId: "f11", qty: 1 }] },
  { id: "SF-1903", date: "9-iyun · 20:10", status: "delivered", total: 72000,
    items: [{ foodId: "f4", qty: 1 }] },
  { id: "SF-1880", date: "5-iyun · 13:02", status: "delivered", total: 63000,
    items: [{ foodId: "f2", qty: 1 }, { foodId: "f9", qty: 1 }] },
];

const TWEAK_DEFAULTS = {
  accent: "#ff4d8d",
  dark: true,
  displayFont: "Unbounded",
  cardRadius: 26,
  homeLayout: "cozy",
};

const PERSIST_KEY = "smartfood:v1";

function loadPersisted() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (e) { return {}; }
}

const saved = loadPersisted();

export const store = reactive({
  booted: false,
  lang: saved.lang || "uz",
  tweaks: { ...TWEAK_DEFAULTS, ...(saved.tweaks || {}) },
  user: saved.user || { name: "Aziz Karimov", phone: "+998 90 123 45 67", email: "aziz@smartfood.uz" },
  addresses: saved.addresses || [
    { id: "a1", tag: "Uy", text: "Toshkent, Amir Temur ko‘chasi 12",
      lat: 41.311158, lng: 69.279737, city: "Toshkent", street: "Amir Temur ko‘chasi", house: "12",
      apartment: "45", entrance: "2", floor: "5", intercom: "45", comment: "", precision: "exact", selected: true },
    { id: "a2", tag: "Ish", text: "Toshkent, Mustaqillik ko‘chasi 45",
      lat: 41.300600, lng: 69.340300, city: "Toshkent", street: "Mustaqillik ko‘chasi", house: "45",
      apartment: "", entrance: "", floor: "8", intercom: "", comment: "Ofis 803", precision: "exact", selected: false },
  ],
  cards: saved.cards || [
    { id: "c1", brand: "UzCard", last4: "4821", default: true },
    { id: "c2", brand: "Humo", last4: "9032", default: false },
  ],
  notif: saved.notif || { orders: true, promos: true, news: false, sound: true },
  favorites: saved.favorites || ["f7", "f4"],
  cart: saved.cart || [],
  orders: SEED_ORDERS,
  promo: "",
  promoApplied: false,
  toast: null,
  _uid: saved._uid || 0,
});

// derived
export const theme = computed(() => (store.tweaks.dark ? "dark" : "light"));
export const selectedAddress = computed(() => store.addresses.find(a => a.selected) || store.addresses[0] || null);
export const cartCount = computed(() => store.cart.reduce((s, i) => s + i.qty, 0));
export const cartSubtotal = computed(() => store.cart.reduce((s, i) => s + i.unit * i.qty, 0));
export const cartDiscount = computed(() => (store.promoApplied ? Math.round(cartSubtotal.value * 0.5) : 0));
export const cartDelivery = computed(() => (cartSubtotal.value >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE));
export const cartTotal = computed(() => cartSubtotal.value - cartDiscount.value + cartDelivery.value);

// persistence
watch(
  () => [store.lang, store.tweaks, store.user, store.addresses, store.cards, store.notif, store.favorites, store.cart, store._uid],
  () => {
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify({
        lang: store.lang,
        tweaks: store.tweaks,
        user: store.user,
        addresses: store.addresses,
        cards: store.cards,
        notif: store.notif,
        favorites: store.favorites,
        cart: store.cart,
        _uid: store._uid,
      }));
    } catch (e) { /* storage full / unavailable */ }
  },
  { deep: true }
);

// ---- actions ----
let toastTimer = null;
export function flash(msg) {
  store.toast = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { store.toast = null; }, 1700);
}

export function setLang(l) { store.lang = l; }
export function setTweak(key, val) { store.tweaks[key] = val; }

export function isFav(id) { return store.favorites.includes(id); }
export function toggleFav(id) {
  haptic("light");
  const i = store.favorites.indexOf(id);
  if (i >= 0) store.favorites.splice(i, 1);
  else store.favorites.push(id);
}

function lineKey(item) {
  return item.foodId + item.sizeId + item.extraIds.slice().sort().join();
}
export function addItem(item) {
  const key = lineKey(item);
  const existing = store.cart.find(x => lineKey(x) === key);
  if (existing) existing.qty += item.qty;
  else store.cart.push({ ...item, uid: ++store._uid });
}
export function quickAdd(f) {
  addItem({ foodId: f.id, sizeId: "m", extraIds: [], qty: 1, unit: f.price });
  haptic("success");
  flash(t("added", store.lang));
}
export function changeQty(uid, d) {
  const it = store.cart.find(x => x.uid === uid);
  if (it) it.qty = Math.max(1, it.qty + d);
}
export function removeItem(uid) {
  const i = store.cart.findIndex(x => x.uid === uid);
  if (i >= 0) store.cart.splice(i, 1);
}
export function clearCart() { store.cart.splice(0, store.cart.length); }

export function applyPromo() {
  if (store.promo.trim().toUpperCase() === "SMART50") {
    store.promoApplied = true;
    haptic("success");
    flash(t("added", store.lang));
  } else {
    haptic("error");
    flash("SMART50");
  }
}

export function placeOrder(total, meta = {}) {
  const id = "SF-" + (2050 + store.orders.length);
  const addr = selectedAddress.value;
  const order = {
    id, date: t("today", store.lang), status: "preparing", total,
    items: store.cart.map(c => ({ foodId: c.foodId, sizeId: c.sizeId, extraIds: c.extraIds, qty: c.qty, unit: c.unit })),
    // snapshot of where/how it goes — the shape a real "create order" call would send
    address: addr ? {
      tag: addr.tag, text: addr.text, lat: addr.lat, lng: addr.lng,
      apartment: addr.apartment, entrance: addr.entrance, floor: addr.floor,
      intercom: addr.intercom, comment: addr.comment,
    } : null,
    note: meta.note || "",
    payment: meta.payment || "cash",
    tip: meta.tip || 0,
    slot: meta.slot || "asap",
  };
  store.orders.unshift(order);
  clearCart();
  store.promoApplied = false;
  store.promo = "";
  haptic("success");
  return order;
}

// ---- profile ----
export function setUser(patch) {
  Object.assign(store.user, patch);
  haptic("success");
  flash(t("savedOk", store.lang));
}

// ---- addresses ----
export function selectAddress(id) {
  store.addresses.forEach(a => { a.selected = a.id === id; });
  haptic("light");
}
export function addAddress(tag, text) {
  const id = "a" + (++store._uid);
  store.addresses.forEach(a => { a.selected = false; });
  store.addresses.push({ id, tag: tag || "Manzil", text, selected: true });
  haptic("success");
}
// Create or update a full address record (with map coords + door-level details),
// then select it. `addr.id` decides create vs update.
export function upsertAddress(addr) {
  const rec = {
    id: addr.id || ("a" + (++store._uid)),
    tag: (addr.tag || "Manzil").trim(),
    text: (addr.text || "").trim(),
    lat: addr.lat ?? null,
    lng: addr.lng ?? null,
    city: addr.city || "",
    street: addr.street || "",
    house: addr.house || "",
    apartment: (addr.apartment || "").trim(),
    entrance: (addr.entrance || "").trim(),
    floor: (addr.floor || "").trim(),
    intercom: (addr.intercom || "").trim(),
    comment: (addr.comment || "").trim(),
    precision: addr.precision || "",
    selected: true,
  };
  store.addresses.forEach(a => { a.selected = false; });
  const i = store.addresses.findIndex(a => a.id === rec.id);
  if (i >= 0) store.addresses[i] = { ...store.addresses[i], ...rec };
  else store.addresses.push(rec);
  haptic("success");
  return rec;
}
export function removeAddress(id) {
  const i = store.addresses.findIndex(a => a.id === id);
  if (i < 0) return;
  const wasSelected = store.addresses[i].selected;
  store.addresses.splice(i, 1);
  if (wasSelected && store.addresses[0]) store.addresses[0].selected = true;
}

// ---- payment cards ----
export function addCard(brand, last4) {
  const id = "c" + (++store._uid);
  store.cards.push({ id, brand: brand || "Card", last4, default: store.cards.length === 0 });
  haptic("success");
}
export function setCardDefault(id) {
  store.cards.forEach(c => { c.default = c.id === id; });
  haptic("light");
}
export function removeCard(id) {
  const i = store.cards.findIndex(c => c.id === id);
  if (i < 0) return;
  const wasDefault = store.cards[i].default;
  store.cards.splice(i, 1);
  if (wasDefault && store.cards[0]) store.cards[0].default = true;
}

// ---- notifications ----
export function setNotif(key, val) { store.notif[key] = val; }

export function reorder(o) {
  o.items.forEach(it => {
    const f = FOODS.find(x => x.id === it.foodId);
    if (f) addItem({ foodId: f.id, sizeId: "m", extraIds: [], qty: it.qty, unit: f.price });
  });
  flash(t("added", store.lang));
}
