/* The eyepiece view: a circular field drawn from REAL micrographs, zoomed for the chosen objective and
   blurred by how far out of focus the stage is. Also the one shared focus model used by the 3D station
   and the bonus round, so "what sharp means" is identical everywhere. */
import { img } from "./data.js?v=1";

const cache = {};
export function loadImg(id) {
  if (cache[id]) return cache[id];
  const im = new Image(); const rec = { im, ready: false, cbs: [] };
  im.onload = () => { rec.ready = true; rec.cbs.forEach(f => f()); rec.cbs = []; };
  im.src = img(id); cache[id] = rec; return rec;
}

/* which photo + zoom shows for each slide and objective */
const MAP = {
  onion: { 4: ["onion-low", 0.55], 10: ["onion-low", 1.0], 40: ["onion-nuc", 1.0], 100: ["onion-nuc", 2.3] },
  cheek: { 4: ["cheek", 0.45], 10: ["cheek", 0.8], 40: ["cheek", 1.5], 100: ["cheek", 2.6] },
};
export const SLIDES = Object.keys(MAP);

/* focus model: ideal stage height per objective (parfocal: nearly the same, so after focusing at x4
   only the FINE knob is needed at higher power). Depth of field shrinks as power grows. */
export const IDEAL = { 4: 60, 10: 62, 40: 64, 100: 65 };
export const DOF = { 4: 12, 10: 6, 40: 2.2, 100: 1.1 };
export const CRASH_AT = { 4: 999, 10: 999, 40: 74, 100: 72 };
export const effective = (coarse, fine) => coarse + fine * 0.5;
export function blurFor(obj, coarse, fine) {
  const d = Math.abs(effective(coarse, fine) - IDEAL[obj]);
  return Math.min(18, (d / DOF[obj]) * 3);
}
export const sharpPct = blur => Math.round(Math.max(0, 1 - blur / 9) * 100);

export function makeView(canvas, { slide = "onion", obj = 4, blur = 0, light = 1 } = {}) {
  const g = canvas.getContext("2d");
  const st = { slide, obj, blur, light, x: 0, y: 0 };
  const hasFilter = "filter" in g;
  const tmp = document.createElement("canvas");
  function draw() {
    const W = canvas.width, H = canvas.height; if (!W) return;
    const [id, zoom] = MAP[st.slide][st.obj];
    const rec = loadImg(id);
    g.save(); g.clearRect(0, 0, W, H); g.fillStyle = "#05070a"; g.fillRect(0, 0, W, H);
    g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2); g.clip();
    g.fillStyle = "#cfd8c9"; g.fillRect(0, 0, W, H);
    if (rec.ready) {
      const im = rec.im, base = (W * 1.15) / im.width * zoom;
      const iw = im.width * base, ih = im.height * base;
      const b = Math.max(0, st.blur);
      let src = im, sw = im.width, sh = im.height;
      if (b > 0.3 && !hasFilter) {
        const f = 1 / (1 + b * 0.9); tmp.width = Math.max(8, (iw * f) | 0); tmp.height = Math.max(8, (ih * f) | 0);
        tmp.getContext("2d").drawImage(im, 0, 0, tmp.width, tmp.height); src = tmp; sw = tmp.width; sh = tmp.height;
      } else if (hasFilter) g.filter = b > 0.3 ? `blur(${(b * (W / 420)).toFixed(1)}px)` : "none";
      const cx = W / 2 + st.x, cy = H / 2 + st.y;
      const n = zoom < 1 ? 3 : 1;
      for (let tx = -n; tx <= n; tx++) for (let ty = -n; ty <= n; ty++) {
        g.save(); g.translate(cx + tx * iw, cy + ty * ih + (zoom < 1 ? tx * ih * 0.37 : 0));   // brick-offset tiling: more cells, no mirror pattern
        g.drawImage(src, 0, 0, sw, sh, -iw / 2, -ih / 2, iw, ih); g.restore();
      }
      g.filter = "none";
    }
    if (st.light < 1) { g.fillStyle = `rgba(0,0,0,${Math.min(0.94, (1 - st.light) * 1.05)})`; g.fillRect(0, 0, W, H); }
    else if (st.light > 1.1) { g.fillStyle = `rgba(255,252,235,${Math.min(0.85, (st.light - 1.1) * 1.4)})`; g.fillRect(0, 0, W, H); }
    const vg = g.createRadialGradient(W / 2, H / 2, W * 0.28, W / 2, H / 2, W / 2);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.5)");
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    g.restore();
    g.lineWidth = 6; g.strokeStyle = "#0b0f14"; g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 3, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 2; g.strokeStyle = "rgba(190,205,215,.55)"; g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 8, 0, Math.PI * 2); g.stroke();
  }
  Object.values(MAP).forEach(m => Object.values(m).forEach(([id]) => { const r = loadImg(id); if (!r.ready) r.cbs.push(draw); }));
  return {
    set(p) { Object.assign(st, p); draw(); },
    draw,
    get state() { return st; },
    resize(px) { canvas.width = canvas.height = px; draw(); },
  };
}
