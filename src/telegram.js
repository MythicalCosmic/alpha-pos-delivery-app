/* ===== Smart Food — Telegram Mini App integration =====
   All calls are guarded so the app also runs as a normal webpage in any browser. */

export const tg = (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) || null;

let backHandler = null;

// Call once on boot.
export function initTelegram() {
  if (!tg) return null;
  try {
    tg.ready();
    tg.expand();
    if (typeof tg.disableVerticalSwipes === "function") tg.disableVerticalSwipes();
  } catch (e) { /* older clients */ }
  return tg;
}

// Returns 'dark' | 'light' from the Telegram client, or null if not in Telegram.
export function tgColorScheme() {
  return tg ? tg.colorScheme : null;
}

// Paint the Telegram header/background to match our theme.
export function applyTgChrome(theme) {
  if (!tg) return;
  const bg = theme === "dark" ? "#0a0818" : "#f5f1ff";
  try {
    if (typeof tg.setHeaderColor === "function") tg.setHeaderColor(bg);
    if (typeof tg.setBackgroundColor === "function") tg.setBackgroundColor(bg);
  } catch (e) { /* unsupported color value on old clients */ }
}

// Native back button — shown on pushed screens, wired to a callback.
export function showBackButton(onClick) {
  if (!tg || !tg.BackButton) return;
  if (backHandler) tg.BackButton.offClick(backHandler);
  backHandler = onClick;
  tg.BackButton.onClick(backHandler);
  tg.BackButton.show();
}

export function hideBackButton() {
  if (!tg || !tg.BackButton) return;
  if (backHandler) { tg.BackButton.offClick(backHandler); backHandler = null; }
  tg.BackButton.hide();
}

// Request the user's current GPS location.
// Uses Telegram's LocationManager (Bot API 8.0+) when available, otherwise the
// browser Geolocation API. Resolves { lat, lng, accuracy } or rejects.
export function requestLocation() {
  return new Promise((resolve, reject) => {
    const lm = tg && tg.LocationManager;
    if (lm && typeof lm.getLocation === "function") {
      const fetch = () => {
        if (!lm.isLocationAvailable) { browserLocate(resolve, reject); return; }
        try {
          lm.getLocation((data) => {
            if (data && typeof data.latitude === "number") {
              resolve({ lat: data.latitude, lng: data.longitude, accuracy: data.horizontal_accuracy ?? null });
            } else {
              reject(new Error("location access denied"));
            }
          });
        } catch (e) { browserLocate(resolve, reject); }
      };
      if (lm.isInited) fetch();
      else { try { lm.init(fetch); } catch (e) { browserLocate(resolve, reject); } }
      return;
    }
    browserLocate(resolve, reject);
  });
}

function browserLocate(resolve, reject) {
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  } else {
    reject(new Error("geolocation unavailable"));
  }
}

// Open Telegram's per-app location settings (when the user previously denied access).
export function openLocationSettings() {
  const lm = tg && tg.LocationManager;
  if (lm && typeof lm.openSettings === "function") { try { lm.openSettings(); } catch (e) { /* ignore */ } }
}

// Haptic feedback helpers (no-op outside Telegram).
export function haptic(type = "light") {
  if (!tg || !tg.HapticFeedback) return;
  try {
    if (type === "success" || type === "error" || type === "warning") {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type); // light | medium | heavy | rigid | soft
    }
  } catch (e) { /* ignore */ }
}
