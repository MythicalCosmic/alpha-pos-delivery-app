<template>
  <div class="stepper">
    <button class="press" @click="$emit('dec')"><Icon name="minus" /></button>
    <span class="q">{{ q }}</span>
    <button class="acc press" @click="$emit('inc')"><Icon name="plus" /></button>
  </div>
</template>

<script setup>
import Icon from "./Icon.js";
defineProps({ q: Number });
defineEmits(["dec", "inc"]);
</script>
