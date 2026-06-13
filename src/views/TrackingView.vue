<template>
  <div v-if="order" class="track-screen">
    <div class="tmap">
      <div class="blk" style="left:30px;top:40px;width:54px;height:70px"></div>
      <div class="blk" style="left:110px;top:90px;width:80px;height:50px"></div>
      <div class="blk" style="right:40px;top:120px;width:70px;height:64px"></div>
      <div class="blk" style="right:120px;top:30px;width:50px;height:46px"></div>
      <div class="nav"><button class="iconbtn press" @click="goHome"><Icon name="back" /></button></div>
      <svg class="route" viewBox="0 0 380 240" preserveAspectRatio="none">
        <path d="M 60 175 C 150 120, 250 200, 340 70" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" opacity="0.9" />
      </svg>
      <span class="pin shop" style="left:16%;top:78%"><span class="dotpin"><Icon name="store" :size="16" /></span></span>
      <span class="pin dest" style="left:89%;top:33%"><span class="dotpin"><Icon name="pin" :size="16" /></span></span>
      <div class="scooter"><Icon name="scooter" :size="26" /></div>
    </div>

    <div class="eta">
      <span class="pill"><span class="d"></span> {{ t("preparing", store.lang) }}</span>
      <div class="big">~28 {{ t("min", store.lang) }}</div>
      <div class="sub">{{ t("orderOnWay", store.lang) }} · #{{ order.id }}</div>
    </div>

    <div class="courier">
      <div class="cav"><Icon name="user" :size="26" /></div>
      <div class="cb">
        <div class="lbl2">{{ t("courierLbl", store.lang) }}</div>
        <div class="nm">Jamshid R.</div>
        <div class="rt"><Icon name="star" :size="13" filled /> 4.9 · Yamaha</div>
      </div>
      <div class="acts">
        <button class="press"><Icon name="chat" :size="20" /></button>
        <button class="fill press"><Icon name="phone" :size="20" /></button>
      </div>
    </div>

    <div class="tline">
      <div v-for="(s, i) in steps" :key="i" :class="['tstep', s.state]">
        <div class="ico">
          <Icon v-if="s.state === 'done'" name="check" />
          <Icon v-else-if="s.key === 'preparing'" name="fire" :size="19" />
          <Icon v-else-if="s.key === 'stReady'" name="scooter" :size="19" />
          <Icon v-else name="bag" :size="19" />
        </div>
        <div class="line"></div>
        <div class="tx"><div class="a">{{ t(s.key, store.lang) }}</div><div class="b">{{ s.time }}</div></div>
      </div>
    </div>

    <div class="px">
      <div class="totals">
        <div class="tr"><span>{{ count }} {{ t("items", store.lang) }}</span><span>{{ foodSummary }}</span></div>
        <div class="tr grand"><span>{{ t("total", store.lang) }}</span><b>{{ sum(order.total, store.lang) }}</b></div>
      </div>
      <div style="height:12px"></div>
      <button class="ghost press" style="width:100%;height:52px;border-radius:16px;background:var(--surface);border:1px solid var(--hairline);font-weight:800;font-size:14px;color:var(--text)" @click="router.push('/orders')">{{ t("viewOrder", store.lang) }}</button>
      <div style="height:10px"></div>
      <button class="cta press" style="width:100%" @click="goHome">{{ t("backHome", store.lang) }}</button>
      <div style="height:24px"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import { store } from "../store.js";
import { t } from "../data/strings.js";
import { foodById, foodName, sum } from "../data/foods.js";

const route = useRoute();
const router = useRouter();
const order = computed(() => store.orders.find(o => o.id === route.params.id));

const steps = [
  { key: "stConfirmed", time: "13:24", state: "done" },
  { key: "preparing", time: "13:26", state: "active" },
  { key: "stReady", time: "~13:38", state: "" },
  { key: "delivered", time: "~13:52", state: "" },
];

const foods = computed(() => (order.value?.items || []).map(it => foodById(it.foodId)).filter(Boolean));
const count = computed(() => (order.value?.items || []).reduce((s, i) => s + i.qty, 0));
const foodSummary = computed(() => foods.value.map(f => foodName(f, store.lang)).join(", ").slice(0, 28) + "…");

function goHome() { router.push("/home"); }
onMounted(() => { if (!order.value) router.replace("/orders"); });
</script>
