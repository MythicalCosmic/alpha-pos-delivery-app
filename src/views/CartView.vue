<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('cart', store.lang)" @back="router.back()">
      <button v-if="store.cart.length > 0" class="press" style="font-weight:800;font-size:13px;color:var(--text-faint)" @click="clearCart">{{ t("clearAll", store.lang) }}</button>
    </TopBar>

    <div v-if="store.cart.length === 0" class="empty">
      <div class="ei"><Icon name="bag" /></div><h3>{{ t("cartEmpty", store.lang) }}</h3><p>{{ t("cartEmptySub", store.lang) }}</p>
    </div>

    <div v-else class="cart2">
      <!-- conflict / closed banner -->
      <div v-if="conflict" class="cart-warn">
        <Icon name="info" :size="18" /> {{ conflict }}
      </div>

      <!-- free-delivery progress -->
      <div v-if="freeThreshold" :class="['freebar', { done: remaining === 0 }]">
        <div class="tx">
          <span class="fi"><Icon :name="remaining === 0 ? 'check' : 'scooter'" :size="18" /></span>
          <span v-if="remaining === 0">{{ t("freeUnlocked", store.lang) }}</span>
          <span v-else><b>{{ sum(remaining, store.lang) }}</b> {{ t("freeLeft", store.lang) }}</span>
        </div>
        <div class="bar"><i :style="{ width: pct + '%' }"></i></div>
      </div>

      <!-- unified bag -->
      <div class="lbl">{{ count }} {{ t("items", store.lang) }}</div>
      <div class="bag">
        <div v-for="it in store.cart" :key="it.uid" :class="['bag-row', 'enter', { unavailable: it.unavailable }]">
          <div class="iw">
            <img v-if="it.snapshot.image_url" :src="it.snapshot.image_url" :alt="foodName(it.snapshot, store.lang)" />
            <FoodArt v-else :kind="it.snapshot.kind" :hue="it.snapshot.hue" />
          </div>
          <div class="bb">
            <div class="nm">{{ foodName(it.snapshot, store.lang) }}</div>
            <div v-if="it.unavailable" class="opt unavailable-copy">{{ t("outOfStock", store.lang) }}</div>
            <div v-if="it.detail" class="opt">{{ it.detail }}</div>
            <div class="pr">{{ sum(it.unit * it.qty, store.lang) }}</div>
          </div>
          <div class="rt">
            <div class="bag-stepper">
              <button v-if="it.qty === 1 || it.unavailable" class="del" @click="removeItem(it.uid)"><Icon name="trash" /></button>
              <button v-else @click="changeQty(it.uid, -1)"><Icon name="minus" /></button>
              <span class="q">{{ it.qty }}</span>
              <button class="acc" :disabled="it.unavailable" @click="changeQty(it.uid, 1)"><Icon name="plus" /></button>
            </div>
          </div>
        </div>
      </div>

      <!-- upsell -->
      <template v-if="upsell.length > 0">
        <div class="lbl">{{ t("addMore", store.lang) }}</div>
        <div class="upsell">
          <div v-for="f in upsell" :key="f.id" class="up-card press" @click="router.push(`/food/${f.id}`)">
            <div class="iw">
              <img v-if="f.image_url" :src="f.image_url" :alt="foodName(f, store.lang)" />
              <FoodArt v-else :kind="f.kind" :hue="f.hue" />
            </div>
            <div class="nm">{{ foodName(f, store.lang) }}</div>
            <div class="pr">{{ sum(f.price, store.lang) }}</div>
            <button class="add press" @click.stop="quickAdd(f)"><Icon name="plus" /></button>
          </div>
        </div>
      </template>

      <!-- receipt -->
      <div class="lbl">{{ t("total", store.lang) }}</div>
      <div class="receipt">
        <div class="tr"><span>{{ t("subtotal", store.lang) }}</span><span>{{ sum(subtotal, store.lang) }}</span></div>
        <div class="tr"><span>{{ t("delivery", store.lang) }}</span><span :class="{ free: delivery === 0 }">{{ delivery === 0 ? t("free", store.lang) : sum(delivery, store.lang) }}</span></div>
        <div class="perf"></div>
        <div class="tr grand"><span>{{ t("total", store.lang) }}</span><b>{{ sum(grand, store.lang) }}</b></div>
      </div>

      <div v-if="belowMin" class="cart-min">{{ t("minOrderInfo", store.lang, { v: sum(minOrder, store.lang) }) }} · {{ sum(minOrder - subtotal, store.lang) }} {{ t("minMore", store.lang) }}</div>
      <div style="height:110px"></div>
    </div>

    <div v-if="store.cart.length > 0" class="actionbar">
      <button class="cta press" :disabled="!canCheckout" @click="router.push('/checkout')">
        {{ t("checkout", store.lang) }} <span class="tp">· {{ sum(grand, store.lang) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import TopBar from "../components/TopBar.vue";
import {
  store, changeQty, removeItem, clearCart, quickAdd, requestQuote,
  loadProducts, cartSubtotal, cartDelivery, cartTotalEstimate, freeDeliveryThreshold, minOrderAmount,
} from "../store.js";
import { t, cf } from "../data/strings.js";
import { foodName, sum } from "../data/foods.js";

const router = useRouter();

const count = computed(() => store.cart.reduce((s, i) => s + i.qty, 0));
const freeThreshold = computed(() => freeDeliveryThreshold.value);
const minOrder = computed(() => minOrderAmount.value);

// Prefer the authoritative server quote when present; otherwise local estimate.
const subtotal = computed(() => (store.quote ? store.quote.subtotal : cartSubtotal.value));
const delivery = computed(() => (store.quote ? store.quote.deliveryFee : cartDelivery.value));
const grand = computed(() => (store.quote ? store.quote.total : cartTotalEstimate.value));

const remaining = computed(() => Math.max(0, freeThreshold.value - subtotal.value));
const pct = computed(() => (freeThreshold.value ? Math.min(100, Math.round((subtotal.value / freeThreshold.value) * 100)) : 100));
const belowMin = computed(() => minOrder.value > 0 && subtotal.value < minOrder.value);
const hasUnavailable = computed(() => store.cart.some((it) => it.unavailable));

const conflict = computed(() => {
  if (store.catalogClosed) return t("browseClosed", store.lang);
  if (hasUnavailable.value) return cf("item_unavailable", store.lang);
  if (store.quoteError && store.quoteError.code && store.quoteError.code !== "empty_cart")
    return cf(store.quoteError.code, store.lang);
  return "";
});
const canCheckout = computed(() =>
  store.cart.length > 0 &&
  !!store.quote &&
  !store.quoting &&
  !store.quoteError &&
  !hasUnavailable.value &&
  !belowMin.value &&
  !store.catalogClosed
);

const upsell = computed(() => {
  const inCart = (id) => store.cart.some((c) => c.productId === id);
  return store.products.filter((f) => (f.kind === "drink" || f.kind === "dessert") && !inCart(f.id)).slice(0, 5);
});

function reprice() { if (store.cart.length) requestQuote({ orderType: "DELIVERY", tip: 0, pointsUsed: 0 }); }
onMounted(async () => {
  await loadProducts();
  reprice();
});
watch(() => store.cart.map((i) => i.uid + "x" + i.qty).join(","), reprice);
</script>

<style scoped>
.iw img { width: 100%; height: 100%; object-fit: cover; }
.up-card .iw img { width: 100%; height: 100%; object-fit: cover; }
.cart-warn { display: flex; align-items: center; gap: 8px; margin: 4px 0 14px; padding: 12px 14px; border-radius: 14px; background: color-mix(in srgb, #e0a02a 14%, var(--surface)); border: 1px solid color-mix(in srgb, #e0a02a 30%, transparent); color: #e0a02a; font-weight: 700; font-size: 12.5px; }
.cart-min { margin-top: 12px; font-size: 12px; font-weight: 700; color: #e0a02a; text-align: center; }
.bag-row.unavailable .iw, .bag-row.unavailable .nm, .bag-row.unavailable .pr { opacity: .55; }
.unavailable-copy { color: #e0a02a; font-weight: 800; }
.bag-stepper button:disabled { opacity: .35; cursor: not-allowed; }
.cta:disabled { opacity: .5; }
</style>
