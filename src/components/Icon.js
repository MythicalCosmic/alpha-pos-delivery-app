/* ===== Smart Food — icon set (render-function component) ===== */
import { h } from "vue";

const P = (d, extra) => h("path", { d, ...(extra || {}) });
const R = (x, y, w, hh, rx) => h("rect", { x, y, width: w, height: hh, rx });
const C = (cx, cy, r, extra) => h("circle", { cx, cy, r, ...(extra || {}) });

// Each icon: array of child vnodes. `sw` overrides default stroke width.
// `fillToggle: true` marks icons whose whole shape flips solid when `filled`.
const ICONS = {
  home: { c: () => [P("M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5")] },
  grid: { c: () => [R(3.5,3.5,7,7,2.2), R(13.5,3.5,7,7,2.2), R(3.5,13.5,7,7,2.2), R(13.5,13.5,7,7,2.2)] },
  heart: { fillToggle: true, c: () => [P("M12 20.5C5.5 16.2 3 12.6 3 9.1 3 6.3 5.1 4.3 7.7 4.3c1.7 0 3.2.9 4.3 2.4 1.1-1.5 2.6-2.4 4.3-2.4C18.9 4.3 21 6.3 21 9.1c0 3.5-2.5 7.1-9 11.4Z")] },
  bag: { c: () => [P("M6 8h12l-1 12.2a1 1 0 0 1-1 .8H8a1 1 0 0 1-1-.8L6 8Z"), P("M9 8V6.5a3 3 0 0 1 6 0V8")] },
  receipt: { c: () => [P("M6 3h12v18l-2.2-1.4L13.5 21l-1.5-1.4L10.5 21l-2.3-1.4L6 21V3Z"), P("M9 8h6M9 12h6")] },
  gear: { c: () => [C(12,12,3), P("M12 2.5l1.4 2.3 2.7-.4.6 2.6 2.4 1.3-1 2.5 1 2.5-2.4 1.3-.6 2.6-2.7-.4L12 21.5 10.6 19.2l-2.7.4-.6-2.6-2.4-1.3 1-2.5-1-2.5 2.4-1.3.6-2.6 2.7.4L12 2.5Z")] },
  search: { c: () => [C(11,11,7), P("m20 20-3.2-3.2")] },
  pin: { c: () => [P("M12 21c4.5-4.2 7-7.6 7-10.8A7 7 0 0 0 5 10.2C5 13.4 7.5 16.8 12 21Z"), C(12,10,2.4)] },
  chevron: { c: () => [P("m9 5 7 7-7 7")] },
  chevronDown: { c: () => [P("m6 9 6 6 6-6")] },
  back: { c: () => [P("m15 5-7 7 7 7")] },
  close: { c: () => [P("M6 6l12 12M18 6 6 18")] },
  star: { fillToggle: true, sw: 1.6, c: () => [P("m12 3 2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.9 6.8 18.9 8 13.1 3.6 9.1l5.9-.7L12 3Z")] },
  clock: { c: () => [C(12,12,8.5), P("M12 7.5V12l3 2")] },
  fire: { c: () => [P("M12 3c.5 3-1.8 4.2-1.8 6.3 0 1 .6 1.7 1.3 1.7.9 0 1.3-.7 1.2-1.8 1.6 1 2.6 2.8 2.6 4.7A5.3 5.3 0 0 1 6.7 14c0-2.5 1.6-4 2.4-5.4C10.2 6.8 10.4 4.7 12 3Z")] },
  plus: { sw: 2.2, c: () => [P("M12 5v14M5 12h14")] },
  minus: { sw: 2.2, c: () => [P("M5 12h14")] },
  trash: { c: () => [P("M5 7h14M9 7V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5V7M7 7l.8 12.2a1 1 0 0 0 1 .8h6.4a1 1 0 0 0 1-.8L18 7")] },
  check: { sw: 2.2, c: () => [P("m5 12.5 4.5 4.5L19 6.5")] },
  card: { c: () => [R(3,5.5,18,13,3), P("M3 9.5h18M6.5 14.5h3")] },
  cash: { c: () => [R(3,6.5,18,11,2.5), C(12,12,2.4)] },
  bell: { c: () => [P("M6 9a6 6 0 0 1 12 0c0 5 1.5 6.5 1.5 6.5h-15S6 14 6 9Z"), P("M10 19a2 2 0 0 0 4 0")] },
  user: { c: () => [C(12,8,3.6), P("M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4")] },
  globe: { c: () => [C(12,12,8.5), P("M3.5 12h17M12 3.5c2.4 2.3 2.4 14.7 0 17M12 3.5c-2.4 2.3-2.4 14.7 0 17")] },
  help: { c: () => [C(12,12,8.5), P("M9.6 9.5a2.4 2.4 0 0 1 4.7.6c0 1.6-2.3 2-2.3 3.4"), C(12,17,0.6,{ fill: "currentColor", stroke: "none" })] },
  scooter: { c: () => [C(6,17,2.5), C(17,17,2.5), P("M8.5 17h6l2-7h2.5M14.5 10l-1.5-4h-2.5")] },
  sun: { c: () => [C(12,12,4), P("M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19")] },
  moon: { c: () => [P("M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z")] },
  qr: { c: () => [R(3.5,3.5,7,7,1.6), R(13.5,3.5,7,7,1.6), R(3.5,13.5,7,7,1.6), P("M14 14h2v2M20 14v6M14 20h3M19 17h1")] },
  phone: { c: () => [P("M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z")] },
  chat: { c: () => [P("M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4V6a1 1 0 0 1 1-1Z")] },
  store: { c: () => [P("M5 9.5V20h14V9.5"), P("M3.5 5.5h17l-1 4a3 3 0 0 1-5.8 0 3 3 0 0 1-5.8 0 3 3 0 0 1-5.4 0Z"), P("M10 20v-4.5h4V20")] },
  gift: { c: () => [R(4,9,16,11,1.6), P("M3 9h18M12 9v11M12 9c-1.5-3.5-5.5-3.5-5.5-1 0 1.5 2 1 5.5 1Zm0 0c1.5-3.5 5.5-3.5 5.5-1 0 1.5-2 1-5.5 1Z")] },
  target: { c: () => [C(12,12,7.5), P("M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4"), C(12,12,1.4,{ fill: "currentColor", stroke: "none" })] },
  edit: { c: () => [P("M4 20h4.5L19 9.5 14.5 5 4 15.5V20Z"), P("M13.5 6l4.5 4.5")] },
  navigation: { c: () => [P("M3 11 21 4l-7 17-2.5-7L3 11Z")] },
  info: { c: () => [C(12,12,8.5), P("M12 11v5"), C(12,7.8,0.6,{ fill: "currentColor", stroke: "none" })] },
  refresh: { c: () => [P("M20 11A8 8 0 0 0 6.3 6.3L4 8.5M4 4v4.5h4.5"), P("M4 13a8 8 0 0 0 13.7 4.7L20 15.5M20 20v-4.5h-4.5")] },
};

export default {
  name: "Icon",
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 24 },
    sw: { type: Number, default: null },
    filled: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const def = ICONS[props.name];
      if (!def) return h("svg", { viewBox: "0 0 24 24", width: props.size, height: props.size });
      const solid = def.fillToggle && props.filled;
      return h(
        "svg",
        {
          viewBox: "0 0 24 24",
          width: props.size,
          height: props.size,
          fill: solid ? "currentColor" : "none",
          stroke: solid ? "none" : "currentColor",
          "stroke-width": props.sw ?? def.sw ?? 1.8,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        },
        def.c()
      );
    };
  },
};
