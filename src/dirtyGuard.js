import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { tg } from "./telegram.js";

/**
 * Protect an edited form from browser, Telegram, and in-app navigation.
 * Call markClean after loading server data and immediately before navigating
 * away following a successful save.
 */
export function useDirtyGuard(snapshot, message, isLocked = () => false) {
  const cleanSnapshot = ref(snapshot());
  const dirty = computed(() => snapshot() !== cleanSnapshot.value);
  const closingProtected = computed(() => dirty.value || isLocked());
  const allowNextNavigation = ref(false);

  function markClean() {
    cleanSnapshot.value = snapshot();
  }

  function allowNextLeave() {
    allowNextNavigation.value = true;
  }

  function shouldLeave() {
    if (isLocked()) return false;
    return !dirty.value || window.confirm(message());
  }

  function beforeUnload(event) {
    if (!closingProtected.value) return;
    event.preventDefault();
    event.returnValue = "";
  }

  function syncTelegramClosingConfirmation(enabled) {
    if (!tg) return;
    try {
      if (enabled && typeof tg.enableClosingConfirmation === "function") {
        tg.enableClosingConfirmation();
      } else if (!enabled && typeof tg.disableClosingConfirmation === "function") {
        tg.disableClosingConfirmation();
      }
    } catch { /* older Telegram clients */ }
  }

  watch(closingProtected, syncTelegramClosingConfirmation, { immediate: true });

  onBeforeRouteLeave(() => {
    if (allowNextNavigation.value) {
      allowNextNavigation.value = false;
      return true;
    }
    return shouldLeave();
  });
  onMounted(() => window.addEventListener("beforeunload", beforeUnload));
  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", beforeUnload);
    syncTelegramClosingConfirmation(false);
  });

  return { dirty, markClean, allowNextLeave, shouldLeave };
}
