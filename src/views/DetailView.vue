<template>
  <div class="push-anim" style="min-height:100%">
    <div v-if="loading" class="detail-load"><span class="spinner"></span></div>

    <div v-else-if="error" class="empty" style="min-height:80vh">
      <div class="ei"><Icon name="bag" /></div>
      <h3>{{ error === "closed" ? t("closedT", store.lang) : t("nothingHere", store.lang) }}</h3>
      <p>{{ error === "closed" ? t("closedS", store.lang) : "" }}</p>
      <button class="cta press" style="margin-top:18px;max-width:220px" @click="router.back()">{{ t("back", store.lang) }}</button>
    </div>

    <template v-else-if="food">
      <div class="detail-hero">
        <img v-if="food.image_url && !imgFailed" :src="food.image_url" :alt="foodName(food, store.lang)" class="hero-img" @error="imgFailed = true" />
        <FoodArt v-else :kind="food.kind" :hue="food.hue" />
        <div class="nav">
          <button class="iconbtn press" @click="router.back()"><Icon name="back" /></button>
          <button :class="['iconbtn', 'press', { on: fav }]" @click="toggleFav(food)"><Icon name="heart" :filled="fav" /></button>
        </div>
      </div>
      <div class="detail-body">
        <h1>{{ foodName(food, store.lang) }}</h1>
        <div class="detail-chips">
          <span v-if="food.kcal" class="dchip"><Icon name="fire" :size="15" /> {{ food.kcal }} {{ t("kcal", store.lang) }}</span>
          <span v-if="food.tag" :class="['dchip']">{{ tagLabel }}</span>
        </div>
        <p v-if="foodDesc(food, store.lang)" class="desc">{{ foodDesc(food, store.lang) }}</p>

        <!-- sizes -->
        <template v-if="food.sizes && food.sizes.length">
          <h3>{{ t("size", store.lang) }}</h3>
          <div class="size-row">
            <button v-for="s in food.sizes" :key="s.id" :class="['size-pill', 'press', { on: sizeId === s.id }]" @click="sizeId = s.id">
              {{ locName(s, store.lang) }}
              <span class="mp">{{ sum(food.price + s.priceDelta, store.lang) }}</span>
            </button>
          </div>
        </template>

        <!-- topping groups -->
        <template v-for="g in food.toppingGroups || []" :key="g.id">
          <h3>{{ g.name }} <span class="grule">{{ groupRule(g) }}</span></h3>
          <button v-for="tp in g.toppings" :key="tp.id" class="extra-row press" style="width:100%" @click="toggleTopping(g, tp.id)">
            <span :class="['checkbox', { on: toppingIds.includes(tp.id) }]"><Icon v-if="toppingIds.includes(tp.id)" name="check" /></span>
            <span class="nm">{{ tp.name }}</span>
            <span v-if="tp.price" class="pr">+{{ sum(tp.price, store.lang) }}</span>
          </button>
        </template>

        <div style="height:110px"></div>
      </div>

      <div class="actionbar">
        <Stepper :q="qty" @dec="qty = Math.max(1, qty - 1)" @inc="qty++" />
        <button class="cta press" :disabled="!valid" @click="add">
          {{ t("addToCart", store.lang) }} <span class="tp">· {{ sum(total, store.lang) }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import Stepper from "../components/Stepper.vue";
import { store, isFav, toggleFav, addLine, buildLine, flash, loadProduct } from "../store.js";
import { ClosedError } from "../api/index.js";
import { t } from "../data/strings.js";
import { foodName, foodDesc, locName, sum } from "../data/foods.js";
import { haptic } from "../telegram.js";

const route = useRoute();
const router = useRouter();

const food = ref(null);
const loading = ref(true);
const error = ref("");
const imgFailed = ref(false);

const sizeId = ref(null);
const toppingIds = ref([]);
const qty = ref(1);

const fav = computed(() => food.value && isFav(food.value.id));
const tagLabel = computed(() => {
  const tag = food.value && food.value.tag;
  return t(tag === "bestseller" ? "bestseller" : tag === "new" ? "newItem" : "spicy", store.lang);
});

const size = computed(() => (food.value && food.value.sizes || []).find((s) => s.id === sizeId.value) || null);
const allToppings = computed(() => (food.value && food.value.toppingGroups || []).flatMap((g) => g.toppings));
const toppingsTotal = computed(() =>
  toppingIds.value.reduce((s, id) => s + ((allToppings.value.find((tp) => tp.id === id) || {}).price || 0), 0)
);
const unit = computed(() => (food.value ? food.value.price + (size.value ? size.value.priceDelta : 0) + toppingsTotal.value : 0));
const total = computed(() => unit.value * qty.value);

function groupRule(g) {
  if (g.required || g.minSelect > 0) {
    if (g.maxSelect === 1) return "· 1";
    if (g.maxSelect > 1) return `· ${g.minSelect}–${g.maxSelect}`;
    return `· ${g.minSelect}+`;
  }
  return `· ${t("optional", store.lang)}`;
}
function countInGroup(g) { return g.toppings.filter((tp) => toppingIds.value.includes(tp.id)).length; }
function toggleTopping(g, id) {
  const i = toppingIds.value.indexOf(id);
  if (i >= 0) { toppingIds.value.splice(i, 1); return; }
  const max = g.maxSelect; // 0 = unlimited
  if (max === 1) {
    // radio within the group
    toppingIds.value = toppingIds.value.filter((tid) => !g.toppings.some((tp) => tp.id === tid));
    toppingIds.value.push(id);
    return;
  }
  if (max > 0 && countInGroup(g) >= max) { haptic("warning"); return; }
  toppingIds.value.push(id);
}

const valid = computed(() => {
  if (!food.value || food.value.available === false) return false;
  const groups = food.value.toppingGroups || [];
  return groups.every((g) => {
    const n = countInGroup(g);
    if ((g.required || g.minSelect > 0) && n < g.minSelect) return false;
    if (g.maxSelect > 0 && n > g.maxSelect) return false;
    return true;
  });
});

function add() {
  if (!valid.value) return;
  addLine(buildLine(food.value, { sizeId: sizeId.value, toppingIds: [...toppingIds.value], qty: qty.value }));
  haptic("success");
  router.back();
  flash(t("added", store.lang));
}

onMounted(async () => {
  try {
    const id = Number(route.params.id) || route.params.id;
    const p = await loadProduct(id);
    food.value = p;
    const def = (p.sizes || []).find((s) => s.isDefault) || (p.sizes || [])[0];
    sizeId.value = def ? def.id : null;
  } catch (e) {
    error.value = e instanceof ClosedError ? "closed" : "notfound";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.detail-load { min-height: 80vh; display: grid; place-items: center; }
.hero-img { width: 100%; height: 100%; object-fit: cover; }
.grule { font-size: 12px; font-weight: 700; color: var(--text-faint); }
.spinner { width: 32px; height: 32px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--accent) 25%, transparent); border-top-color: var(--accent); animation: dspin .8s linear infinite; }
@keyframes dspin { to { transform: rotate(360deg); } }
</style>
