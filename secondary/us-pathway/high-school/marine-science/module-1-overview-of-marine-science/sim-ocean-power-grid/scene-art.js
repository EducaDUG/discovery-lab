/* ==========================================================================
   OCEAN POWER GRID — SHARED SCENE ART   (canvas 2D, hand-drawn vector style)
   Every function draws into a 2D context. Used by the Energy Bench (three
   close-up stations) and the Harbour Isle Grid game so both look like one world.
   Style target: clean Gizmos/CK-12 "polished diorama" — believable little
   machines on a living sea, not neon arcade chrome.
   ========================================================================== */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, f) => a + (b - a) * f;
function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
function mixColor(c1, c2, f) { const a = hex(c1), b = hex(c2); return `rgb(${Math.round(mix(a[0], b[0], f))},${Math.round(mix(a[1], b[1], f))},${Math.round(mix(a[2], b[2], f))})`; }
function keyColor(keys, h) {                    // keys: [[hour, '#rrggbb'], ...] wraps the day
  for (let i = 0; i < keys.length - 1; i++) { if (h >= keys[i][0] && h <= keys[i + 1][0]) return mixColor(keys[i][1], keys[i + 1][1], (h - keys[i][0]) / (keys[i + 1][0] - keys[i][0])); }
  return keys[keys.length - 1][1];
}
const SKY_TOP = [[0, "#040919"], [5, "#16244a"], [6.6, "#5a6fa8"], [8, "#5aa7ee"], [12, "#3b97ee"], [16.5, "#5aa4e2"], [18.4, "#c5707a"], [19.6, "#4a3670"], [21, "#0b1230"], [24, "#040919"]];
const SKY_BOT = [[0, "#0a1538"], [5, "#3a3f70"], [6.6, "#f9a066"], [8, "#bfe2fb"], [12, "#cfeaff"], [16.5, "#e7dcc6"], [18.4, "#ffa15c"], [19.6, "#b56a7a"], [21, "#1c2550"], [24, "#0a1538"]];
const SEA_TOP = [[0, "#0b2342"], [6.6, "#b5866c"], [8, "#6cc0de"], [12, "#58b6d6"], [16.5, "#6bb0c8"], [18.4, "#d38160"], [20, "#14254a"], [24, "#0b2342"]];
const SEA_BOT = [[0, "#041426"], [8, "#0d5a83"], [12, "#0b5d85"], [17, "#0c4f73"], [19.6, "#0a2c48"], [24, "#041426"]];

export function isDark(hod) { return hod < 5.6 || hod > 20.2; }

