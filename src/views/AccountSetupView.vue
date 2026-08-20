<template>
  <div class="push-anim account-screen">
    <TopBar :title="t('completeAccount', store.lang)" @back="router.back()" />

    <main class="account-wrap">
      <section class="account-intro">
        <div class="account-mark"><Icon name="user" :size="26" /></div>
        <div>
          <div class="eyebrow">{{ t("checkoutStep", store.lang) }}</div>
          <h1>{{ t("accountTitle", store.lang) }}</h1>
          <p>{{ t("accountBody", store.lang) }}</p>
        </div>
      </section>

      <div class="step-row" aria-label="Checkout setup progress">
        <div class="step on"><span>1</span>{{ t("accountStep", store.lang) }}</div>
        <div class="step-line"></div>
        <div class="step"><span>2</span>{{ t("locationStep", store.lang) }}</div>
      </div>

      <form class="account-card" @submit.prevent="save">
        <label class="field">
          <span>{{ t("firstName", store.lang) }}</span>
          <input
            v-model="form.firstName"
            autocomplete="given-name"
            :placeholder="t('firstNamePh', store.lang)"
            :aria-invalid="!!errors.first_name"
            :aria-describedby="errors.first_name ? 'account-first-name-error' : undefined"
            :disabled="saving"
          />
          <small v-if="errors.first_name" id="account-first-name-error">{{ errors.first_name }}</small>
        </label>

        <label class="field">
          <span>{{ t("lastName", store.lang) }}</span>
          <input
            v-model="form.lastName"
            autocomplete="family-name"
            :placeholder="t('lastNamePh', store.lang)"
            :aria-invalid="!!errors.last_name"
            :aria-describedby="errors.last_name ? 'account-last-name-error' : undefined"
            :disabled="saving"
          />
          <small v-if="errors.last_name" id="account-last-name-error">{{ errors.last_name }}</small>
        </label>

        <label class="field">
          <span>{{ t("phone", store.lang) }}</span>
          <div class="phone-field">
            <Icon name="phone" :size="18" />
            <input
              v-model="form.phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="+998 90 123 45 67"
              :aria-invalid="!!errors.phone"
              :aria-describedby="errors.phone ? 'account-phone-error account-phone-help' : 'account-phone-help'"
              :disabled="saving"
            />
          </div>
          <small v-if="errors.phone" id="account-phone-error">{{ errors.phone }}</small>
          <em id="account-phone-help">{{ t("phoneWhy", store.lang) }}</em>
        </label>

        <div v-if="submitError" class="form-error" role="alert">
          <Icon name="info" :size="18" /> {{ submitError }}
        </div>

        <div class="privacy-note">
          <Icon name="check" :size="18" />
          <span>{{ t("confirmIdentityNote", store.lang) }}</span>
        </div>

        <button class="cta press" type="submit" :disabled="!canSave || saving">
          <span v-if="saving" class="spinner-sm"></span>
          <template v-else>{{ t("confirmContinue", store.lang) }} <Icon name="chevron" :size="18" /></template>
        </button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import { ApiError } from "../api/index.js";
import { t } from "../data/strings.js";
import { useDirtyGuard } from "../dirtyGuard.js";
import { accountSetupReturnPath } from "../onboarding.js";
import { displayUzPhone, isUzPhone, normalizeUzPhone } from "../phone.js";
import { deliverableAddresses, loadAddresses, store, updateProfile } from "../store.js";

const route = useRoute();
const router = useRouter();
const me = store.me || {};
const form = reactive({
  firstName: me.firstName || "",
  lastName: me.lastName || "",
  phone: displayUzPhone(me.phone || ""),
});
const errors = reactive({ first_name: "", last_name: "", phone: "" });
const submitError = ref("");
const saving = ref(false);
const formSnapshot = () => JSON.stringify(form);
const { markClean, allowNextLeave } = useDirtyGuard(formSnapshot, () => t("discardChanges", store.lang), () => saving.value);

const canSave = computed(() =>
  !!form.firstName.trim() &&
  !!form.lastName.trim() &&
  isUzPhone(form.phone) &&
  !saving.value
);

