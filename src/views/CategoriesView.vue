<template>
  <div class="screen-anim">
    <div class="page-head">
      <h1>{{ t("tCats", store.lang) }}</h1>
      <div class="sub">{{ FOODS.length }} {{ t("items", store.lang) }} · {{ CATEGORIES.length - 1 }} {{ t("categories", store.lang).toLowerCase() }}</div>
    </div>
    <div class="cat-grid" style="margin-top:16px">
      <button
        v-for="c in cats"
        :key="c.id"
        class="cat-tile press"
        :style="cat === c.id ? { borderColor: 'var(--accent)', boxShadow: 'var(--shadow-accent)' } : null"
        @click="cat = c.id"
      >
        <div class="art"><FoodArt :kind="c.kind" :hue="hueFor(c.id)" /></div>
        <div>
          <div class="nm">{{ catName(c, store.lang) }}</div>
          <div class="ct">{{ counts(c.id) }} {{ t("items", store.lang) }}</div>
        </div>
      </button>
    </div>
    <SecHead :title="catName(activeCat, store.lang)" />
    <div class="flist">
      <FoodRow v-for="f in feed" :key="f.id" :f="f" />
    </div>
    <div style="height:8px"></div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import FoodArt from "../components/FoodArt.js";
import FoodRow from "../components/FoodRow.vue";
import SecHead from "../components/SecHead.vue";
import { store } from "../store.js";
import { t } from "../data/strings.js";
import { CATEGORIES, FOODS, catName, hueFor } from "../data/foods.js";

const cats = CATEGORIES.filter(c => c.id !== "all");
const cat = ref("burger");
const feed = computed(() => FOODS.filter(f => f.cat === cat.value));
const activeCat = computed(() => CATEGORIES.find(c => c.id === cat.value));
const counts = (id) => FOODS.filter(f => f.cat === id).length;
</script>
