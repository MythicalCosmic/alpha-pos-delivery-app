<template>
  <div v-if="order" class="track-screen">
    <div class="thero" :data-status="lifecycle">
      <div class="nav"><button class="iconbtn press" @click="goHome"><Icon name="back" /></button></div>
      <div class="thero-ic">
        <Icon :name="heroIcon" :size="40" />
      </div>
      <div class="thero-t">{{ t(statusKey, store.lang) }}</div>
      <div class="thero-s">{{ statusSub }}</div>
      <div class="thero-code">{{ order.code }}</div>
    </div>

    <div class="px" style="margin-top:18px">
      <!-- queue / kitchen -->
      <div v-if="order.posOrder" class="pos-card">
        <div class="pc-row">
          <span class="pc-l">{{ t("queueNo", store.lang) }}</span>
          <span class="pc-v">#{{ order.posOrder.displayId }}</span>
        </div>
        <div class="pc-row">
          <span class="pc-l">{{ t("preparing", store.lang) }}</span>
          <span class="pc-badge">{{ kitchenStatus }}</span>
        </div>
      </div>

      <!-- timeline (active orders) -->
      <div v-if="isActive" class="tline">
        <div v-for="(s, i) in steps" :key="i" :class="['tstep', s.state]">
          <div class="ico">
            <Icon v-if="s.state === 'done'" name="check" />
            <Icon v-else-if="s.key === 'kPreparing'" name="fire" :size="19" />
            <Icon v-else name="bag" :size="19" />
          </div>
          <div class="line"></div>
          <div class="tx"><div class="a">{{ t(s.key, store.lang) }}</div></div>
        </div>
      </div>

      <!-- rejection reason -->
      <OrderHelp v-if="lifecycle === 'REJECTED'" :message="t('rejectedHelp', store.lang)" />

      <!-- address -->
      <div v-if="order.orderType === 'DELIVERY' && order.addressText" class="addr-line">
        <Icon name="pin" :size="16" /> {{ order.addressText }}
      </div>

      <!-- totals -->
      <div class="totals" style="margin-top:14px">
        <div class="tr"><span>{{ count }} {{ t("items", store.lang) }}</span><span>{{ sum(order.totals.subtotal, store.lang) }}</span></div>
        <div v-if="order.totals.deliveryFee" class="tr"><span>{{ t("delivery", store.lang) }}</span><span>{{ sum(order.totals.deliveryFee, store.lang) }}</span></div>
        <div v-if="order.totals.discount" class="tr"><span class="disc">{{ t("discount", store.lang) }}</span><span class="disc">−{{ sum(order.totals.discount, store.lang) }}</span></div>
        <div v-if="order.totals.tip" class="tr"><span>{{ t("tipCourier", store.lang) }}</span><span>{{ sum(order.totals.tip, store.lang) }}</span></div>
        <div class="tr grand"><span>{{ t("total", store.lang) }}</span><b>{{ sum(order.totals.total, store.lang) }}</b></div>
      </div>

      <div style="height:12px"></div>
      <button v-if="lifecycle === 'PENDING'" class="cancel-btn press" :disabled="canceling" @click="doCancel">
        {{ t("cancelOrder", store.lang) }}
      </button>
      <div v-if="cancelErr" class="reject-box" style="margin-top:10px"><Icon name="info" :size="18" /> {{ cancelErr }}</div>
      <div style="height:8px"></div>
      <button class="ghost press" style="width:100%;height:52px;border-radius:16px;background:var(--surface);border:1px solid var(--hairline);font-weight:800;font-size:14px;color:var(--text)" @click="router.push('/orders')">{{ t("viewOrder", store.lang) }}</button>
      <div style="height:10px"></div>
      <button class="cta press" style="width:100%" @click="goHome">{{ t("backHome", store.lang) }}</button>
      <div style="height:24px"></div>
    </div>
  </div>

  <div v-else-if="loadFailed" class="empty" style="min-height:80vh">
    <div class="ei"><Icon name="receipt" /></div><h3>{{ t("technicalIssueTitle", store.lang) }}</h3>
    <div style="width:min(420px,calc(100% - 32px))"><OrderHelp :message="t('technicalLoadFailure', store.lang)" /></div>
    <button class="cta press" style="margin-top:18px;max-width:220px" @click="router.replace('/orders')">{{ t("viewOrder", store.lang) }}</button>
  </div>
  <div v-else class="empty" style="min-height:80vh"><span class="spinner"></span></div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import OrderHelp from "../components/OrderHelp.vue";
