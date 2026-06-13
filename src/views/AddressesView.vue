<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('addresses', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">

      <div v-if="store.addresses.length === 0" class="empty">
        <div class="ei"><Icon name="pin" /></div><h3>{{ t("addrEmpty", store.lang) }}</h3>
      </div>

      <div v-else class="stack" style="margin-top:6px">
        <div v-for="a in store.addresses" :key="a.id" class="addr-row press" @click="selectAddress(a.id)">
          <span :class="['radio', { on: a.selected }]"></span>
          <span class="li2"><Icon name="pin" :size="20" /></span>
          <span class="lt">
            <span class="a">{{ a.tag }}</span>
            <span class="b">{{ a.text }}</span>
          </span>
          <button class="del press" @click.stop="removeAddress(a.id)"><Icon name="trash" :size="18" /></button>
        </div>
      </div>

      <!-- add form -->
      <div v-if="adding" class="addform">
        <input v-model="tag" :placeholder="t('addrLabel', store.lang)" />
        <input v-model="text" :placeholder="t('addrLine', store.lang)" />
        <div class="addform-acts">
          <button class="ghostbtn press" @click="cancel">{{ t("cancel", store.lang) }}</button>
          <button class="solidbtn press" :disabled="!text.trim()" @click="confirm">{{ t("save", store.lang) }}</button>
        </div>
      </div>
      <button v-else class="addbtn press" @click="adding = true"><Icon name="plus" :size="20" /> {{ t("addAddress", store.lang) }}</button>

      <div style="height:24px"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import { store, selectAddress, removeAddress, addAddress } from "../store.js";
import { t } from "../data/strings.js";

const router = useRouter();
const adding = ref(false);
const tag = ref("");
const text = ref("");

function cancel() { adding.value = false; tag.value = ""; text.value = ""; }
function confirm() {
  if (!text.value.trim()) return;
  addAddress(tag.value.trim(), text.value.trim());
  cancel();
}
</script>

<style scoped>
.addr-row { display: flex; align-items: center; gap: 13px; padding: 15px 16px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-sm); }
.addr-row .li2 { width: 40px; height: 40px; border-radius: 13px; display: grid; place-items: center; background: var(--surface-2); color: var(--accent-2); flex: none; }
.addr-row .lt { flex: 1; min-width: 0; }
.addr-row .lt .a { font-weight: 800; font-size: 14px; }
.addr-row .lt .b { font-size: 11.5px; color: var(--text-dim); font-weight: 600; margin-top: 2px; display: block; }
.addr-row .del { color: var(--text-faint); flex: none; }
.addbtn { width: 100%; margin-top: 14px; height: 54px; border-radius: 16px; border: 1.5px dashed var(--hairline-strong); display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; font-size: 14px; color: var(--accent); }
.addform { margin-top: 14px; background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.addform input { height: 50px; border-radius: 14px; background: var(--surface-2); border: 1.5px solid var(--hairline); padding: 0 14px; color: var(--text); font-weight: 700; font-size: 14px; outline: none; }
.addform input:focus { border-color: var(--accent); }
.addform-acts { display: flex; gap: 10px; margin-top: 2px; }
.ghostbtn { flex: 1; height: 48px; border-radius: 14px; background: var(--surface-2); font-weight: 800; color: var(--text); }
.solidbtn { flex: 1; height: 48px; border-radius: 14px; background: var(--accent); color: var(--on-accent); font-weight: 800; box-shadow: var(--shadow-accent); }
.solidbtn:disabled { opacity: .5; }
</style>
