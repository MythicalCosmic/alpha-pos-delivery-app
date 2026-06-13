<template>
  <div class="loy push-anim">
    <TopBar :title="t('loyalty', store.lang)" @back="router.back()" />

    <div class="loy-card">
      <div class="shine"></div>
      <div class="top">
        <span class="brand">Smart Club</span>
        <span class="tier"><Icon name="star" :size="13" filled /> Gold</span>
      </div>
      <div class="pts">
        <div class="n">{{ grouped(points) }}</div>
        <div class="l">{{ t("points", store.lang) }} · Aziz Karimov</div>
      </div>
      <div class="prog">
        <div class="bar"><i :style="{ width: pct + '%' }"></i></div>
        <div class="pl">{{ grouped(goal - points) }} {{ t("points", store.lang) }} {{ t("nextTier", store.lang) }}</div>
      </div>
    </div>

    <div class="qr-panel">
      <div class="qr-box">
        <QRCode :value="memberId" />
        <div class="qr-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M9 12v9" />
            <path d="M16 3c-1.6 0-2.8 2-2.8 4.5S14.4 12 16 12s2.8-2 2.8-4.5S17.6 3 16 3ZM16 12v9" />
          </svg>
        </div>
      </div>
      <div class="qh">{{ t("showQr", store.lang) }}</div>
      <div class="qs">{{ t("earnInfo", store.lang) }}</div>
      <div class="mid"><span>{{ t("memberId", store.lang) }}</span> {{ memberId }}</div>
    </div>

    <div class="loy-rewards">
      <div class="h">{{ t("rewards", store.lang) }}</div>
      <div v-for="(r, i) in rewards" :key="i" :class="['reward', 'press', { locked: points < r.cost }]">
        <div class="ri"><FoodArt :kind="r.kind" :hue="r.hue" /></div>
        <div class="rb">
          <div class="a">{{ name(r) }}</div>
          <div class="b">{{ sub(r) }}</div>
        </div>
        <span class="cost"><Icon name="star" :size="13" filled /> {{ grouped(r.cost) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import TopBar from "../components/TopBar.vue";
import QRCode from "../components/QRCode.js";
import { store } from "../store.js";
import { t } from "../data/strings.js";

const router = useRouter();
const points = 1250, goal = 2000;
const memberId = "SF · 7741 2290";
const pct = Math.round((points / goal) * 100);

const rewards = [
  { kind: "dessert", hue: 28, cost: 400, uz: "Bepul donut", en: "Free donut", ru: "Бесплатный донат", suz: "Istalgan shirinlik", sen: "Any dessert", sru: "Любой десерт" },
  { kind: "drink", hue: 300, cost: 800, uz: "Bepul yetkazish ×3", en: "Free delivery ×3", ru: "Бесплатная доставка ×3", suz: "Keyingi 3 buyurtma", sen: "Next 3 orders", sru: "Следующие 3 заказа" },
  { kind: "combo", hue: 18, cost: 1600, uz: "Kombo’ga −50%", en: "−50% on any combo", ru: "−50% на комбо", suz: "Smart Duo yoki Fiesta", sen: "Smart Duo or Fiesta", sru: "Smart Duo или Fiesta" },
];

const grouped = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const name = (o) => o[store.lang] || o.uz;
const sub = (o) => o["s" + store.lang] || o.suz;
</script>
