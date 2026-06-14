<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('editProfile', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">
      <div class="avatar-block">
        <img v-if="photo" :src="photo" class="big-av" :alt="form.name" />
        <div v-else class="big-av">{{ initials }}</div>
        <div class="av-name">{{ form.name || "—" }}</div>
        <div class="av-tier"><Icon name="star" :size="13" filled /> {{ grouped(points) }} {{ t("points", store.lang) }}</div>
      </div>

      <div class="gt2">{{ t("personalInfo", store.lang) }}</div>

      <label class="field">
        <span class="fl"><Icon name="user" :size="18" /> {{ t("fullName", store.lang) }}</span>
        <input v-model="form.name" :placeholder="t('fullName', store.lang)" />
      </label>

      <label class="field">
        <span class="fl"><Icon name="phone" :size="18" /> {{ t("phone", store.lang) }}</span>
        <input v-model="form.phone" type="tel" inputmode="tel" placeholder="+998 ..." />
      </label>

      <div style="height:110px"></div>
    </div>

    <div class="actionbar">
      <button class="cta press" :disabled="!form.name.trim() || saving" @click="save">
        <span v-if="saving" class="spinner-sm"></span>
        <template v-else>{{ t("save", store.lang) }}</template>
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import { store, updateProfile } from "../store.js";
import { t } from "../data/strings.js";

const router = useRouter();
const me = store.me || { name: "", phone: "", photoUrl: "", points: 0 };
const form = reactive({ name: me.name || "", phone: me.phone || "" });
const photo = computed(() => store.me && store.me.photoUrl);
const points = computed(() => (store.me ? store.me.points : 0));
const grouped = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const saving = ref(false);

const initials = computed(() =>
  (form.name || "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "U"
);

async function save() {
  if (!form.name.trim() || saving.value) return;
  saving.value = true;
  try {
    await updateProfile({ name: form.name.trim(), phone: form.phone.trim() });
    router.back();
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.avatar-block { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 14px 0 8px; }
.big-av { width: 92px; height: 92px; border-radius: 28px; background: linear-gradient(140deg, var(--accent), #a05bff); color: #fff; display: grid; place-items: center; font-family: var(--font-display); font-weight: 700; font-size: 34px; box-shadow: var(--shadow-accent); object-fit: cover; }
.av-name { font-family: var(--font-display); font-weight: 700; font-size: 19px; margin-top: 14px; }
.av-tier { display: inline-flex; align-items: center; gap: 5px; color: var(--star); font-weight: 800; font-size: 12px; margin-top: 6px; }
.gt2 { font-size: 11.5px; font-weight: 800; color: var(--text-faint); text-transform: uppercase; letter-spacing: .5px; margin: 22px 4px 12px; }
.field { display: block; margin-bottom: 14px; }
.field .fl { display: flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 800; color: var(--text-dim); margin: 0 2px 8px; }
.field input { width: 100%; height: 54px; border-radius: 16px; background: var(--surface); border: 1.5px solid var(--hairline); padding: 0 16px; color: var(--text); font-weight: 700; font-size: 14.5px; outline: none; transition: border-color .2s; }
.field input:focus { border-color: var(--accent); }
.cta:disabled { opacity: .5; }
.spinner-sm { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.4); border-top-color: #fff; animation: pspin .8s linear infinite; }
@keyframes pspin { to { transform: rotate(360deg); } }
</style>
