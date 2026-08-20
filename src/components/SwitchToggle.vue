<template>
  <button type="button" role="switch" :class="['switch', { on }]" :aria-checked="on" :aria-label="ariaLabel" :disabled="disabled" @click="$emit('toggle')"><i></i></button>
</template>

<script setup>
defineProps({ on: Boolean, disabled: Boolean, ariaLabel: { type: String, default: undefined } });
defineEmits(["toggle"]);
</script>
