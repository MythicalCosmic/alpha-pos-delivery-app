<template>
  <div class="fcard press enter" @click="open">
    <div class="imgwrap">
      <FoodArt :kind="f.kind" :hue="f.hue" />
      <span v-if="f.tag" :class="['badge-tag', f.tag]">{{ tagLabel }}</span>
      <button :class="['fav', { on: fav }]" @click.stop="toggleFav(f.id)"><Icon name="heart" :filled="fav" /></button>
    </div>
    <div class="nm">{{ foodName(f, store.lang) }}</div>
    <div class="meta">
      <span class="star"><Icon name="star" :size="13" filled /> {{ f.rating }}</span>
      <span class="dot"></span>
      <span><Icon name="clock" :size="13" style="vertical-align:-2px;margin-right:2px" />{{ f.time }} {{ t("min", store.lang) }}</span>
    </div>
    <div class="priceline">
      <div class="price">
        <small v-if="f.oldPrice">{{ sum(f.oldPrice, store.lang) }}</small>
        {{ sum(f.price, store.lang) }}
      </div>
      <button class="add press" @click.stop="quickAdd(f)"><Icon name="plus" /></button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "./Icon.js";
import FoodArt from "./FoodArt.js";
import { store, isFav, toggleFav, quickAdd } from "../store.js";
import { foodName, sum } from "../data/foods.js";
import { t } from "../data/strings.js";

const props = defineProps({ f: { type: Object, required: true } });
const router = useRouter();
const fav = computed(() => isFav(props.f.id));
const tagLabel = computed(() =>
  t(props.f.tag === "bestseller" ? "bestseller" : props.f.tag === "new" ? "newItem" : "spicy", store.lang)
);
function open() { router.push(`/food/${props.f.id}`); }
</script>
