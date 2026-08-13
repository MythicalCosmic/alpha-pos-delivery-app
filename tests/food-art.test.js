import test from "node:test";
import assert from "node:assert/strict";

import { FOOD_ART_KINDS } from "../src/components/FoodArt.js";
import {
  applyCategoryArt,
  hueForKind,
  isUpsellKind,
  kindFromText,
} from "../src/api/normalize.js";

const EXAMPLES = {
  burger: "Chicken chiz burger",
  hotdog: "Hot Dog halapeno",
  pizza: "Pitsa pepperoni katta",
  lavash: "Tandir Lavash",
  sandwich: "Non kabob standart",
  chicken: "Qarsildoq strips 1kg",
  wings: "Qanotcha 8 ta",
  nuggets: "Naggetsi 10ta",
  cheese: "Sirniy palochki 5ta",
  fries: "Kartoshka fri",
  sauce: "Sous qalampir",
  doner: "Donar",
  bread: "Non",
  pastry: "KURASAN MUVA",
  gum: "Alif saqich 5 ming",
  tea: "Limon imbirli choy",
  coffee: "Cofe kapuchino",
  bottle: "Milliy cola 1.5",
  drink: "Moxito mango marakuyya",
  shake: "Kokteyl qulupnay",
  icecream: "Muzqaymoq sharik",
  waffle: "Gankongskiy waffle assartiy",
  dessert: "Tort MATILDA",
  combo: "Lavash combo",
};

test("every menu art family has a drawn glyph and stable hue", () => {
  for (const [expected, name] of Object.entries(EXAMPLES)) {
    const actual = kindFromText(name);
    assert.equal(actual, expected, name);
    assert.ok(FOOD_ART_KINDS.includes(actual), `${actual} must have a FoodArt glyph`);
    assert.equal(Number.isFinite(hueForKind(actual)), true);
  }
});

test("mixed meals resolve before their individual food words", () => {
  assert.equal(kindFromText("Hot dog combo 42 ming"), "combo");
  assert.equal(kindFromText("Moxito+kokteyl+waffle 65.000"), "combo");
  assert.equal(kindFromText("KURASAN MUVA+MUZQAYMOQ"), "combo");
  assert.equal(kindFromText("Pitsa burgerli katta"), "pizza");
  assert.equal(kindFromText("Lavash tovuqli"), "lavash");
});

test("unbranded product names inherit their live category art", () => {
  const products = [{ id: 514, categoryId: 22, name: "Mango marakuya", kind: "all", hue: 270 }];
  const categories = [{ id: 22, name: "Choylar", kind: "tea", hue: 145 }];
  applyCategoryArt(products, categories);
  assert.equal(products[0].kind, "tea");
  assert.notEqual(products[0].hue, 270);
});

test("all beverage and sweet art families remain eligible for cart suggestions", () => {
  for (const kind of ["bottle", "drink", "shake", "tea", "coffee", "icecream", "dessert", "waffle"])
    assert.equal(isUpsellKind(kind), true, kind);
  assert.equal(isUpsellKind("burger"), false);
});
