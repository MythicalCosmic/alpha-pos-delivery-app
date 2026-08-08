const TERMINAL = new Set(["COMPLETED", "CANCELED", "REJECTED"]);
const ACTIVE = new Set(["PENDING", "DISPATCHED", "PREPARING", "READY"]);

function status(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "CANCELLED" ? "CANCELED" : normalized;
}

export function orderLifecycle(order) {
  const outer = status(order && order.status);
  const effective = status(order && order.effectiveStatus);
  const pos = status(order && order.posOrder && order.posOrder.status);

  if (outer === "REJECTED") return "REJECTED";
  if (outer === "CANCELED" || pos === "CANCELED") return "CANCELED";
  if (outer === "COMPLETED" || pos === "COMPLETED") return "COMPLETED";
  if (effective === "REJECTED" || effective === "CANCELED" || effective === "COMPLETED") return effective;
  if (outer === "READY" || pos === "READY") return "READY";
  if (outer === "PREPARING" || pos === "PREPARING") return "PREPARING";
  if (effective === "READY" || effective === "PREPARING" || effective === "DISPATCHED") return effective;
  if (outer === "DISPATCHED") return "DISPATCHED";
  if (outer === "PENDING") return "PENDING";
  return outer || pos || "PENDING";
}

export function isTerminalOrder(order) {
  return TERMINAL.has(orderLifecycle(order));
}

export function isActiveOrder(order) {
  return ACTIVE.has(orderLifecycle(order));
}
