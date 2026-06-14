<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('support', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">

      <!-- contact channels -->
      <div class="stack" style="margin-top:6px">
        <a v-for="c in contacts" :key="c.key" class="lrow press" :href="c.href" target="_blank" rel="noopener" @click="haptic('light')">
          <span class="li"><Icon :name="c.icon" :size="21" /></span>
          <span class="lt"><span class="a">{{ c.title }}</span><span class="b">{{ c.sub }}</span></span>
          <span class="chev"><Icon name="chevron" :size="20" /></span>
        </a>
      </div>

      <!-- tickets -->
      <div class="gt2 row-between">
        <span>{{ t("myTickets", store.lang) }}</span>
        <button class="mini-add press" @click="toggleNew"><Icon name="plus" :size="16" /> {{ t("newTicket", store.lang) }}</button>
      </div>

      <div v-if="composing" class="ticket-form">
        <input v-model="subject" class="tf-in" :placeholder="t('ticketSubject', store.lang)" />
        <textarea v-model="message" class="tf-area" :placeholder="t('ticketMsg', store.lang)" rows="3"></textarea>
        <div class="tf-acts">
          <button class="ghostbtn press" @click="composing = false">{{ t("cancel", store.lang) }}</button>
          <button class="solidbtn press" :disabled="!message.trim() || sending" @click="submitTicket">{{ t("sendMsg", store.lang) }}</button>
        </div>
      </div>

      <div v-if="store.tickets.length === 0 && !composing" class="muted">{{ t("noTickets", store.lang) }}</div>

      <div v-for="tk in store.tickets" :key="tk.id" class="ticket">
        <button class="tk-head press" @click="open = open === tk.id ? -1 : tk.id">
          <span class="tk-l">
            <span class="a">{{ tk.subject || ("#" + tk.id) }}</span>
            <span class="b">{{ tk.messages.length }} · {{ fmtDateTime(tk.createdAt, store.lang) }}</span>
          </span>
          <span :class="['tk-badge', tk.status.toLowerCase()]">{{ t(tk.status === "OPEN" ? "ticketOpen" : "ticketClosed", store.lang) }}</span>
        </button>
        <div v-if="open === tk.id" class="tk-thread">
          <div v-for="m in tk.messages" :key="m.id" :class="['msg', m.sender.toLowerCase()]">
            <div class="bubble">{{ m.text }}</div>
            <div class="mt">{{ fmtTime(m.createdAt, store.lang) }}</div>
          </div>
          <div v-if="tk.status === 'OPEN'" class="tk-reply">
            <input v-model="replyText[tk.id]" :placeholder="t('ticketMsg', store.lang)" @keyup.enter="reply(tk)" />
            <button class="press" :disabled="!(replyText[tk.id] || '').trim()" @click="reply(tk)"><Icon name="navigation" :size="18" /></button>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <div class="gt2">{{ t("faqTitle", store.lang) }}</div>
      <div class="faq">
        <div v-for="(f, i) in faqs" :key="i" :class="['faq-item', { open: openFaq === i }]">
          <button class="faq-q press" @click="toggleFaq(i)">
            <span>{{ f.q }}</span>
            <Icon name="chevronDown" :size="18" class="caret" />
          </button>
          <div v-if="openFaq === i" class="faq-a">{{ f.a }}</div>
        </div>
      </div>

      <div style="height:24px"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import { store, loadSupport, loadTickets, createTicket, addTicketMessage } from "../store.js";
import { t } from "../data/strings.js";
import { haptic } from "../telegram.js";
import { pickLang } from "../api/normalize.js";
import { fmtDateTime, fmtTime } from "../util.js";

const router = useRouter();
const openFaq = ref(0);
const open = ref(-1);
const composing = ref(false);
const subject = ref("");
const message = ref("");
const sending = ref(false);
const replyText = reactive({});

// Static fallback used until /support resolves (or if it has no contacts).
const STATIC_CONTACTS = { phone: "+998 71 200 70 70", telegram: "@smartfood_support", email: "help@smartfood.uz" };

const contactSrc = computed(() => {
  const c = (store.support && store.support.contacts) || (store.config && store.config.support) || {};
  return { phone: c.phone || STATIC_CONTACTS.phone, telegram: c.telegram || STATIC_CONTACTS.telegram, email: c.email || STATIC_CONTACTS.email };
});

const contacts = computed(() => {
  const c = contactSrc.value;
  const handle = (c.telegram || "").replace(/^@/, "");
  return [
    { key: "call", icon: "phone", title: t("supportCall", store.lang), sub: c.phone, href: `tel:${(c.phone || "").replace(/\s/g, "")}` },
    { key: "tg", icon: "chat", title: t("supportTg", store.lang), sub: c.telegram, href: `https://t.me/${handle}` },
    { key: "mail", icon: "bell", title: t("supportMail", store.lang), sub: c.email, href: `mailto:${c.email}` },
  ];
});

const STATIC_FAQ = [
  { q: "faqQ1", a: "faqA1" }, { q: "faqQ2", a: "faqA2" }, { q: "faqQ3", a: "faqA3" },
];
const faqs = computed(() => {
  const api = store.support && store.support.faq;
  if (api && api.length) return api.map((f) => ({ q: pickLang(f.q, store.lang), a: pickLang(f.a, store.lang) }));
  return STATIC_FAQ.map((f) => ({ q: t(f.q, store.lang), a: t(f.a, store.lang) }));
});

function toggleFaq(i) { openFaq.value = openFaq.value === i ? -1 : i; haptic("light"); }
function toggleNew() { composing.value = !composing.value; }

async function submitTicket() {
  if (!message.value.trim() || sending.value) return;
  sending.value = true;
  try {
    await createTicket(subject.value.trim(), message.value.trim());
    subject.value = ""; message.value = ""; composing.value = false;
  } catch { /* ignore */ }
  finally { sending.value = false; }
}

async function reply(tk) {
  const text = (replyText[tk.id] || "").trim();
  if (!text) return;
  replyText[tk.id] = "";
  try { await addTicketMessage(tk.id, text); } catch { /* ignore */ }
}

onMounted(() => { loadSupport(); loadTickets(); });
</script>

<style scoped>
.gt2 { font-size: 11.5px; font-weight: 800; color: var(--text-faint); text-transform: uppercase; letter-spacing: .5px; margin: 24px 4px 12px; }
.row-between { display: flex; align-items: center; justify-content: space-between; }
.mini-add { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 800; color: var(--accent); text-transform: none; }
.muted { font-size: 12.5px; font-weight: 700; color: var(--text-faint); padding: 4px 2px; }
.lrow { text-decoration: none; color: inherit; }
.ticket-form { background: var(--surface); border: 1px solid var(--hairline); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.tf-in, .tf-area { width: 100%; border-radius: 12px; background: var(--surface-2); border: 1.5px solid var(--hairline); padding: 10px 12px; color: var(--text); font-weight: 600; font-size: 13.5px; outline: none; resize: none; font-family: inherit; }
.tf-in:focus, .tf-area:focus { border-color: var(--accent); }
.tf-acts { display: flex; gap: 10px; }
.ghostbtn { flex: 1; height: 44px; border-radius: 12px; background: var(--surface-2); font-weight: 800; color: var(--text); }
.solidbtn { flex: 1; height: 44px; border-radius: 12px; background: var(--accent); color: var(--on-accent); font-weight: 800; box-shadow: var(--shadow-accent); }
.solidbtn:disabled { opacity: .5; }
.ticket { background: var(--surface); border: 1px solid var(--hairline); border-radius: 16px; margin-bottom: 10px; overflow: hidden; }
.tk-head { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 16px; text-align: left; }
.tk-head .a { font-weight: 800; font-size: 13.5px; color: var(--text); }
.tk-head .b { font-size: 11px; color: var(--text-faint); font-weight: 700; margin-top: 2px; display: block; }
.tk-badge { font-size: 10px; font-weight: 800; padding: 4px 9px; border-radius: 999px; flex: none; }
.tk-badge.open { color: #1fb87a; background: color-mix(in srgb, #1fb87a 14%, transparent); }
.tk-badge.closed { color: var(--text-faint); background: var(--surface-2); }
.tk-thread { padding: 0 14px 14px; border-top: 1px solid var(--hairline); }
.msg { margin-top: 12px; display: flex; flex-direction: column; }
.msg.customer { align-items: flex-end; }
.msg .bubble { max-width: 80%; padding: 9px 13px; border-radius: 14px; font-size: 13px; font-weight: 600; line-height: 1.4; }
.msg.customer .bubble { background: var(--accent); color: var(--on-accent); border-bottom-right-radius: 4px; }
.msg.operator .bubble { background: var(--surface-2); color: var(--text); border-bottom-left-radius: 4px; }
.msg .mt { font-size: 10px; color: var(--text-faint); font-weight: 700; margin-top: 4px; }
.tk-reply { display: flex; gap: 8px; margin-top: 14px; }
.tk-reply input { flex: 1; min-width: 0; height: 42px; border-radius: 12px; background: var(--surface-2); border: 1.5px solid var(--hairline); padding: 0 12px; color: var(--text); font-weight: 600; font-size: 13px; outline: none; }
.tk-reply input:focus { border-color: var(--accent); }
.tk-reply button { width: 42px; height: 42px; flex: none; border-radius: 12px; background: var(--accent); color: var(--on-accent); display: grid; place-items: center; }
.tk-reply button:disabled { opacity: .5; }
.faq { display: flex; flex-direction: column; gap: 10px; }
.faq-item { background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-sm); overflow: hidden; }
.faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 16px; font-weight: 800; font-size: 13.5px; text-align: left; color: var(--text); }
.faq-q .caret { transition: transform .25s; color: var(--text-faint); flex: none; }
.faq-item.open .caret { transform: rotate(180deg); }
.faq-a { padding: 0 16px 15px; font-size: 12.5px; font-weight: 600; color: var(--text-dim); line-height: 1.5; }
</style>
