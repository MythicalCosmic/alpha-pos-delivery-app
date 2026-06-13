<template>
  <div :class="['screen', 'app-root', { 'has-nav': !hideNav }]" :data-theme="theme" :style="screenStyle">
    <Splash v-if="!store.booted" @done="store.booted = true" />

    <div class="viewport" ref="viewportEl">
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </div>

    <!-- floating cart bar (tab screens only) -->
    <button v-if="showCartBar" class="cartbar press" @click="router.push('/cart')">
      <span class="cb-ic"><Icon name="bag" :size="22" /><span class="n">{{ cartCount }}</span></span>
      <span class="cb-t"><span class="a">{{ t("cart", store.lang) }}</span><span class="b">{{ sum(cartSubtotal, store.lang) }}</span></span>
      <span class="cb-go">{{ t("checkout", store.lang) }} <Icon name="chevron" :size="18" /></span>
    </button>

    <Toast />

    <BottomNav v-if="!hideNav" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import BottomNav from "./components/BottomNav.vue";
import Splash from "./components/Splash.vue";
import Toast from "./components/Toast.vue";
import Icon from "./components/Icon.js";
import { store, theme, cartCount, cartSubtotal } from "./store.js";
import { t } from "./data/strings.js";
import { sum } from "./data/foods.js";
import { initTelegram, applyTgChrome, showBackButton, hideBackButton } from "./telegram.js";

const route = useRoute();
const router = useRouter();
const viewportEl = ref(null);

const hideNav = computed(() => !!route.meta.hideNav);
const onTabScreen = computed(() => !!route.meta.tab);
const showCartBar = computed(() => onTabScreen.value && cartCount.value > 0);

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
watch(
  () => route.meta.pushed,
  (pushed) => {
    if (pushed) showBackButton(() => router.back());
    else hideBackButton();
  },
  { immediate: true }
);

onMounted(() => {
  initTelegram();
  applyTgChrome(theme.value);
});
</script>
