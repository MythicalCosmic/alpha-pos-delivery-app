<template>
  <div class="screen-anim">
    <div class="page-head">
      <h1>{{ t("tCats", store.lang) }}</h1>
      <div class="sub">{{ store.products.length }} {{ t("items", store.lang) }} · {{ cats.length }} {{ t("categories", store.lang).toLowerCase() }}</div>
    </div>

    <div v-if="!storeOpen" class="closed-banner">
      <span class="ci"><Icon name="store" :size="20" /></span>
      <div><div class="a">{{ t("closedT", store.lang) }}</div><div class="b">{{ t("closedS", store.lang) }}</div></div>
    </div>

      <div class="cat-grid" style="margin-top:16px">
        <button
          v-for="c in cats"
          :key="c.id"
          class="cat-tile press"
          :style="cat === c.id ? { borderColor: 'var(--accent)', boxShadow: 'var(--shadow-accent)' } : null"
          @click="cat = c.id"
        >
          <div class="art"><FoodArt :kind="c.kind" :hue="c.hue" /></div>
          <div>
            <div class="nm">{{ catName(c, store.lang) }}</div>
            <div class="ct">{{ counts(c.id) }} {{ t("items", store.lang) }}</div>
          </div>
        </button>
      </div>
      <SecHead v-if="activeCat" :title="catName(activeCat, store.lang)" />
      <div class="flist">
        <FoodRow v-for="f in feed" :key="f.id" :f="f" />
      </div>
    <div style="height:8px"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import FoodArt from "../components/FoodArt.js";
import FoodRow from "../components/FoodRow.vue";
import SecHead from "../components/SecHead.vue";
import Icon from "../components/Icon.js";
import { store, storeOpen, loadCategories, loadProducts } from "../store.js";
import { t } from "../data/strings.js";
import { catName } from "../data/foods.js";

const cats = computed(() => store.categories);
const cat = ref(null);
const feed = computed(() => (cat.value == null ? [] : store.products.filter((f) => f.categoryId === cat.value)));
const activeCat = computed(() => store.categories.find((c) => c.id === cat.value) || null);
const counts = (id) => store.products.filter((f) => f.categoryId === id).length;

watch(cats, (list) => { if (cat.value == null && list.length) cat.value = list[0].id; }, { immediate: true });

onMounted(() => {
  if (!store.categories.length) loadCategories();
  loadProducts();
});
</script>

<style scoped>
.closed-banner { display: flex; align-items: center; gap: 12px; margin: 16px 20px 0; padding: 16px; border: 1px solid color-mix(in srgb, #e0a02a 30%, transparent); border-radius: 18px; background: color-mix(in srgb, #e0a02a 12%, var(--surface)); }
.closed-banner .ci { width: 42px; height: 42px; display: grid; flex: none; place-items: center; border-radius: 13px; background: var(--surface-2); color: #e0a02a; }
.closed-banner .a { font-size: 14px; font-weight: 800; }
.closed-banner .b { margin-top: 2px; color: var(--text-dim); font-size: 12px; font-weight: 600; }
</style>
