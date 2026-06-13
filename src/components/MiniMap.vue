<template>
  <div ref="el" class="mini-map" :style="{ height: height + 'px' }">
    <div v-if="failed" class="mini-fallback"><Icon name="pin" :size="22" /></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import Icon from "./Icon.js";
import { store } from "../store.js";
import { loadYmaps } from "../maps.js";

const props = defineProps({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  height: { type: Number, default: 120 },
  zoom: { type: Number, default: 16 },
});

const el = ref(null);
const failed = ref(false);
let map = null;
let placemark = null;
let destroyed = false;

async function build() {
  if (props.lat == null || props.lng == null) return;
  try {
    const ymaps = await loadYmaps(store.lang);
    if (destroyed || !el.value) return;
    if (!map) {
      map = new ymaps.Map(
        el.value,
        { center: [props.lat, props.lng], zoom: props.zoom, controls: [] },
        { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true }
      );
      // read-only preview
      map.behaviors.disable(["drag", "scrollZoom", "dblClickZoom", "multiTouch"]);
      placemark = new ymaps.Placemark([props.lat, props.lng], {}, { preset: "islands#redDotIcon" });
      map.geoObjects.add(placemark);
    }
  } catch (e) {
    failed.value = true;
  }
}

function update() {
  if (!map) { build(); return; }
  if (props.lat == null || props.lng == null) return;
  map.setCenter([props.lat, props.lng], props.zoom);
  if (placemark) placemark.geometry.setCoordinates([props.lat, props.lng]);
}

onMounted(build);
watch(() => [props.lat, props.lng], update);
onBeforeUnmount(() => {
  destroyed = true;
  if (map) { try { map.destroy(); } catch (e) { /* ignore */ } map = null; }
});
</script>

<style scoped>
.mini-map { width: 100%; border-radius: 16px; overflow: hidden; background: var(--surface-2); position: relative; }
.mini-fallback { position: absolute; inset: 0; display: grid; place-items: center; color: var(--text-faint); }
</style>