function validate() {
  errors.first_name = form.firstName.trim() ? "" : t("firstNameRequired", store.lang);
  errors.last_name = form.lastName.trim() ? "" : t("lastNameRequired", store.lang);
  errors.phone = isUzPhone(form.phone) ? "" : t("phoneInvalid", store.lang);
  return !errors.first_name && !errors.last_name && !errors.phone;
}

function safeReturn() {
  return accountSetupReturnPath(route.query.return);
}

async function save() {
  if (!validate() || saving.value) return;
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
    const target = safeReturn();
    if (target.startsWith("/checkout") && !store.addressesLoaded) {
      const loaded = await loadAddresses();
      if (!loaded) {
        submitError.value = t("addressLoadFailed", store.lang);
        return;
      }
    }
    if (target.startsWith("/checkout") && deliverableAddresses.value.length === 0) {
      allowNextLeave();
      await router.replace({ name: "address-edit", query: { return: target } });
    } else {
      allowNextLeave();
      await router.replace(target);
    }
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
.account-screen { min-height: 100%; }
.account-wrap { padding: 8px 18px 120px; }
.account-intro { display: grid; grid-template-columns: 50px 1fr; gap: 14px; align-items: start; padding: 14px 2px 8px; }
.account-mark { width: 50px; height: 50px; border-radius: 17px; display: grid; place-items: center; color: #fff; background: linear-gradient(145deg, var(--accent), #a05bff); box-shadow: var(--shadow-accent); }
.eyebrow { color: var(--accent); font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
h1 { margin: 5px 0 7px; font-family: var(--font-display); font-size: clamp(21px, 6vw, 27px); line-height: 1.12; letter-spacing: -.03em; }
.account-intro p { margin: 0; color: var(--text-dim); font-size: 13px; line-height: 1.55; font-weight: 650; }
.step-row { display: flex; align-items: center; margin: 18px 6px; color: var(--text-faint); font-size: 11px; font-weight: 850; }
.step { display: flex; align-items: center; gap: 7px; white-space: nowrap; }
.step span { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; border: 1px solid var(--hairline-strong); }
.step.on { color: var(--accent); }
.step.on span { color: #fff; background: var(--accent); border-color: var(--accent); }
.step-line { height: 1px; flex: 1; min-width: 18px; margin: 0 9px; background: var(--hairline); }
.account-card { padding: 18px; border: 1px solid var(--hairline); border-radius: 24px; background: var(--surface); box-shadow: var(--shadow-card); }
.field { display: block; margin-bottom: 15px; }
.field > span { display: block; margin: 0 2px 8px; color: var(--text-dim); font-size: 12px; font-weight: 850; }
.field > input, .phone-field { width: 100%; height: 54px; border: 1.5px solid var(--hairline); border-radius: 15px; background: var(--surface-2); color: var(--text); outline: none; }
.field > input { padding: 0 15px; font: inherit; font-size: 14.5px; font-weight: 750; }
.phone-field { display: flex; align-items: center; gap: 9px; padding: 0 14px; color: var(--text-faint); }
.phone-field input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; font-size: 14.5px; font-weight: 750; }
.field > input:focus, .phone-field:focus-within { border-color: var(--accent); }
.field > input[aria-invalid="true"], .phone-field:has(input[aria-invalid="true"]) { border-color: #ef5b6e; }
.field small { display: block; margin: 6px 2px 0; color: #ef5b6e; font-size: 11.5px; font-weight: 750; }
.field em { display: block; margin: 6px 2px 0; color: var(--text-faint); font-size: 11.5px; line-height: 1.4; font-style: normal; }
.privacy-note { display: flex; gap: 9px; align-items: flex-start; margin: 4px 0 16px; padding: 11px 12px; border-radius: 13px; color: var(--text-dim); background: color-mix(in srgb, var(--accent-2) 8%, var(--surface-2)); font-size: 11.5px; line-height: 1.45; font-weight: 700; }
.privacy-note svg { flex: none; color: var(--accent-2); }
.form-error { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; color: #ef5b6e; font-size: 12px; font-weight: 750; }
.cta { width: 100%; min-height: 54px; display: flex; align-items: center; justify-content: center; gap: 7px; }
.cta:disabled { opacity: .5; }
.spinner-sm { width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.4); border-top-color: #fff; animation: account-spin .8s linear infinite; }
@keyframes account-spin { to { transform: rotate(360deg); } }
</style>
