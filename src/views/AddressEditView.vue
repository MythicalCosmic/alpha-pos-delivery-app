<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t(isNew ? 'newAddress' : 'editAddress', store.lang)" @back="router.back()" />

    <div v-if="!formReady" class="address-state" :class="{ error: !!loadError }" aria-live="polite">
      <template v-if="loadError">
        <Icon name="info" :size="24" />
        <strong>{{ loadError }}</strong>
        <button class="loc-pick press" type="button" @click="loadEditing">{{ t("tryAgain", store.lang) }}</button>
      </template>
      <template v-else>
        <span class="spinner-sm" aria-hidden="true"></span>
        <strong>{{ t("addressLoading", store.lang) }}</strong>
      </template>
    </div>

    <div v-else class="px" style="padding-top:6px">
      <!-- location card -->
      <div class="loc-card">
        <MiniMap v-if="form.lat != null" :lat="form.lat" :lng="form.lng" :height="150" />
        <div v-else class="loc-empty"><Icon name="pin" :size="26" /></div>

        <button class="loc-pick press" type="button" :disabled="saving" @click="openPicker = true">
          <Icon name="target" :size="18" />
          {{ form.lat != null ? t("editPin", store.lang) : t("chooseOnMap", store.lang) }}
        </button>
        <div v-if="form.lat != null" class="loc-precise" :class="{ ok: form.precision === 'exact' }">
          <span class="dot"></span>{{ form.precision === "exact" ? t("precise", store.lang) : t("approximate", store.lang) }}
        </div>
      </div>

      <!-- tag -->
      <div id="address-label-heading" class="gt2">{{ t("addrLabel", store.lang) }}</div>
      <div class="tagrow">
        <button v-for="opt in tagOpts" :key="opt.v" :class="['tagchip', 'press', { on: form.tag === opt.v }]" type="button" :disabled="saving" @click="form.tag = opt.v">{{ opt.label }}</button>
      </div>
      <input v-if="isCustomTag" id="custom-address-label" v-model="form.tag" class="fld" maxlength="40" :aria-label="t('addrLabel', store.lang)" :placeholder="t('addrLabel', store.lang)" :disabled="saving" />

      <!-- full address -->
      <label class="gt2" for="full-address">{{ t("fullAddress", store.lang) }}</label>
      <input id="full-address" v-model="form.text" class="fld" maxlength="500" :placeholder="t('addrLine', store.lang)" :disabled="saving" />

      <!-- entry details -->
      <div class="gt2">{{ t("addrDetails", store.lang) }} · <span class="opt">{{ t("optional", store.lang) }}</span></div>
      <div class="grid4">
        <label class="mini"><span>{{ t("apartment", store.lang) }}</span><input v-model="form.apartment" inputmode="numeric" maxlength="40" :disabled="saving" /></label>
        <label class="mini"><span>{{ t("entrance", store.lang) }}</span><input v-model="form.entrance" inputmode="numeric" maxlength="40" :disabled="saving" /></label>
        <label class="mini"><span>{{ t("floor", store.lang) }}</span><input v-model="form.floor" inputmode="numeric" maxlength="40" :disabled="saving" /></label>
        <label class="mini"><span>{{ t("intercom", store.lang) }}</span><input v-model="form.intercom" inputmode="numeric" maxlength="40" :disabled="saving" /></label>
      </div>

      <label class="gt2" for="address-comment">{{ t("addrComment", store.lang) }}</label>
      <input id="address-comment" v-model="form.comment" class="fld" maxlength="500" :placeholder="t('addrCommentPh', store.lang)" :disabled="saving" />

      <div v-if="form.lat == null" class="hint"><Icon name="pin" :size="14" /> {{ t("setPinFirst", store.lang) }}</div>
      <div v-if="saveError" class="form-error" role="alert"><Icon name="info" :size="16" /> {{ saveError }}</div>
      <div style="height:110px"></div>
    </div>

    <div v-if="formReady" class="actionbar">
      <button class="cta press" :disabled="!canSave" @click="save">{{ t("save", store.lang) }}</button>
    </div>

    <MapPicker
      v-if="openPicker"
      :initial="form.lat != null ? { lat: form.lat, lng: form.lng } : null"
      @close="openPicker = false"
      @confirm="onPicked"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import MiniMap from "../components/MiniMap.vue";
import MapPicker from "../components/MapPicker.vue";
import { store, saveAddress, loadAddresses } from "../store.js";
import { t } from "../data/strings.js";
import { useDirtyGuard } from "../dirtyGuard.js";
import { showBackButton } from "../telegram.js";

const route = useRoute();
const router = useRouter();

const editing = computed(() => store.addresses.find(a => String(a.id) === String(route.params.id)) || null);
const isNew = computed(() => !route.params.id);

const form = reactive({
  id: editing.value?.id || null,
  tag: editing.value?.label || t("tagHome", store.lang),
  text: editing.value?.line || "",
  lat: editing.value?.lat ?? null,
  lng: editing.value?.lng ?? null,
  city: editing.value?.city || "",
  street: editing.value?.street || "",
  house: editing.value?.house || "",
  apartment: editing.value?.apartment || "",
  entrance: editing.value?.entrance || "",
  floor: editing.value?.floor || "",
  intercom: editing.value?.intercom || "",
  comment: editing.value?.comment || "",
  precision: editing.value?.precision || "",
});

const tagOpts = computed(() => [
  { v: t("tagHome", store.lang), label: t("tagHome", store.lang) },
  { v: t("tagWork", store.lang), label: t("tagWork", store.lang) },
  { v: t("tagOther", store.lang), label: t("tagOther", store.lang) },
]);
const isCustomTag = computed(() => !tagOpts.value.some(o => o.v === form.tag));

