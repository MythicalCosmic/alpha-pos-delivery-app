<template>
  <div class="frow press enter" @click="open">
    <div class="imgwrap">
      <img v-if="f.image_url" :src="f.image_url" :alt="foodName(f, store.lang)" loading="lazy" @error="imgFailed = true" v-show="!imgFailed" />
      <FoodArt v-if="!f.image_url || imgFailed" :kind="f.kind" :hue="f.hue" />
      <span v-if="f.tag" :class="['badge-tag', f.tag]">{{ tagLabel }}</span>
    </div>
    <div class="body">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div class="nm">{{ foodName(f, store.lang) }}</div>
      </div>
      <div v-if="foodDesc(f, store.lang)" class="ds">{{ foodDesc(f, store.lang) }}</div>
      <div v-if="!orderable" class="meta unavailable-label">
        <span>{{ t("outOfStock", store.lang) }}</span>
      </div>
      <div v-else-if="f.kcal" class="meta">
        <span>{{ f.kcal }} {{ t("kcal", store.lang) }}</span>
      </div>
      <div class="priceline">
        <div class="price">{{ sum(f.price, store.lang) }}</div>
        <button class="add press" :disabled="!orderable" @click.stop="quickAdd(f)"><Icon name="plus" /></button>
      </div>
    </div>
    <button :class="['fav', { on: fav }]" @click.stop="toggleFav(f)"><Icon name="heart" :filled="fav" /></button>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Icon from "./Icon.js";
import FoodArt from "./FoodArt.js";
import { store, isFav, toggleFav, quickAdd, isProductOrderable } from "../store.js";
import { foodName, foodDesc, sum } from "../data/foods.js";
import { t } from "../data/strings.js";

const props = defineProps({ f: { type: Object, required: true } });
const router = useRouter();
const imgFailed = ref(false);
const fav = computed(() => isFav(props.f.id));
const orderable = computed(() => isProductOrderable(props.f));
const tagLabel = computed(() =>
  t(props.f.tag === "bestseller" ? "bestseller" : props.f.tag === "new" ? "newItem" : "spicy", store.lang)
);
function open() { router.push(`/food/${props.f.id}`); }
</script>

<style scoped>
.imgwrap img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.add:disabled { opacity: .4; }
.unavailable-label { color: #e0a02a; }
</style>
