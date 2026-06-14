<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t(isNew ? 'newAddress' : 'editAddress', store.lang)" @back="router.back()" />

    <div class="px" style="padding-top:6px">
      <!-- location card -->
      <div class="loc-card">
        <MiniMap v-if="form.lat != null" :lat="form.lat" :lng="form.lng" :height="150" />
        <div v-else class="loc-empty"><Icon name="pin" :size="26" /></div>

        <button class="loc-pick press" @click="openPicker = true">
          <Icon name="target" :size="18" />
          {{ form.lat != null ? t("editPin", store.lang) : t("chooseOnMap", store.lang) }}
        </button>
        <div v-if="form.lat != null" class="loc-precise" :class="{ ok: form.precision === 'exact' }">
          <span class="dot"></span>{{ form.precision === "exact" ? t("precise", store.lang) : t("approximate", store.lang) }}
        </div>
      </div>

      <!-- tag -->
      <div class="gt2">{{ t("addrLabel", store.lang) }}</div>
      <div class="tagrow">
        <button v-for="opt in tagOpts" :key="opt.v" :class="['tagchip', 'press', { on: form.tag === opt.v }]" @click="form.tag = opt.v">{{ opt.label }}</button>
      </div>
      <input v-if="isCustomTag" v-model="form.tag" class="fld" :placeholder="t('addrLabel', store.lang)" />

      <!-- full address -->
      <div class="gt2">{{ t("fullAddress", store.lang) }}</div>
      <input v-model="form.text" class="fld" :placeholder="t('addrLine', store.lang)" />

      <!-- entry details -->
      <div class="gt2">{{ t("addrDetails", store.lang) }} · <span class="opt">{{ t("optional", store.lang) }}</span></div>
      <div class="grid4">
        <label class="mini"><span>{{ t("apartment", store.lang) }}</span><input v-model="form.apartment" inputmode="numeric" /></label>
        <label class="mini"><span>{{ t("entrance", store.lang) }}</span><input v-model="form.entrance" inputmode="numeric" /></label>
        <label class="mini"><span>{{ t("floor", store.lang) }}</span><input v-model="form.floor" inputmode="numeric" /></label>
        <label class="mini"><span>{{ t("intercom", store.lang) }}</span><input v-model="form.intercom" inputmode="numeric" /></label>
      </div>

      <div class="gt2">{{ t("addrComment", store.lang) }}</div>
      <input v-model="form.comment" class="fld" :placeholder="t('addrCommentPh', store.lang)" />

      <div v-if="form.lat == null" class="hint"><Icon name="pin" :size="14" /> {{ t("setPinFirst", store.lang) }}</div>
      <div style="height:110px"></div>
    </div>

    <div class="actionbar">
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
import { showBackButton } from "../telegram.js";

const route = useRoute();
const router = useRouter();

const editing = computed(() => store.addresses.find(a => String(a.id) === String(route.params.id)) || null);
const isNew = computed(() => !editing.value);

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
const canSave = computed(() => !!form.text.trim() && !saving.value);

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
  if (!form.text.trim() || saving.value) return;
  saving.value = true;
  try {
    await saveAddress({ ...form });
    router.back();
  } catch (e) {
    saving.value = false;
  }
}

onMounted(() => { if (!store.addresses.length) loadAddresses(); });
</script>

<style scoped>
.loc-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 12px; margin-top: 8px; }
.loc-empty { height: 150px; border-radius: 16px; background: var(--surface-2); display: grid; place-items: center; color: var(--text-faint); }
.loc-pick { width: 100%; margin-top: 12px; height: 48px; border-radius: 14px; background: var(--surface-2); color: var(--accent); font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.loc-precise { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 11.5px; font-weight: 800; color: #e0a02a; }
.loc-precise.ok { color: #1fb87a; }
.loc-precise .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

.gt2 { font-size: 11.5px; font-weight: 800; color: var(--text-faint); text-transform: uppercase; letter-spacing: .5px; margin: 22px 4px 10px; }
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
.cta:disabled { opacity: .5; }
</style>
