<template>
  <div class="status-screen">
    <div class="status-card">
      <div :class="['status-ic', tone]">
        <span v-if="spinner" class="spinner"></span>
        <Icon v-else :name="icon" :size="34" />
      </div>
      <h2 v-if="title">{{ title }}</h2>
      <p v-if="sub">{{ sub }}</p>
      <button v-if="action" class="status-btn press" @click="$emit('action')">
        <Icon v-if="actionIcon" :name="actionIcon" :size="18" /> {{ action }}
      </button>
    </div>
  </div>
</template>

<script setup>
import Icon from "./Icon.js";

defineProps({
  icon: { type: String, default: "info" },
  title: { type: String, default: "" },
  sub: { type: String, default: "" },
  action: { type: String, default: "" },
  actionIcon: { type: String, default: "" },
  tone: { type: String, default: "" },     // "" | warn | bad
  spinner: { type: Boolean, default: false },
});
defineEmits(["action"]);
</script>

<style scoped>
.status-screen { min-height: 100%; display: grid; place-items: center; padding: 40px 24px; }
.status-card { display: flex; flex-direction: column; align-items: center; text-align: center; max-width: 320px; }
.status-ic { width: 84px; height: 84px; border-radius: 28px; display: grid; place-items: center; background: var(--surface); border: 1px solid var(--hairline); color: var(--accent); margin-bottom: 20px; }
.status-ic.warn { color: #e0a02a; }
.status-ic.bad { color: #ef5b6e; }
.status-card h2 { font-family: var(--font-display); font-weight: 700; font-size: 21px; margin: 0 0 8px; color: var(--text); }
.status-card p { font-size: 13.5px; font-weight: 600; color: var(--text-dim); line-height: 1.5; margin: 0 0 22px; }
.status-btn { height: 52px; padding: 0 26px; border-radius: 16px; background: var(--accent); color: var(--on-accent); font-weight: 800; font-size: 14.5px; display: inline-flex; align-items: center; gap: 8px; box-shadow: var(--shadow-accent); }
.spinner { width: 30px; height: 30px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--accent) 25%, transparent); border-top-color: var(--accent); animation: status-spin .8s linear infinite; }
@keyframes status-spin { to { transform: rotate(360deg); } }
</style>
