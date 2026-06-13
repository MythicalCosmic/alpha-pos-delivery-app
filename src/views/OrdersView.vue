<template>
  <div class="screen-anim">
    <div class="page-head"><h1>{{ t("tOrders", store.lang) }}</h1></div>
    <div class="segmented">
      <button :class="{ on: seg === 'active' }" @click="seg = 'active'">{{ t("active", store.lang) }} {{ active.length ? `(${active.length})` : "" }}</button>
      <button :class="{ on: seg === 'history' }" @click="seg = 'history'">{{ t("history", store.lang) }}</button>
    </div>
    <div class="px" style="margin-top:18px">
      <div v-if="list.length === 0" class="empty">
        <div class="ei"><Icon name="receipt" /></div><h3>{{ t("ordersEmpty", store.lang) }}</h3><p>{{ t("cartEmptySub", store.lang) }}</p>
      </div>
      <OrderCard v-for="o in list" :key="o.id" :o="o" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Icon from "../components/Icon.js";
import OrderCard from "../components/OrderCard.vue";
import { store } from "../store.js";
import { t } from "../data/strings.js";

const seg = ref("active");
const active = computed(() => store.orders.filter(o => o.status !== "delivered"));
const history = computed(() => store.orders.filter(o => o.status === "delivered"));
const list = computed(() => (seg.value === "active" ? active.value : history.value));
</script>
