/* ===== Smart Food — server → view-model normalizers =====
   Maps the raw /api/smartfood dicts (BACKEND_API.md §9) into the shapes the
   Vue components consume. Two jobs beyond renaming:
     1. Carry the i18n `names`/`descriptions` maps AND a resolved `name`, so the
        existing foodName()/catName() helpers keep working.
     2. Derive an illustration `kind` + `hue` for <FoodArt>, since the API has no
        such field. `image_url` is preferred by the cards when present. */

const LANGS = ["uz", "ru", "en"];

// Resolve a {uz,ru,en} map for the active language, fallback order [lang, uz, ru, en].
export function pickLang(map, lang) {
  if (!map || typeof map !== "object") return "";
  return map[lang] || map.uz || map.ru || map.en || "";
}

// Build a complete {uz,ru,en} map from a server `names`/`descriptions` map plus a
// resolved single string, so a value is always present for every language.
function fullMap(map, resolved) {
  const base = map && typeof map === "object" ? map : {};
  const fallback = resolved || base.uz || base.ru || base.en || "";
  const out = {};
  for (const l of LANGS) out[l] = base[l] || fallback;
  return out;
}

// Map free text (a category or product name, any language) to a FoodArt kind.
// Specific mixed meals and foods run before broad words such as burger/drink.
// The aliases intentionally include the spellings used by the live Uzbek POS
// catalog, so every published row gets recognizable art without manual images.
const KIND_RULES = [
  ["combo", /combo|kombo|комбо|lanchbox|lunchbox|lanch box|combo top|premium|ikkilik|(?:moxito|mojito|kokteyl).*(?:waffle|vafl)|kurasan.*muzqaymoq/i],
  ["hotdog", /hot\s*dog|hotdog|хот\s*дог|longer/i],
  ["lavash", /lavash|лаваш|tandir|toster|lester/i],
  ["pizza", /pizza|pitsa|пицц|hachapuri|хачапури/i],
  ["sandwich", /non\s*(?:burger|kabob)|нон\s*(?:бургер|кабоб)|sandwich|сэндвич/i],
  ["burger", /burger|бургер/i],
  ["wings", /qanot|wing|крыл/i],
  ["nuggets", /nagget|nugget|наггет/i],
  ["sauce", /sous|sauce|соус|ketchup|chisnoch|chili|qalampir/i],
  ["cheese", /sirniy\s*(?:paloch|sharik)|cheese\s*(?:stick|ball)|сырн.*(?:палоч|шарик)/i],
  ["chicken", /strips?|srtips?|qarsildoq|\bfile\b|chicken|tovuq|куриц/i],
  ["fries", /kartoshka.*fri|french\s*fries|карто.*фри|\bfri\b/i],
  ["doner", /donar|doner|döner|донар|донер/i],
  ["pastry", /bolichka|kurasan|croissant|kruassan|круассан|булоч/i],
  ["bread", /(^|\s)non($|\s)|bread|хлеб|леп[её]ш/i],
  ["gum", /saqich|gum|жвач/i],
  ["waffle", /waffle|vafl|вафл/i],
  ["icecream", /muzqaymoq|ice\s*cream|морож/i],
  ["dessert", /dessert|shirin|десерт|cake|keks|tort|donut|maxrovi|kit\s*kat|medovik|trayfil|trifle/i],
  ["shake", /kokteyl|cocktail|milk\s*shake|milkshake|yogurt|kakao|sutli|matcha|bablti|bubble\s*tea/i],
  ["coffee", /cofe|kofe|coffee|kapuch|cappucc|кофе/i],
  ["tea", /choy|chay|tea|чай/i],
  ["drink", /moxito|mojito|limonat|limanat|limont|lemonad|ichimlik|напит|tashqi\s*bar/i],
  ["bottle", /cola|suv|water|juice|\bsok\b|micco|limoo|dena|maxito|\bparty\b|ak45|aloe|be\s*fresh|sakura/i],
];
export function kindFromText(...texts) {
  const hay = texts.filter(Boolean).join(" ");
  for (const [kind, re] of KIND_RULES) if (re.test(hay)) return kind;
  return "all";
}

const HUE_BY_KIND = {
  burger: 22,
  hotdog: 5,
  pizza: 14,
  lavash: 38,
  sandwich: 45,
  chicken: 27,
  wings: 18,
  nuggets: 34,
  cheese: 48,
  fries: 352,
  sauce: 4,
  doner: 24,
  bread: 38,
  pastry: 31,
  gum: 315,
  tea: 145,
  coffee: 26,
  bottle: 202,
  drink: 300,
  shake: 326,
  icecream: 330,
  waffle: 37,
  dessert: 340,
  combo: 18,
  all: 270,
};
export function hueForKind(kind) {
  return HUE_BY_KIND[kind] ?? 270;
}

// Stable-ish hue jitter from an id so same-kind items don't all look identical.
function hueFor(kind, id) {
  const base = hueForKind(kind);
  const n = Number(id) || 0;
  return (base + (n % 5) * 6) % 360;
}

