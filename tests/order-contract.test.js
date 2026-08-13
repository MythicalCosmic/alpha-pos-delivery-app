import test from "node:test";
import assert from "node:assert/strict";

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

const {
  clientOrderIdFor,
  clearClientOrderId,
} = await import("../src/orderAttempt.js");
const {
  isActiveOrder,
  isTerminalOrder,
  orderLifecycle,
} = await import("../src/orderLifecycle.js");
const { buildSupportContacts } = await import("../src/supportContacts.js");
const {
  cartHasUnavailableItems,
  productCanBeOrdered,
  reconcileCatalogAvailability,
} = await import("../src/catalogAvailability.js");

test("checkout idempotency key survives equivalent retries and rotates on change", () => {
  const first = clientOrderIdFor({ items: [{ product_id: 329, quantity: 1 }], tip: 0 });
  const retry = clientOrderIdFor({ tip: 0, items: [{ quantity: 1, product_id: 329 }] });
  const changed = clientOrderIdFor({ items: [{ product_id: 329, quantity: 2 }], tip: 0 });

  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(retry, first);
  assert.notEqual(changed, first);

  clearClientOrderId(changed);
  assert.notEqual(
    clientOrderIdFor({ items: [{ product_id: 329, quantity: 2 }], tip: 0 }),
    changed,
  );
});

test("linked POS status is the authoritative customer lifecycle", () => {
  const linked = (status) => ({ status: "DISPATCHED", posOrder: { status } });

  assert.equal(orderLifecycle(linked("PREPARING")), "PREPARING");
  assert.equal(orderLifecycle(linked("READY")), "READY");
  assert.equal(orderLifecycle(linked("COMPLETED")), "COMPLETED");
  assert.equal(orderLifecycle(linked("CANCELLED")), "CANCELED");
  assert.equal(isActiveOrder(linked("READY")), true);
  assert.equal(isTerminalOrder(linked("COMPLETED")), true);
  assert.equal(isActiveOrder(linked("CANCELED")), false);
  assert.equal(isActiveOrder({ status: "PAID" }), false);
});

test("support renders only non-empty contacts supplied by the backend", () => {
  const labels = { call: "Call", telegram: "Telegram", email: "Email" };

  assert.deepEqual(buildSupportContacts([{}, null], labels), []);
  assert.deepEqual(
    buildSupportContacts(
      [{ phone: "  ", telegram: "@real_support", email: "" }, { phone: "+998 90 123 45 67" }],
      labels,
    ),
    [
      { key: "call", icon: "phone", title: "Call", sub: "+998 90 123 45 67", href: "tel:+998901234567" },
      { key: "tg", icon: "chat", title: "Telegram", sub: "@real_support", href: "https://t.me/real_support" },
    ],
  );
});

test("a fresh catalog marks stopped products in persisted carts and favorites", () => {
  const cart = [
    { productId: 10, snapshot: { id: 10 } },
    { productId: 20, snapshot: { id: 20 } },
  ];
  const favorites = [{ id: 10, name: "Old name" }, { id: 20, name: "Stopped" }];
  const cache = { 10: { id: 10 }, 20: { id: 20 } };
  const products = [{ id: 10, name: "Live name", names: {}, price: 12000, available: true }];

  const result = reconcileCatalogAvailability(products, cart, favorites, cache);

  assert.deepEqual(result.availableProductIds, ["10"]);
  assert.equal(result.unavailableCartCount, 1);
  assert.equal(cart[0].unavailable, false);
  assert.equal(cart[1].unavailable, true);
  assert.equal(favorites[0].available, true);
  assert.equal(favorites[0].name, "Live name");
  assert.equal(favorites[1].available, false);
  assert.deepEqual(Object.keys(cache), ["10"]);
  assert.equal(cartHasUnavailableItems(cart), true);
});

test("catalog-backed orderability rejects stopped favorite snapshots", () => {
  assert.equal(productCanBeOrdered({ id: 10, available: true }, ["10"], true), true);
  assert.equal(productCanBeOrdered({ id: 20, available: true }, ["10"], true), false);
  assert.equal(productCanBeOrdered({ id: 10, available: false }, ["10"], true), false);
});
