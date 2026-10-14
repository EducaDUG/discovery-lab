/* Perimeter Pac - local bonus-round module (classic "reskin a known arcade format").
   The student steers a hungry patrol character around the edge of rectangles,
   eating one dot per unit of fence. The number of dots IS the perimeter.
   - Time-boxed (default 120 s) on setInterval; requestAnimationFrame only draws.
   - Arrow keys / WASD or on-screen d-pad buttons. No lives, no fail state.
   - Own always-visible mute button (setTTS) per CLAUDE.md section 6.
   - Reduced motion: slower movement, no particles, no shake. */
import { ttsEnabled, setTTS } from "../../../../../engine/accessibility.js?v=6";

const SHAPES = [[3, 2], [4, 2], [3, 3], [5, 2], [4, 3], [5, 3], [6, 2], [4, 4], [6, 3], [5, 4]];
const W = 480, H = 320;
const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";

const CSS = `
.pp{background:#14172b;color:#f4f1e6;border-radius:14px;padding:14px;max-width:560px;border:2px solid #3a3f78}
.pp__hud{display:flex;flex-wrap:wrap;gap:6px 14px;font-family:var(--font-data,monospace);font-size:.9rem;margin-bottom:8px}
.pp__hud b{color:#ffd84a}
.pp__banner{font-weight:700;color:#9fe7ff;margin:2px 0 8px}
.pp canvas{width:100%;height:auto;display:block;border-radius:10px;background:#0c0e1d;touch-action:none}
.pp__pad{display:grid;grid-template-columns:repeat(3,56px);grid-template-rows:repeat(2,48px);gap:6px;justify-content:center;margin:10px 0}
.pp__pad button{border:2px solid #6b72c8;background:#23285a;color:#fff;border-radius:10px;font-size:1.3rem;cursor:pointer}
.pp__pad button:active,.pp__pad button:focus-visible{background:#3b43a3;outline:2px solid #ffd84a}
.pp__tray{display:flex;flex-wrap:wrap;gap:4px;min-height:22px;margin-top:6px}
.pp__foot{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:8px}
.pp__btn{border:2px solid #ffd84a;background:#ffd84a;color:#14172b;font-weight:700;border-radius:999px;padding:.45em 1.1em;cursor:pointer}
.pp__btn--ghost{background:transparent;color:#ffd84a}
.pp__mute{display:inline-flex;gap:.4em;align-items:center;border:1px solid #6b72c8;background:#1c2048;color:#f4f1e6;border-radius:999px;padding:.35em .9em;cursor:pointer}
.pp__end{text-align:center;padding:12px}
.pp__end h3{margin:.2em 0;color:#ffd84a}
.pp__end p{margin:.3em 0}
.pp__launch{border:2px dashed var(--accent,#3f7fbf);border-radius:12px;padding:14px;background:var(--accent-wash,#eef3fb)}
.pp__launch h3{margin:0 0 6px}
.pp__launch .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
`;
function injectCSS() {
  if (document.getElementById("pp-css")) return;
  const s = document.createElement("style"); s.id = "pp-css"; s.textContent = CSS; document.head.appendChild(s);
}

export function shapeIconSVG(l, w, color = "#ffd84a") {
  const u = 6, wd = l * u, ht = w * u;
  return `<svg width="${wd + 4}" height="${ht + 4}" viewBox="0 0 ${wd + 4} ${ht + 4}" aria-hidden="true"><rect x="2" y="2" width="${wd}" height="${ht}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="1 3" stroke-linecap="round"/></svg>`;
}

export function renderPacLaunch(host, { strings: S, onPlay, onSkip }) {
  injectCSS();
  host.innerHTML = `<div class="pp__launch"><h3>${S.title}</h3><p>${S.instructions}</p>
    <div class="row"><button type="button" class="pp__btn" data-a="play">${S.play}</button>
    <button type="button" class="pp__btn pp__btn--ghost" style="color:inherit;border-color:currentColor" data-a="skip">${S.skip}</button></div></div>`;
  host.querySelector('[data-a="play"]').addEventListener("click", onPlay);
  host.querySelector('[data-a="skip"]').addEventListener("click", onSkip);
}

/* Border lattice nodes of an l x w rectangle, as "x,y" keys. */
function isBorder(l, w, x, y) {
  return x >= 0 && y >= 0 && x <= l && y <= w && (x === 0 || y === 0 || x === l || y === w);
}

