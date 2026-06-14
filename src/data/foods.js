/* ===== Smart Food — presentation helpers =====
   The catalog now comes live from /api/smartfood (see src/api/). What remains
   here are pure formatting/i18n helpers that operate on the normalized
   view-models produced by src/api/normalize.js. They also tolerate the older
   flat-key shape ({uz,ru,en}) so nothing breaks if a plain object is passed. */

import { pickLang } from "../api/normalize.js";

// Resolve a localized name from a normalized product/category (`.names` map +
// resolved `.name`), falling back to flat language keys.
export function foodName(f, lang) {
  if (!f) return "";
  return pickLang(f.names, lang) || f.name || f[lang] || f.uz || "";
}

export function foodDesc(f, lang) {
  if (!f) return "";
  return pickLang(f.descriptions, lang) || f.description || f["d" + lang] || f.duz || "";
}

export function catName(c, lang) {
  if (!c) return "";
  return pickLang(c.names, lang) || c.name || c[lang] || c.uz || "";
}

// Localized name for a small option object (size/topping/reward) — `.names` map,
// resolved `.name`, or flat keys.
export function locName(o, lang) {
  if (!o) return "";
  return pickLang(o.names, lang) || o.name || o[lang] || o.uz || "";
}

// Uzbek/Russian so'm grouping: 39000 -> "39 000 so'm" (or "… сум" in ru).
export function sum(n, lang) {
  const grouped = Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (lang === "ru") return grouped + " сум";
  return grouped + " so‘m";
}
