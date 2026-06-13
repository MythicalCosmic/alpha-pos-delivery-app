<template>
  <teleport to="body">
    <div class="mp-overlay">
      <!-- top bar: close + search -->
      <div class="mp-top">
        <button class="mp-x press" @click="$emit('close')"><Icon name="back" /></button>
        <div class="mp-search">
          <Icon name="search" :size="18" />
          <input
            v-model="query"
            :placeholder="t('searchAddress', lang)"
            enterkeyhint="search"
            @keyup.enter="doSearch"
          />
          <button v-if="query.trim()" class="mp-go press" @click="doSearch">{{ t("searchBtn", lang) }}</button>
        </div>
      </div>

      <!-- the map -->
      <div ref="mapEl" class="mp-map"></div>

      <!-- helper hint -->
      <div v-if="!loadError" class="mp-hint">{{ t("tapHint", lang) }}</div>

      <!-- fixed center pin (the map moves under it; a click also drops it) -->
      <div v-if="!loadError" class="mp-pin" :class="{ lifted: dragging }">
        <Icon name="pin" :size="46" />
        <span class="mp-shadow"></span>
      </div>

      <!-- locate-me -->
      <button v-if="!loadError" class="mp-locate press" :class="{ busy: locating }" :disabled="locating" @click="locateMe">
        <Icon name="target" :size="22" />
      </button>

      <!-- bottom sheet -->
      <div class="mp-sheet">
        <template v-if="loadError">
          <div class="mp-errbox"><Icon name="pin" :size="20" /> {{ t("mapError", lang) }}</div>
          <button class="mp-confirm press" @click="$emit('close')">{{ t("back", lang) }}</button>
        </template>
        <template v-else>
          <div class="mp-row">
            <span class="mp-badge" :class="badgeClass"><span class="dot"></span>{{ badgeLabel }}</span>
            <span v-if="status" class="mp-status">{{ status }}</span>
          </div>
          <div class="mp-addr">{{ display || (resolving ? t("locating", lang) : t("moveMap", lang)) }}</div>
          <button class="mp-confirm press" :disabled="!canConfirm" @click="confirm">
            {{ t("confirmLoc", lang) }}
          </button>
        </template>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Icon from "./Icon.js";
import { store } from "../store.js";
import { t } from "../data/strings.js";
import { loadYmaps, reverseGeocode, forwardGeocode } from "../maps.js";
import { requestLocation, haptic } from "../telegram.js";
import { DEFAULT_CENTER, DEFAULT_ZOOM, GEO_BOUNDS } from "../config.js";

const props = defineProps({
  initial: { type: Object, default: null }, // { lat, lng }
});
const emit = defineEmits(["close", "confirm"]);

const lang = computed(() => store.lang);
const mapEl = ref(null);
let map = null;
let revTimer = null;
let destroyed = false;

const dragging = ref(false);
const resolving = ref(false);
const locating = ref(false);
const loadError = ref(false);
const status = ref("");
const query = ref("");
const picked = ref(null);   // { lat, lng } — the chosen point (always set once map is ready)
const address = ref(null);  // resolved address (may be partial/empty)

const display = computed(() => {
  const a = address.value;
  const line = a ? ([a.street, a.house].filter(Boolean).join(" ") || a.formatted) : "";
  if (line) return line;
  if (picked.value) return `${picked.value.lat.toFixed(5)}, ${picked.value.lng.toFixed(5)}`;
  return "";
});
const isExact = computed(() => address.value && address.value.precision === "exact");
const badgeClass = computed(() => (isExact.value ? "ok" : "warn"));
const badgeLabel = computed(() => (isExact.value ? t("precise", lang.value) : t("approximate", lang.value)));
// Confirm is enabled as soon as a point is chosen — the address can keep resolving.
const canConfirm = computed(() => !!picked.value);

// Set the chosen point immediately, then reverse-geocode it (debounced).
function geocodeAt(coords) {
  picked.value = { lat: coords[0], lng: coords[1] };
  status.value = "";
  clearTimeout(revTimer);
  resolving.value = true;
  revTimer = setTimeout(() => runReverse(coords), 300);
}

async function runReverse(coords) {
  if (destroyed) return;
  try {
    const p = await reverseGeocode(coords, lang.value);
    if (!destroyed) address.value = p;
  } catch (e) {
    if (!destroyed) address.value = null;
  } finally {
    if (!destroyed) resolving.value = false;
  }
}

async function locateMe() {
  status.value = "";
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    status.value = t("needsHttps", lang.value);
    return;
  }
  locating.value = true;
  try {
    const loc = await requestLocation();
    if (map && loc) {
      map.setCenter([loc.lat, loc.lng], Math.max(map.getZoom(), 17), { duration: 300 });
      geocodeAt([loc.lat, loc.lng]);
      haptic("light");
    }
  } catch (e) {
    status.value = t("locFail", lang.value);
    console.warn("[maps] locate failed:", e?.message || e);
  } finally {
    locating.value = false;
  }
}

async function doSearch() {
  const q = query.value.trim();
  if (!q || !map) return;
  status.value = "";
  try {
    const p = await forwardGeocode(q, lang.value, { boundedBy: GEO_BOUNDS });
    if (p && p.lat != null) {
      map.setCenter([p.lat, p.lng], 17, { duration: 300 });
      geocodeAt([p.lat, p.lng]);
    } else {
      status.value = t("locFail", lang.value);
    }
  } catch (e) {
    status.value = t("locFail", lang.value);
  }
}