export function mountPacPerimeter(host, opts) {
  injectCSS();
  const S = opts.strings;
  const durationMs = (opts.durationSec || 120) * 1000;
  const speed = reduced() ? 2.6 : 4.2; // lattice steps per second
  const SOUND_ICON = (on) => on ? "&#128266;" : "&#128263;";

  host.innerHTML = `<div class="pp">
    <div class="pp__hud"><span>${S.time}: <b id="pp-time">120</b></span><span>${S.score}: <b id="pp-score">0</b></span>
      <span>${S.streak}: <b id="pp-streak">0</b></span><span>${S.shapes}: <b id="pp-shapes">0</b></span></div>
    <p class="pp__banner" id="pp-banner" aria-live="polite"></p>
    <canvas id="pp-cv" width="${W}" height="${H}" tabindex="0" role="img" aria-label="${S.canvasLabel}"></canvas>
    <div class="pp__pad" aria-label="${S.padLabel}">
      <span></span><button type="button" data-d="up" aria-label="${S.up}">&#9650;</button><span></span>
      <button type="button" data-d="left" aria-label="${S.left}">&#9664;</button>
      <button type="button" data-d="down" aria-label="${S.down}">&#9660;</button>
      <button type="button" data-d="right" aria-label="${S.right}">&#9654;</button>
    </div>
    <div class="pp__tray" id="pp-tray" aria-label="${S.tray}"></div>
    <p style="font-size:.85rem;opacity:.85;margin:6px 0 0">${S.instructions}</p>
    <div class="pp__foot"><button type="button" class="pp__mute" id="pp-mute"></button></div>
    <div id="pp-end"></div></div>`;

  const cv = host.querySelector("#pp-cv"), ctx = cv.getContext("2d");
  const el = (id) => host.querySelector(id);
  const muteBtn = el("#pp-mute");
  const paintMute = () => {
    const on = ttsEnabled();
    muteBtn.innerHTML = SOUND_ICON(on) + `<span>${on ? S.soundOn : S.soundOff}</span>`;
    muteBtn.setAttribute("aria-label", on ? S.soundOn : S.soundOff);
  };
  muteBtn.addEventListener("click", () => { setTTS(!ttsEnabled()); paintMute(); });
  paintMute();

  let score = 0, streak = 0, best = 0, done = 0, shapeIx = 0, over = false;
  let l = 0, w = 0, cell = 40, ox = 0, oy = 0, eaten = new Set();
  let px = 0, py = 0, tx = 0, ty = 0, prog = 1, dirKey = null, want = null; // moving from (px,py) to (tx,ty)
  let shapeStart = 0, remaining = durationMs / 1000;
  const parts = []; let flash = 0, shake = 0, lastT = performance.now();
  const startT = performance.now();
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  function loadShape() {
    [l, w] = SHAPES[shapeIx % SHAPES.length];
    cell = Math.min(60, Math.floor((W - 80) / l), Math.floor((H - 80) / w));
    ox = Math.round((W - l * cell) / 2); oy = Math.round((H - w * cell) / 2);
    eaten = new Set(); px = tx = 0; py = ty = 0; prog = 1; dirKey = null; want = null;
    eaten.add("0,0");
    shapeStart = performance.now();
    el("#pp-banner").textContent = S.shapeBanner.replace("{l}", l).replace("{w}", w);
  }
  const total = () => 2 * (l + w);

  function tryStep() {
    // At a node: choose the wanted direction if valid, otherwise keep going, otherwise stop.
    const order = [want, dirKey].filter(Boolean);
    for (const k of order) {
      const [dx, dy] = DIRS[k], nx = tx + dx, ny = ty + dy;
      if (isBorder(l, w, nx, ny)) { px = tx; py = ty; tx = nx; ty = ny; prog = 0; dirKey = k; return; }
    }
    dirKey = null;
  }
  function burst(x, y, color) {
    if (reduced()) return;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * 6.28, v = 40 + Math.random() * 60;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5, c: color });
    }
  }
  function eatHere() {
    const k = tx + "," + ty;
    if (eaten.has(k)) return;
    eaten.add(k); score += 10;
    burst(ox + tx * cell, oy + ty * cell, "#ffd84a");
    if (eaten.size === total()) finishShape();
    paintHud();
  }
  function finishShape() {
    const secs = (performance.now() - shapeStart) / 1000;
    const par = total() * 0.9 + 3; // generous par; missing it only resets the streak
    done++;
    if (secs <= par) { streak++; best = Math.max(best, streak); } else streak = 0;
    score += 50 + streak * 5;
    flash = 0.5; shake = reduced() ? 0 : 0.25;
    burst(ox + (l * cell) / 2, oy + (w * cell) / 2, "#9fe7ff");
    const tray = el("#pp-tray");
    tray.insertAdjacentHTML("beforeend", `<span title="${l} x ${w}">${shapeIconSVG(l, w)}</span>`);
    el("#pp-banner").textContent = S.shapeDone.replace("{l}", l).replace("{w}", w).replace("{p}", total());
    shapeIx++;
    setTimeout(() => { if (!over) loadShape(); }, 900);
    freeze = performance.now() + 900;
  }
  let freeze = 0;
  function paintHud() {
    el("#pp-time").textContent = Math.max(0, Math.ceil(remaining));
    el("#pp-score").textContent = score; el("#pp-streak").textContent = streak; el("#pp-shapes").textContent = done;
  }

  /* ---- logic clock: setInterval, never rAF (CLAUDE.md section 4) ---- */
  const tick = setInterval(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    remaining = Math.max(0, (durationMs - (now - startT)) / 1000);
    if (remaining <= 0) { endGame(); return; }
    flash = Math.max(0, flash - dt); shake = Math.max(0, shake - dt);
    for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
    if (now >= freeze) {
      let budget = speed * dt;
      let guard = 6;
      while (budget > 0 && guard-- > 0) {
        if (prog >= 1) { tryStep(); if (prog >= 1) break; }
        const need = 1 - prog, use = Math.min(budget, need);
        prog += use; budget -= use;
        if (prog >= 1) { prog = 1; eatHere(); if (now < freeze) break; }
      }
    }
    paintHud();
  }, 40);

  /* ---- drawing only on rAF ---- */
  let raf = 0;
  function draw() {
    raf = requestAnimationFrame(draw);
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    ctx.fillStyle = "#0c0e1d"; ctx.fillRect(0, 0, W, H);
    // garden fill
    ctx.fillStyle = flash > 0 ? "#2b5a3a" : "#1a3a2a";
    ctx.fillRect(ox, oy, l * cell, w * cell);
    // walls
    ctx.strokeStyle = "#5b64e0"; ctx.lineWidth = 5; ctx.strokeRect(ox, oy, l * cell, w * cell);
    // side labels
    ctx.fillStyle = "#9fe7ff"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(S.sideLabel.replace("{n}", l), ox + (l * cell) / 2, oy - 12);
    ctx.fillText(S.sideLabel.replace("{n}", w), ox - 28, oy + (w * cell) / 2 + 5);
    // dots
    for (let x = 0; x <= l; x++) for (let y = 0; y <= w; y++) {
      if (!isBorder(l, w, x, y) || eaten.has(x + "," + y)) continue;
      ctx.fillStyle = "#ffe9a8"; ctx.beginPath(); ctx.arc(ox + x * cell, oy + y * cell, 4, 0, 6.28); ctx.fill();
    }
    // player
    const cx = ox + (px + (tx - px) * prog) * cell, cy = oy + (py + (ty - py) * prog) * cell;
    const ang = dirKey === "left" ? Math.PI : dirKey === "up" ? -Math.PI / 2 : dirKey === "down" ? Math.PI / 2 : 0;
    const mouth = reduced() ? 0.25 : 0.15 + 0.3 * Math.abs(Math.sin(performance.now() / 120));
    ctx.fillStyle = "#ffd84a"; ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 13, ang + mouth, ang + 6.283 - mouth); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#14172b"; ctx.beginPath();
    ctx.arc(cx + Math.cos(ang - 1.1) * 6, cy + Math.sin(ang - 1.1) * 6, 2, 0, 6.28); ctx.fill();
    // counter
    ctx.fillStyle = "#f4f1e6"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(S.dotsCounter.replace("{n}", eaten.size).replace("{l}", l).replace("{w}", w), 8, H - 8);
    for (const p of parts) { ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* ---- input ---- */
  const KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", W: "up", s: "down", S: "down", a: "left", A: "left", d: "right", D: "right" };
  function setWant(d) {
    want = d;
    if (prog < 1 && dirKey) { // reverse mid-edge
      const [dx, dy] = DIRS[d], [cx, cy] = DIRS[dirKey];
      if (dx === -cx && dy === -cy) { [px, tx] = [tx, px]; [py, ty] = [ty, py]; prog = 1 - prog; dirKey = d; }
    } else if (prog >= 1 && !dirKey) dirKey = d;
  }
  function onKey(e) {
    const d = KEYS[e.key];
    if (!d || over) return;
    if (/^Arrow/.test(e.key)) e.preventDefault();
    setWant(d);
  }
  document.addEventListener("keydown", onKey);
  host.querySelectorAll(".pp__pad button").forEach((b) => b.addEventListener("click", () => setWant(b.dataset.d)));

  function endGame() {
    if (over) return;
    over = true;
    clearInterval(tick); cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey);
    paintHud();
    const stats = { score, shapes: done, best };
    el("#pp-end").innerHTML = `<div class="pp__end"><h3>${S.finishTitle}</h3>
      <p>${S.score}: <b>${score}</b> &middot; ${S.shapes}: <b>${done}</b> &middot; ${S.best}: <b>${best}</b></p>
      <p>${S.finishNote}</p>
      <div class="pp__foot" style="justify-content:center"><button type="button" class="pp__btn" data-a="again">${S.playAgain}</button>
      <button type="button" class="pp__btn pp__btn--ghost" data-a="go">${S.continueLabel}</button></div></div>`;
    el('[data-a="again"]').addEventListener("click", () => mountPacPerimeter(host, opts));
    el('[data-a="go"]').addEventListener("click", () => opts.onExit && opts.onExit(stats));
    el('[data-a="go"]').focus();
  }

  loadShape(); paintHud(); draw();
  cv.focus({ preventScroll: true });
  return { stop() { over = true; clearInterval(tick); cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); } };
}
