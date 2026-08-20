<template>
  <div :class="['screen', 'app-root', { 'has-nav': showNav }]" :data-theme="theme" :style="screenStyle">
    <Splash v-if="!store.booted" @done="store.booted = true" />

    <div class="viewport" ref="viewportEl">
      <!-- Boot gate: session + config must resolve before the app is usable -->
      <template v-if="store.bootState !== 'ready'">
        <StatusScreen v-if="store.bootState === 'loading'" spinner :title="t('loading', store.lang)" />
        <StatusScreen
          v-else-if="store.bootState === 'no_telegram'"
          icon="chat" :title="t('openTgT', store.lang)" :sub="t('openTgS', store.lang)"
          :action="t('retry', store.lang)" action-icon="refresh" @action="retryBoot"
        />
        <StatusScreen
          v-else-if="store.bootState === 'blocked'"
          icon="close" tone="bad" :title="t('blockedT', store.lang)" :sub="t('blockedS', store.lang)"
        />
        <StatusScreen
          v-else
          icon="globe" tone="warn" :title="t('connErrT', store.lang)" :sub="t('connErrS', store.lang)"
          :action="t('retry', store.lang)" action-icon="refresh" @action="retryBoot"
        />
      </template>

      <router-view v-else v-slot="{ Component }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </div>

    <!-- floating cart bar (tab screens only) -->
    <button v-if="showCartBar" class="cartbar press" @click="router.push('/cart')">
      <span class="cb-ic"><Icon name="bag" :size="22" /><span class="n">{{ cartCount }}</span></span>
      <span class="cb-t"><span class="a">{{ t("cart", store.lang) }}</span><span class="b">{{ sum(cartSubtotal, store.lang) }}</span></span>
      <span class="cb-go">{{ t("checkout", store.lang) }} <Icon name="chevron" :size="18" /></span>
    </button>

    <!-- browser preview badge: shows live-API reachability when opened outside Telegram -->
    <div v-if="ready && store.browser" :class="['browser-badge', apiTone]">
      <Icon name="globe" :size="14" /> {{ t("browserPreview", store.lang) }} · {{ apiLabel }}
    </div>

    <Toast />

    <BottomNav v-if="showNav" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import BottomNav from "./components/BottomNav.vue";
import Splash from "./components/Splash.vue";
import Toast from "./components/Toast.vue";
import StatusScreen from "./components/StatusScreen.vue";
import Icon from "./components/Icon.js";
import { store, theme, cartCount, cartSubtotal, boot, retryBoot } from "./store.js";
import { t } from "./data/strings.js";
import { sum } from "./data/foods.js";
import { initTelegram, applyTgChrome, showBackButton, hideBackButton } from "./telegram.js";
import { completedAccountRedirect } from "./onboarding.js";

const route = useRoute();
const router = useRouter();
const viewportEl = ref(null);

const ready = computed(() => store.bootState === "ready");
const hideNav = computed(() => !!route.meta.hideNav);
const onTabScreen = computed(() => !!route.meta.tab);
const showNav = computed(() => ready.value && !hideNav.value);
const showCartBar = computed(() => ready.value && onTabScreen.value && cartCount.value > 0);

const apiLabel = computed(() =>
  store.apiNote === "ok" ? t("apiOk", store.lang)
  : store.apiNote === "auth" ? t("apiAuth", store.lang)
  : t("apiErr", store.lang)
);
const apiTone = computed(() => (store.apiNote === "ok" ? "ok" : store.apiNote === "auth" ? "warn" : "bad"));

const screenStyle = computed(() => ({
  "--accent": store.tweaks.accent,
  "--radius-card": store.tweaks.cardRadius + "px",
  "--font-display": `'${store.tweaks.displayFont}', system-ui, sans-serif`,
}));

// scroll to top on navigation
watch(() => route.fullPath, async () => {
  await nextTick();
  if (viewportEl.value) viewportEl.value.scrollTop = 0;
});

// Telegram: theme chrome + native back button
watch(theme, (v) => applyTgChrome(v));
// Telegram may restore the exact hash that was open when the Mini App closed.
// Once boot has loaded the server profile, leave a stale setup URL immediately
// if this customer already completed onboarding on any previous session.
watch(
  () => [store.bootState, route.name, store.me?.profileComplete, route.query.return],
  () => {
    const target = completedAccountRedirect({
      bootState: store.bootState,
      routeName: route.name,
      customer: store.me,
      returnTo: route.query.return,
    });
    if (target) void router.replace(target);
  },
  { immediate: true }
);
watch(
  () => [route.meta.pushed, ready.value],
  ([pushed, isReady]) => {
    if (pushed && isReady) showBackButton(() => router.back());
    else hideBackButton();
  },
  { immediate: true }
);

onMounted(() => {
  initTelegram();
  applyTgChrome(theme.value);
  boot();
});
</script>

<style scoped>
.browser-badge {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 76px);
  transform: translateX(-50%);
  z-index: 3500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 800;
  white-space: nowrap;
  background: var(--surface);
  border: 1px solid var(--hairline);
  box-shadow: 0 6px 20px rgba(0, 0, 0, .25);
  color: var(--text-dim);
  pointer-events: none;
}
.browser-badge.ok { color: #1fb87a; border-color: color-mix(in srgb, #1fb87a 35%, transparent); }
.browser-badge.warn { color: #e0a02a; border-color: color-mix(in srgb, #e0a02a 35%, transparent); }
.browser-badge.bad { color: #ef5b6e; border-color: color-mix(in srgb, #ef5b6e 35%, transparent); }
</style>
