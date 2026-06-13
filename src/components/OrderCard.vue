<template>
  <div class="order-card enter">
    <div class="oh">
      <div><div class="oid">#{{ o.id }}</div><div class="od">{{ o.date }}</div></div>
      <span :class="['status', o.status]"><span class="d"></span>{{ t(statusKey, store.lang) }}</span>
    </div>
    <div v-if="o.status !== 'delivered'" class="track">
      <template v-for="i in 3" :key="i">
        <div :class="['node', { done: (i - 1) < step }]"><Icon v-if="(i - 1) < step" name="check" /></div>
        <div v-if="i < 3" :class="['bar', { done: (i - 1) < step - 1 }]"></div>
      </template>
    </div>
    <div class="order-prev">
      <div v-for="(f, i) in foods.slice(0, 4)" :key="i" class="av"><FoodArt :kind="f.kind" :hue="f.hue" /></div>
      <div v-if="foods.length > 4" class="more">+{{ foods.length - 4 }}</div>
    </div>
    <div class="order-foot">
      <div class="ot">{{ count }} {{ t("items", store.lang) }}<b>{{ sum(o.total, store.lang) }}</b></div>
      <button :class="['obtn', 'press', o.status === 'delivered' ? '' : 'ghost']" @click="act">
        {{ o.status === "delivered" ? t("reorder", store.lang) : t("trackOrder", store.lang) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "./Icon.js";
import FoodArt from "./FoodArt.js";
import { store, reorder } from "../store.js";
import { t } from "../data/strings.js";
import { FOODS, sum } from "../data/foods.js";

const props = defineProps({ o: { type: Object, required: true } });
const router = useRouter();

const foods = computed(() => props.o.items.map(it => FOODS.find(f => f.id === it.foodId)).filter(Boolean));
const count = computed(() => props.o.items.reduce((s, i) => s + i.qty, 0));
const statusKey = computed(() => ({ ontheway: "onTheWay", preparing: "preparing", delivered: "delivered" }[props.o.status]));
const step = computed(() => (props.o.status === "preparing" ? 1 : props.o.status === "ontheway" ? 2 : 3));

function act() {
  if (props.o.status === "delivered") { reorder(props.o); router.push("/cart"); }
  else router.push(`/tracking/${props.o.id}`);
}
</script>
