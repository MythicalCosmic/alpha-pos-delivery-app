<template>
  <div class="order-help" role="alert">
    <div class="order-help-message"><Icon name="info" :size="18" /> <span>{{ message }}</span></div>
    <a v-if="phone" class="order-help-action press" :href="phoneHref">
      <Icon name="phone" :size="17" />
      <span>{{ t("callSupport", store.lang) }}</span>
      <b>{{ phone }}</b>
    </a>
    <button v-else class="order-help-action press" type="button" @click="router.push('/support')">
      <Icon name="chat" :size="17" />
      <span>{{ t("contactSupport", store.lang) }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "./Icon.js";
import { store } from "../store.js";
import { t } from "../data/strings.js";

defineProps({ message: { type: String, required: true } });

const router = useRouter();
const phone = computed(() => String(store.config && store.config.support && store.config.support.phone || "").trim());
const phoneHref = computed(() => `tel:${phone.value.replace(/[^+\d]/g, "")}`);
</script>

<style scoped>
.order-help { margin: 14px 0; padding: 13px 14px; border-radius: 15px; background: color-mix(in srgb, #ef5b6e 12%, var(--surface)); border: 1px solid color-mix(in srgb, #ef5b6e 28%, transparent); }
.order-help-message { display: flex; align-items: flex-start; gap: 8px; color: #ef5b6e; font-size: 12.5px; font-weight: 700; line-height: 1.45; }
.order-help-message svg { flex: none; margin-top: 1px; }
.order-help-action { width: 100%; min-height: 42px; margin-top: 11px; padding: 9px 11px; border-radius: 12px; display: flex; align-items: center; gap: 8px; background: var(--surface); color: var(--text); text-decoration: none; font-size: 12px; font-weight: 800; text-align: left; }
.order-help-action b { margin-left: auto; color: var(--accent); font-size: 11.5px; }
</style>
