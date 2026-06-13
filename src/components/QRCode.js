/* ===== Smart Food — deterministic branded QR (decorative) ===== */
import { h } from "vue";

function _hash(str) { let hh = 2166136261; for (let i = 0; i < str.length; i++) { hh ^= str.charCodeAt(i); hh = Math.imul(hh, 16777619); } return hh >>> 0; }
function _rng(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export default {
  name: "QRCode",
  props: {
    value: { type: String, default: "SMARTFOOD" },
    n: { type: Number, default: 33 },
    color: { type: String, default: "#1a1140" },
  },
  setup(props) {
    return () => {
      const N = props.n;
      const grid = Array.from({ length: N }, () => Array(N).fill(false));
      const res = Array.from({ length: N }, () => Array(N).fill(false));
      const set = (r, c, v) => { if (r >= 0 && c >= 0 && r < N && c < N) { grid[r][c] = v; res[r][c] = true; } };
      function finder(r, c) {
        for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
          const onBorder = i >= 0 && i <= 6 && j >= 0 && j <= 6 && (i === 0 || i === 6 || j === 0 || j === 6);
          const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          set(r + i, c + j, onBorder || inner);
        }
      }
      finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
      for (let i = 8; i < N - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
      (function align(r, c) {
        for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
          const ring = Math.max(Math.abs(i), Math.abs(j));
          set(r + i, c + j, ring !== 1);
        }
      })(N - 7, N - 7);
      const m = Math.floor(N / 2);
      for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) set(m + i, m + j, false);
      const rnd = _rng(_hash(props.value));
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!res[r][c]) grid[r][c] = rnd() > 0.52;

      const rects = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (grid[r][c]) rects.push(h("rect", { key: r + "-" + c, x: c, y: r, width: 1.04, height: 1.04, rx: 0.32, fill: props.color }));
      }
      return h("svg", { viewBox: `-1 -1 ${N + 2} ${N + 2}`, shapeRendering: "crispEdges" }, rects);
    };
  },
};
