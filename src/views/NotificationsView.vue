<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('notifs', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">
      <div class="stack" style="margin-top:6px">
        <div class="lrow">
          <span class="li"><Icon name="receipt" :size="21" /></span>
          <span class="lt"><span class="a">{{ t("notifOrders", store.lang) }}</span><span class="b">{{ t("notifOrdersRequired", store.lang) }}</span></span>
          <span class="always-on">{{ t("alwaysOn", store.lang) }}</span>
        </div>
        <div class="lrow">
          <span class="li"><Icon name="gift" :size="21" /></span>
          <span class="lt"><span class="a">{{ t("notifPromos", store.lang) }}</span><span class="b">{{ t("notifPromosS", store.lang) }}</span></span>
          <SwitchToggle :on="store.notif.promos" :disabled="saving" :aria-label="t('notifPromos', store.lang)" @toggle="togglePromos" />
        </div>
      </div>
      <p v-if="error" class="pref-error" role="alert">{{ error }}</p>
      <div style="height:24px"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import SwitchToggle from "../components/SwitchToggle.vue";
import { store, setBroadcastOptIn } from "../store.js";
import { t } from "../data/strings.js";

const router = useRouter();
const saving = ref(false);
const error = ref("");

async function togglePromos() {
  if (saving.value) return;
  saving.value = true;
  error.value = "";
  try {
    await setBroadcastOptIn(!store.notif.promos);
  } catch {
    error.value = t("notifPreferenceFailed", store.lang);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.always-on { padding: 7px 9px; color: var(--accent); border-radius: 10px; background: color-mix(in srgb, var(--accent) 12%, transparent); font-size: 11px; font-weight: 850; white-space: nowrap; }
.pref-error { margin: 12px 4px 0; color: #ef5b6e; font-size: 12px; font-weight: 750; }
</style>