/* ---------- sky + sun/moon + clouds ---------- */
export function drawSky(ctx, W, hz, hod, cloud, time, reduced) {
  const g = ctx.createLinearGradient(0, 0, 0, hz);
  let top = keyColor(SKY_TOP, hod), bot = keyColor(SKY_BOT, hod);
  const storm = clamp((cloud - 0.45) / 0.5, 0, 1);
  if (storm > 0) { const grey = isDark(hod) ? "#0b0f1c" : "#59626f"; top = mixColor(rgbToHex(top), grey, storm * 0.75); bot = mixColor(rgbToHex(bot), isDark(hod) ? "#151b2a" : "#8b94a0", storm * 0.7); }
  g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, hz);
  // stars
  const night = isDark(hod) ? 1 : (hod < 7 ? (7 - hod) / 1.4 : hod > 19 ? (hod - 19) / 1.2 : 0);
  if (night > 0) {
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 70; i++) { const x = (i * 97.3) % W, y = (i * 53.7) % (hz * 0.85); const tw = reduced ? 0.7 : 0.5 + 0.5 * Math.sin(time * 1.2 + i); ctx.globalAlpha = clamp(night, 0, 1) * (1 - storm) * tw * 0.85; ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1.2, i % 7 === 0 ? 2 : 1.2); }
    ctx.globalAlpha = 1;
  }
  // sun / moon
  const dayF = (hod - 6) / 12;
  if (dayF > -0.06 && dayF < 1.06) {
    const a = Math.PI * clamp(dayF, 0, 1), sx = mix(W * 0.12, W * 0.88, clamp(dayF, 0, 1)), sy = hz - Math.sin(a) * hz * 0.78 + 6;
    const rg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 90); rg.addColorStop(0, `rgba(255,230,150,${0.55 * (1 - storm * 0.8)})`); rg.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = rg; ctx.fillRect(sx - 100, sy - 100, 200, 200);
    ctx.globalAlpha = 1 - storm * 0.75; ctx.fillStyle = "#fff1b8"; ctx.beginPath(); ctx.arc(sx, sy, 15, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  } else {
    const nf = hod >= 18 ? (hod - 18) / 12 : (hod + 6) / 12, a = Math.PI * clamp(nf, 0, 1), mx = mix(W * 0.14, W * 0.86, clamp(nf, 0, 1)), my = hz - Math.sin(a) * hz * 0.7 + 8;
    ctx.globalAlpha = 1 - storm * 0.85; ctx.fillStyle = "#e9efff"; ctx.beginPath(); ctx.arc(mx, my, 11, 0, 7); ctx.fill();
    ctx.fillStyle = keyColor(SKY_TOP, hod); ctx.beginPath(); ctx.arc(mx + 5, my - 3, 10, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  }
  // clouds: drifting soft puffs, denser and darker with `cloud`
  const n = Math.round(3 + cloud * 9);
  for (let i = 0; i < n; i++) {
    const sp = 6 + (i % 4) * 3, x = ((i * 173 + time * sp * (reduced ? 0.15 : 1)) % (W + 240)) - 120, y = 22 + (i * 37) % (hz * 0.55);
    const tone = isDark(hod) ? "30,38,62" : storm > 0.3 ? "88,96,108" : "255,255,255";
    ctx.fillStyle = `rgba(${tone},${0.35 + cloud * 0.45})`;
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + k * 26, y + (k % 2) * 6, 34 + (k % 3) * 8, 14 + (k % 2) * 6, 0, 0, 7); ctx.fill(); }
  }
}
function rgbToHex(c) { if (c[0] === "#") return c; const m = c.match(/\d+/g).map(Number); return "#" + m.slice(0, 3).map(v => v.toString(16).padStart(2, "0")).join(""); }

