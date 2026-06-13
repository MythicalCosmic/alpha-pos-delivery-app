/* ===== Smart Food — catalog data & formatting helpers ===== */

// kind drives the SVG illustration in FoodArt
export const CATEGORIES = [
  { id: "all",      kind: "all",     uz: "Hammasi", en: "All",      ru: "Все" },
  { id: "burger",   kind: "burger",  uz: "Burger",  en: "Burgers",  ru: "Бургеры" },
  { id: "pizza",    kind: "pizza",   uz: "Pitsa",   en: "Pizza",    ru: "Пицца" },
  { id: "dessert",  kind: "dessert", uz: "Shirinlik", en: "Dessert", ru: "Десерты" },
  { id: "drink",    kind: "drink",   uz: "Ichimlik", en: "Drinks",  ru: "Напитки" },
  { id: "combo",    kind: "combo",   uz: "Kombo",   en: "Combo",    ru: "Комбо" },
];

// hue tints the illustration background
export const FOODS = [
  { id: "f1", cat: "burger", kind: "burger", hue: 22,  price: 39000, oldPrice: 52000, rating: 4.9, time: 20, kcal: 540, tag: "bestseller", spicy: false,
    uz: "Smart Klassik Burger", en: "Smart Classic Burger", ru: "Классический бургер",
    duz: "Mol go‘shti kotleti, cheddar, achchiq sous va yangi sabzavotlar bilan.",
    den: "Juicy beef patty, cheddar, smart sauce and fresh garden veggies.",
    dru: "Сочная говяжья котлета, чеддер, фирменный соус и свежие овощи." },
  { id: "f2", cat: "burger", kind: "burger", hue: 8, price: 47000, rating: 4.8, time: 22, kcal: 690, tag: "spicy", spicy: true,
    uz: "Olovli Double Burger", en: "Double Flame Burger", ru: "Двойной острый бургер",
    duz: "Ikki qavat kotlet, jalapeno va olovli chili sous.",
    den: "Two flame-grilled patties, jalapeño and fiery chili glaze.",
    dru: "Две котлеты на огне, халапеньо и острый соус чили." },
  { id: "f3", cat: "burger", kind: "burger", hue: 38, price: 35000, rating: 4.7, time: 18, kcal: 480, tag: "", spicy: false,
    uz: "Tovuqli Krunch Burger", en: "Crunch Chicken Burger", ru: "Хрустящий куриный бургер",
    duz: "Xrustlama tovuq filesi, coleslaw va asal-hardal sous.",
    den: "Crispy chicken fillet, coleslaw and honey-mustard.",
    dru: "Хрустящее куриное филе, коул-слоу и медово-горчичный соус." },
  { id: "f4", cat: "pizza", kind: "pizza", hue: 14, price: 72000, rating: 4.9, time: 28, kcal: 980, tag: "bestseller", spicy: false,
    uz: "Pepperoni Supreme", en: "Pepperoni Supreme", ru: "Пепперони Суприм",
    duz: "Ikki barobar pepperoni, mozzarella va o‘tli tomat sous.",
    den: "Double pepperoni, mozzarella and herbed tomato base.",
    dru: "Двойная пепперони, моцарелла и томатный соус с травами." },
  { id: "f5", cat: "pizza", kind: "pizza", hue: 120, price: 68000, rating: 4.7, time: 26, kcal: 820, tag: "", spicy: false,
    uz: "Margarita Bianca", en: "Margherita Bianca", ru: "Маргарита Бьянка",
    duz: "Buyvol mozzarellasi, rayhon va zaytun moyi.",
    den: "Buffalo mozzarella, fresh basil and olive oil.",
    dru: "Моцарелла буффало, базилик и оливковое масло." },
  { id: "f6", cat: "pizza", kind: "pizza", hue: 32, price: 84000, rating: 4.8, time: 30, kcal: 1040, tag: "new", spicy: true,
    uz: "Four Cheese & Chili", en: "Four Cheese & Chili", ru: "Четыре сыра и чили",
    duz: "To‘rt xil pishloq, asal va achchiq chili.",
    den: "Four cheeses, honey drizzle and chili flakes.",
    dru: "Четыре сыра, мёд и хлопья чили." },
  { id: "f7", cat: "dessert", kind: "dessert", hue: 330, price: 24000, rating: 4.9, time: 12, kcal: 420, tag: "bestseller", spicy: false,
    uz: "Tutli Chizkeyk", en: "Berry Cheesecake", ru: "Ягодный чизкейк",
    duz: "New-York uslubidagi chizkeyk, yangi reza meva sousi.",
    den: "New-York style cheesecake with fresh berry coulis.",
    dru: "Чизкейк по нью-йоркски с ягодным соусом." },
  { id: "f8", cat: "dessert", kind: "dessert", hue: 28, price: 19000, rating: 4.6, time: 10, kcal: 360, tag: "", spicy: false,
    uz: "Tuzli Karamel Donut", en: "Salted Caramel Donut", ru: "Солёная карамель донат",
    duz: "Yumshoq donut, tuzli karamel va karamel bo‘laklari.",
    den: "Soft glazed donut with salted caramel drizzle.",
    dru: "Мягкий донат с солёной карамелью." },
  { id: "f9", cat: "drink", kind: "drink", hue: 300, price: 26000, rating: 4.8, time: 8, kcal: 220, tag: "new", spicy: false,
    uz: "Qulupnay Milkshake", en: "Strawberry Milkshake", ru: "Клубничный милкшейк",
    duz: "Qaymoqli qulupnay milksheyk, qaymoq qalpoq bilan.",
    den: "Creamy strawberry shake topped with whipped cream.",
    dru: "Сливочный клубничный коктейль со взбитыми сливками." },
  { id: "f10", cat: "drink", kind: "drink", hue: 200, price: 14000, rating: 4.5, time: 5, kcal: 90, tag: "", spicy: false,
    uz: "Limon-Yalpiz Lemonad", en: "Lemon Mint Lemonade", ru: "Лимонад с мятой",
    duz: "Yangi siqilgan limon, yalpiz va muz.",
    den: "Fresh lemon, mint leaves and crushed ice.",
    dru: "Свежий лимон, мята и колотый лёд." },
  { id: "f11", cat: "combo", kind: "combo", hue: 18, price: 89000, oldPrice: 110000, rating: 4.9, time: 25, kcal: 1180, tag: "bestseller", spicy: false,
    uz: "Smart Duo Kombo", en: "Smart Duo Combo", ru: "Комбо Smart Duo",
    duz: "2 burger, kartoshka fri va 2 ichimlik.",
    den: "2 burgers, golden fries and 2 drinks.",
    dru: "2 бургера, картофель фри и 2 напитка." },
  { id: "f12", cat: "combo", kind: "combo", hue: 270, price: 119000, rating: 4.8, time: 32, kcal: 1620, tag: "", spicy: false,
    uz: "Oilaviy Fiesta Kombo", en: "Family Fiesta Combo", ru: "Семейное комбо Fiesta",
    duz: "1 katta pitsa, 2 burger, fri va 4 ichimlik.",
    den: "1 large pizza, 2 burgers, fries and 4 drinks.",
    dru: "1 большая пицца, 2 бургера, фри и 4 напитка." },
];

