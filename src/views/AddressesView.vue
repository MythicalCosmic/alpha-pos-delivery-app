<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('addresses', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">

      <div v-if="store.addressesLoading && !store.addresses.length" class="empty" style="margin-top:40px"><span class="spinner"></span></div>

      <div v-else-if="store.addresses.length === 0" class="empty">
        <div class="ei"><Icon name="pin" /></div><h3>{{ t("addrEmpty", store.lang) }}</h3>
      </div>

      <div v-else class="stack" style="margin-top:6px">
        <div v-for="a in store.addresses" :key="a.id" class="addr-row press" @click="choose(a.id)">
          <span :class="['radio', { on: a.id === store.selectedAddressId }]"></span>
          <span class="li2"><Icon name="pin" :size="20" /></span>
          <span class="lt">
            <span class="a">{{ a.label || t("tagHome", store.lang) }} <em v-if="a.precision === 'exact'" class="exact">• {{ t("precise", store.lang) }}</em></span>
            <span class="b">{{ a.line }}</span>
            <span v-if="detailLine(a)" class="c">{{ detailLine(a) }}</span>
          </span>
          <button class="edit press" @click.stop="router.push(`/address/edit/${a.id}`)"><Icon name="edit" :size="18" /></button>
          <button class="del press" @click.stop="remove(a.id)"><Icon name="trash" :size="18" /></button>
        </div>
      </div>

      <button class="addbtn press" @click="router.push('/address/edit')">
        <Icon name="plus" :size="20" /> {{ t("addAddress", store.lang) }}
      </button>

      <div style="height:24px"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import { store, selectAddress, removeAddress, loadAddresses } from "../store.js";
import { t } from "../data/strings.js";

const router = useRouter();

function choose(id) { selectAddress(id); }
async function remove(id) { try { await removeAddress(id); } catch { /* ignore */ } }

function detailLine(a) {
  const parts = [];
  if (a.apartment) parts.push(`${t("apartment", store.lang)} ${a.apartment}`);
  if (a.entrance) parts.push(`${t("entrance", store.lang)} ${a.entrance}`);
  if (a.floor) parts.push(`${t("floor", store.lang)} ${a.floor}`);
  return parts.join(" · ");
}

onMounted(() => loadAddresses());
</script>

<style scoped>
.addr-row { display: flex; align-items: center; gap: 13px; padding: 15px 16px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-sm); }
.addr-row .li2 { width: 40px; height: 40px; border-radius: 13px; display: grid; place-items: center; background: var(--surface-2); color: var(--accent-2); flex: none; }
.addr-row .lt { flex: 1; min-width: 0; }
.addr-row .lt .a { font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 6px; }
.addr-row .lt .a .exact { font-style: normal; font-size: 10.5px; font-weight: 800; color: #1fb87a; }
.addr-row .lt .b { font-size: 11.5px; color: var(--text-dim); font-weight: 600; margin-top: 2px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.addr-row .lt .c { font-size: 11px; color: var(--text-faint); font-weight: 700; margin-top: 3px; display: block; }
.addr-row .edit { color: var(--accent-2); flex: none; }
.addr-row .del { color: var(--text-faint); flex: none; }
.addbtn { width: 100%; margin-top: 14px; height: 54px; border-radius: 16px; border: 1.5px dashed var(--hairline-strong); display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; font-size: 14px; color: var(--accent); }
.spinner { width: 28px; height: 28px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--accent) 25%, transparent); border-top-color: var(--accent); animation: aspin .8s linear infinite; }
@keyframes aspin { to { transform: rotate(360deg); } }
</style>
