const STORAGE_KEY = "smartfood:checkout-attempt:v1";

let memoryAttempt = null;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value)
    .sort()
    .reduce((out, key) => {
      out[key] = stableValue(value[key]);
      return out;
    }, {});
}

function fingerprint(body) {
  return JSON.stringify(stableValue(body));
}

function uuidV4() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function readAttempt() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (parsed && typeof parsed.id === "string" && typeof parsed.fingerprint === "string") {
      memoryAttempt = parsed;
    }
  } catch {
    // Keep the in-memory fallback when storage is unavailable or corrupt.
  }
  return memoryAttempt;
}

function writeAttempt(attempt) {
  memoryAttempt = attempt;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt)); }
  catch { /* the in-memory attempt still protects retries in this session */ }
}

export function clientOrderIdFor(body) {
  const bodyFingerprint = fingerprint(body);
  const existing = readAttempt();
  if (existing && existing.fingerprint === bodyFingerprint) return existing.id;

  const attempt = { id: uuidV4(), fingerprint: bodyFingerprint };
  writeAttempt(attempt);
  return attempt.id;
}

export function clearClientOrderId(id) {
  const existing = readAttempt();
  if (!existing || existing.id !== id) return;
  memoryAttempt = null;
  try { localStorage.removeItem(STORAGE_KEY); }
  catch { /* already cleared from the live session */ }
}
