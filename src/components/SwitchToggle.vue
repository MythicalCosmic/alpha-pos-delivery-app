<template>
  <button :class="['switch', { on }]" @click="$emit('toggle')"><i></i></button>
</template>

<script setup>
defineProps({ on: Boolean });
defineEmits(["toggle"]);
</script>
