<template>
  <div class="frow press enter" @click="open">
    <div class="imgwrap">
      <FoodArt :kind="f.kind" :hue="f.hue" />
      <span v-if="f.tag" :class="['badge-tag', f.tag]">{{ tagLabel }}</span>
    </div>
    <div class="body">
      <div style="display:flex;justify-content:space-between;gap:8px">
        <div class="nm">{{ foodName(f, store.lang) }}</div>
      </div>
      <div class="ds">{{ foodDesc(f, store.lang) }}</div>
      <div class="meta">
        <span class="star"><Icon name="star" :size="13" filled /> {{ f.rating }}</span>
        <span class="dot" style="width:3px;height:3px;border-radius:50%;background:var(--text-faint)"></span>
        <span>{{ f.time }} {{ t("min", store.lang) }}</span>
        <span class="dot" style="width:3px;height:3px;border-radius:50%;background:var(--text-faint)"></span>
        <span>{{ f.kcal }} {{ t("kcal", store.lang) }}</span>
      </div>
      <div class="priceline">
        <div class="price">{{ sum(f.price, store.lang) }}</div>
        <button class="add press" @click.stop="quickAdd(f)"><Icon name="plus" /></button>
      </div>
    </div>
    <button :class="['fav', { on: fav }]" @click.stop="toggleFav(f.id)"><Icon name="heart" :filled="fav" /></button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "./Icon.js";
import FoodArt from "./FoodArt.js";
import { store, isFav, toggleFav, quickAdd } from "../store.js";
import { foodName, foodDesc, sum } from "../data/foods.js";
import { t } from "../data/strings.js";

const props = defineProps({ f: { type: Object, required: true } });
const router = useRouter();
const fav = computed(() => isFav(props.f.id));
const tagLabel = computed(() =>
  t(props.f.tag === "bestseller" ? "bestseller" : props.f.tag === "new" ? "newItem" : "spicy", store.lang)
);
function open() { router.push(`/food/${props.f.id}`); }
</script>
