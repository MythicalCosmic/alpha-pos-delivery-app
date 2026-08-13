/* ===== Smart Food — geometric food illustrations =====
   These are code-native fallbacks for a catalog without photography. Every
   glyph shares the same bold silhouette, small ingredient accents, gradient
   field, and optical scale as the original burger artwork. */
import { h } from "vue";

const W = "#fff";
const D = "rgba(0,0,0,0.22)";
const S = "rgba(255,255,255,0.55)";
const GOLD = "#ffd24a";
const GREEN = "#72c975";
const RED = "#e9544d";
const BROWN = "#8a542f";
let _gid = 0;

export const FOOD_ART_KINDS = Object.freeze([
  "burger", "hotdog", "pizza", "lavash", "sandwich", "chicken", "wings",
  "nuggets", "cheese", "fries", "sauce", "doner", "bread", "pastry", "gum",
  "tea", "coffee", "bottle", "drink", "shake", "icecream", "waffle",
  "dessert", "combo", "all",
]);

const P = (d, fill, extra) => h("path", { d, fill, ...(extra || {}) });
const St = (d, stroke = W, width = 2.5, extra) => h("path", {
  d,
  fill: "none",
  stroke,
  "stroke-width": width,
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  ...(extra || {}),
});
const Rc = (x, y, w, hh, rx, fill, extra) => h("rect", {
  x, y, width: w, height: hh, rx, fill, ...(extra || {}),
});
const Ci = (cx, cy, r, fill, extra) => h("circle", { cx, cy, r, fill, ...(extra || {}) });
const El = (cx, cy, rx, ry, fill, extra) => h("ellipse", { cx, cy, rx, ry, fill, ...(extra || {}) });
const Pg = (points, fill, extra) => h("polygon", { points, fill, ...(extra || {}) });

