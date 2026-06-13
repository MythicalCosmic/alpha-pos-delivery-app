<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('cart', store.lang)" @back="router.back()">
      <button v-if="store.cart.length > 0" class="press" style="font-weight:800;font-size:13px;color:var(--text-faint)" @click="clearCart">{{ t("clearAll", store.lang) }}</button>
    </TopBar>

    <div v-if="store.cart.length === 0" class="empty">
      <div class="ei"><Icon name="bag" /></div><h3>{{ t("cartEmpty", store.lang) }}</h3><p>{{ t("cartEmptySub", store.lang) }}</p>
    </div>

    <div v-else class="cart2">
      <!-- free-delivery progress -->
      <div :class="['freebar', { done: remaining === 0 }]">
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
        <div v-for="it in store.cart" :key="it.uid" class="bag-row enter">
          <div class="iw"><FoodArt :kind="foodOf(it).kind" :hue="foodOf(it).hue" /></div>
          <div class="bb">
            <div class="nm">{{ foodName(foodOf(it), store.lang) }}</div>
            <div class="opt">{{ optLine(it) }}</div>
            <div class="pr">{{ sum(it.unit * it.qty, store.lang) }}</div>
          </div>
          <div class="rt">
            <div class="bag-stepper">
              <button v-if="it.qty === 1" class="del" @click="removeItem(it.uid)"><Icon name="trash" /></button>
              <button v-else @click="changeQty(it.uid, -1)"><Icon name="minus" /></button>
              <span class="q">{{ it.qty }}</span>
              <button class="acc" @click="changeQty(it.uid, 1)"><Icon name="plus" /></button>
            </div>
          </div>
        </div>
      </div>

      <!-- upsell -->
      <template v-if="upsell.length > 0">
        <div class="lbl">{{ t("addMore", store.lang) }}</div>
        <div class="upsell">
          <div v-for="f in upsell" :key="f.id" class="up-card press">
            <div class="iw"><FoodArt :kind="f.kind" :hue="f.hue" /></div>
            <div class="nm">{{ foodName(f, store.lang) }}</div>
            <div class="pr">{{ sum(f.price, store.lang) }}</div>
            <button class="add press" @click="quickAdd(f)"><Icon name="plus" /></button>
          </div>
        </div>
      </template>

      <!-- promo -->
      <div class="lbl">{{ t("havePromo", store.lang) }}</div>
      <div class="promo-ticket">
        <span class="pi"><Icon name="gift" :size="20" /></span>
        <input v-model="store.promo" placeholder="SMART50" />
        <button :class="['applyb', 'press', { applied: store.promoApplied }]" @click="applyPromo">{{ store.promoApplied ? t("added", store.lang) : t("promo", store.lang) }}</button>
      </div>

      <!-- receipt -->
      <div class="lbl">{{ t("total", store.lang) }}</div>
      <div class="receipt">
        <div class="tr"><span>{{ t("subtotal", store.lang) }}</span><span>{{ sum(cartSubtotal, store.lang) }}</span></div>
        <div v-if="cartDiscount > 0" class="tr"><span class="disc">SMART50 · −50%</span><span class="disc">−{{ sum(cartDiscount, store.lang) }}</span></div>
        <div class="tr"><span>{{ t("delivery", store.lang) }}</span><span :class="{ free: cartDelivery === 0 }">{{ cartDelivery === 0 ? t("free", store.lang) : sum(cartDelivery, store.lang) }}</span></div>
        <div class="perf"></div>
        <div class="tr grand"><span>{{ t("total", store.lang) }}</span><b>{{ sum(cartTotal, store.lang) }}</b></div>
      </div>
      <div style="height:110px"></div>
    </div>

    <div v-if="store.cart.length > 0" class="actionbar">
      <button class="cta press" @click="router.push('/checkout')">{{ t("checkout", store.lang) }} <span class="tp">· {{ sum(cartTotal, store.lang) }}</span></button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import TopBar from "../components/TopBar.vue";
import {
  store, changeQty, removeItem, clearCart, quickAdd, applyPromo,
  cartSubtotal, cartDiscount, cartDelivery, cartTotal,
} from "../store.js";
import { t } from "../data/strings.js";
import { FOODS, SIZES, EXTRAS, FREE_DELIVERY_AT, foodById, foodName, locName, sum } from "../data/foods.js";

const router = useRouter();

const count = computed(() => store.cart.reduce((s, i) => s + i.qty, 0));
const remaining = computed(() => Math.max(0, FREE_DELIVERY_AT - cartSubtotal.value));
const pct = computed(() => Math.min(100, Math.round((cartSubtotal.value / FREE_DELIVERY_AT) * 100)));
const upsell = computed(() => {
  const inCart = (id) => store.cart.some(c => c.foodId === id);
  return FOODS.filter(f => (f.cat === "drink" || f.cat === "dessert") && !inCart(f.id)).slice(0, 5);
});

const foodOf = (it) => foodById(it.foodId);
function optLine(it) {
  const sz = SIZES.find(s => s.id === it.sizeId);
  const exNames = it.extraIds.map(id => locName(EXTRAS.find(e => e.id === id), store.lang));
  return [locName(sz, store.lang), ...exNames].join(" · ");
}
</script>
