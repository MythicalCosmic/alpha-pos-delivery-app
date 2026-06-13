<template>
  <div class="splash" @click="$emit('done')">
    <div class="aura a"></div>
    <div class="aura b"></div>
    <div class="orbit">
      <div class="od"><FoodArt kind="burger" :hue="22" /></div>
      <div class="od"><FoodArt kind="pizza" :hue="14" /></div>
      <div class="od"><FoodArt kind="dessert" :hue="330" /></div>
      <div class="od"><FoodArt kind="drink" :hue="300" /></div>
    </div>
    <div class="mark">
      <span class="glow"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M9 12v9" />
        <path d="M16 3c-1.6 0-2.8 2-2.8 4.5S14.4 12 16 12s2.8-2 2.8-4.5S17.6 3 16 3ZM16 12v9" />
      </svg>
    </div>
    <div class="word">Smart <span class="hl">Food</span></div>
    <div class="tagline">{{ tagline }}</div>
    <div class="loader"><i></i></div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import FoodArt from "./FoodArt.js";
import { store } from "../store.js";

const emit = defineEmits(["done"]);
const tagline = computed(() =>
  ({ uz: "Tez · Issiq · Mazali", en: "Fast · Hot · Tasty", ru: "Быстро · Горячо · Вкусно" }[store.lang] || "Tez · Issiq · Mazali")
);
let id;
onMounted(() => { id = setTimeout(() => emit("done"), 3200); });
onUnmounted(() => clearTimeout(id));
</script>