function glyph(kind) {
  switch (kind) {
    case "burger":
      return [
        P("M-26 -16a26 14 0 0 1 52 0Z", W),
        Ci(-10, -19, 1.5, D), Ci(4, -21, 1.5, D), Ci(14, -17, 1.5, D),
        Rc(-26, -12, 52, 6, 3, GREEN),
        Rc(-26, -6, 52, 9, 3.5, "#7a4a2b"),
        Rc(-26, 3, 52, 5, 2.5, GOLD),
        P("M-26 10a26 11 0 0 0 52 0Z", W),
      ];
    case "hotdog":
      return [h("g", { transform: "rotate(-8)" }, [
        Rc(-30, -13, 60, 26, 13, W),
        Rc(-24, -7, 48, 14, 7, "#d95649"),
        St("M-19 1c6-8 12 8 18 0s12-8 20 0", GOLD, 3),
        P("M-28-9c4-3 8-4 12-4v26c-5 0-9-1-12-4Z", "rgba(255,210,120,.55)"),
      ])];
    case "pizza":
      return [
        P("M0 -30 26 22a4 4 0 0 1-3.6 5.6H-22.4A4 4 0 0 1-26 22Z", W),
        P("M0 -24 21 19H-21Z", "#ffce6b"),
        Ci(-7, 2, 3.4, RED), Ci(8, 6, 3.4, RED), Ci(0, 14, 3.4, RED),
        Ci(2, -7, 2.4, GREEN),
      ];
    case "lavash":
      return [h("g", { transform: "rotate(-10)" }, [
        Rc(-28, -15, 49, 30, 12, W),
        P("M-24-12h9l-5 24h-7a12 12 0 0 1-1-5Z", "#f0c985"),
        El(21, 0, 14, 15, W),
        Ci(20, -5, 5, "#d85b47"), Ci(24, 5, 4.5, GREEN), Ci(15, 5, 3.5, GOLD),
        St("M-14-11-19 11M-4-13-9 13", "rgba(138,84,47,.5)", 2),
      ])];
    case "sandwich":
      return [
        Pg("-28,-5 0,-27 28,-5", W),
        Pg("-25,-1 0,-18 25,-1", "#f1c36f"),
        P("M-27 2h54l-7 7H-20Z", GREEN),
        P("M-25 10h50l-6 6H-19Z", RED),
        Pg("-28,20 0,2 28,20", W),
      ];
    case "chicken":
      return [h("g", { transform: "rotate(-27)" }, [
        P("M-25-8c0-13 12-21 24-18 10 2 16 12 13 22-3 12-15 18-27 12-7-4-11-10-10-16Z", W),
        P("M-18-9c2-8 9-13 17-12 8 2 12 9 9 17-3 8-12 12-20 8Z", "#efa94e"),
        Rc(8, -3, 23, 7, 3.5, W),
        Ci(32, -3, 5, W), Ci(32, 4, 5, W),
      ])];
    case "wings":
      return [
        P("M-29 1c2-17 17-27 31-20 8 4 9 14 2 20-9 9-21 11-33 7Z", W),
        P("M29 1C27-16 12-26-2-19c-8 4-9 14-2 20 9 9 21 11 33 7Z", "#ffd08a"),
        St("M-19-1c7-2 12-7 16-13M19-1C12-3 7-8 3-14", "rgba(138,84,47,.5)", 2),
      ];
    case "nuggets":
      return [
        P("M-29-9c2-9 13-14 22-9 6 3 7 11 2 17-7 7-20 6-25-1-2-3-2-5 1-7Z", W),
        P("M5-15c7-7 20-5 24 4 4 8-3 17-13 17C5 28-2 21 0 11c1-8 0-20 5-26Z", "#ffd08a"),
        P("M-23 10c8-6 20-2 22 7 1 8-8 14-17 10-8-3-11-11-5-17Z", "#f4b95e"),
        Ci(-13, -9, 2, S), Ci(14, -8, 2, S), Ci(-14, 19, 2, S),
      ];
    case "cheese":
      return [h("g", { transform: "rotate(-10)" }, [
        Rc(-27, -18, 15, 43, 6, W), Rc(-7, -22, 15, 47, 6, "#ffe083"), Rc(13, -16, 15, 41, 6, W),
        Rc(-24, -13, 9, 31, 4, GOLD), Rc(-4, -17, 9, 35, 4, "#efb943"), Rc(16, -11, 9, 29, 4, GOLD),
      ])];
    case "fries":
      return [
        Rc(-19, -28, 6, 35, 2.5, GOLD, { transform: "rotate(-7 -16 -10)" }),
        Rc(-9, -31, 6, 38, 2.5, "#ffe17a"), Rc(2, -27, 6, 34, 2.5, GOLD),
        Rc(13, -30, 6, 37, 2.5, "#ffe17a", { transform: "rotate(7 16 -10)" }),
        P("M-26-4h52l-5 30h-42Z", RED),
        P("M-21 1h42l-2 8a30 30 0 0 1-38 0Z", "#ff746b"),
      ];
    case "sauce":
      return [
        P("M-25-7h50l-5 29a5 5 0 0 1-5 4h-30a5 5 0 0 1-5-4Z", W),
        El(0, -7, 25, 8, W), El(0, -6, 19, 5, RED),
        St("M-10 8c7 5 13-5 20 0", "rgba(233,84,77,.65)", 3),
      ];
    case "doner":
      return [
        St("M0-31v58", W, 3),
        P("M-20-23C-7-31 11-30 22-21L16 14C7 25-8 25-17 14Z", W),
        P("M-14-17C-4-22 9-22 16-16l-2 8c-8 4-18 4-27 0ZM-15-2c9 5 19 5 28 0l-2 8c-8 4-17 4-25 0Z", BROWN),
        P("M-21 28h42l-5 5h-32Z", W),
      ];
    case "bread":
      return [
        P("M-29 8c0-20 13-32 29-32S29-12 29 8v12a6 6 0 0 1-6 6h-46a6 6 0 0 1-6-6Z", W),
        St("M-15-14c4 4 4 9 0 13M-3-19c4 4 4 9 0 13M9-17c4 4 4 9 0 13", "#d6a65d", 3),
      ];
    case "pastry":
      return [
        P("M-31 14C-18-17 15-30 32 4c-5-4-11-6-17-6-3-13-19-15-27-4 4 7 5 13 4 20-8-2-16-7-23-12 2 10 5 18 8 25Z", W),
        St("M-21-5c5 4 8 10 9 18M-7-17c5 6 8 13 8 22M9-17c4 5 6 10 6 15", "#d6a65d", 2.5),
      ];
    case "gum":
      return [
        Pg("-33,-12 -24,-4 -33,5", "#ffd1e4"), Pg("33,-12 24,-4 33,5", "#ffd1e4"),
        Rc(-26, -17, 52, 28, 7, W, { transform: "rotate(-6)" }),
        Rc(-17, -10, 14, 14, 4, "#ff85b7", { transform: "rotate(-6)" }),
        Rc(2, -12, 14, 14, 4, "#c99bff", { transform: "rotate(-6)" }),
        Ci(15, 16, 10, "rgba(255,255,255,.45)"), Ci(15, 16, 6, "rgba(255,255,255,.25)"),
      ];
    case "tea":
      return [
        Rc(-25, -9, 43, 30, 7, W),
        P("M-21-5h35v15a7 7 0 0 1-7 7h-21a7 7 0 0 1-7-7Z", "#e8a848"),
        St("M18-3c19-3 20 22 2 21", W, 5),
        St("M-13-19c-5-6 5-8 0-15M0-19c-5-6 5-8 0-15M13-19c-5-6 5-8 0-15", S, 2.3),
      ];
    case "coffee":
      return [
        Rc(-25, -8, 43, 29, 7, W),
        El(-3, -7, 19, 5, "#75442d"),
        St("M18-2c19-2 19 21 2 20", W, 5),
        St("M-12-18c-6-7 6-9 0-17M2-18c-6-7 6-9 0-17", S, 2.5),
        Ci(-7, 7, 3, "#f4c78c"), Ci(4, 5, 2, "#f4c78c"),
      ];
    case "bottle":
      return [
        Rc(-8, -31, 16, 7, 3, W),
        P("M-10-24h20v8c0 4 8 8 8 15v23a7 7 0 0 1-7 7h-22a7 7 0 0 1-7-7V-1c0-7 8-11 8-15Z", W),
        Rc(-15, -6, 30, 20, 5, "#61c8dc"),
        P("M-15 6c9-7 20 6 30-2v10h-30Z", "#4da7e8"),
        Ci(8, -15, 3, S),
      ];
    case "drink":
      return [
        P("M-14 -22h28l-3 44a3 3 0 0 1-3 2.7H-11A3 3 0 0 1-14 22Z", W),
        P("M-13 -16h26l-1.4 20H-11.6Z", "#ff7fb0"),
        Rc(6, -34, 3.2, 20, 1.6, W, { transform: "rotate(18 7 -24)" }),
        Ci(0, -22, 6, S),
      ];
    case "shake":
      return [
        P("M-16-12h32l-3 35a4 4 0 0 1-4 4H-9a4 4 0 0 1-4-4Z", W),
        P("M-15-7h30l-1 16h-28Z", "#f6a6cf"),
        P("M-19-12c2-13 12-20 19-20s17 7 19 20Z", W),
        Ci(-6, -20, 3, "#ff8fbe"), Ci(5, -24, 2.5, "#c89cff"),
        Rc(7, -37, 3.4, 25, 1.7, W, { transform: "rotate(13 8 -24)" }),
      ];
    case "icecream":
      return [
        Pg("-18,2 18,2 0,31", "#edb66c"),
        St("M-12 8 7 25M12 8-7 25", "rgba(138,84,47,.45)", 1.8),
        Ci(-10, -4, 13, W), Ci(9, -5, 14, "#ff9ec4"), Ci(0, -17, 13, "#fff2c7"),
        Ci(5, -20, 2, S),
      ];
    case "waffle":
      return [h("g", { transform: "rotate(-8)" }, [
        Rc(-25, -25, 50, 50, 8, W), Rc(-21, -21, 42, 42, 6, "#eeb85c"),
        St("M-10-20v40M2-20v40M14-20v40M-20-10h40M-20 2h40M-20 14h40", "#c88935", 2),
        P("M-12-12c8-5 15-2 21 4-5 5-10 8-19 8Z", "#ff8fbd"),
      ])];
    case "dessert":
      return [
        P("M-18 4h36l-4 18a3 3 0 0 1-3 2.6H-11A3 3 0 0 1-14 22Z", W),
        P("M-20 -4a20 12 0 0 1 40 0c0 4-9 7-20 7s-20-3-20-7Z", "#ff9ec4"),
        Ci(0, -16, 4.5, RED),
        St("M0-20v-5", GREEN, 2.4),
      ];
    case "combo":
      return [
        P("M-28-12a18 9 0 0 1 36 0Z", W),
        Rc(-28, -9, 36, 6, 3, BROWN),
        P("M-28-1a18 8 0 0 0 36 0Z", W),
        P("M14-16h16l-2 30a3 3 0 0 1-3 2.7H19A3 3 0 0 1 16 14Z", W),
        P("M16-11h12l-1 14H17Z", "#ff7fb0"),
        Rc(18, -26, 3, 13, 1.5, W, { transform: "rotate(-12 19 -20)" }),
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
      return h("div", { class: "foodart", "aria-hidden": "true" }, [
        h("svg", {
          viewBox: "0 0 120 120",
          width: "100%",
          height: "100%",
          preserveAspectRatio: "xMidYMid slice",
          focusable: "false",
        }, [
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
          h("g", {
            transform: "translate(60 60) scale(1.18)",
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
          }, glyph(props.kind)),
        ]),
      ]);
    };
  },
};
