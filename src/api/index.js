/* ===== Smart Food — data-source facade =====
   The single surface the store talks to. Always the live /api/smartfood client.
   Closed/conflict/network errors propagate as typed errors (see http.js). */

import { liveDs } from "./live.js";

export const ds = liveDs;

export { ApiError, ClosedError, ConflictError, NetworkError } from "./http.js";
export { ensureSession, login, clearSession, getCustomer, getInitData, hasTelegram, NoTelegramError } from "./session.js";
