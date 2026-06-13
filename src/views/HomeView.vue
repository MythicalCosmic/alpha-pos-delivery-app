<template>
  <div class="screen-anim">
    <!-- header -->
    <div class="home-head row spread">
      <button class="loc-btn press" @click="router.push('/addresses')">
        <span class="loc-ic"><Icon name="pin" :size="22" /></span>
        <span class="loc-text col" style="align-items:flex-start">
          <span class="lbl">{{ t("deliverTo", store.lang) }}</span>
          <span class="val"><span class="addr-txt">{{ selectedAddress ? selectedAddress.text : "—" }}</span> <Icon name="chevronDown" :size="16" /></span>
        </span>
      </button>
      <div class="head-actions">
        <button class="loy-btn press" @click="router.push('/loyalty')"><Icon name="qr" :size="22" /></button>
        <button class="avatar press"><Icon name="bell" :size="22" /><span class="ping"></span></button>
      </div>
    </div>

    <!-- search -->
    <div class="search">
      <Icon name="search" :size="20" style="color:var(--text-faint)" />
      <input v-model="q" :placeholder="t('searchPh', store.lang)" />
      <span class="filt"><Icon name="grid" :size="17" /></span>
    </div>

    <!-- category chips -->
    <SecHead :title="t('categories', store.lang)" :link="t('seeAll', store.lang)" @link="router.push('/categories')" />
    <div class="chips">
      <button
        v-for="c in CATEGORIES"
        :key="c.id"
        :class="['chip', 'press', { on: cat === c.id }]"
        @click="cat = c.id"
      >
        <span class="ci"><FoodArt :kind="c.kind" :hue="hueFor(c.id)" /></span>
        <span>{{ catName(c, store.lang) }}</span>
      </button>
    </div>

    <!-- promo -->
    <div class="promo press">
      <div class="deco"><FoodArt kind="burger" :hue="20" /></div>
      <div class="deco2"><FoodArt kind="drink" :hue="300" /></div>
      <h3>{{ t("promoTitle", store.lang) }}</h3>
      <p>{{ t("promoSub", store.lang) }}</p>
      <span class="pill"><Icon name="scooter" :size="16" /> {{ t("freeDelivery", store.lang) }}</span>
    </div>

    <!-- popular -->
    <template v-if="cat === 'all' && !q">
      <SecHead :title="t('popular', store.lang)" />
      <div class="hscroll">
        <FoodCard v-for="f in popular" :key="f.id" :f="f" />
      </div>
    </template>

    <!-- feed -->
    <SecHead :title="feedTitle" />
    <div v-if="feed.length === 0" class="empty">
      <div class="ei"><Icon name="search" /></div><h3>—</h3><p>{{ t("searchPh", store.lang) }}</p>
    </div>
    <div v-else-if="store.tweaks.homeLayout === 'list'" class="flist">
      <FoodRow v-for="f in feed" :key="f.id" :f="f" />
    </div>
    <div v-else class="food-grid">
      <FoodCard v-for="f in feed" :key="f.id" :f="f" />
    </div>
    <div style="height:8px"></div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import FoodCard from "../components/FoodCard.vue";
import FoodRow from "../components/FoodRow.vue";
import SecHead from "../components/SecHead.vue";
import { store } from "../store.js";
import { t } from "../data/strings.js";
import { CATEGORIES, FOODS, catName, foodName, hueFor } from "../data/foods.js";
import { selectedAddress } from "../store.js";

const router = useRouter();
const cat = ref("all");
const q = ref("");

const popular = FOODS.filter(f => f.tag === "bestseller" || f.rating >= 4.8).slice(0, 6);
const feed = computed(() =>
  FOODS.filter(f =>
    (cat.value === "all" || f.cat === cat.value) &&
    (!q.value || foodName(f, store.lang).toLowerCase().includes(q.value.toLowerCase()))
  )
);
const feedTitle = computed(() =>
  cat.value === "all"
    ? t("recommended", store.lang)
    : catName(CATEGORIES.find(c => c.id === cat.value), store.lang)
);
</script>
