<template>
  <div class="sec-head">
    <h2>{{ title }}</h2>
    <button v-if="link" class="link press" @click="$emit('link')">{{ link }}</button>
  </div>
</template>

<script setup>
defineProps({ title: String, link: { type: String, default: "" } });
defineEmits(["link"]);
</script>
