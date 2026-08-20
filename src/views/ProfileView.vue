<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('editProfile', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">
      <div class="avatar-block">
        <img v-if="photo" :src="photo" class="big-av" :alt="fullName" />
        <div v-else class="big-av">{{ initials }}</div>
        <div class="av-name">{{ fullName || "—" }}</div>
        <div class="av-tier"><Icon name="star" :size="13" filled /> {{ grouped(points) }} {{ t("points", store.lang) }}</div>
      </div>

      <div class="gt2">{{ t("personalInfo", store.lang) }}</div>

      <label class="field">
        <span class="fl"><Icon name="user" :size="18" /> {{ t("firstName", store.lang) }}</span>
        <input v-model="form.firstName" autocomplete="given-name" :placeholder="t('firstNamePh', store.lang)" :aria-invalid="!!errors.first_name" :aria-describedby="errors.first_name ? 'profile-first-name-error' : undefined" :disabled="saving" />
        <small v-if="errors.first_name" id="profile-first-name-error">{{ errors.first_name }}</small>
      </label>

      <label class="field">
        <span class="fl"><Icon name="user" :size="18" /> {{ t("lastName", store.lang) }}</span>
        <input v-model="form.lastName" autocomplete="family-name" :placeholder="t('lastNamePh', store.lang)" :aria-invalid="!!errors.last_name" :aria-describedby="errors.last_name ? 'profile-last-name-error' : undefined" :disabled="saving" />
        <small v-if="errors.last_name" id="profile-last-name-error">{{ errors.last_name }}</small>
      </label>

      <label class="field">
        <span class="fl"><Icon name="phone" :size="18" /> {{ t("phone", store.lang) }}</span>
        <input v-model="form.phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 90 123 45 67" :aria-invalid="!!errors.phone" :aria-describedby="errors.phone ? 'profile-phone-error' : undefined" :disabled="saving" />
        <small v-if="errors.phone" id="profile-phone-error">{{ errors.phone }}</small>
      </label>

      <div v-if="submitError" class="form-error" role="alert">{{ submitError }}</div>

      <div style="height:110px"></div>
    </div>

    <div class="actionbar">
      <button class="cta press" :disabled="!canSave || saving" @click="save">
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
import { ApiError } from "../api/index.js";
import { useDirtyGuard } from "../dirtyGuard.js";
import { displayUzPhone, isUzPhone, normalizeUzPhone } from "../phone.js";
import { store, updateProfile } from "../store.js";
import { t } from "../data/strings.js";

const router = useRouter();
const me = store.me || { firstName: "", lastName: "", phone: "", photoUrl: "", points: 0 };
const form = reactive({
  firstName: me.firstName || "",
  lastName: me.lastName || "",
  phone: displayUzPhone(me.phone || ""),
});
const errors = reactive({ first_name: "", last_name: "", phone: "" });
const submitError = ref("");
const photo = computed(() => store.me && store.me.photoUrl);
const points = computed(() => (store.me ? store.me.points : 0));
const grouped = (n) => (n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const saving = ref(false);
const formSnapshot = () => JSON.stringify(form);
const { markClean, allowNextLeave } = useDirtyGuard(formSnapshot, () => t("discardChanges", store.lang), () => saving.value);

const fullName = computed(() => `${form.firstName} ${form.lastName}`.trim());
const initials = computed(() =>
  [form.firstName, form.lastName].filter(Boolean).map((w) => w.trim()[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U"
);
const canSave = computed(() =>
  !!form.firstName.trim() && !!form.lastName.trim() && isUzPhone(form.phone)
);

async function save() {
  errors.first_name = form.firstName.trim() ? "" : t("firstNameRequired", store.lang);
  errors.last_name = form.lastName.trim() ? "" : t("lastNameRequired", store.lang);
  errors.phone = isUzPhone(form.phone) ? "" : t("phoneInvalid", store.lang);
  if (!canSave.value || saving.value) return;
  saving.value = true;
  submitError.value = "";
  try {
    await updateProfile({
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      phone: normalizeUzPhone(form.phone),
      confirm: true,
    });
    markClean();
    allowNextLeave();
    router.back();
  } catch (error) {
    if (error instanceof ApiError && error.errors) {
      errors.first_name = error.errors.first_name || "";
      errors.last_name = error.errors.last_name || "";
      errors.phone = error.errors.phone || "";
    }
    submitError.value = (error && error.message) || t("saveFailed", store.lang);
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
.field small { display: block; margin: 6px 2px 0; color: #ef5b6e; font-size: 11.5px; font-weight: 750; }
.form-error { margin: 0 2px 14px; color: #ef5b6e; font-size: 12px; font-weight: 750; }
.cta:disabled { opacity: .5; }
.spinner-sm { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.4); border-top-color: #fff; animation: pspin .8s linear infinite; }
@keyframes pspin { to { transform: rotate(360deg); } }
</style>
