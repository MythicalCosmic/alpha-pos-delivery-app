<template>
  <div class="loy push-anim">
    <TopBar :title="t('loyalty', store.lang)" @back="router.back()" />

    <div class="loy-card">
      <div class="shine"></div>
      <div class="top">
        <span class="brand">Smart Club</span>
        <span class="tier"><Icon name="star" :size="13" filled /> {{ memberName }}</span>
      </div>
      <div class="pts">
        <div class="n">{{ grouped(points) }}</div>
        <div class="l">{{ t("points", store.lang) }}</div>
      </div>
      <div v-if="pointValue" class="prog">
        <div class="pl">{{ t("pointsWorth", store.lang, { v: grouped(pointValue) }) }}</div>
      </div>
    </div>

    <div class="qr-panel">
      <div class="qr-box">
        <QRCode :value="memberId" />
      </div>
      <div class="qh">{{ t("showQr", store.lang) }}</div>
      <div v-if="earnInfo" class="qs">{{ earnInfo }}</div>
      <div class="mid"><span>{{ t("memberId", store.lang) }}</span> {{ memberId }}</div>
    </div>

    <div v-if="!loyaltyOn" class="loy-off">{{ t("loyaltyOff", store.lang) }}</div>

    <div v-if="history.length" class="loy-history">
      <div class="h">{{ t("history", store.lang) }}</div>
      <div v-for="(row, i) in history" :key="i" class="lh-row">
        <div class="lh-l">
          <div class="a">{{ row.code }}</div>
          <div class="b">{{ fmtDateTime(row.createdAt, store.lang) }}</div>
        </div>
        <div class="lh-r">
          <span v-if="row.pointsEarned" class="earn">+{{ row.pointsEarned }}</span>
          <span v-if="row.pointsUsed" class="used">−{{ row.pointsUsed }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import QRCode from "../components/QRCode.js";
import { store, loadLoyalty } from "../store.js";
import { t } from "../data/strings.js";
import { sum } from "../data/foods.js";
import { fmtDateTime } from "../util.js";

const router = useRouter();

const points = computed(() => (store.loyalty ? store.loyalty.points : (store.me ? store.me.points : 0)));
const pointValue = computed(() => (store.loyalty ? store.loyalty.pointValueUzs : 0));
const perUzs = computed(() => (store.loyalty ? store.loyalty.pointsPerUzs : 0));
const history = computed(() => (store.loyalty ? store.loyalty.history : []));
const loyaltyOn = computed(() => !!(store.config && store.config.featureFlags && store.config.featureFlags.loyalty) && perUzs.value > 0);

const memberName = computed(() => (store.me ? store.me.name : "Smart"));
const memberId = computed(() => (store.me && store.me.telegramId ? "SF-" + store.me.telegramId : (store.me ? "SF-" + store.me.id : "SF")));
const earnInfo = computed(() => (perUzs.value ? t("earnInfo", store.lang) + ` · 1 / ${grouped(perUzs.value)}` : ""));

const grouped = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

onMounted(() => loadLoyalty());
</script>

<style scoped>
.loy-off { margin: 16px; padding: 14px; border-radius: 14px; background: var(--surface); border: 1px solid var(--hairline); text-align: center; font-weight: 700; font-size: 13px; color: var(--text-dim); }
.loy-history { margin: 8px 16px 24px; }
.loy-history .h { font-size: 12.5px; font-weight: 800; color: var(--text-faint); text-transform: uppercase; letter-spacing: .5px; margin: 18px 2px 12px; }
.lh-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; background: var(--surface); border: 1px solid var(--hairline); border-radius: 14px; margin-bottom: 8px; }
.lh-row .a { font-weight: 800; font-size: 13.5px; }
.lh-row .b { font-size: 11px; color: var(--text-faint); font-weight: 700; margin-top: 2px; }
.lh-r { display: flex; gap: 10px; font-weight: 800; font-size: 14px; }
.lh-r .earn { color: var(--accent-2); }
.lh-r .used { color: #e0a02a; }
</style>
