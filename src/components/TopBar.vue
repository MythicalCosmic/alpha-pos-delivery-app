<template>
  <div class="topbar">
    <button class="iconbtn press" @click="$emit('back')"><Icon name="back" /></button>
    <h1>{{ title }}</h1>
    <div style="width:42px;display:flex;justify-content:flex-end"><slot /></div>
  </div>
</template>

<script setup>
import Icon from "./Icon.js";
defineProps({ title: String });
defineEmits(["back"]);
</script>
