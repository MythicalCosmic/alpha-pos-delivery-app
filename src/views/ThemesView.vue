<template>
  <div class="push-anim" style="min-height:100%">
    <TopBar :title="t('themes', store.lang)" @back="router.back()" />
    <div class="px" style="padding-top:6px">

      <!-- live preview -->
      <div class="preview">
        <div class="pv-art"><FoodArt kind="burger" :hue="22" /></div>
        <div class="pv-body">
          <div class="pv-nm">{{ t("promoTitle", store.lang).slice(0, 18) }}</div>
          <div class="pv-meta"><Icon name="star" :size="13" filled /> 4.9 · 20 {{ t("min", store.lang) }}</div>
          <div class="pv-row">
            <span class="pv-price">39 000 so‘m</span>
            <span class="pv-add"><Icon name="plus" /></span>
          </div>
        </div>
      </div>

      <!-- dark mode -->
      <div class="lrow" style="margin-top:18px">
        <span class="li"><Icon :name="theme === 'dark' ? 'moon' : 'sun'" :size="21" /></span>
        <span class="lt"><span class="a">{{ t("darkMode", store.lang) }}</span><span class="b">{{ theme === "dark" ? "On" : "Off" }}</span></span>
        <SwitchToggle :on="theme === 'dark'" @toggle="setTweak('dark', theme !== 'dark')" />
      </div>

      <!-- accent -->
      <div class="tweak">
        <div class="tlbl">{{ t("accent", store.lang) }}</div>
        <div class="swatches">
          <button v-for="c in accents" :key="c" :class="['swatch', { on: store.tweaks.accent === c }]" :style="{ background: c }" @click="setTweak('accent', c)">
            <Icon v-if="store.tweaks.accent === c" name="check" :size="16" />
          </button>
        </div>
      </div>

      <!-- home layout -->
      <div class="tweak">
        <div class="tlbl">{{ t("homeFeed", store.lang) }}</div>
        <div class="mini-seg">
          <button :class="{ on: store.tweaks.homeLayout === 'cozy' }" @click="setTweak('homeLayout', 'cozy')">{{ t("cozy", store.lang) }}</button>
          <button :class="{ on: store.tweaks.homeLayout === 'list' }" @click="setTweak('homeLayout', 'list')">{{ t("list", store.lang) }}</button>
        </div>
      </div>

      <!-- display font -->
      <div class="tweak">
        <div class="tlbl">{{ t("displayFont", store.lang) }}</div>
        <div class="mini-seg">
          <button v-for="f in fonts" :key="f" :class="{ on: store.tweaks.displayFont === f }" :style="{ fontFamily: `'${f}', sans-serif` }" @click="setTweak('displayFont', f)">{{ f.split(" ")[0] }}</button>
        </div>
      </div>

      <!-- card radius -->
      <div class="tweak">
        <div class="tlbl">{{ t("cardRadius", store.lang) }} <b>{{ store.tweaks.cardRadius }}px</b></div>
        <input class="slider" type="range" min="14" max="32" step="1" :value="store.tweaks.cardRadius" @input="setTweak('cardRadius', +$event.target.value)" />
      </div>
      <div style="height:24px"></div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import Icon from "../components/Icon.js";
import FoodArt from "../components/FoodArt.js";
import TopBar from "../components/TopBar.vue";
import SwitchToggle from "../components/SwitchToggle.vue";
import { store, setTweak, theme } from "../store.js";
import { t } from "../data/strings.js";

const router = useRouter();
const accents = ["#ff4d8d", "#ff6b35", "#23c483", "#7a5af5", "#f4a823"];
const fonts = ["Unbounded", "Space Grotesk", "Sora"];
</script>

<style scoped>
.preview { display: flex; gap: 14px; align-items: center; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-card); padding: 14px; }
.pv-art { width: 92px; height: 92px; border-radius: 20px; overflow: hidden; flex: none; }
.pv-body { flex: 1; min-width: 0; }
.pv-nm { font-family: var(--font-display); font-weight: 700; font-size: 16px; }
.pv-meta { display: inline-flex; align-items: center; gap: 4px; color: var(--star); font-weight: 800; font-size: 12px; margin-top: 6px; }
.pv-row { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.pv-price { font-family: var(--font-display); font-weight: 700; font-size: 15px; }
.pv-add { width: 36px; height: 36px; border-radius: 12px; background: var(--accent); color: var(--on-accent); display: grid; place-items: center; box-shadow: var(--shadow-accent); }
.pv-add svg { width: 20px; height: 20px; }

.tweak { margin-top: 18px; }
.tlbl { font-size: 12.5px; font-weight: 800; color: var(--text-dim); margin: 0 2px 10px; display: flex; justify-content: space-between; }
.tlbl b { color: var(--accent); font-family: var(--font-display); }
.swatches { display: flex; gap: 12px; }
.swatch { width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center; color: #fff; box-shadow: 0 8px 18px -8px rgba(0,0,0,.4); transition: transform .18s cubic-bezier(.34,1.56,.64,1); border: 2px solid transparent; }
.swatch.on { transform: scale(1.08); border-color: var(--text); }
.mini-seg { display: flex; gap: 8px; }
.mini-seg button { flex: 1; padding: 13px 0; border-radius: 14px; background: var(--surface); border: 1.5px solid var(--hairline); font-weight: 800; font-size: 13px; color: var(--text-dim); transition: .2s; }
.mini-seg button.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--text); }
.slider { -webkit-appearance: none; appearance: none; width: 100%; height: 7px; border-radius: 7px; background: var(--surface-3); outline: none; }
.slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; border-radius: 50%; background: var(--accent); box-shadow: 0 4px 10px -2px rgba(0,0,0,.4); cursor: pointer; border: 3px solid var(--surface); }
.slider::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; background: var(--accent); border: 3px solid var(--surface); cursor: pointer; }
</style>
