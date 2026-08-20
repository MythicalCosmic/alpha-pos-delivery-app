<template>
  <div class="topbar">
    <button class="iconbtn press" type="button" :aria-label="t('back', store.lang)" @click="$emit('back')"><Icon name="back" /></button>
    <h1>{{ title }}</h1>
    <div style="width:42px;display:flex;justify-content:flex-end"><slot /></div>
  </div>
</template>

<script setup>
import Icon from "./Icon.js";
import { store } from "../store.js";
import { t } from "../data/strings.js";
defineProps({ title: String });
defineEmits(["back"]);
</script>
