<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('checkout', store.lang)" @back="router.back()" />
    <div class="co2">
      <!-- order type -->
      <div class="segmented" style="margin-top:4px">
        <button :class="{ on: orderType === 'DELIVERY' }" @click="orderType = 'DELIVERY'">{{ t("delivery2", store.lang) }}</button>
        <button :class="{ on: orderType === 'PICKUP' }" @click="orderType = 'PICKUP'">{{ t("pickup", store.lang) }}</button>
      </div>

      <!-- order summary -->
      <div class="lbl">{{ t("yourOrder", store.lang) }}<button class="ed press" type="button" @click="router.back()">{{ t("edit", store.lang) }}</button></div>
      <div class="co-summary">
        <div class="thumbs">
          <div v-for="(it, i) in store.cart.slice(0, 3)" :key="i" class="th">
            <img v-if="it.snapshot.image_url" :src="it.snapshot.image_url" :alt="foodName(it.snapshot, store.lang)" />
            <FoodArt v-else :kind="it.snapshot.kind" :hue="it.snapshot.hue" />
          </div>
          <div v-if="store.cart.length > 3" class="more">+{{ store.cart.length - 3 }}</div>
        </div>
        <div class="ct">
          <div class="a">{{ count }} {{ t("items", store.lang) }}</div>
          <div class="b">{{ store.cart.map(it => foodName(it.snapshot, store.lang)).join(", ") }}</div>
        </div>
      </div>

      <!-- address (DELIVERY only) -->
      <template v-if="orderType === 'DELIVERY'">
        <div class="lbl">{{ t("deliveryAddr", store.lang) }}</div>
        <div v-if="selectedAddress" class="addr-card">
          <MiniMap v-if="selectedAddress.lat != null" :lat="selectedAddress.lat" :lng="selectedAddress.lng" :height="92" class="addr-mini" />
          <div v-else class="addr-map"><span class="road"></span><span class="road b"></span><span class="pin"><Icon name="pin" :size="26" /></span></div>
          <div class="addr-body">
            <span class="tag"><Icon name="pin" :size="12" /> {{ selectedAddress.label || t("home2", store.lang) }}</span>
            <div class="ad">{{ selectedAddress.line }}</div>
            <div v-if="addrDetail" class="ad2">{{ addrDetail }}</div>
            <button class="ch press" type="button" @click="router.push('/addresses')">{{ t("change", store.lang) }}</button>
          </div>
        </div>
        <div v-if="selectedAddress && store.addressesError" class="location-warning location-warning--stale" role="alert">
          <Icon name="info" :size="18" />
          <span>{{ t("addressesStale", store.lang) }}</span>
          <button class="press" type="button" :disabled="store.addressesLoading" @click="retryAddresses">{{ t("tryAgain", store.lang) }}</button>
        </div>
        <div v-if="selectedAddress && !selectedAddressIsDeliverable" class="location-warning">
          <Icon name="info" :size="18" />
          <span>{{ t("preciseLocationNeeded", store.lang) }}</span>
          <button class="press" @click="pinSelectedAddress">{{ t("addPreciseLocation", store.lang) }}</button>
        </div>
        <div v-else-if="!selectedAddress && (!store.addressesLoaded || store.addressesLoading) && !store.addressesError" class="address-loading" aria-live="polite">
          <span class="spinner-address" aria-hidden="true"></span>{{ t("addressesLoading", store.lang) }}
        </div>
        <div v-else-if="!selectedAddress && store.addressesError" class="location-warning location-warning--error" role="alert">
          <Icon name="info" :size="18" />
          <span>{{ t("addressesLoadFailed", store.lang) }}</span>
          <button class="press" type="button" :disabled="store.addressesLoading" @click="retryAddresses">{{ t("tryAgain", store.lang) }}</button>
        </div>
        <button v-else-if="!selectedAddress" class="addbtn press" type="button" @click="addDeliveryAddress">
          <Icon name="plus" :size="20" /> {{ t("addAddr2", store.lang) }}
        </button>
        <div class="note-in">
          <Icon name="chat" :size="18" />
          <input v-model="note" :placeholder="t('notePh', store.lang)" />
        </div>
      </template>
      <div v-else class="note-in" style="margin-top:14px">
        <Icon name="chat" :size="18" />
        <input v-model="note" :placeholder="t('notePh', store.lang)" />
      </div>

      <!-- payment -->
      <div class="lbl">{{ t("payWith", store.lang) }}</div>
      <div class="pay-grid">
        <button :class="['pay-card', 'press', { on: pay === 'cash' }]" @click="pay = 'cash'">
          <span class="tick"><Icon name="check" /></span>
          <span class="pi"><Icon name="cash" :size="20" /></span>
          <div class="a">{{ t("cash", store.lang) }}</div><div class="b">{{ t("delivery", store.lang).toLowerCase() }}</div>
        </button>
        <button :class="['pay-card', 'press', { on: pay === 'card', disabled: !cardAllowed }]" :disabled="!cardAllowed" @click="cardAllowed && (pay = 'card')">
          <span class="tick"><Icon name="check" /></span>
          <span class="pi"><Icon name="card" :size="20" /></span>
          <div class="a">{{ t("card", store.lang) }}</div><div class="b">{{ cardAllowed ? "••••" : t("comingSoon", store.lang) }}</div>
        </button>
      </div>
      <div v-if="!cardAllowed" class="pay-note">{{ t("cashOnly", store.lang) }}</div>

      <!-- loyalty points -->
      <template v-if="loyaltySpendingOn && pointsAvailable > 0">
        <div class="lbl">{{ t("usePoints", store.lang) }}</div>
        <div class="points-row">
          <div class="pl">
            <Icon name="star" :size="16" filled />
            <span>{{ grouped(pointsAvailable) }} {{ t("points", store.lang) }}</span>
          </div>
          <SwitchToggle :on="usePoints" @toggle="usePoints = !usePoints" />
        </div>
      </template>

      <!-- tip -->
      <div class="lbl">{{ t("tipCourier", store.lang) }}</div>
      <div class="tips">
        <button v-for="v in tipOptions" :key="v" :class="['tip-chip', 'press', { on: tip === v }]" @click="tip = v">
          {{ v === 0 ? "—" : (v / 1000) + "k" }}
        </button>
      </div>
      <div class="tip-note">{{ t("tipNote", store.lang) }}</div>

      <!-- totals (authoritative server quote) -->
      <div class="totals" style="margin-top:20px">
        <div class="tr"><span>{{ t("subtotal", store.lang) }}</span><span>{{ sum(totals.subtotal, store.lang) }}</span></div>
        <div v-if="totals.discount > 0" class="tr"><span class="disc">{{ t("discount", store.lang) }}</span><span class="disc">−{{ sum(totals.discount, store.lang) }}</span></div>
        <div v-if="orderType === 'DELIVERY'" class="tr"><span>{{ t("delivery", store.lang) }}</span><span :class="{ free: totals.deliveryFee === 0 }">{{ totals.deliveryFee === 0 ? t("free", store.lang) : sum(totals.deliveryFee, store.lang) }}</span></div>
        <div v-if="totals.tip > 0" class="tr"><span>{{ t("tipCourier", store.lang) }}</span><span>{{ sum(totals.tip, store.lang) }}</span></div>
        <div class="tr grand"><span>{{ t("total", store.lang) }}</span><b>{{ sum(totals.total, store.lang) }}</b></div>
        <div v-if="loyaltyEarningOn && totals.earned > 0" class="earn">+{{ totals.earned }} {{ t("points", store.lang) }}</div>
      </div>

      <OrderHelp v-if="submitError && submitNeedsSupport" :message="submitError" />
      <div v-else-if="visibleError" class="cart-warn"><Icon name="info" :size="18" /> {{ visibleError }}</div>
      <div style="height:120px"></div>
    </div>

    <div class="actionbar">
      <button class="cta press" :disabled="!canSubmit || submitting" @click="place">
        <span v-if="submitting || store.quoting" class="spinner-sm"></span>
        <template v-else>{{ t("placeOrder", store.lang) }} <span class="tp">· {{ sum(totals.total, store.lang) }}</span></template>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import TopBar from "../components/TopBar.vue";
