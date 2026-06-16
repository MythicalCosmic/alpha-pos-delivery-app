/* ===== Smart Food — real, scannable QR ===== */
/* Encodes `value` as an actual QR (qrcode-generator) so staff can scan the
   member id (SF-<telegram_id>) or a gift code off the screen. Rendered as SVG
   so it stays crisp at any size. Error correction 'M' (~15% recoverable). */
import { h } from "vue";
import qrcode from "qrcode-generator";

export default {
  name: "QRCode",
  props: {
    value: { type: String, default: "SMARTFOOD" },
    color: { type: String, default: "#1a1140" },
    ecl: { type: String, default: "M" }, // L | M | Q | H
  },
  setup(props) {
    return () => {
      let qr;
      try {
        qr = qrcode(0, props.ecl); // typeNumber 0 = auto-fit smallest version
        qr.addData(String(props.value == null ? "" : props.value) || " ");
        qr.make();
      } catch (e) {
        return h("svg", { viewBox: "0 0 1 1", width: "100%", height: "100%" });
      }
      const N = qr.getModuleCount();
      const rects = [];
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (qr.isDark(r, c)) {
            // 1.02 overlap closes anti-alias hairlines; sharp squares scan best.
            rects.push(h("rect", { key: r + "-" + c, x: c, y: r, width: 1.02, height: 1.02, fill: props.color }));
          }
        }
      }
      // 1-module quiet zone around the symbol (required by the QR spec to scan).
      return h(
        "svg",
        { viewBox: `-1 -1 ${N + 2} ${N + 2}`, shapeRendering: "crispEdges", width: "100%", height: "100%" },
        rects
      );
    };
  },
};
