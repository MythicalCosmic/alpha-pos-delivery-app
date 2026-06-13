<template>
  <div class="screen-anim">
    <div class="page-head"><h1>{{ t("tFav", store.lang) }}</h1><div class="sub">{{ favs.length }} {{ t("items", store.lang) }}</div></div>
    <div v-if="favs.length === 0" class="empty">
      <div class="ei"><Icon name="heart" /></div>
      <h3>{{ t("favEmpty", store.lang) }}</h3>
      <p>{{ t("favEmptySub", store.lang) }}</p>
    </div>
    <div v-else class="flist" style="margin-top:14px">
      <FoodRow v-for="f in favs" :key="f.id" :f="f" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import Icon from "../components/Icon.js";
import FoodRow from "../components/FoodRow.vue";
import { store } from "../store.js";
import { t } from "../data/strings.js";
import { FOODS } from "../data/foods.js";

const favs = computed(() => FOODS.filter(f => store.favorites.includes(f.id)));
</script>