import MiniMap from "../components/MiniMap.vue";
import SwitchToggle from "../components/SwitchToggle.vue";
import OrderHelp from "../components/OrderHelp.vue";
import { store, selectedAddress, selectedAddressIsDeliverable, profileComplete, requestQuote, submitOrder, loadAddresses, loadLoyalty, loadProducts, cartSubtotal, cartDelivery, cartTotalEstimate } from "../store.js";
import { ClosedError, ConflictError, ApiError } from "../api/index.js";
import { t, cf } from "../data/strings.js";
import { foodName, sum } from "../data/foods.js";
import { loyaltyModes } from "../api/normalize.js";

const router = useRouter();
const orderType = ref("DELIVERY");
const pay = ref("cash");
const tip = ref(0);
const note = ref("");
const usePoints = ref(false);
const submitting = ref(false);
const submitError = ref("");
const submitNeedsSupport = ref(false);

const cardAllowed = computed(() => !!(store.config && store.config.featureFlags && store.config.featureFlags.card_payments));
const loyaltyCapabilities = computed(() => loyaltyModes(store.config, store.loyalty));
const loyaltyEarningOn = computed(() => loyaltyCapabilities.value.earning);
const loyaltySpendingOn = computed(() => loyaltyCapabilities.value.spending);
const pointsAvailable = computed(() => (store.loyalty ? store.loyalty.points : (store.me ? store.me.points : 0)));
const pointsUsed = computed(() => (usePoints.value && loyaltySpendingOn.value ? pointsAvailable.value : 0));
const hasUnavailable = computed(() => store.cart.some((it) => it.unavailable));
const quoteError = computed(() => {
  if (store.catalogClosed) return t("browseClosed", store.lang);
  if (store.quoteError && store.quoteError.code) return cf(store.quoteError.code, store.lang);
  return "";
});
const visibleError = computed(() => submitError.value || quoteError.value);