import { store, loadOrder, trackOrder, cancelOrder } from "../store.js";
import { ConflictError } from "../api/index.js";
import { t } from "../data/strings.js";
import { sum } from "../data/foods.js";
import { TRACK_POLL_MS } from "../config.js";
import { confirmDialog } from "../telegram.js";
import { isActiveOrder, orderLifecycle } from "../orderLifecycle.js";

const route = useRoute();
const router = useRouter();
const id = Number(route.params.id) || route.params.id;

const order = computed(() => store.orderCache[id] || null);
const loadFailed = ref(false);
const canceling = ref(false);
const cancelErr = ref("");
let timer = null;

const lifecycle = computed(() => orderLifecycle(order.value));
const isActive = computed(() => !!order.value && isActiveOrder(order.value));
const count = computed(() => (order.value ? order.value.items.reduce((s, i) => s + i.quantity, 0) : 0));

const statusKey = computed(() => ({
  PENDING: "stPending", DISPATCHED: "stDispatched", PREPARING: "kPreparing",
  READY: "kReady", COMPLETED: "stCompleted", REJECTED: "stRejected", CANCELED: "stCanceled",
}[lifecycle.value] || "stPending"));

const statusSub = computed(() => {
  if (!order.value) return "";
  return t(({
    PENDING: "awaitingSub", DISPATCHED: "confirmedSub", PREPARING: "preparingSub",
    READY: "readySub", COMPLETED: "completedSub", REJECTED: "stRejected", CANCELED: "canceledSub",
  })[lifecycle.value] || "awaitingSub", store.lang);
});

const heroIcon = computed(() => ({
  PENDING: "clock", DISPATCHED: "bag", PREPARING: "fire", READY: "check",
  COMPLETED: "check", REJECTED: "close", CANCELED: "close",
}[lifecycle.value] || "clock"));

const kitchenStatus = computed(() => {
  const s = order.value && order.value.posOrder && order.value.posOrder.status;
  if (s === "PREPARING") return t("kPreparing", store.lang);
  if (s === "READY") return t("kReady", store.lang);
  if (s === "COMPLETED") return t("stCompleted", store.lang);
  if (s === "CANCELED" || s === "CANCELLED") return t("stCanceled", store.lang);
  return s || "";
});

const steps = computed(() => {
  const progress = ({ PENDING: 1, DISPATCHED: 2, PREPARING: 3, READY: 4 })[lifecycle.value] || 0;
  return [
    { key: "stPending", state: progress > 1 ? "done" : "active" },
    { key: "stDispatched", state: progress > 2 ? "done" : (progress === 2 ? "active" : "") },
    { key: "kPreparing", state: progress > 3 ? "done" : (progress === 3 ? "active" : "") },
    { key: "kReady", state: progress === 4 ? "active" : "" },
  ];
});

async function poll() {
  try { await trackOrder(id, {}); loadFailed.value = false; }
  catch { if (!order.value) loadFailed.value = true; }
}

function stopPolling() {
  if (timer) clearTimeout(timer);
  timer = null;
}

function schedulePoll() {
  stopPolling();
  if (!isActive.value) return;
  timer = setTimeout(async () => {
    await poll();
    schedulePoll();
  }, TRACK_POLL_MS);
}

