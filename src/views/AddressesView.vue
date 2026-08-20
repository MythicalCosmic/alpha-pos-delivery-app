<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('addresses', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">

      <div v-if="(store.addressesLoading || (!store.addressesLoaded && !store.addressesError)) && !store.addresses.length" class="empty address-feedback" style="margin-top:40px" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <strong>{{ t("addressesLoading", store.lang) }}</strong>
      </div>

      <div v-else-if="store.addressesError && !store.addresses.length" class="empty address-feedback address-feedback--error" role="alert">
        <div class="ei"><Icon name="info" /></div>
        <h3>{{ t("addressesLoadFailed", store.lang) }}</h3>
        <button class="retry-btn press" type="button" :disabled="store.addressesLoading" @click="retryLoad">
          {{ t("tryAgain", store.lang) }}
        </button>
      </div>

      <div v-else-if="store.addressesLoaded && store.addresses.length === 0" class="empty">
        <div class="ei"><Icon name="pin" /></div><h3>{{ t("addrEmpty", store.lang) }}</h3>
      </div>

      <div v-else class="stack" style="margin-top:6px" role="radiogroup" :aria-label="t('addresses', store.lang)">
        <div v-if="store.addressesError" class="stale-warning" role="alert">
          <span><Icon name="info" :size="17" /> {{ t("addressesStale", store.lang) }}</span>
          <button class="press" type="button" :disabled="store.addressesLoading" @click="retryLoad">{{ t("tryAgain", store.lang) }}</button>
        </div>
        <div v-for="a in store.addresses" :key="a.id" class="addr-row" :class="{ 'is-busy': deletingId === a.id }" :aria-busy="deletingId === a.id">
          <button
            class="addr-select press"
            type="button"
            role="radio"
            :aria-checked="a.id === store.selectedAddressId"
            :aria-label="`${a.label || t('tagHome', store.lang)}: ${a.line}`"
            :disabled="deletingId === a.id"
            @click="choose(a.id)"
          >
            <span :class="['radio', { on: a.id === store.selectedAddressId }]"></span>
            <span class="li2"><Icon name="pin" :size="20" /></span>
            <span class="lt">
              <span class="a">{{ a.label || t("tagHome", store.lang) }} <em v-if="a.precision === 'exact'" class="exact">• {{ t("precise", store.lang) }}</em></span>
              <span class="b">{{ a.line }}</span>
              <span v-if="detailLine(a)" class="c">{{ detailLine(a) }}</span>
            </span>
          </button>
          <button class="edit press" type="button" :disabled="deletingId === a.id" :aria-label="`${t('editAddress', store.lang)}: ${a.label || a.line}`" @click.stop="router.push(`/address/edit/${a.id}`)"><Icon name="edit" :size="18" /></button>
          <button class="del press" type="button" :disabled="deletingId !== null" :aria-label="`${t('deleteAddress', store.lang)}: ${a.label || a.line}`" @click.stop="remove(a.id)">
            <span v-if="deletingId === a.id" class="spinner spinner--small" aria-hidden="true"></span>
            <Icon v-else name="trash" :size="18" />
          </button>
        </div>
        <div v-if="deleteError" class="delete-error" role="alert"><Icon name="info" :size="17" /> {{ deleteError }}</div>
      </div>

      <button v-if="store.addressesLoaded || store.addresses.length" class="addbtn press" type="button" :disabled="store.addressesLoading || deletingId !== null" @click="router.push('/address/edit')">
        <Icon name="plus" :size="20" /> {{ t("addAddress", store.lang) }}
      </button>

      <div style="height:24px"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import { store, selectAddress, removeAddress, loadAddresses } from "../store.js";
import { t } from "../data/strings.js";
import { confirmDialog, haptic } from "../telegram.js";

const router = useRouter();
const deletingId = ref(null);
const deleteError = ref("");

function choose(id) { selectAddress(id); }
async function remove(id) {
  if (deletingId.value !== null) return;
  const confirmed = await confirmDialog(t("deleteAddressConfirm", store.lang));
  if (!confirmed) return;
  deletingId.value = id;
  deleteError.value = "";
  try {
    await removeAddress(id);
  } catch {
    deleteError.value = t("addressDeleteFailed", store.lang);
    haptic("error");
  } finally {
    deletingId.value = null;
  }
}
function retryLoad() { void loadAddresses(); }

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
.addr-row { display: flex; align-items: center; gap: 4px; padding: 13px 10px 13px 14px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-sm); }
.addr-row.is-busy { opacity: .72; }
.addr-select { display: flex; min-width: 0; min-height: 44px; flex: 1; align-items: center; gap: 10px; color: inherit; text-align: left; }
.addr-row .li2 { width: 40px; height: 40px; border-radius: 13px; display: grid; place-items: center; background: var(--surface-2); color: var(--accent-2); flex: none; }
.addr-row .lt { flex: 1; min-width: 0; }
.addr-row .lt .a { font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 6px; }
.addr-row .lt .a .exact { font-style: normal; font-size: 10.5px; font-weight: 800; color: #1fb87a; }
.addr-row .lt .b { font-size: 11.5px; color: var(--text-dim); font-weight: 600; margin-top: 2px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.addr-row .lt .c { font-size: 11px; color: var(--text-faint); font-weight: 700; margin-top: 3px; display: block; }
.addr-row .edit, .addr-row .del { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; flex: none; }
.addr-row .edit { color: var(--accent-2); }
.addr-row .del { color: var(--text-faint); }
.addr-row button:disabled { opacity: .55; }
.delete-error { display: flex; min-height: 46px; align-items: center; gap: 8px; padding: 10px 13px; border: 1px solid color-mix(in srgb, #ef5b6e 28%, transparent); border-radius: 14px; background: color-mix(in srgb, #ef5b6e 10%, var(--surface)); color: #ef5b6e; font-size: 12px; line-height: 1.4; font-weight: 750; }
.addbtn { width: 100%; margin-top: 14px; height: 54px; border-radius: 16px; border: 1.5px dashed var(--hairline-strong); display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; font-size: 14px; color: var(--accent); }
.address-feedback { gap: 12px; }
.address-feedback strong { max-width: 290px; color: var(--text-dim); font-size: 13px; line-height: 1.45; }
.address-feedback--error .ei { color: #ef5b6e; }
.retry-btn { min-width: 150px; min-height: 46px; padding: 0 18px; border-radius: 13px; background: var(--surface-2); color: var(--accent); font-size: 13px; font-weight: 800; }
.stale-warning { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 11px 10px 13px; border: 1px solid color-mix(in srgb, #e0a02a 28%, transparent); border-radius: 14px; background: color-mix(in srgb, #e0a02a 10%, var(--surface)); color: #c78815; font-size: 11.5px; font-weight: 750; }
.stale-warning span { display: flex; align-items: center; gap: 7px; }
.stale-warning button { min-height: 40px; padding: 0 11px; border-radius: 11px; background: color-mix(in srgb, #e0a02a 15%, var(--surface)); color: currentColor; font-size: 11.5px; font-weight: 850; }
.addbtn:disabled, .retry-btn:disabled, .stale-warning button:disabled { opacity: .55; }
.spinner { width: 28px; height: 28px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--accent) 25%, transparent); border-top-color: var(--accent); animation: aspin .8s linear infinite; }
.spinner--small { width: 18px; height: 18px; border-width: 2px; }
@keyframes aspin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
</style>