// Product payloads carry category_id but not the category name. Once both live
// lists arrive, use the category's art family only for names that did not match
// a more specific product rule (e.g. "Mango marakuya" under Choylar).
export function applyCategoryArt(products, categories) {
  const byId = new Map((categories || []).map((category) => [String(category.id), category]));
  for (const product of products || []) {
    if (product.kind !== "all") continue;
    const category = byId.get(String(product.categoryId));
    if (!category || !category.kind || category.kind === "all") continue;
    product.kind = category.kind;
    product.hue = hueFor(product.kind, product.id);
  }
  return products;
}

const UPSELL_KINDS = new Set(["bottle", "drink", "shake", "tea", "coffee", "icecream", "dessert", "waffle"]);
export function isUpsellKind(kind) {
  return UPSELL_KINDS.has(kind);
}

/* ---------- config ---------- */
export function normalizeConfig(d) {
  d = d || {};
  return {
    currency: d.currency || "UZS",
    enabled: !!d.enabled,
    deliveryFee: d.delivery_fee || 0,
    freeDeliveryThreshold: d.free_delivery_threshold || 0,
    minOrderAmount: d.min_order_amount || 0,
    defaultTipOptions: Array.isArray(d.default_tip_options) ? d.default_tip_options : [],
    supportedLanguages: Array.isArray(d.supported_languages) ? d.supported_languages : ["uz", "ru", "en"],
    defaultLanguage: d.default_language || "uz",
    serviceArea: d.service_area || {},
    featureFlags: d.feature_flags || {},
    support: d.support || {},
  };
}

/* ---------- catalog ---------- */
export function normalizeCategory(d) {
  d = d || {};
  const names = fullMap(d.names, d.name);
  const kind = kindFromText(names.en, names.uz, names.ru);
  return {
    id: d.id,
    name: pickLang(names, "uz") || d.name || "",
    names,
    sort: d.sort ?? 0,
    image_url: d.image_url || "",
    kind,
    hue: hueForKind(kind),
  };
}

export function normalizeProduct(d) {
  d = d || {};
  const names = fullMap(d.names, d.name);
  const descriptions = fullMap(d.descriptions, d.description);
  const kind = kindFromText(names.en, names.uz, names.ru);
  const out = {
    id: d.id,
    categoryId: d.category_id,
    name: d.name || pickLang(names, "uz"),
    names,
    description: d.description || "",
    descriptions,
    price: d.price || 0,
    image_url: d.image_url || "",
    tag: d.tag || "",
    kcal: d.kcal ?? null,
    available: d.available !== false,
    kind,
    hue: hueFor(kind, d.id),
  };
  // Detail-only fields (present on GET /catalog/products/:id).
  if (Array.isArray(d.sizes)) out.sizes = d.sizes.map(normalizeSize);
  if (Array.isArray(d.topping_groups)) out.toppingGroups = d.topping_groups.map(normalizeToppingGroup);
  return out;
}

function normalizeSize(s) {
  s = s || {};
  const names = fullMap(s.names, s.name);
  return {
    id: s.id,
    name: s.name || pickLang(names, "uz"),
    names,
    priceDelta: s.price_delta || 0,
    isDefault: !!s.is_default,
  };
}

function normalizeToppingGroup(g) {
  g = g || {};
  return {
    id: g.id,
    name: g.name || "",
    required: !!g.required,
    minSelect: g.min_select || 0,
    maxSelect: g.max_select || 0, // 0 = unlimited
    toppings: Array.isArray(g.toppings) ? g.toppings.map(normalizeTopping) : [],
  };
}

function normalizeTopping(t) {
  t = t || {};
  return { id: t.id, name: t.name || "", price: t.price || 0 };
}

/* ---------- cart quote ---------- */
export function normalizeQuote(d) {
  d = d || {};
  return {
    currency: d.currency || "UZS",
    subtotal: d.subtotal || 0,
    deliveryFee: d.delivery_fee || 0,
    freeDeliveryApplied: !!d.free_delivery_applied,
    discount: d.discount || 0,
    tip: d.tip || 0,
    total: d.total || 0,
    loyaltyPointsUsed: d.loyalty_points_used || 0,
    loyaltyPointsEarned: d.loyalty_points_earned || 0,
    lines: Array.isArray(d.lines) ? d.lines.map(normalizeQuoteLine) : [],
  };
}

function normalizeQuoteLine(l) {
  l = l || {};
  return {
    productId: l.product_id,
    sizeId: l.size_id ?? null,
    name: l.name || "",
    quantity: l.quantity || 0,
    unitPrice: l.unit_price || 0,
    lineTotal: l.line_total || 0,
    toppings: Array.isArray(l.toppings) ? l.toppings : [],
    detail: l.detail || "",
  };
}

