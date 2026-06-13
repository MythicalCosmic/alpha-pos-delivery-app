<template>
  <nav class="bottomnav">
    <button
      v-for="it in items"
      :key="it.id"
      :class="['navbtn', 'press', { active: activeTab === it.id }]"
      @click="go(it.path)"
    >
      <span class="dot"></span>
      <Icon :name="it.icon" :filled="it.id === 'fav' && activeTab === 'fav'" />
      <span>{{ t(it.key, store.lang) }}</span>
    </button>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Icon from "./Icon.js";
import { store } from "../store.js";
import { t } from "../data/strings.js";
import { haptic } from "../telegram.js";

const route = useRoute();
const router = useRouter();

const items = [
  { id: "home", icon: "home", key: "tHome", path: "/home" },
  { id: "cats", icon: "grid", key: "tCats", path: "/categories" },
  { id: "fav", icon: "heart", key: "tFav", path: "/favorites" },
  { id: "orders", icon: "receipt", key: "tOrders", path: "/orders" },
  { id: "settings", icon: "gear", key: "tSettings", path: "/settings" },
];

const activeTab = computed(() => route.meta.tab);

function go(path) {
  haptic("light");
  if (route.path !== path) router.push(path);
}
</script>