const tipOptions = computed(() => {
  const o = store.config && store.config.defaultTipOptions;
  return o && o.length ? o : [0, 5000, 10000, 20000];
});

const count = computed(() => store.cart.reduce((s, i) => s + i.qty, 0));
const grouped = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Authoritative totals from the server quote, with a local fallback.
const totals = computed(() => {
  const q = store.quote;
  if (q) return { subtotal: q.subtotal, deliveryFee: q.deliveryFee, discount: q.discount, tip: q.tip, total: q.total, earned: q.loyaltyPointsEarned };
  const sub = cartSubtotal.value;
  const del = orderType.value === "PICKUP" ? 0 : cartDelivery.value;
  return { subtotal: sub, deliveryFee: del, discount: 0, tip: tip.value, total: sub + del + tip.value, earned: 0 };
});

const addrDetail = computed(() => {
  const a = selectedAddress.value;
  if (!a) return "";
  const parts = [];
  if (a.apartment) parts.push(`${t("apartment", store.lang)} ${a.apartment}`);
  if (a.entrance) parts.push(`${t("entrance", store.lang)} ${a.entrance}`);
  if (a.floor) parts.push(`${t("floor", store.lang)} ${a.floor}`);
  if (a.intercom) parts.push(`${t("intercom", store.lang)} ${a.intercom}`);
  return parts.join(" · ");
});

const canSubmit = computed(() =>
  store.cart.length > 0 &&
  profileComplete.value &&
  !(orderType.value === "DELIVERY" && !selectedAddressIsDeliverable.value) &&
  !!store.quote &&
  !store.quoting &&
  !store.quoteError &&
  !hasUnavailable.value &&
  !store.catalogClosed
);

function addDeliveryAddress() {
  router.push({ name: "address-edit", query: { return: "/checkout" } });
}

function pinSelectedAddress() {
  if (!selectedAddress.value) return addDeliveryAddress();
  router.push({
    name: "address-edit",
    params: { id: selectedAddress.value.id },
    query: { return: "/checkout" },
  });
}

function retryAddresses() {
  void loadAddresses();
}

function reprice() {
  if (!store.cart.length) return;
  requestQuote({ orderType: orderType.value, tip: tip.value, pointsUsed: pointsUsed.value });
}

