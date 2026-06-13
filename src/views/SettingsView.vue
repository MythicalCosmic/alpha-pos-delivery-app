<template>
  <div class="screen-anim px" style="padding-top:10px">
    <div class="page-head" style="padding-left:0;padding-right:0"><h1>{{ t("tSettings", store.lang) }}</h1></div>

    <div class="profile-card press" style="margin-top:14px" @click="go('/profile')">
      <div class="pa"><Icon name="user" :size="30" /></div>
      <div class="pi">
        <div class="pn">{{ store.user.name }}</div>
        <span class="pm"><Icon name="star" :size="13" filled /> Smart Gold · 1 250 {{ t("points", store.lang) }}</span>
      </div>
      <span style="margin-left:auto;color:rgba(255,255,255,.8)"><Icon name="chevron" :size="22" /></span>
    </div>

    <!-- appearance / themes -->
    <div class="settings-group">
      <div class="gt">{{ t("appearance", store.lang) }}</div>
      <div class="lrow press" @click="go('/themes')">
        <span class="li"><Icon :name="theme === 'dark' ? 'moon' : 'sun'" :size="21" /></span>
        <span class="lt"><span class="a">{{ t("themes", store.lang) }}</span><span class="b">{{ t("themesSub", store.lang) }}</span></span>
        <span class="accent-dot" :style="{ background: store.tweaks.accent }"></span>
        <span class="chev"><Icon name="chevron" :size="20" /></span>
      </div>
    </div>

    <!-- language -->
    <div class="settings-group">
      <div class="gt">{{ t("language", store.lang) }}</div>
      <div class="lang-seg">
        <button v-for="l in langs" :key="l.id" :class="{ on: store.lang === l.id }" @click="setLang(l.id)">
          <span class="fl">{{ l.fl }}</span>{{ l.n }}
        </button>
      </div>
    </div>

    <!-- account -->
    <div class="settings-group">
      <div class="gt">{{ t("account", store.lang) }}</div>
      <div class="stack">
        <div v-for="r in rows" :key="r.path" class="lrow press" @click="go(r.path)">
          <span class="li"><Icon :name="r.icon" :size="21" /></span>
          <span class="lt"><span class="a">{{ t(r.key, store.lang) }}</span><span v-if="r.sub" class="b">{{ r.sub }}</span></span>
          <span class="chev"><Icon name="chevron" :size="20" /></span>
        </div>
      </div>
    </div>
    <div style="height:10px"></div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import { store, setLang, theme, selectedAddress } from "../store.js";
import { t } from "../data/strings.js";
import { haptic } from "../telegram.js";

const router = useRouter();
const langs = [{ id: "uz", fl: "🇺🇿", n: "O‘zbek" }, { id: "en", fl: "🇬🇧", n: "English" }, { id: "ru", fl: "🇷🇺", n: "Русский" }];

const rows = computed(() => [
  { icon: "pin", key: "addresses", path: "/addresses", sub: selectedAddress.value ? selectedAddress.value.text : "" },
  { icon: "card", key: "payments", path: "/payments", sub: defaultCardSub.value },
  { icon: "bell", key: "notifs", path: "/notifications", sub: "" },
  { icon: "gift", key: "loyalty", path: "/loyalty", sub: "Smart Club" },
  { icon: "help", key: "support", path: "/support", sub: "" },
]);
const defaultCardSub = computed(() => {
  const c = store.cards.find(x => x.default) || store.cards[0];
  return c ? `${c.brand} •••• ${c.last4}` : "";
});

function go(path) { haptic("light"); router.push(path); }
</script>

<style scoped>
.accent-dot { width: 18px; height: 18px; border-radius: 50%; flex: none; box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 8%, transparent); }
</style>