async function doCancel() {
  if (canceling.value) return;
  const ok = await confirmDialog(t("cancelAsk", store.lang));
  if (!ok) return;
  canceling.value = true;
  cancelErr.value = "";
  try {
    await cancelOrder(id);
  } catch (e) {
    // Status can race the poll: the order may have left PENDING before we tapped.
    cancelErr.value = e instanceof ConflictError ? t("cannotCancel", store.lang) : t("orderFail", store.lang);
  } finally {
    canceling.value = false;
  }
}

function goHome() { router.push("/home"); }

onMounted(async () => {
  try {
    if (!order.value) await loadOrder(id);
  } catch { loadFailed.value = true; }
  schedulePoll();
});
watch(isActive, (active) => { if (active) schedulePoll(); else stopPolling(); });
onBeforeUnmount(stopPolling);
</script>

<style scoped>
.thero { position: relative; padding: 56px 20px 26px; display: flex; flex-direction: column; align-items: center; text-align: center; background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 22%, var(--surface)), var(--surface)); }
.thero[data-status="REJECTED"], .thero[data-status="CANCELED"] { background: linear-gradient(160deg, color-mix(in srgb, #ef5b6e 18%, var(--surface)), var(--surface)); }
.thero[data-status="COMPLETED"] { background: linear-gradient(160deg, color-mix(in srgb, #1fb87a 18%, var(--surface)), var(--surface)); }
.thero .nav { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 12px); left: 14px; }
.thero .iconbtn { width: 42px; height: 42px; border-radius: 13px; background: var(--surface); color: var(--text); display: grid; place-items: center; box-shadow: 0 6px 18px rgba(0,0,0,.2); }
.thero-ic { width: 78px; height: 78px; border-radius: 26px; background: var(--surface); color: var(--accent); display: grid; place-items: center; box-shadow: var(--shadow-accent); margin-bottom: 14px; }
.thero[data-status="REJECTED"] .thero-ic, .thero[data-status="CANCELED"] .thero-ic { color: #ef5b6e; box-shadow: none; }
.thero[data-status="COMPLETED"] .thero-ic { color: #1fb87a; box-shadow: none; }
.thero-t { font-family: var(--font-display); font-weight: 700; font-size: 22px; color: var(--text); }
.thero-s { font-size: 13px; font-weight: 600; color: var(--text-dim); margin-top: 6px; }
.thero-code { margin-top: 12px; font-weight: 800; font-size: 13px; color: var(--accent); background: var(--surface); padding: 6px 14px; border-radius: 999px; }
.pos-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 6px 16px; margin-bottom: 14px; }
.pc-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; }
.pc-row + .pc-row { border-top: 1px solid var(--hairline); }
.pc-l { font-size: 13px; font-weight: 700; color: var(--text-dim); }
.pc-v { font-family: var(--font-display); font-weight: 700; font-size: 22px; color: var(--accent); }
.pc-badge { font-weight: 800; font-size: 12px; color: var(--accent-2); background: color-mix(in srgb, var(--accent-2) 14%, transparent); padding: 5px 12px; border-radius: 999px; }
.reject-box { display: flex; align-items: center; gap: 8px; margin: 4px 0 14px; padding: 12px 14px; border-radius: 14px; background: color-mix(in srgb, #ef5b6e 14%, var(--surface)); border: 1px solid color-mix(in srgb, #ef5b6e 30%, transparent); color: #ef5b6e; font-weight: 700; font-size: 12.5px; }
.addr-line { display: flex; align-items: center; gap: 8px; margin: 4px 0 4px; font-size: 12.5px; font-weight: 700; color: var(--text-dim); }
.cancel-btn { width: 100%; height: 52px; border-radius: 16px; background: color-mix(in srgb, #ef5b6e 14%, var(--surface)); border: 1px solid color-mix(in srgb, #ef5b6e 30%, transparent); color: #ef5b6e; font-weight: 800; font-size: 14px; }
.cancel-btn:disabled { opacity: .5; }
.spinner { width: 32px; height: 32px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--accent) 25%, transparent); border-top-color: var(--accent); animation: tspin .8s linear infinite; }
@keyframes tspin { to { transform: rotate(360deg); } }
</style>