/* ---------- orders ---------- */
export function normalizeOrder(d) {
  d = d || {};
  const t = d.totals || {};
  const pos = d.pos_order || null;
  return {
    id: d.id,
    code: d.code || (d.id != null ? "SF-" + d.id : ""),
    source: d.source || "bot",   // "in_store" for purchases made outside the bot
    status: d.status || "PENDING",
    effectiveStatus: d.effective_status || null,
    clientOrderId: d.client_order_id || null,
    orderType: d.order_type || "DELIVERY",
    createdAt: d.created_at || null,
    phone: d.phone || "",
    note: d.note || "",
    addressText: d.address_text || "",
    paymentMethod: d.payment_method || "CASH",
    totals: {
      subtotal: t.subtotal || 0,
      deliveryFee: t.delivery_fee || 0,
      discount: t.discount || 0,
      tip: t.tip || 0,
      total: t.total || 0,
    },
    loyaltyPointsUsed: d.loyalty_points_used || 0,
    loyaltyPointsEarned: d.loyalty_points_earned || 0,
    items: Array.isArray(d.items) ? d.items.map(normalizeOrderItem) : [],
    posOrder: pos
      ? { id: pos.id, uuid: pos.uuid, status: pos.status, displayId: pos.display_id }
      : null,
    dispatchedAt: d.dispatched_at || null,
    rejectReason: d.reject_reason || "",
  };
}

function normalizeOrderItem(it) {
  it = it || {};
  return {
    productId: it.product_id,
    sizeId: it.size_id ?? null,
    quantity: it.quantity || 0,
    unitPrice: it.unit_price || 0,
    lineTotal: it.line_total || 0,
    toppings: Array.isArray(it.toppings) ? it.toppings : [],
    detail: it.detail || "",
  };
}

/* ---------- addresses ---------- */
export function normalizeAddress(d) {
  d = d || {};
  return {
    id: d.id,
    label: d.label || "",
    line: d.line || "",
    lat: d.lat ?? null,
    lng: d.lng ?? null,
    city: d.city || "",
    street: d.street || "",
    house: d.house || "",
    apartment: d.apartment || "",
    entrance: d.entrance || "",
    floor: d.floor || "",
    intercom: d.intercom || "",
    comment: d.comment || "",
    precision: d.precision || "",
    isDefault: !!d.is_default,
  };
}

/* ---------- loyalty ---------- */
export function normalizeRedemption(d) {
  d = d || {};
  return {
    id: d.id,
    code: d.code || "",
    rewardName: d.reward_name || "",
    kind: d.kind || "",
    pointsSpent: d.points_spent || 0,
    status: d.status || "ISSUED",
    createdAt: d.created_at || null,
    fulfilledAt: d.fulfilled_at || null,
  };
}

export function normalizeReward(d) {
  d = d || {};
  return {
    id: d.id,
    name: d.name || "Gift",
    names: d.names || {},
    description: d.description || "",
    kind: d.kind || "CUSTOM",
    pointsCost: d.points_cost || 0,
    imageUrl: d.image_url || "",
    discountAmount: d.discount_amount || 0,
    productId: d.product_id || null,
    inStock: d.in_stock !== false,
    affordable: !!d.affordable,
  };
}

export function normalizeLoyalty(d) {
  d = d || {};
  const rate = d.earn_rate || {};
  return {
    points: d.points || 0,
    memberId: d.member_id || "",
    // NB: `points_per_uzs` is actually UZS-spent-per-1-point-earned (guide §6.6).
    pointsPerUzs: rate.points_per_uzs || 0,
    pointValueUzs: rate.point_value_uzs || 0,
    history: Array.isArray(d.history)
      ? d.history.map((h) => ({
          code: h.code || "",
          pointsEarned: h.points_earned || 0,
          pointsUsed: h.points_used || 0,
          createdAt: h.created_at || null,
        }))
      : [],
    redemptions: Array.isArray(d.redemptions) ? d.redemptions.map(normalizeRedemption) : [],
  };
}

/* ---------- profile / me ---------- */
export function normalizeMe(d) {
  d = d || {};
  return {
    id: d.id,
    telegramId: d.telegram_id,
    name: d.name || "",
    phone: d.phone || "",
    language: d.language || "uz",
    photoUrl: d.photo_url || "",
    points: (d.loyalty && d.loyalty.points) || 0,
  };
}

/* ---------- support ---------- */
export function normalizeSupport(d) {
  d = d || {};
  return {
    contacts: d.contacts || {},
    faq: Array.isArray(d.faq) ? d.faq : [],
  };
}

export function normalizeTicket(d) {
  d = d || {};
  return {
    id: d.id,
    subject: d.subject || "",
    status: d.status || "OPEN",
    createdAt: d.created_at || null,
    messages: Array.isArray(d.messages)
      ? d.messages.map((m) => ({
          id: m.id,
          sender: m.sender || "CUSTOMER",
          text: m.text || "",
          createdAt: m.created_at || null,
        }))
      : [],
  };
}

/* ---------- geo ---------- */
export function normalizeGeoResult(r) {
  r = r || {};
  return {
    formatted: r.formatted || "",
    lat: r.lat ?? null,
    lng: r.lng ?? null,
    precision: r.precision || "",
    kind: r.kind || "",
  };
}
