<template>
  <div class="order-card enter">
    <div class="oh">
      <div><div class="oid">{{ o.code }}</div><div class="od">{{ date }}</div></div>
      <span :class="['status', statusClass]"><span class="d"></span>{{ t(statusKey, store.lang) }}</span>
    </div>

    <div v-if="active" class="track">
      <template v-for="i in 3" :key="i">
        <div :class="['node', { done: (i - 1) < step }]"><Icon v-if="(i - 1) < step" name="check" /></div>
        <div v-if="i < 3" :class="['bar', { done: (i - 1) < step - 1 }]"></div>
      </template>
    </div>

    <div class="order-prev">
      <div class="av"><Icon name="bag" :size="20" /></div>
      <div class="prev-txt">{{ count }} {{ t("items", store.lang) }}</div>
      <div v-if="o.posOrder && o.posOrder.displayId != null" class="queue">#{{ o.posOrder.displayId }}</div>
    </div>

    <div class="order-foot">
      <div class="ot">{{ count }} {{ t("items", store.lang) }}<b>{{ sum(o.totals.total, store.lang) }}</b></div>
      <span v-if="inStore" class="instore-tag"><Icon name="bag" :size="13" /> {{ t("inStore", store.lang) }}</span>
      <button v-else :class="['obtn', 'press', active ? 'ghost' : '']" @click="act">
        {{ active ? t("trackOrder", store.lang) : t("reorder", store.lang) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "./Icon.js";
import { store, reorder } from "../store.js";
import { t } from "../data/strings.js";
import { sum } from "../data/foods.js";
import { fmtDateTime } from "../util.js";
import { isActiveOrder, orderLifecycle } from "../orderLifecycle.js";

const props = defineProps({ o: { type: Object, required: true } });
const router = useRouter();

const inStore = computed(() => props.o.source === "in_store");
const lifecycle = computed(() => orderLifecycle(props.o));
const active = computed(() => isActiveOrder(props.o));
const count = computed(() => props.o.items.reduce((s, i) => s + i.quantity, 0));
const date = computed(() => fmtDateTime(props.o.createdAt, store.lang));

const statusKey = computed(() => inStore.value ? "inStore" : ({
  PENDING: "stPending", DISPATCHED: "stDispatched", PREPARING: "kPreparing",
  READY: "kReady", COMPLETED: "stCompleted", REJECTED: "stRejected", CANCELED: "stCanceled",
}[lifecycle.value] || "stPending"));
const statusClass = computed(() => inStore.value ? "instore" : ({
  PENDING: "preparing", DISPATCHED: "ontheway", PREPARING: "preparing",
  READY: "ontheway", COMPLETED: "completed", REJECTED: "rejected", CANCELED: "rejected",
}[lifecycle.value] || "preparing"));

// 1 = received (PENDING), 2 = confirmed (DISPATCHED), 3 = ready (kitchen READY)
const step = computed(() => {
  if (lifecycle.value === "PENDING") return 1;
  if (lifecycle.value === "DISPATCHED" || lifecycle.value === "PREPARING") return 2;
  if (lifecycle.value === "READY") return 3;
  return 0;
});

async function act() {
  if (active.value) { router.push(`/tracking/${props.o.id}`); }
  else { await reorder(props.o); router.push("/cart"); }
}
</script>

<style scoped>
.order-prev { display: flex; align-items: center; gap: 10px; }
.order-prev .av { width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; background: var(--surface-2); color: var(--accent-2); flex: none; }
.order-prev .prev-txt { font-size: 12.5px; font-weight: 700; color: var(--text-dim); }
.order-prev .queue { margin-left: auto; font-weight: 800; font-size: 12px; color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); padding: 4px 10px; border-radius: 999px; }
.status.rejected { color: #ef5b6e; }
.status.completed { color: #1fb87a; }
.status.instore { color: var(--text-dim); }
.instore-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 800; color: var(--text-dim); background: var(--surface-2); padding: 7px 12px; border-radius: 999px; }
</style>
