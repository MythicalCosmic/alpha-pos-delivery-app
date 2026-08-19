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

    <!-- Active redemptions: the customer shows this code/QR to claim the gift -->
    <div v-if="redemptions.length" class="gift-mine">
      <div class="h">{{ t("myGifts", store.lang) }}</div>
      <div v-for="r in redemptions" :key="r.id" class="rd-card">
        <div class="rd-info">
          <div class="rd-name">{{ r.rewardName }}</div>
          <div class="rd-code">{{ r.code }}</div>
          <div class="rd-hint">{{ t("showCode", store.lang) }}</div>
        </div>
        <div class="rd-qr"><QRCode :value="r.code" /></div>
      </div>
    </div>

    <!-- Gift catalog -->
    <div v-if="gifts.length" class="gifts">
      <div class="h">{{ t("gifts", store.lang) }}</div>
      <div
        v-for="g in gifts"
        :key="g.id"
        class="g-card"
        :class="{ off: !g.canRedeem }"
      >
        <div class="g-visual">
          <span aria-hidden="true">{{ giftEmoji(g.kind) }}</span>
          <img v-if="g.imageUrl" :src="g.imageUrl" alt="" width="52" height="52" loading="lazy" @error="hideBrokenImage" />
        </div>
        <div class="g-main">
          <div class="g-name">{{ g.name }}</div>
          <div v-if="g.description" class="g-desc">{{ g.description }}</div>
          <div class="g-cost">{{ grouped(g.pointsCost) }} {{ t("points", store.lang) }}</div>
        </div>
        <button
          class="g-btn"
          :class="{ confirm: confirmId === g.id }"
          :disabled="!g.canRedeem || busy === g.id"
          @click="onRedeem(g)"
        >
          <span v-if="g.limitReached">{{ t("rewardLimitReached", store.lang) }}</span>
          <span v-else-if="!g.inStock">{{ t("outOfStock", store.lang) }}</span>
          <span v-else-if="!g.affordable">{{ t("notEnough", store.lang) }}</span>
          <span v-else-if="busy === g.id">…</span>
          <span v-else-if="confirmId === g.id">{{ t("redeemQ", store.lang, { n: grouped(g.pointsCost) }) }}</span>
          <span v-else>{{ t("redeem", store.lang) }}</span>
        </button>
      </div>
    </div>

    <div v-if="loyaltyOn && !gifts.length" class="loy-off">{{ t("rewardsEmpty", store.lang) }}</div>
    <div v-else-if="!loyaltyOn && !gifts.length" class="loy-off">{{ t("loyaltyOff", store.lang) }}</div>

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
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import QRCode from "../components/QRCode.js";
import { store, loadLoyalty, loadRewards, redeemReward, flash } from "../store.js";
import { t } from "../data/strings.js";
import { fmtDateTime } from "../util.js";
import { loyaltyModes } from "../api/normalize.js";

const router = useRouter();

const points = computed(() => (store.loyalty ? store.loyalty.points : (store.me ? store.me.points : 0)));
const pointValue = computed(() => (store.loyalty ? store.loyalty.pointValueUzs : 0));
const perUzs = computed(() => (store.loyalty ? store.loyalty.pointsPerUzs : 0));
const history = computed(() => (store.loyalty ? store.loyalty.history : []));
const redemptions = computed(() => (store.loyalty && store.loyalty.redemptions ? store.loyalty.redemptions : []));
const gifts = computed(() => (store.rewards && store.rewards.items ? store.rewards.items : []));
const loyaltyCapabilities = computed(() => loyaltyModes(store.config, store.loyalty));
const loyaltyOn = computed(() => loyaltyCapabilities.value.earning || loyaltyCapabilities.value.spending);

const memberName = computed(() => (store.me ? store.me.name : "Smart"));
const memberId = computed(() => {
  if (store.loyalty && store.loyalty.memberId) return store.loyalty.memberId;
  if (store.me && store.me.telegramId) return "SF-" + store.me.telegramId;
  return store.me ? "SF-" + store.me.id : "SF";
});
const earnInfo = computed(() => (
  perUzs.value
    ? t("earnInfo", store.lang, { v: grouped(perUzs.value) })
    : ""
));

const busy = ref(null);
const confirmId = ref(null);