export const SIZES = [
  { id: "s", uz: "Kichik", en: "Small", ru: "Малый", mult: 0.85 },
  { id: "m", uz: "O‘rta", en: "Medium", ru: "Средний", mult: 1 },
  { id: "l", uz: "Katta", en: "Large", ru: "Большой", mult: 1.25 },
];

export const EXTRAS = [
  { id: "cheese", uz: "Qo‘shimcha pishloq", en: "Extra cheese", ru: "Доп. сыр", price: 6000 },
  { id: "bacon",  uz: "Bekon", en: "Bacon", ru: "Бекон", price: 9000 },
  { id: "sauce",  uz: "Smart sous", en: "Smart sauce", ru: "Smart соус", price: 4000 },
  { id: "fries",  uz: "Kartoshka fri", en: "Side fries", ru: "Картофель фри", price: 15000 },
];

export const DELIVERY_FEE = 12000;
export const FREE_DELIVERY_AT = 100000;

export function foodName(f, lang) { return f[lang] || f.uz; }
export function foodDesc(f, lang) { return f["d" + lang] || f.duz; }
export function catName(c, lang) { return c[lang] || c.uz; }
export function locName(o, lang) { return o[lang] || o.uz; }
export function foodById(id) { return FOODS.find(f => f.id === id); }

export function hueFor(id) {
  return { all: 270, burger: 22, pizza: 14, dessert: 330, drink: 300, combo: 18 }[id] ?? 270;
}

// uzbek-style number grouping: 39 000 so'm
export function sum(n, lang) {
  const grouped = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (lang === "ru") return grouped + " сум";
  return grouped + " so‘m";
}
