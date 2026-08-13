<template>
  <div class="fcard press enter" @click="open">
    <div class="imgwrap">
      <img v-if="f.image_url" :src="f.image_url" :alt="foodName(f, store.lang)" loading="lazy" @error="imgFailed = true" v-show="!imgFailed" />
      <FoodArt v-if="!f.image_url || imgFailed" :kind="f.kind" :hue="f.hue" />
      <span v-if="f.tag" :class="['badge-tag', f.tag]">{{ tagLabel }}</span>
      <button :class="['fav', { on: fav }]" @click.stop="toggleFav(f)"><Icon name="heart" :filled="fav" /></button>
    </div>
    <div class="nm">{{ foodName(f, store.lang) }}</div>
    <div class="meta">
      <span v-if="f.kcal"><Icon name="fire" :size="13" style="vertical-align:-2px;margin-right:2px" />{{ f.kcal }} {{ t("kcal", store.lang) }}</span>
      <span v-else-if="catLabel">{{ catLabel }}</span>
    </div>
    <div class="priceline">
      <div class="price">{{ sum(f.price, store.lang) }}</div>
      <button class="add press" :disabled="!orderable" @click.stop="quickAdd(f)"><Icon name="plus" /></button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Icon from "./Icon.js";
import FoodArt from "./FoodArt.js";
import { store, isFav, toggleFav, quickAdd, isProductOrderable } from "../store.js";
import { foodName, sum } from "../data/foods.js";
import { t } from "../data/strings.js";

const props = defineProps({ f: { type: Object, required: true } });
const router = useRouter();
const imgFailed = ref(false);
const fav = computed(() => isFav(props.f.id));
const orderable = computed(() => isProductOrderable(props.f));
const catLabel = computed(() => {
  const c = store.categories.find((x) => x.id === props.f.categoryId);
  return c ? c.name : "";
});
const tagLabel = computed(() =>
  t(props.f.tag === "bestseller" ? "bestseller" : props.f.tag === "new" ? "newItem" : "spicy", store.lang)
);
function open() { router.push(`/food/${props.f.id}`); }
</script>

<style scoped>
.imgwrap img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.add:disabled { opacity: .4; }
</style>
