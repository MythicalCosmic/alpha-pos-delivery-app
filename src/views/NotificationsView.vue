<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('notifs', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">
      <div class="stack" style="margin-top:6px">
        <div v-for="r in rows" :key="r.key" class="lrow">
          <span class="li"><Icon :name="r.icon" :size="21" /></span>
          <span class="lt"><span class="a">{{ t(r.key, store.lang) }}</span><span class="b">{{ t(r.sub, store.lang) }}</span></span>
          <SwitchToggle :on="store.notif[r.id]" @toggle="setNotif(r.id, !store.notif[r.id])" />
        </div>
      </div>
      <div style="height:24px"></div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import SwitchToggle from "../components/SwitchToggle.vue";
import { store, setNotif } from "../store.js";
import { t } from "../data/strings.js";

const router = useRouter();
const rows = [
  { id: "orders", icon: "receipt", key: "notifOrders", sub: "notifOrdersS" },
  { id: "promos", icon: "gift", key: "notifPromos", sub: "notifPromosS" },
  { id: "news", icon: "bell", key: "notifNews", sub: "notifNewsS" },
  { id: "sound", icon: "chat", key: "notifSound", sub: "notifSoundS" },
];
</script>