function confirm() {
  if (!canConfirm.value) return;
  const a = address.value || {};
  haptic("success");
  emit("confirm", {
    lat: picked.value.lat,
    lng: picked.value.lng,
    city: a.city || "",
    street: a.street || "",
    house: a.house || "",
    formatted: a.formatted || "",
    precision: a.precision || "",
  });
}

onMounted(async () => {
  try {
    const ymaps = await loadYmaps(lang.value);
    if (destroyed) return;
    const center = props.initial && props.initial.lat != null
      ? [props.initial.lat, props.initial.lng]
      : DEFAULT_CENTER;
    map = new ymaps.Map(
      mapEl.value,
      { center, zoom: DEFAULT_ZOOM, controls: ["zoomControl"] },
      { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true }
    );
    // click a building to drop the pin there
    map.events.add("click", (e) => {
      const coords = e.get("coords");
      if (coords) { map.panTo(coords, { duration: 200 }); geocodeAt(coords); }
    });
    // pan/zoom updates the pinned point to the new map centre
    map.events.add("actionbegin", () => { dragging.value = true; });
    map.events.add("actionend", () => { dragging.value = false; geocodeAt(map.getCenter()); });
    // initial resolve
    geocodeAt(center);
  } catch (e) {
    loadError.value = true;
    console.warn("[maps] map failed to load:", e?.message || e);
  }
});

onBeforeUnmount(() => {
  destroyed = true;
  clearTimeout(revTimer);
  if (map) { try { map.destroy(); } catch (e) { /* ignore */ } map = null; }
});
</script>

<style scoped>
.mp-overlay { position: fixed; inset: 0; z-index: 4000; background: var(--bg, #0a0818); display: flex; flex-direction: column; }
.mp-map { position: absolute; inset: 0; width: 100%; height: 100%; }

.mp-top { position: absolute; top: 0; left: 0; right: 0; z-index: 10; display: flex; gap: 10px; padding: calc(env(safe-area-inset-top, 0px) + 12px) 14px 12px; }
.mp-x { width: 44px; height: 44px; flex: none; border-radius: 14px; background: var(--surface); color: var(--text); display: grid; place-items: center; box-shadow: 0 6px 20px rgba(0,0,0,.25); }
.mp-search { flex: 1; display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px; border-radius: 14px; background: var(--surface); color: var(--text-faint); box-shadow: 0 6px 20px rgba(0,0,0,.25); }
.mp-search input { flex: 1; min-width: 0; background: none; border: none; outline: none; color: var(--text); font-weight: 700; font-size: 14px; }
.mp-go { flex: none; font-weight: 800; font-size: 12.5px; color: var(--accent); padding: 0 4px; }

.mp-hint { position: absolute; left: 50%; top: 50%; transform: translate(-50%, 26px); z-index: 7; background: rgba(0,0,0,.55); color: #fff; font-size: 11.5px; font-weight: 700; padding: 5px 11px; border-radius: 999px; pointer-events: none; white-space: nowrap; }

/* center pin sits exactly over the map's center */
.mp-pin { position: absolute; left: 50%; top: 50%; z-index: 8; transform: translate(-50%, -100%); color: var(--accent); pointer-events: none; transition: transform .18s ease; filter: drop-shadow(0 6px 6px rgba(0,0,0,.35)); }
.mp-pin.lifted { transform: translate(-50%, -118%); }
.mp-shadow { position: absolute; left: 50%; bottom: -6px; transform: translateX(-50%); width: 14px; height: 5px; border-radius: 50%; background: rgba(0,0,0,.35); filter: blur(1px); }

.mp-locate { position: absolute; right: 16px; bottom: 188px; z-index: 9; width: 48px; height: 48px; border-radius: 16px; background: var(--surface); color: var(--accent); display: grid; place-items: center; box-shadow: 0 8px 24px rgba(0,0,0,.3); }
.mp-locate.busy { opacity: .6; }
.mp-locate:disabled { opacity: .55; }

.mp-sheet { position: absolute; left: 0; right: 0; bottom: 0; z-index: 10; background: var(--surface); border-radius: 24px 24px 0 0; padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px); box-shadow: 0 -10px 30px rgba(0,0,0,.25); }
.mp-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.mp-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; padding: 5px 10px; border-radius: 999px; }
.mp-badge .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.mp-badge.ok { color: #1fb87a; background: color-mix(in srgb, #1fb87a 16%, transparent); }
.mp-badge.warn { color: #e0a02a; background: color-mix(in srgb, #e0a02a 16%, transparent); }
.mp-status { font-size: 11px; font-weight: 700; color: #e0a02a; text-align: right; }
.mp-addr { font-weight: 800; font-size: 16px; line-height: 1.3; color: var(--text); min-height: 21px; margin-bottom: 14px; }
.mp-confirm { width: 100%; height: 54px; border-radius: 16px; background: var(--accent); color: var(--on-accent); font-weight: 800; font-size: 15px; box-shadow: var(--shadow-accent); }
.mp-confirm:disabled { opacity: .5; }
.mp-errbox { display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-weight: 700; font-size: 13.5px; margin-bottom: 14px; }
</style>
