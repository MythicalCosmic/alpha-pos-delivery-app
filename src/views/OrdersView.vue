<template>
  <div class="screen-anim">
    <div class="page-head"><h1>{{ t("tOrders", store.lang) }}</h1></div>
    <div class="segmented">
      <button :class="{ on: seg === 'active' }" @click="seg = 'active'">{{ t("active", store.lang) }} {{ active.length ? `(${active.length})` : "" }}</button>
      <button :class="{ on: seg === 'history' }" @click="seg = 'history'">{{ t("history", store.lang) }}</button>
    </div>
    <div class="px" style="margin-top:18px">
      <div v-if="store.ordersLoading && !store.orders.length" class="ord-load"><span class="spinner"></span></div>
      <template v-else>
        <div v-if="list.length === 0" class="empty">
          <div class="ei"><Icon name="receipt" /></div><h3>{{ t("ordersEmpty", store.lang) }}</h3><p>{{ t("nothingHere", store.lang) }}</p>
        </div>
        <OrderCard v-for="o in list" :key="o.id" :o="o" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Icon from "../components/Icon.js";
import OrderCard from "../components/OrderCard.vue";
import { store, loadOrders } from "../store.js";
import { t } from "../data/strings.js";
import { isActiveOrder } from "../orderLifecycle.js";

const seg = ref("active");
const active = computed(() => store.orders.filter(isActiveOrder));
const history = computed(() => store.orders.filter((o) => !isActiveOrder(o)));
const list = computed(() => (seg.value === "active" ? active.value : history.value));

onMounted(() => loadOrders());
</script>

<style scoped>
.ord-load { display: grid; place-items: center; padding: 60px 0; }
.spinner { width: 30px; height: 30px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--accent) 25%, transparent); border-top-color: var(--accent); animation: ospin .8s linear infinite; }
@keyframes ospin { to { transform: rotate(360deg); } }
</style>
