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
