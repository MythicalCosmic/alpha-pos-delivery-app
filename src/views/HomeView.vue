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

      <!-- operator-managed home banners; the config promo remains a fallback -->
      <section v-if="visibleBanners.length" class="banner-rail" :aria-label="t('featured', store.lang)">
        <component
          :is="banner.actionType === 'NONE' ? 'article' : 'button'"
          v-for="(banner, index) in visibleBanners"
          :key="banner.id"
          class="home-banner press"
          :type="banner.actionType === 'NONE' ? undefined : 'button'"
          @click="openBanner(banner)"
        >
          <img :src="banner.imageUrl" alt="" width="720" height="360" :loading="index === 0 ? 'eager' : 'lazy'" @error="failedBannerIds.add(banner.id)" />
          <span class="home-banner__shade" aria-hidden="true"></span>
          <span class="home-banner__copy">
            <strong>{{ banner.title }}</strong>
            <small v-if="banner.subtitle">{{ banner.subtitle }}</small>
          </span>
          <span v-if="banner.actionType !== 'NONE'" class="home-banner__go" aria-hidden="true"><Icon name="chevron" :size="18" /></span>
        </component>
      </section>

      <div v-else-if="freeThreshold" class="promo press">
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
import { ref, reactive, computed, onBeforeUnmount, onMounted } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import FoodCard from "../components/FoodCard.vue";
import FoodRow from "../components/FoodRow.vue";
import SecHead from "../components/SecHead.vue";
import { store, selectedAddress, storeOpen, loadBanners, loadCategories, loadProducts } from "../store.js";
import { t } from "../data/strings.js";
import { catName, foodName, sum } from "../data/foods.js";

const router = useRouter();
const cat = ref("all");
const q = ref("");
const failedBannerIds = reactive(new Set());
let bannerRefreshTimer = 0;

const chips = computed(() => [
  { id: "all", kind: "all", hue: 270, names: { uz: t("catAll", "uz"), ru: t("catAll", "ru"), en: t("catAll", "en") } },
  ...store.categories,
]);
const freeThreshold = computed(() => (store.config ? store.config.freeDeliveryThreshold : 0));
const visibleBanners = computed(() => store.banners.filter((banner) => !failedBannerIds.has(banner.id)));

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

function openBanner(banner) {
  if (banner.actionType === "PRODUCT" && banner.productId) router.push(`/food/${banner.productId}`);
  else if (banner.actionType === "LOYALTY") router.push("/loyalty");
  else if (banner.actionType === "CATALOG") router.push("/categories");
}

function refreshVisibleBanners() {
  if (document.visibilityState === "visible") loadBanners();
}

onMounted(() => {
  if (!store.categories.length) loadCategories();
  loadBanners();
  bannerRefreshTimer = window.setInterval(loadBanners, 60_000);
  document.addEventListener("visibilitychange", refreshVisibleBanners);
  loadProducts();
});

onBeforeUnmount(() => {
  window.clearInterval(bannerRefreshTimer);
  document.removeEventListener("visibilitychange", refreshVisibleBanners);
});
</script>

<style scoped>
.closed-banner { display: flex; align-items: center; gap: 12px; margin: 16px 0; padding: 16px; border-radius: 18px; background: color-mix(in srgb, #e0a02a 12%, var(--surface)); border: 1px solid color-mix(in srgb, #e0a02a 30%, transparent); }
.closed-banner .ci { width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; background: var(--surface-2); color: #e0a02a; flex: none; }
.closed-banner .a { font-weight: 800; font-size: 14px; }
.closed-banner .b { font-size: 12px; color: var(--text-dim); font-weight: 600; margin-top: 2px; }
.banner-rail { display: flex; gap: 12px; margin-top: 16px; padding: 0 20px 4px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.banner-rail::-webkit-scrollbar { display: none; }
.home-banner { position: relative; width: 100%; min-width: 100%; aspect-ratio: 2 / 1; overflow: hidden; padding: 0; color: #fff; text-align: left; border: 1px solid rgba(255,255,255,.12); border-radius: var(--radius-card); background: var(--surface); scroll-snap-align: center; box-shadow: 0 16px 36px -24px rgba(0,0,0,.65); }
.home-banner > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.home-banner__shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8,6,20,.82) 0%, rgba(8,6,20,.42) 58%, rgba(8,6,20,.08) 100%); }
.home-banner__copy { position: absolute; left: 19px; right: 54px; bottom: 18px; display: grid; gap: 5px; }
.home-banner__copy strong { font-family: var(--font-display); font-size: clamp(16px, 4.5vw, 20px); line-height: 1.15; text-wrap: balance; }
.home-banner__copy small { color: rgba(255,255,255,.88); font-size: 12px; font-weight: 650; line-height: 1.35; }
.home-banner__go { position: absolute; right: 16px; bottom: 17px; display: grid; width: 36px; height: 36px; place-items: center; border-radius: 12px; background: rgba(255,255,255,.18); backdrop-filter: blur(10px); }
.cat-loading { display: grid; place-items: center; padding: 60px 0; }
.spinner { width: 30px; height: 30px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--accent) 25%, transparent); border-top-color: var(--accent); animation: hspin .8s linear infinite; }
@keyframes hspin { to { transform: rotate(360deg); } }
</style>
