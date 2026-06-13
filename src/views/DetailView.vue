<template>
  <div v-if="food" class="push-anim" style="min-height:100%">
    <div class="detail-hero">
      <FoodArt :kind="food.kind" :hue="food.hue" />
      <div class="nav">
        <button class="iconbtn press" @click="back"><Icon name="back" /></button>
        <button :class="['iconbtn', 'press', { on: fav }]" @click="toggleFav(food.id)"><Icon name="heart" :filled="fav" /></button>
      </div>
    </div>
    <div class="detail-body">
      <h1>{{ foodName(food, store.lang) }}</h1>
      <div class="detail-chips">
        <span class="dchip star"><Icon name="star" :size="15" filled /> {{ food.rating }}</span>
        <span class="dchip"><Icon name="clock" :size="15" /> {{ food.time }} {{ t("min", store.lang) }}</span>
        <span class="dchip"><Icon name="fire" :size="15" /> {{ food.kcal }} {{ t("kcal", store.lang) }}</span>
      </div>
      <p class="desc">{{ foodDesc(food, store.lang) }}</p>

      <h3>{{ t("size", store.lang) }}</h3>
      <div class="size-row">
        <button v-for="s in SIZES" :key="s.id" :class="['size-pill', 'press', { on: sizeId === s.id }]" @click="sizeId = s.id">
          {{ locName(s, store.lang) }}
          <span class="mp">{{ sum(Math.round(food.price * s.mult), store.lang) }}</span>
        </button>
      </div>

      <h3>{{ t("extras", store.lang) }}</h3>
      <button v-for="e in EXTRAS" :key="e.id" class="extra-row press" style="width:100%" @click="toggleExtra(e.id)">
        <span :class="['checkbox', { on: extras.includes(e.id) }]"><Icon v-if="extras.includes(e.id)" name="check" /></span>
        <span class="nm">{{ locName(e, store.lang) }}</span>
        <span class="pr">+{{ sum(e.price, store.lang) }}</span>
      </button>
      <div style="height:110px"></div>
    </div>

    <div class="actionbar">
      <Stepper :q="qty" @dec="qty = Math.max(1, qty - 1)" @inc="qty++" />
      <button class="cta press" @click="add">
        {{ t("addToCart", store.lang) }} <span class="tp">· {{ sum(total, store.lang) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import Stepper from "../components/Stepper.vue";
import { store, isFav, toggleFav, addItem, flash } from "../store.js";
import { t } from "../data/strings.js";
import { SIZES, EXTRAS, foodById, foodName, foodDesc, locName, sum } from "../data/foods.js";
import { haptic } from "../telegram.js";

const route = useRoute();
const router = useRouter();
const food = computed(() => foodById(route.params.id));

const sizeId = ref("m");
const extras = ref([]);
const qty = ref(1);

const fav = computed(() => food.value && isFav(food.value.id));
const size = computed(() => SIZES.find(s => s.id === sizeId.value));
const extrasTotal = computed(() => extras.value.reduce((s, id) => s + EXTRAS.find(e => e.id === id).price, 0));
const unit = computed(() => Math.round(food.value.price * size.value.mult) + extrasTotal.value);
const total = computed(() => unit.value * qty.value);

function toggleExtra(id) {
  const i = extras.value.indexOf(id);
  if (i >= 0) extras.value.splice(i, 1);
  else extras.value.push(id);
}
function back() { router.back(); }
function add() {
  addItem({ foodId: food.value.id, sizeId: sizeId.value, extraIds: [...extras.value], qty: qty.value, unit: unit.value });
  haptic("success");
  router.back();
  flash(t("added", store.lang));
}
</script>
