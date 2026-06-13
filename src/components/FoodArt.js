/* ===== Smart Food — geometric food illustrations ===== */
import { h } from "vue";

const W = "#fff", D = "rgba(0,0,0,0.22)", S = "rgba(255,255,255,0.55)";
let _gid = 0;

const P = (d, fill) => h("path", { d, fill });
const Rc = (x, y, w, hh, rx, fill) => h("rect", { x, y, width: w, height: hh, rx, fill });
const Ci = (cx, cy, r, fill, extra) => h("circle", { cx, cy, r, fill, ...(extra || {}) });

function glyph(kind) {
  switch (kind) {
    case "burger":
      return [
        P("M-26 -16a26 14 0 0 1 52 0Z", W),
        Ci(-10, -19, 1.5, D), Ci(4, -21, 1.5, D), Ci(14, -17, 1.5, D),
        Rc(-26, -12, 52, 6, 3, "#7ad17a"),
        Rc(-26, -6, 52, 9, 3.5, "#7a4a2b"),
        Rc(-26, 3, 52, 5, 2.5, "#ffd24a"),
        P("M-26 10a26 11 0 0 0 52 0Z", W),
      ];
    case "pizza":
      return [
        P("M0 -30 26 22a4 4 0 0 1-3.6 5.6H-22.4A4 4 0 0 1-26 22Z", W),
        P("M0 -24 21 19H-21Z", "#ffce6b"),
        Ci(-7, 2, 3.4, "#e0473c"), Ci(8, 6, 3.4, "#e0473c"), Ci(0, 14, 3.4, "#e0473c"),
        Ci(2, -7, 2.4, "#6fae54"),
      ];
    case "dessert":
      return [
        P("M-18 4h36l-4 18a3 3 0 0 1-3 2.6H-11A3 3 0 0 1-14 22Z", W),
        P("M-20 -4a20 12 0 0 1 40 0c0 4-9 7-20 7s-20-3-20-7Z", "#ff9ec4"),
        Ci(0, -16, 4.5, "#e0473c"),
        h("path", { d: "M0 -20v-5", stroke: "#6fae54", "stroke-width": 2.4, "stroke-linecap": "round" }),
      ];
    case "drink":
      return [
        P("M-14 -22h28l-3 44a3 3 0 0 1-3 2.7H-11A3 3 0 0 1-14 22Z", W),
        P("M-13 -16h26l-1.4 20H-11.6Z", "#ff7fb0"),
        h("rect", { x: 6, y: -34, width: 3.2, height: 20, rx: 1.6, fill: W, transform: "rotate(18 7 -24)" }),
        Ci(0, -22, 6, S),
      ];
    case "combo":
      return [
        h("path", { d: "M-28 -10a18 9 0 0 1 36 0Z", fill: W, transform: "translate(0 -2)" }),
        Rc(-28, -9, 36, 6, 3, "#7a4a2b"),
        P("M-28 -1a18 8 0 0 0 36 0Z", W),
        P("M14 -16h16l-2 30a3 3 0 0 1-3 2.7H19A3 3 0 0 1 16 14Z", W),
        P("M16 -11h12l-1 14H17Z", "#ff7fb0"),
      ];
    case "all":
    default:
      return [
        Ci(-12, -10, 9, W),
        Rc(2, -19, 18, 18, 5, W),
        P("M-20 8h40l-4 12a3 3 0 0 1-3 2.2H-13A3 3 0 0 1-16 20Z", W),
      ];
  }
}

export default {
  name: "FoodArt",
  props: {
    kind: { type: String, default: "all" },
    hue: { type: Number, default: 20 },
  },
  setup(props) {
    const gid = "fa" + (++_gid);
    return () => {
      const c1 = `hsl(${props.hue} 85% 64%)`;
      const c2 = `hsl(${(props.hue + 28) % 360} 80% 52%)`;
      return h("div", { class: "foodart" }, [
        h("svg", { viewBox: "0 0 120 120", width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice" }, [
          h("defs", [
            h("radialGradient", { id: gid, cx: "32%", cy: "24%", r: "92%" }, [
              h("stop", { offset: "0%", "stop-color": c1 }),
              h("stop", { offset: "100%", "stop-color": c2 }),
            ]),
          ]),
          h("rect", { width: 120, height: 120, fill: `url(#${gid})` }),
          h("circle", { cx: 94, cy: 22, r: 42, fill: "rgba(255,255,255,0.14)" }),
          h("circle", { cx: 18, cy: 106, r: 32, fill: "rgba(0,0,0,0.10)" }),
          h("circle", { cx: 60, cy: 60, r: 37, fill: "rgba(0,0,0,0.16)" }),
          h("g", { transform: "translate(60 60) scale(1.18)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))" }, glyph(props.kind)),
        ]),
      ]);
    };
  },
};
