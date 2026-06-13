<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('support', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">

      <div class="stack" style="margin-top:6px">
        <a v-for="c in contacts" :key="c.key" class="lrow press" :href="c.href" target="_blank" rel="noopener" @click="haptic('light')">
          <span class="li"><Icon :name="c.icon" :size="21" /></span>
          <span class="lt"><span class="a">{{ t(c.key, store.lang) }}</span><span class="b">{{ t(c.sub, store.lang) }}</span></span>
          <span class="chev"><Icon name="chevron" :size="20" /></span>
        </a>
      </div>

      <div class="gt2">{{ t("faqTitle", store.lang) }}</div>
      <div class="faq">
        <div v-for="(f, i) in faqs" :key="i" :class="['faq-item', { open: open === i }]">
          <button class="faq-q press" @click="toggle(i)">
            <span>{{ t(f.q, store.lang) }}</span>
            <Icon name="chevronDown" :size="18" class="caret" />
          </button>
          <div v-if="open === i" class="faq-a">{{ t(f.a, store.lang) }}</div>
        </div>
      </div>

      <div style="height:24px"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import { store } from "../store.js";
import { t } from "../data/strings.js";
import { haptic } from "../telegram.js";

const router = useRouter();
const open = ref(0);
function toggle(i) { open.value = open.value === i ? -1 : i; haptic("light"); }

const contacts = [
  { icon: "phone", key: "supportCall", sub: "supportCallS", href: "tel:+998712007070" },
  { icon: "chat", key: "supportTg", sub: "supportTgS", href: "https://t.me/smartfood_support" },
  { icon: "bell", key: "supportMail", sub: "supportMailS", href: "mailto:help@smartfood.uz" },
];
const faqs = [
  { q: "faqQ1", a: "faqA1" },
  { q: "faqQ2", a: "faqA2" },
  { q: "faqQ3", a: "faqA3" },
];
</script>

<style scoped>
.lrow { text-decoration: none; color: inherit; }
.gt2 { font-size: 11.5px; font-weight: 800; color: var(--text-faint); text-transform: uppercase; letter-spacing: .5px; margin: 24px 4px 12px; }
.faq { display: flex; flex-direction: column; gap: 10px; }
.faq-item { background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-sm); overflow: hidden; }
.faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 16px; font-weight: 800; font-size: 13.5px; text-align: left; color: var(--text); }
.faq-q .caret { transition: transform .25s; color: var(--text-faint); flex: none; }
.faq-item.open .caret { transform: rotate(180deg); }
.faq-a { padding: 0 16px 15px; font-size: 12.5px; font-weight: 600; color: var(--text-dim); line-height: 1.5; }
</style>