const grouped = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function giftEmoji(kind) {
  return { FREE_PRODUCT: "🍔", DISCOUNT: "🏷️", FREE_DELIVERY: "🛵", CUSTOM: "🎁" }[kind] || "🎁";
}

function hideBrokenImage(event) {
  event.currentTarget.hidden = true;
}

async function onRedeem(g) {
  if (!g.canRedeem || busy.value) return;
  // Two-tap confirm so a stray tap never spends points.
  if (confirmId.value !== g.id) {
    confirmId.value = g.id;
    return;
  }
  confirmId.value = null;
  busy.value = g.id;
  try {
    await redeemReward(g.id);
    flash(t("redeemSuccess", store.lang));
  } catch (e) {
    flash(e && e.message ? e.message : t("notEnough", store.lang));
  } finally {
    busy.value = null;
  }
}

onMounted(() => {
  loadLoyalty();
  loadRewards();
});
</script>

<style scoped>
.loy-off { margin: 16px; padding: 14px; border-radius: 14px; background: var(--surface); border: 1px solid var(--hairline); text-align: center; font-weight: 700; font-size: 13px; color: var(--text-dim); }
.loy-history { margin: 8px 16px 24px; }
.h { font-size: 12.5px; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: .5px; margin: 18px 2px 12px; }
.lh-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; background: var(--surface); border: 1px solid var(--hairline); border-radius: 14px; margin-bottom: 8px; }
.lh-row .a { font-weight: 800; font-size: 13.5px; }
.lh-row .b { font-size: 11px; color: var(--text-dim); font-weight: 700; margin-top: 2px; }
.lh-r { display: flex; gap: 10px; font-weight: 800; font-size: 14px; }
.lh-r .earn { color: var(--accent-2); }
.lh-r .used { color: #e0a02a; }

/* my redeemed gifts */
.gift-mine { margin: 8px 16px; }
.rd-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; margin-bottom: 10px; border-radius: 16px;
  background: linear-gradient(135deg, var(--accent-2, #2bb673) 0%, color-mix(in srgb, var(--accent-2, #2bb673) 70%, #000) 100%);
  color: #fff; box-shadow: 0 8px 24px -12px var(--accent-2, #2bb673); }
.rd-info { flex: 1; min-width: 0; }
.rd-name { font-weight: 800; font-size: 15px; }
.rd-code { font-weight: 800; font-size: 16px; letter-spacing: 1px; margin-top: 4px; font-variant-numeric: tabular-nums; }
.rd-hint { font-size: 11px; opacity: .85; font-weight: 600; margin-top: 3px; }
.rd-qr { width: 76px; height: 76px; flex: 0 0 76px; background: #fff; border-radius: 12px; padding: 6px; }

/* gift catalog */
.gifts { margin: 8px 16px 24px; }
.g-card { display: flex; align-items: center; gap: 13px; padding: 13px 14px; margin-bottom: 9px; background: var(--surface); border: 1px solid var(--hairline); border-radius: 16px; }
.g-card.off { border-color: var(--hairline-strong); }
.g-visual { position: relative; width: 52px; height: 52px; display: grid; place-items: center; overflow: hidden; font-size: 26px; background: var(--surface-2, rgba(127,127,127,.08)); border: 1px solid var(--hairline); border-radius: 14px; flex: 0 0 52px; }
.g-visual img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.g-main { flex: 1; min-width: 0; }
.g-name { font-weight: 800; font-size: 14.5px; }
.g-desc { font-size: 11.5px; color: var(--text-dim); font-weight: 600; margin-top: 1px; }
.g-cost { font-size: 12.5px; font-weight: 800; color: #9f1f56; margin-top: 3px; }
.g-btn { min-height: 44px; flex: 0 0 auto; border: none; border-radius: 12px; padding: 8px 14px; font-weight: 800; font-size: 12.5px; line-height: 1.25; color: #fff; background: #9f1f56; cursor: pointer; max-width: 46%; }
.g-btn.confirm { background: #087551; font-size: 11px; }
.g-btn:disabled { background: #e7e2f3; color: #51496f; cursor: default; }
:global([data-theme="dark"]) .g-cost { color: #ff8fba; }
:global([data-theme="dark"]) .g-btn:disabled { background: #342d59; color: #c4bce3; }
.g-empty { padding: 14px; text-align: center; color: var(--text-faint); font-weight: 700; font-size: 13px; }
</style>
