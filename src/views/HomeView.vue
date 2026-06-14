<template>
  <div class="screen-anim">
    <!-- header -->
    <div class="home-head row spread">
      <button class="loc-btn press" @click="router.push('/addresses')">
        <span class="loc-ic"><Icon name="pin" :size="22" /></span>
        <span class="loc-text col" style="align-items:flex-start">
          <span class="lbl">{{ t("deliverTo", store.lang) }}</span>
          <span class="val"><span class="addr-txt">{{ selectedAddress ? selectedAddress.line : "—" }}</span> <Icon name="chevronDown" :size="16" /></span>
        </span>
      </button>
      <div class="head-actions">
        <button class="loy-btn press" @click="router.push('/loyalty')"><Icon name="qr" :size="22" /></button>
        <button class="avatar press" @click="router.push('/support')"><Icon name="bell" :size="22" /></button>
      </div>
    </div>

    <!-- search -->
    <div class="search">
      <Icon name="search" :size="20" style="color:var(--text-faint)" />
      <input v-model="q" :placeholder="t('searchPh', store.lang)" />
      <span class="filt"><Icon name="grid" :size="17" /></span>
    </div>

    <!-- closed -->
    <div v-if="!storeOpen" class="closed-banner">
      <span class="ci"><Icon name="store" :size="20" /></span>
      <div><div class="a">{{ t("closedT", store.lang) }}</div><div class="b">{{ t("closedS", store.lang) }}</div></div>
    </div>

    <template v-else>
      <!-- category chips -->
      <SecHead :title="t('categories', store.lang)" :link="t('seeAll', store.lang)" @link="router.push('/categories')" />
      <div class="chips">
        <button
          v-for="c in chips"
          :key="c.id"
          :class="['chip', 'press', { on: cat === c.id }]"
          @click="cat = c.id"
        >
          <span class="ci"><FoodArt :kind="c.kind" :hue="c.hue" /></span>
          <span>{{ catName(c, store.lang) }}</span>
        </button>
      </div>

      <!-- free-delivery banner (from live config) -->
      <div v-if="freeThreshold" class="promo press">
        <div class="deco"><FoodArt kind="burger" :hue="20" /></div>
        <div class="deco2"><FoodArt kind="drink" :hue="300" /></div>
        <h3>{{ t("freeDelivery", store.lang) }}</h3>
        <p>{{ t("freeOver", store.lang, { v: sum(freeThreshold, store.lang) }) }}</p>
        <span class="pill"><Icon name="scooter" :size="16" /> {{ t("freeDelivery", store.lang) }}</span>
      </div>

      <!-- loading -->
      <div v-if="store.catalogLoading && !store.products.length" class="cat-loading">
        <span class="spinner"></span>
      </div>

      <template v-else>
        <!-- popular -->
        <template v-if="cat === 'all' && !q && popular.length">
          <SecHead :title="t('popular', store.lang)" />
          <div class="hscroll">
            <FoodCard v-for="f in popular" :key="f.id" :f="f" />
          </div>
        </template>

        <!-- feed -->
        <SecHead :title="feedTitle" />
        <div v-if="feed.length === 0" class="empty">
          <div class="ei"><Icon name="search" /></div><h3>{{ t("noResults", store.lang) }}</h3><p>{{ t("searchPh", store.lang) }}</p>
        </div>
        <div v-else-if="store.tweaks.homeLayout === 'list'" class="flist">
          <FoodRow v-for="f in feed" :key="f.id" :f="f" />
        </div>
        <div v-else class="food-grid">
          <FoodCard v-for="f in feed" :key="f.id" :f="f" />
        </div>
      </template>
    </template>
    <div style="height:8px"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import FoodCard from "../components/FoodCard.vue";
import FoodRow from "../components/FoodRow.vue";
import SecHead from "../components/SecHead.vue";
import { store, selectedAddress, storeOpen, loadCategories, loadProducts } from "../store.js";
import { t } from "../data/strings.js";
import { catName, foodName, sum } from "../data/foods.js";

const router = useRouter();
const cat = ref("all");
const q = ref("");

const chips = computed(() => [
  { id: "all", kind: "all", hue: 270, names: { uz: t("catAll", "uz"), ru: t("catAll", "ru"), en: t("catAll", "en") } },
  ...store.categories,
]);
const freeThreshold = computed(() => (store.config ? store.config.freeDeliveryThreshold : 0));

const popular = computed(() => {
  const best = store.products.filter((f) => f.tag === "bestseller");
  return (best.length ? best : store.products).slice(0, 6);
});
const feed = computed(() =>
  store.products.filter((f) =>
    (cat.value === "all" || f.categoryId === cat.value) &&
    (!q.value || foodName(f, store.lang).toLowerCase().includes(q.value.toLowerCase()))
  )
);
const feedTitle = computed(() =>
  cat.value === "all"
    ? t("recommended", store.lang)
    : catName(store.categories.find((c) => c.id === cat.value), store.lang)
);

onMounted(() => {
  if (!store.categories.length) loadCategories();
  loadProducts();
});
</script>

<style scoped>
.closed-banner { display: flex; align-items: center; gap: 12px; margin: 16px 0; padding: 16px; border-radius: 18px; background: color-mix(in srgb, #e0a02a 12%, var(--surface)); border: 1px solid color-mix(in srgb, #e0a02a 30%, transparent); }
.closed-banner .ci { width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; background: var(--surface-2); color: #e0a02a; flex: none; }
.closed-banner .a { font-weight: 800; font-size: 14px; }
.closed-banner .b { font-size: 12px; color: var(--text-dim); font-weight: 600; margin-top: 2px; }
.cat-loading { display: grid; place-items: center; padding: 60px 0; }
.spinner { width: 30px; height: 30px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--accent) 25%, transparent); border-top-color: var(--accent); animation: hspin .8s linear infinite; }
@keyframes hspin { to { transform: rotate(360deg); } }
</style>
