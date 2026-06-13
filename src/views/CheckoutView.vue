<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('checkout', store.lang)" @back="router.back()" />
    <div class="co2">
      <!-- order summary -->
      <div class="lbl">{{ t("yourOrder", store.lang) }}<span class="ed press" @click="router.back()">{{ t("edit", store.lang) }}</span></div>
      <div class="co-summary">
        <div class="thumbs">
          <div v-for="(x, i) in foods.slice(0, 3)" :key="i" class="th"><FoodArt :kind="x.f.kind" :hue="x.f.hue" /></div>
          <div v-if="foods.length > 3" class="more">+{{ foods.length - 3 }}</div>
        </div>
        <div class="ct">
          <div class="a">{{ count }} {{ t("items", store.lang) }}</div>
          <div class="b">{{ foods.map(x => foodName(x.f, store.lang)).join(", ") }}</div>
        </div>
      </div>

      <!-- address -->
      <div class="lbl">{{ t("deliveryAddr", store.lang) }}</div>
      <div class="addr-card">
        <MiniMap
          v-if="selectedAddress && selectedAddress.lat != null"
          :lat="selectedAddress.lat"
          :lng="selectedAddress.lng"
          :height="92"
          class="addr-mini"
        />
        <div v-else class="addr-map">
          <span class="road"></span><span class="road b"></span>
          <span class="pin"><Icon name="pin" :size="26" /></span>
        </div>
        <div class="addr-body">
          <span class="tag"><Icon name="pin" :size="12" /> {{ selectedAddress ? selectedAddress.tag : t("home2", store.lang) }}</span>
          <div class="ad">{{ selectedAddress ? selectedAddress.text : "—" }}</div>
          <div v-if="addrDetail" class="ad2">{{ addrDetail }}</div>
          <div class="ch press" @click="router.push('/addresses')">{{ t("change", store.lang) }}</div>
        </div>
      </div>
      <div class="note-in">
        <Icon name="chat" :size="18" />
        <input v-model="note" :placeholder="t('notePh', store.lang)" />
      </div>

      <!-- when -->
      <div class="lbl">{{ t("when", store.lang) }}</div>
      <div class="slots">
        <button :class="['slot', 'press', { on: slot === 'asap' }]" @click="slot = 'asap'">
          <div class="a">{{ t("asap", store.lang).split(" ")[0] }} ⚡</div><div class="b">25–35 {{ t("min", store.lang) }}</div>
        </button>
        <button v-for="s in slots" :key="s" :class="['slot', 'press', { on: slot === s }]" @click="slot = s">
          <div class="a">{{ s }}</div><div class="b">{{ t("today", store.lang) }}</div>
        </button>
      </div>

      <!-- payment -->
      <div class="lbl">{{ t("payWith", store.lang) }}</div>
      <div class="pay-grid">
        <button :class="['pay-card', 'press', { on: pay === 'cash' }]" @click="pay = 'cash'">
          <span class="tick"><Icon name="check" /></span>
          <span class="pi"><Icon name="cash" :size="20" /></span>
          <div class="a">{{ t("cash", store.lang) }}</div><div class="b">{{ t("delivery", store.lang).toLowerCase() }}</div>
        </button>
        <button :class="['pay-card', 'press', { on: pay === 'card' }]" @click="pay = 'card'">
          <span class="tick"><Icon name="check" /></span>
          <span class="pi"><Icon name="card" :size="20" /></span>
          <div class="a">{{ t("card", store.lang) }}</div><div class="b">•••• 4821</div>
        </button>
      </div>

      <!-- tip -->
      <div class="lbl">{{ t("tipCourier", store.lang) }}</div>
      <div class="tips">
        <button v-for="v in TIPS" :key="v" :class="['tip-chip', 'press', { on: tip === v }]" @click="tip = v">
          {{ v === 0 ? "—" : (v / 1000) + "k" }}
        </button>
      </div>
      <div class="tip-note">{{ t("tipNote", store.lang) }}</div>

      <!-- totals -->
      <div class="totals" style="margin-top:20px">
        <div class="tr"><span>{{ t("subtotal", store.lang) }}</span><span>{{ sum(cartSubtotal, store.lang) }}</span></div>
        <div v-if="cartDiscount > 0" class="tr"><span class="disc">SMART50</span><span class="disc">−{{ sum(cartDiscount, store.lang) }}</span></div>
        <div class="tr"><span>{{ t("delivery", store.lang) }}</span><span :class="{ free: cartDelivery === 0 }">{{ cartDelivery === 0 ? t("free", store.lang) : sum(cartDelivery, store.lang) }}</span></div>
        <div v-if="tip > 0" class="tr"><span>{{ t("tipCourier", store.lang) }}</span><span>{{ sum(tip, store.lang) }}</span></div>
        <div class="tr grand"><span>{{ t("total", store.lang) }}</span><b>{{ sum(grandTotal, store.lang) }}</b></div>
      </div>
      <div style="height:110px"></div>
    </div>
    <div class="actionbar">
      <button class="cta press" @click="place">{{ t("placeOrder", store.lang) }} <span class="tp">· {{ sum(grandTotal, store.lang) }}</span></button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import TopBar from "../components/TopBar.vue";
import MiniMap from "../components/MiniMap.vue";
import { store, placeOrder, cartSubtotal, cartDiscount, cartDelivery, selectedAddress } from "../store.js";
import { t } from "../data/strings.js";
import { foodById, foodName, sum } from "../data/foods.js";

const router = useRouter();
const pay = ref("cash");
const slot = ref("asap");
const tip = ref(3000);
const note = ref("");
const TIPS = [0, 3000, 5000, 10000];

function futureSlots() {
  const base = new Date(Date.now() + 45 * 60000);
  base.setMinutes(base.getMinutes() < 30 ? 30 : 60, 0, 0);
  const out = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(base.getTime() + i * 30 * 60000);
    out.push(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  }
  return out;
}
const slots = futureSlots();

const foods = computed(() => store.cart.map(c => ({ f: foodById(c.foodId), qty: c.qty })).filter(x => x.f));
const count = computed(() => store.cart.reduce((s, i) => s + i.qty, 0));
const grandTotal = computed(() => cartSubtotal.value - cartDiscount.value + cartDelivery.value + tip.value);

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

onMounted(() => { if (store.cart.length === 0) router.replace("/cart"); });

function place() {
  const order = placeOrder(grandTotal.value, {
    note: note.value, payment: pay.value, tip: tip.value, slot: slot.value,
  });
  router.replace(`/tracking/${order.id}`);
}
</script>

<style scoped>
.addr-mini { width: 92px; flex: none; border-radius: 0; }
.addr-body .ad2 { font-size: 11px; color: var(--text-faint); font-weight: 700; margin-top: 4px; }
</style>