/* ---------- sea with perspective wave rows; Hs (m) scales the swell ---------- */
export function drawSea(ctx, W, H, hz, hod, Hs, Tp, time, reduced, windV, ampMul = 1) {
  const g = ctx.createLinearGradient(0, hz, 0, H);
  g.addColorStop(0, keyColor(SEA_TOP, hod)); g.addColorStop(1, keyColor(SEA_BOT, hod));
  ctx.fillStyle = g; ctx.fillRect(0, hz, W, H - hz);
  const rows = 26, amp0 = clamp(Hs, 0.3, 9) * 1.7 * ampMul;
  for (let k = 0; k < rows; k++) {
    const f = Math.pow(k / rows, 1.7), y = hz + 4 + f * (H - hz - 4), s = 0.25 + f * 1.3, amp = amp0 * s * 0.45;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) {
      const ph = x / (46 * (1 + f * 1.5)) * (9 / Math.max(5, Tp)) + (reduced ? 0 : time * (1.4 + f * 1.6) * (6 / Math.max(4, Tp))) + k * 1.7;
      const yy = y + Math.sin(ph) * amp + Math.sin(ph * 0.47 + k) * amp * 0.4;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    const dark = isDark(hod);
    ctx.strokeStyle = dark ? `rgba(150,190,255,${0.05 + f * 0.1})` : `rgba(255,255,255,${0.06 + f * 0.2})`; ctx.lineWidth = 0.6 + f * 1.8; ctx.stroke();
    if (Hs > 3.2 && k % 2 === 0 && f > 0.15) {           // whitecaps in rough seas
      ctx.strokeStyle = `rgba(255,255,255,${clamp((Hs - 3) / 5, 0, 0.75) * (0.15 + f * 0.45)})`; ctx.lineWidth = 1 + f * 2; ctx.setLineDash([3 + f * 10, 12 + f * 28]); ctx.lineDashOffset = -time * 20 * (1 + f); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  // sun/moon glitter path
  if (!isDark(hod)) { const gl = ctx.createLinearGradient(0, hz, 0, H); gl.addColorStop(0, "rgba(255,240,190,.22)"); gl.addColorStop(1, "rgba(255,240,190,0)"); ctx.fillStyle = gl; const cx = mix(W * 0.12, W * 0.88, clamp((hod - 6) / 12, 0, 1)); ctx.beginPath(); ctx.moveTo(cx - 14, hz); ctx.lineTo(cx + 14, hz); ctx.lineTo(cx + 90, H); ctx.lineTo(cx - 90, H); ctx.fill(); }
  // horizon haze
  const hg = ctx.createLinearGradient(0, hz - 6, 0, hz + 40); hg.addColorStop(0, "rgba(255,255,255,0)"); hg.addColorStop(0.2, isDark(hod) ? "rgba(120,150,220,.10)" : "rgba(255,255,255,.22)"); hg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = hg; ctx.fillRect(0, hz - 6, W, 46);
}
export function waveYAt(x, y, hz, H, Hs, Tp, time) { // surface bob for a unit at (x,y): matches a mid-range wave row
  const f = clamp((y - hz) / (H - hz), 0, 1), s = 0.25 + f * 1.3, amp = clamp(Hs, 0.3, 9) * 1.7 * s * 0.45;
  const ph = x / (46 * (1 + f * 1.5)) * (9 / Math.max(5, Tp)) + time * (1.4 + f * 1.6) * (6 / Math.max(4, Tp));
  return Math.sin(ph) * amp;
}

/* ---------- helpers ---------- */
function shadowEllipse(ctx, x, y, rx, ry, a = 0.25) { ctx.fillStyle = `rgba(0,20,40,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); }
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
export { roundRect };

/* ---------- offshore wind turbine (x,y = waterline) ---------- */
export function drawWind(ctx, x, y, s, ang, dim = 1, dark = false) {
  ctx.save(); ctx.translate(x, y);
  shadowEllipse(ctx, 0, 3 * s, 11 * s, 3 * s);
  const top = -92 * s;
  // tower
  const tg = ctx.createLinearGradient(-4 * s, 0, 4 * s, 0); tg.addColorStop(0, dark ? "#8fa0b5" : "#dfe8ef"); tg.addColorStop(0.5, dark ? "#c2cedd" : "#ffffff"); tg.addColorStop(1, dark ? "#6f7f93" : "#b7c4d0");
  ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-3.6 * s, -6 * s); ctx.lineTo(-1.7 * s, top); ctx.lineTo(1.7 * s, top); ctx.lineTo(3.6 * s, -6 * s); ctx.fill();
  // yellow transition piece + foundation
  ctx.fillStyle = "#f2b705"; ctx.fillRect(-4.6 * s, -9 * s, 9.2 * s, 10 * s); ctx.fillStyle = "#c58f00"; ctx.fillRect(-4.6 * s, -4 * s, 9.2 * s, 1.4 * s);
  ctx.fillStyle = "#5d6b79"; ctx.fillRect(-2.6 * s, 1 * s, 5.2 * s, 6 * s);
  // nacelle
  ctx.fillStyle = dark ? "#b7c3d1" : "#f7fafc"; roundRect(ctx, -3 * s, top - 3.6 * s, 14 * s, 6.6 * s, 2.2 * s); ctx.fill();
  ctx.fillStyle = "#c83d3d"; ctx.fillRect(9 * s, top - 2.4 * s, 1.6 * s, 4 * s);
  // rotor (hub at front of nacelle)
  const hx = 11 * s, hy = top;
  for (let b = 0; b < 3; b++) {
    const a = ang + b * Math.PI * 2 / 3;
    for (let ghost = 0; ghost < 2; ghost++) {
      if (ghost === 1 && dim < 0.25) continue;
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(a - ghost * 0.22 * Math.min(1, dim * 1.4)); ctx.globalAlpha = ghost ? 0.22 * Math.min(1, dim * 2) : 1;
      const bg = ctx.createLinearGradient(0, 0, 0, -58 * s); bg.addColorStop(0, dark ? "#c7d1dd" : "#ffffff"); bg.addColorStop(1, dark ? "#8b98a8" : "#dde6ee");
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(-1.8 * s, 0); ctx.quadraticCurveTo(-3.6 * s, -16 * s, -1.2 * s, -58 * s); ctx.lineTo(0.5 * s, -58 * s); ctx.quadraticCurveTo(2.4 * s, -18 * s, 1.9 * s, 0); ctx.fill();
      ctx.restore();
    }
  }
  ctx.fillStyle = dark ? "#c7d1dd" : "#fff"; ctx.beginPath(); ctx.arc(hx, hy, 3.2 * s, 0, 7); ctx.fill(); ctx.strokeStyle = "#9fb0bf"; ctx.lineWidth = 0.6 * s; ctx.stroke();
  if (dark) { ctx.fillStyle = "#ff3b3b"; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(ang * 3); ctx.beginPath(); ctx.arc(1 * s, top - 4.6 * s, 1.3 * s, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
}

/* ---------- wave energy converter, Pelamis-style segmented tube ---------- */
export function drawWaveDevice(ctx, x, y, s, phase, amp, dark = false) {
  ctx.save(); ctx.translate(x, y);
  shadowEllipse(ctx, 0, 3 * s, 34 * s, 4 * s, 0.2);
  const segs = 4, L = 17 * s;
  let px = -segs * L / 2, py = 0;
  for (let i = 0; i < segs; i++) {
    const a0 = Math.sin(phase - i * 0.9) * amp * 0.5, a1 = Math.sin(phase - (i + 1) * 0.9) * amp * 0.5;
    const nx = px + L * 0.96, ny = py + (a1 - a0) * 0.6;
    ctx.save(); ctx.translate(px, py + a0 * 0.4); ctx.rotate(Math.atan2(a1 - a0, L) * 0.7);
    const g = ctx.createLinearGradient(0, -6 * s, 0, 6 * s); g.addColorStop(0, dark ? "#d85b6f" : "#ff6f84"); g.addColorStop(0.5, dark ? "#a52b40" : "#e23a54"); g.addColorStop(1, "#7a1428");
    ctx.fillStyle = g; roundRect(ctx, 0, -5.6 * s, L, 10 * s, 4 * s); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(2 * s, -4.4 * s, L - 4 * s, 1.4 * s);
    ctx.restore();
    ctx.fillStyle = "#2b2f3a"; ctx.beginPath(); ctx.arc(px + L, py + (a1) * 0.4 - 0.6 * s, 2.2 * s, 0, 7); ctx.fill();
    px = nx; py = ny;
  }
  ctx.restore();
}

/* ---------- tidal-stream turbine: surface platform + translucent rotor under the water ---------- */
export function drawTidal(ctx, x, y, s, ang, flowDir = 1, dark = false) {
  ctx.save(); ctx.translate(x, y);
  // underwater rotor pair (translucent)
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#0b3b5b"; ctx.fillRect(-2 * s, 2 * s, 4 * s, 28 * s);
  for (const off of [-16, 16]) {
    ctx.save(); ctx.translate(off * s, 26 * s);
    ctx.fillStyle = "#d0443e"; ctx.beginPath(); ctx.arc(0, 0, 3.4 * s, 0, 7); ctx.fill();
    const cw = Math.cos(ang); ctx.strokeStyle = "#e7f2f7"; ctx.lineWidth = 3 * s; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -14 * s * Math.abs(cw) - 1); ctx.lineTo(0, 14 * s * Math.abs(cw) + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(1, 0); ctx.stroke();
    ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, -14 * s); ctx.lineTo(0, 14 * s); ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = "#13445f"; ctx.fillRect(-20 * s, 24 * s, 40 * s, 3 * s);
  ctx.globalAlpha = 1;
  // surface box, Seaflow-style red housing on black legs
  ctx.fillStyle = "#26303c"; ctx.fillRect(-7 * s, -10 * s, 14 * s, 14 * s);
  ctx.fillStyle = dark ? "#b03a3a" : "#e5484d"; roundRect(ctx, -10 * s, -24 * s, 20 * s, 14 * s, 2 * s); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(-8 * s, -22 * s, 16 * s, 2 * s);
  ctx.fillStyle = "#26303c"; ctx.fillRect(-1 * s, -42 * s, 2 * s, 18 * s);
  ctx.fillStyle = dark ? "#ffd166" : "#ff9f1c"; ctx.beginPath(); ctx.arc(0, -43 * s, 2 * s, 0, 7); ctx.fill();
  // flow arrows
  ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.4 * s;
  for (let i = 0; i < 3; i++) { const yy = (8 + i * 6) * s, dx = flowDir * 9 * s; ctx.beginPath(); ctx.moveTo(-dx, yy); ctx.lineTo(dx, yy); ctx.lineTo(dx - flowDir * 3.4 * s, yy - 2.2 * s); ctx.moveTo(dx, yy); ctx.lineTo(dx - flowDir * 3.4 * s, yy + 2.2 * s); ctx.stroke(); }
  ctx.restore();
}

/* ---------- ocean-current turbine: big slow rotors on a floating, tethered platform ---------- */
export function drawCurrentTurbine(ctx, x, y, s, ang, dark = false) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1 * s; ctx.setLineDash([3 * s, 3 * s]);
  ctx.beginPath(); ctx.moveTo(-8 * s, 8 * s); ctx.lineTo(-22 * s, 62 * s); ctx.moveTo(8 * s, 8 * s); ctx.lineTo(22 * s, 62 * s); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = 0.6;
  for (const off of [-19, 19]) {
    ctx.save(); ctx.translate(off * s, 22 * s);
    ctx.fillStyle = "#3a2f96"; ctx.beginPath(); ctx.ellipse(0, 0, 4.4 * s, 4 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#cfc8ff"; ctx.lineWidth = 3.4 * s; ctx.lineCap = "round"; ctx.rotate(ang);
    for (let b = 0; b < 3; b++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -19 * s); ctx.stroke(); }
    ctx.restore();
  }
  ctx.fillStyle = "#2b2470"; ctx.fillRect(-26 * s, 18 * s, 52 * s, 4 * s);
  ctx.globalAlpha = 1;
  // floating hull
  const g = ctx.createLinearGradient(0, -12 * s, 0, 4 * s); g.addColorStop(0, dark ? "#8a7bff" : "#b3a8ff"); g.addColorStop(1, "#5a48d8");
  ctx.fillStyle = g; roundRect(ctx, -26 * s, -10 * s, 52 * s, 14 * s, 6 * s); ctx.fill();
  ctx.fillStyle = "#f5f6fa"; roundRect(ctx, -9 * s, -22 * s, 18 * s, 12 * s, 2 * s); ctx.fill(); ctx.fillStyle = "#5a48d8"; ctx.fillRect(-7 * s, -19 * s, 14 * s, 3 * s);
  ctx.restore();
}

/* ---------- OTEC platform: warm surface water in, cold deep water up a long pipe ---------- */
export function drawOtec(ctx, x, y, s, tick, dark = false) {
  ctx.save(); ctx.translate(x, y);
  const pg = ctx.createLinearGradient(0, 8 * s, 0, 86 * s); pg.addColorStop(0, "rgba(255,120,60,.85)"); pg.addColorStop(0.35, "rgba(120,170,230,.7)"); pg.addColorStop(1, "rgba(40,80,200,.45)");
  ctx.fillStyle = pg; roundRect(ctx, -4 * s, 6 * s, 8 * s, 84 * s, 4 * s); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.2 * s; ctx.setLineDash([2 * s, 5 * s]); ctx.lineDashOffset = -tick * 24;
  ctx.beginPath(); ctx.moveTo(0, 86 * s); ctx.lineTo(0, 10 * s); ctx.stroke(); ctx.setLineDash([]);
  // spar platform
  ctx.fillStyle = "#3a2a14"; ctx.fillRect(-12 * s, -4 * s, 24 * s, 12 * s);
  const hg = ctx.createLinearGradient(0, -34 * s, 0, -4 * s); hg.addColorStop(0, dark ? "#ffb24d" : "#ffd27a"); hg.addColorStop(1, "#ff9f1c");
  ctx.fillStyle = hg; roundRect(ctx, -16 * s, -14 * s, 32 * s, 12 * s, 2 * s); ctx.fill();
  ctx.fillStyle = "#f5f6fa"; ctx.fillRect(-12 * s, -28 * s, 12 * s, 14 * s); ctx.fillRect(3 * s, -22 * s, 8 * s, 8 * s);
  ctx.fillStyle = "#3a4452"; ctx.fillRect(-10 * s, -26 * s, 3 * s, 4 * s); ctx.fillRect(-5 * s, -26 * s, 3 * s, 4 * s);
  ctx.strokeStyle = "#ff7a45"; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(6 * s, -22 * s); ctx.lineTo(6 * s, -38 * s); ctx.lineTo(12 * s, -38 * s); ctx.stroke();
  ctx.restore();
}

/* ---------- floating solar raft ---------- */
export function drawSolar(ctx, x, y, s, sun, dark = false) {
  ctx.save(); ctx.translate(x, y);
  shadowEllipse(ctx, 0, 4 * s, 30 * s, 4 * s, 0.22);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    const px = (-28 + c * 14 + r * 4) * s, py = (-6 - r * 7) * s;
    ctx.beginPath(); ctx.moveTo(px, py + 7 * s); ctx.lineTo(px + 12 * s, py + 7 * s); ctx.lineTo(px + 14 * s, py); ctx.lineTo(px + 2 * s, py); ctx.closePath();
    const g = ctx.createLinearGradient(px, py, px + 14 * s, py + 7 * s); g.addColorStop(0, dark ? "#1a2a55" : "#2c4c9c"); g.addColorStop(1, dark ? "#0d1736" : "#173276");
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "#c9d6ee"; ctx.lineWidth = 0.7 * s; ctx.stroke();
    if (sun > 0.05) { ctx.fillStyle = `rgba(255,255,255,${0.35 * sun})`; ctx.beginPath(); ctx.moveTo(px + 2 * s, py + 1 * s); ctx.lineTo(px + 6 * s, py + 1 * s); ctx.lineTo(px + 3 * s, py + 6 * s); ctx.lineTo(px + 1.4 * s, py + 6 * s); ctx.fill(); }
  }
  ctx.fillStyle = "#ffd166"; for (const bx of [-30, 30]) { ctx.beginPath(); ctx.arc(bx * s, 3 * s, 2.2 * s, 0, 7); ctx.fill(); }
  ctx.restore();
}

/* ---------- battery container on the pier; charge 0..1 ---------- */
export function drawBattery(ctx, x, y, s, charge, dark = false) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "#59616e"; ctx.fillRect(-22 * s, 0, 44 * s, 4 * s);
  ctx.fillStyle = "#e9edf2"; roundRect(ctx, -19 * s, -22 * s, 38 * s, 22 * s, 2 * s); ctx.fill();
  ctx.fillStyle = "#c9d0da"; for (let i = 0; i < 6; i++) ctx.fillRect((-17 + i * 6.2) * s, -20 * s, 1 * s, 18 * s);
  ctx.fillStyle = "#8a52d8"; ctx.fillRect(-19 * s, -12 * s, 38 * s, 3 * s);
  ctx.fillStyle = "#1c2230"; roundRect(ctx, -13 * s, -8 * s, 26 * s, 6 * s, 1.5 * s); ctx.fill();
  const n = 5;
  for (let i = 0; i < n; i++) { const on = charge > (i + 0.2) / n; ctx.fillStyle = on ? (charge < 0.25 ? "#ff6b6b" : "#4ade80") : "#364152"; ctx.fillRect((-12 + i * 5) * s, -7 * s, 4 * s, 4 * s); }
  ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.moveTo(1 * s, -27 * s); ctx.lineTo(-3 * s, -19 * s); ctx.lineTo(0, -19 * s); ctx.lineTo(-1 * s, -13.6 * s); ctx.lineTo(3.5 * s, -21 * s); ctx.lineTo(0.4 * s, -21 * s); ctx.fill();
  ctx.restore();
}

/* ---------- Harbour Isle skyline; lit = 0..1 share of windows lit ---------- */
export function drawCity(ctx, W, H, hz, hod, lit, time, reduced) {
  const baseY = H * 0.78, x0 = 0, x1 = W * 0.22;
  // headland
  const hg = ctx.createLinearGradient(0, hz - 20, 0, H); hg.addColorStop(0, isDark(hod) ? "#0b1420" : "#2f5f4a"); hg.addColorStop(1, isDark(hod) ? "#101b2b" : "#4a7a52");
  ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(0, hz - 8); ctx.quadraticCurveTo(W * 0.1, hz - 22, W * 0.2, hz + 8); ctx.quadraticCurveTo(W * 0.26, hz + 70, W * 0.21, baseY + 30); ctx.lineTo(W * 0.14, H * 0.96); ctx.lineTo(0, H); ctx.fill();
  ctx.fillStyle = isDark(hod) ? "#1a2538" : "#d9c38b"; ctx.beginPath(); ctx.moveTo(W * 0.14, H * 0.96); ctx.quadraticCurveTo(W * 0.215, H * 0.88, W * 0.225, baseY + 34); ctx.quadraticCurveTo(W * 0.245, baseY + 30, W * 0.24, baseY + 50); ctx.quadraticCurveTo(W * 0.23, H * 0.92, W * 0.2, H); ctx.lineTo(W * 0.14, H); ctx.fill();
  // buildings (deterministic layout)
  const B = [[.012, 62, 26], [.04, 92, 24], [.066, 70, 30], [.098, 118, 26], [.126, 84, 28], [.152, 64, 24], [.176, 100, 24], [.06, 50, 22]];
  const dark = isDark(hod) || hod < 6.5 || hod > 19;
  B.forEach((b, i) => {
    const bx = b[0] * W, bw = b[2], bh = b[1], by = hz + 22 + (i % 3) * 6;
    ctx.fillStyle = dark ? "#0c1524" : (i % 2 ? "#cdd6de" : "#b9c4cf"); ctx.fillRect(bx, by - bh + 60, bw, bh);
    ctx.fillStyle = dark ? "#16233a" : "rgba(255,255,255,.35)"; ctx.fillRect(bx + bw - 4, by - bh + 60, 4, bh);
    const cols = Math.floor(bw / 8), rows = Math.floor(bh / 10);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const seed = (i * 131 + r * 17 + c * 53) % 100 / 100;
      const on = seed < lit;                               // fewer lit windows = brownout; all dark = blackout
      const flick = !reduced && lit < 0.95 && lit > 0.05 && ((Math.floor(time * 2 + seed * 10) % 7) === 0);
      ctx.fillStyle = (on && !flick) ? (dark ? "#ffd98a" : "#ffe9b0") : (dark ? "#0a1120" : "#7d8fa3");
      ctx.globalAlpha = (on && !flick) ? (dark ? 1 : 0.6) : 0.8; ctx.fillRect(bx + 3 + c * 8, by - bh + 66 + r * 10, 4.5, 6);
    }
    ctx.globalAlpha = 1;
  });
  if (dark && lit > 0.2) { const gl = ctx.createLinearGradient(0, hz, 0, hz + 120); gl.addColorStop(0, `rgba(255,190,90,${0.16 * lit})`); gl.addColorStop(1, "rgba(255,190,90,0)"); ctx.fillStyle = gl; ctx.fillRect(0, hz, W * 0.25, 120); }
  // power pole / substation marker
  ctx.fillStyle = "#3a4452"; ctx.fillRect(W * 0.205, baseY - 40, 3, 70); ctx.fillRect(W * 0.197, baseY - 34, 19, 2.4);
}

/* ---------- power cable from a unit to the shore, with moving current dots ---------- */
export function drawCable(ctx, x, y, tx, ty, flow, time, color, reduced) {
  if (flow <= 0.02) { ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1; ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.quadraticCurveTo((x + tx) / 2, Math.max(y, ty) + 26, tx, ty); ctx.stroke(); ctx.setLineDash([]); return; }
  ctx.strokeStyle = color; ctx.globalAlpha = 0.25 + 0.55 * Math.min(1, flow); ctx.lineWidth = 1.2 + 2.2 * Math.min(1, flow);
  ctx.setLineDash([4, 9]); ctx.lineDashOffset = reduced ? 0 : -time * (30 + 60 * flow);
  ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.quadraticCurveTo((x + tx) / 2, Math.max(y, ty) + 26, tx, ty); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
}

export const util = { clamp, mix, mixColor };