const openPicker = ref(false);
const saving = ref(false);
const formReady = ref(isNew.value || !!editing.value);
const loadError = ref("");
const saveError = ref("");
const formSnapshot = () => JSON.stringify(form);
const { markClean, allowNextLeave } = useDirtyGuard(formSnapshot, () => t("discardChanges", store.lang), () => saving.value);
const canSave = computed(() =>
  formReady.value && !!form.text.trim() && form.lat != null && form.lng != null && !saving.value
);

function hydrate(address) {
  Object.assign(form, {
    id: address.id,
    tag: address.label || t("tagHome", store.lang),
    text: address.line || "",
    lat: address.lat ?? null,
    lng: address.lng ?? null,
    city: address.city || "",
    street: address.street || "",
    house: address.house || "",
    apartment: address.apartment || "",
    entrance: address.entrance || "",
    floor: address.floor || "",
    intercom: address.intercom || "",
    comment: address.comment || "",
    precision: address.precision || "",
  });
  formReady.value = true;
  loadError.value = "";
  markClean();
}

async function loadEditing() {
  if (isNew.value) {
    formReady.value = true;
    markClean();
    return;
  }
  loadError.value = "";
  formReady.value = false;
  let address = editing.value;
  if (!address) {
    const loaded = await loadAddresses();
    if (!loaded) {
      loadError.value = t("addressLoadFailed", store.lang);
      return;
    }
    address = editing.value;
  }
  if (!address) {
    loadError.value = t("addressLoadFailed", store.lang);
    return;
  }
  hydrate(address);
}

// While the map overlay is open, the Telegram back button should close it,
// not pop the whole screen. Restore the normal handler when it closes.
watch(openPicker, (open) => {
  if (open) showBackButton(() => { openPicker.value = false; });
  else showBackButton(() => router.back());
});

function onPicked(p) {
  form.lat = p.lat;
  form.lng = p.lng;
  form.city = p.city || form.city;
  form.street = p.street || "";
  form.house = p.house || "";
  form.precision = p.precision || "";
  // prefer street + house, else the full formatted line, else the raw coordinates
  const line = [p.street, p.house].filter(Boolean).join(" ");
  const coordText = p.lat != null ? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` : "";
  form.text = line || p.formatted || form.text || coordText;
  openPicker.value = false;
}

async function save() {
  if (!canSave.value) return;
  saving.value = true;
  saveError.value = "";
  try {
    await saveAddress({ ...form });
    markClean();
    const target = typeof route.query.return === "string" ? route.query.return : "";
    allowNextLeave();
    if (target.startsWith("/") && !target.startsWith("//")) await router.replace(target);
    else router.back();
  } catch {
    saveError.value = t("addressSaveFailed", store.lang);
  } finally {
    saving.value = false;
  }
}

onMounted(() => { void loadEditing(); });
</script>

<style scoped>
.loc-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 12px; margin-top: 8px; }
.loc-empty { height: 150px; border-radius: 16px; background: var(--surface-2); display: grid; place-items: center; color: var(--text-faint); }
.loc-pick { width: 100%; margin-top: 12px; height: 48px; border-radius: 14px; background: var(--surface-2); color: var(--accent); font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.loc-precise { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 11.5px; font-weight: 800; color: #e0a02a; }
.loc-precise.ok { color: #1fb87a; }
.loc-precise .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

.gt2 { display: block; font-size: 11.5px; font-weight: 800; color: var(--text-faint); text-transform: uppercase; letter-spacing: .5px; margin: 22px 4px 10px; }
.gt2 .opt { text-transform: none; color: var(--text-faint); font-weight: 700; }
.fld { width: 100%; height: 52px; border-radius: 14px; background: var(--surface); border: 1.5px solid var(--hairline); padding: 0 14px; color: var(--text); font-weight: 700; font-size: 14px; outline: none; }
.fld:focus { border-color: var(--accent); }

.tagrow { display: flex; gap: 8px; margin-bottom: 10px; }
.tagchip { flex: 1; height: 44px; border-radius: 13px; background: var(--surface); border: 1.5px solid var(--hairline); font-weight: 800; font-size: 13px; color: var(--text-dim); }
.tagchip.on { background: color-mix(in srgb, var(--accent) 14%, transparent); border-color: var(--accent); color: var(--accent); }

.grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
.mini { display: flex; flex-direction: column; gap: 6px; }
.mini span { font-size: 11px; font-weight: 800; color: var(--text-dim); margin-left: 2px; }
.mini input { width: 100%; height: 48px; border-radius: 13px; background: var(--surface); border: 1.5px solid var(--hairline); padding: 0 10px; color: var(--text); font-weight: 700; font-size: 14px; outline: none; text-align: center; }
.mini input:focus { border-color: var(--accent); }

.hint { display: flex; align-items: center; gap: 6px; margin-top: 14px; font-size: 12px; font-weight: 700; color: var(--text-faint); }
.address-state { display: grid; min-height: 55vh; place-content: center; justify-items: center; gap: 12px; padding: 28px; color: var(--text-dim); text-align: center; }
.address-state.error { color: #ef5b6e; }
.address-state .loc-pick { min-width: 180px; padding: 0 18px; }
.form-error { display: flex; align-items: center; gap: 7px; margin-top: 14px; color: #ef5b6e; font-size: 12px; font-weight: 750; }
.spinner-sm { width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid var(--hairline); border-top-color: var(--accent); animation: pspin .8s linear infinite; }
@keyframes pspin { to { transform: rotate(360deg); } }
.cta:disabled { opacity: .5; }
@media (prefers-reduced-motion: reduce) { .spinner-sm { animation: none; } }
</style>