async function place() {
  if (!profileComplete.value) {
    router.replace({ name: "account-setup", query: { return: "/checkout" } });
    return;
  }
  if (orderType.value === "DELIVERY" && !selectedAddressIsDeliverable.value) {
    if (selectedAddress.value) pinSelectedAddress();
    else addDeliveryAddress();
    return;
  }
  if (!canSubmit.value || submitting.value) return;
  submitError.value = "";
  submitNeedsSupport.value = false;
  submitting.value = true;
  try {
    // Re-quote immediately before submit so a product stopped since the user
    // opened checkout never appears to go through. The backend validates again.
    const currentQuote = await requestQuote({
      orderType: orderType.value,
      tip: tip.value,
      pointsUsed: pointsUsed.value,
    });
    if (!currentQuote) {
      submitError.value = quoteError.value || cf("error", store.lang);
      return;
    }
    const order = await submitOrder({
      orderType: orderType.value,
      addressId: orderType.value === "DELIVERY" && selectedAddress.value ? selectedAddress.value.id : null,
      phone: store.me ? store.me.phone : "",
      note: note.value,
      tip: tip.value,
      pointsUsed: pointsUsed.value,
      paymentMethod: pay.value === "card" && cardAllowed.value ? "CARD" : "CASH",
    });
    router.replace(`/tracking/${order.id}`);
  } catch (e) {
    if (e instanceof ClosedError) {
      const noCashier = e.reason === "no_cashier";
      submitError.value = t(noCashier ? "noCashierHelp" : "closedT", store.lang);
      submitNeedsSupport.value = noCashier;
    }
    else if (e instanceof ConflictError && e.code === "profile_required") {
      router.replace({ name: "account-setup", query: { return: "/checkout" } });
    }
    else if (e instanceof ConflictError && e.code === "location_required") {
      if (selectedAddress.value) pinSelectedAddress();
      else addDeliveryAddress();
    }
    else if (e instanceof ConflictError) submitError.value = cf(e.code, store.lang);
    else if (e instanceof ApiError && e.httpStatus === 422 && e.errors && e.errors.address_id) submitError.value = t("needAddress", store.lang);
    else if (e instanceof ApiError && e.httpStatus === 404) submitError.value = t("needAddress", store.lang);
    else {
      submitError.value = t("technicalOrderFailure", store.lang);
      submitNeedsSupport.value = true;
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  if (store.cart.length === 0) { router.replace("/cart"); return; }
  if (!profileComplete.value && !store.browser) {
    router.replace({ name: "account-setup", query: { return: "/checkout" } });
    return;
  }
  if (!store.loyalty) loadLoyalty();
  if (!store.addressesLoaded) await loadAddresses();
  await loadProducts();
  reprice();
});
watch([orderType, tip, usePoints], reprice);
watch(loyaltySpendingOn, (enabled) => {
  if (!enabled) usePoints.value = false;
});
</script>

<style scoped>
.addr-mini { width: 92px; flex: none; border-radius: 0; }
.co2 .lbl .ed { min-width: 44px; min-height: 44px; margin: -14px -8px -14px 0; padding: 0 8px; border-radius: 10px; }
.addr-body .ch { display: inline-flex; min-height: 44px; align-items: center; margin: -5px 0 -10px -10px; padding: 0 10px; border-radius: 10px; }
.addr-body .ad2 { font-size: 11px; color: var(--text-faint); font-weight: 700; margin-top: 4px; }
.thumbs .th img { width: 100%; height: 100%; object-fit: cover; }
.pay-card.disabled, .pay-card:disabled { opacity: .55; }
.pay-note { font-size: 11.5px; font-weight: 700; color: var(--text-faint); margin: 8px 2px 0; }
.points-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--hairline); border-radius: 16px; }
.points-row .pl { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14px; color: var(--star); }
.points-row .pl span { color: var(--text); }
.totals .earn { text-align: right; font-size: 12px; font-weight: 800; color: var(--accent-2); margin-top: 6px; }
.cart-warn { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding: 12px 14px; border-radius: 14px; background: color-mix(in srgb, #ef5b6e 14%, var(--surface)); border: 1px solid color-mix(in srgb, #ef5b6e 30%, transparent); color: #ef5b6e; font-weight: 700; font-size: 12.5px; }
.addbtn { width: 100%; height: 54px; border-radius: 16px; border: 1.5px dashed var(--hairline-strong); display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; font-size: 14px; color: var(--accent); }
.location-warning { display: grid; grid-template-columns: 20px 1fr auto; gap: 9px; align-items: center; margin-top: 10px; padding: 11px 12px; border: 1px solid color-mix(in srgb, #e0a02a 28%, transparent); border-radius: 14px; background: color-mix(in srgb, #e0a02a 10%, var(--surface)); color: #c78815; font-size: 11.5px; line-height: 1.35; font-weight: 750; }
.location-warning button { min-height: 40px; padding: 0 10px; border-radius: 11px; background: color-mix(in srgb, #e0a02a 15%, var(--surface)); color: currentColor; font-size: 11.5px; font-weight: 850; }
.location-warning--error { border-color: color-mix(in srgb, #ef5b6e 28%, transparent); background: color-mix(in srgb, #ef5b6e 10%, var(--surface)); color: #ef5b6e; }
.location-warning--stale { margin-bottom: 0; }
.address-loading { min-height: 54px; display: flex; align-items: center; justify-content: center; gap: 9px; border: 1px solid var(--hairline); border-radius: 16px; background: var(--surface); color: var(--text-dim); font-size: 12.5px; font-weight: 750; }
.spinner-address { width: 19px; height: 19px; border-radius: 50%; border: 2.5px solid var(--hairline); border-top-color: var(--accent); animation: cspin .8s linear infinite; }
.cta:disabled { opacity: .55; }
.spinner-sm { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.4); border-top-color: #fff; animation: cspin .8s linear infinite; }
@keyframes cspin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spinner-sm, .spinner-address { animation: none; } }
</style>
