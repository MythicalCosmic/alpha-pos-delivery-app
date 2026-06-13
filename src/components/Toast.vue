<template>
  <Transition name="toast">
    <div v-if="store.toast" class="toast"><Icon name="check" /> {{ store.toast }}</div>
  </Transition>
</template>

<script setup>
import Icon from "./Icon.js";
import { store } from "../store.js";
</script>

<style>
.toast-leave-active { transition: opacity .25s ease, transform .25s ease; }
.toast-leave-to { opacity: 0; transform: translate(-50%, 14px); }
</style>
