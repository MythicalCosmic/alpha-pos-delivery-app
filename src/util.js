/* ===== Smart Food — small shared formatting helpers ===== */

const LOCALES = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" };

// ISO 8601 (or null) -> short, locale-aware "14 Jun, 13:24". Falls back gracefully.
export function fmtDateTime(iso, lang = "uz") {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(LOCALES[lang] || "ru-RU", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function fmtTime(iso, lang = "uz") {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(LOCALES[lang] || "ru-RU", { hour: "2-digit", minute: "2-digit" }).format(d);
  } catch {
    return "";
  }
}
