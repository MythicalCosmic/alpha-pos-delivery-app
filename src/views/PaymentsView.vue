<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('payments', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">

      <div v-if="store.cards.length === 0" class="empty">
        <div class="ei"><Icon name="card" /></div><h3>{{ t("cardsEmpty", store.lang) }}</h3>
      </div>

      <div v-else class="stack" style="margin-top:6px">
        <div v-for="c in store.cards" :key="c.id" class="pay-row press" @click="setCardDefault(c.id)">
          <span class="cic"><Icon name="card" :size="20" /></span>
          <span class="lt">
            <span class="a">{{ c.brand }} •••• {{ c.last4 }}</span>
            <span class="b" v-if="c.default">{{ t("defaultLbl", store.lang) }}</span>
            <span class="b" v-else>{{ t("setDefault", store.lang) }}</span>
          </span>
          <span v-if="c.default" class="badge-def">{{ t("defaultLbl", store.lang) }}</span>
          <button class="del press" @click.stop="removeCard(c.id)"><Icon name="trash" :size="18" /></button>
        </div>
      </div>

      <!-- add form -->
      <div v-if="adding" class="addform">
        <input v-model="num" inputmode="numeric" maxlength="19" :placeholder="t('cardNumber', store.lang)" @input="formatNum" />
        <div class="row2">
          <input v-model="exp" inputmode="numeric" maxlength="5" :placeholder="t('expiry', store.lang) + ' MM/YY'" @input="formatExp" />
          <select v-model="brand">
            <option>UzCard</option><option>Humo</option><option>Visa</option><option>Mastercard</option>
          </select>
        </div>
        <div class="addform-acts">
          <button class="ghostbtn press" @click="cancel">{{ t("cancel", store.lang) }}</button>
          <button class="solidbtn press" :disabled="last4.length < 4" @click="confirm">{{ t("save", store.lang) }}</button>
        </div>
      </div>
      <button v-else class="addbtn press" @click="adding = true"><Icon name="plus" :size="20" /> {{ t("addCard", store.lang) }}</button>

      <div style="height:24px"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import TopBar from "../components/TopBar.vue";
import { store, setCardDefault, removeCard, addCard } from "../store.js";
import { t } from "../data/strings.js";

const router = useRouter();
const adding = ref(false);
const num = ref("");
const exp = ref("");
const brand = ref("UzCard");
const last4 = computed(() => num.value.replace(/\D/g, "").slice(-4));

function formatNum() {
  const digits = num.value.replace(/\D/g, "").slice(0, 16);
  num.value = digits.replace(/(.{4})/g, "$1 ").trim();
}
function formatExp() {
  const d = exp.value.replace(/\D/g, "").slice(0, 4);
  exp.value = d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}
function cancel() { adding.value = false; num.value = ""; exp.value = ""; brand.value = "UzCard"; }
function confirm() {
  if (last4.value.length < 4) return;
  addCard(brand.value, last4.value);
  cancel();
}
</script>

<style scoped>
.pay-row { display: flex; align-items: center; gap: 13px; padding: 15px 16px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-sm); }
.pay-row .cic { width: 40px; height: 40px; border-radius: 13px; display: grid; place-items: center; background: var(--surface-2); color: var(--accent-2); flex: none; }
.pay-row .lt { flex: 1; min-width: 0; }
.pay-row .lt .a { font-weight: 800; font-size: 14px; }
.pay-row .lt .b { font-size: 11.5px; color: var(--text-dim); font-weight: 700; margin-top: 2px; display: block; }
.badge-def { font-size: 10px; font-weight: 800; color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); padding: 4px 9px; border-radius: 999px; flex: none; }
.pay-row .del { color: var(--text-faint); flex: none; }
.addbtn { width: 100%; margin-top: 14px; height: 54px; border-radius: 16px; border: 1.5px dashed var(--hairline-strong); display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; font-size: 14px; color: var(--accent); }
.addform { margin-top: 14px; background: var(--surface); border: 1px solid var(--hairline); border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.addform input, .addform select { height: 50px; border-radius: 14px; background: var(--surface-2); border: 1.5px solid var(--hairline); padding: 0 14px; color: var(--text); font-weight: 700; font-size: 14px; outline: none; }
.addform input:focus, .addform select:focus { border-color: var(--accent); }
.row2 { display: flex; gap: 10px; }
.row2 input { flex: 1; min-width: 0; }
.row2 select { flex: none; width: 130px; }
.addform-acts { display: flex; gap: 10px; margin-top: 2px; }
.ghostbtn { flex: 1; height: 48px; border-radius: 14px; background: var(--surface-2); font-weight: 800; color: var(--text); }
.solidbtn { flex: 1; height: 48px; border-radius: 14px; background: var(--accent); color: var(--on-accent); font-weight: 800; box-shadow: var(--shadow-accent); }
.solidbtn:disabled { opacity: .5; }
</style>
