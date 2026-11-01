/* Pre-IG Stage 1 Spanish Internal Exam 4 revision: bonus game "Taxi Hop" (a reskin of the classic road-crossing game).
   A question appears, three taxis drive across the street, each carrying one answer. Hop your suitcase onto a taxi
   (button, tap or keys 1-3). Right answer = a passport stamp in a new city. Wrong answer = the taxi takes you to the
   wrong city and the right answer plus a memory hook appears. No lives, nothing can hurt you; it only costs time.
   The clock runs on setInterval wall-clock time (120 s). requestAnimationFrame only draws. The game is silent, so it needs no mute button. */
import { $, el, shuffle, burstOn, popIt, shake, reduced, toast } from "../../../../../../engine/revision-kit.js?v=22";

const CITIES = ["Madrid", "Ciudad de México", "Buenos Aires", "Lima", "Bogotá", "Sevilla", "Santiago", "Cusco", "Barcelona", "La Habana", "Quito", "Valencia"];
const TAXI = ["#ffc94d", "#3fd9a0", "#ff8fa3"];
const ROUND_MS = 120000;

export function mountTaxi(host, { bank, tx, onDone }) {
  const pickText = x => (x && typeof x === "object" ? x[tx.lang] : x);
  host.innerHTML = "";
  const wrap = el("div", "tx");
  wrap.innerHTML = `<div class="tx__bar"><span>${tx.time} <b id="txT">120</b> s</span><span>${tx.stamps} <b id="txS">0</b></span><span>${tx.streak} <b id="txK">0</b></span><button class="btn btn--ghost" id="txQuit">${tx.quit}</button></div>
  <p class="tx__q" id="txQ" aria-live="polite"></p><canvas class="tx__cv" id="txCv" width="720" height="300" role="img" aria-label="${tx.alt}"></canvas>
  <div class="tx__opts" id="txO"></div><p class="tx__fb" id="txF" aria-live="polite"></p>`;
  host.append(wrap);
  const cv = $("#txCv", wrap), g = cv.getContext("2d"), box = $("#txO", wrap), fb = $("#txF", wrap);
  const state = { t0: performance.now(), end: performance.now() + ROUND_MS, i: -1, stamps: 0, streak: 0, best: 0, asked: 0, missed: [], q: null, lock: false, hop: null, city: "", over: false };
  let order = shuffle(bank);
  const rate = [0.9, 1.25, 1.6].map(v => v * (reduced() ? 0.6 : 1));
  const phase = [0.1, 0.45, 0.8];
  function taxiX(k, now) { const p = ((now - state.t0) / 1000 * rate[k] * 0.12 + phase[k]) % 1; return -140 + p * (cv.width + 280); }
  function next() {
    state.i++; if (state.i >= order.length) { order = shuffle(bank); state.i = 0; }
    const r = order[state.i], opts = shuffle([r.ok, ...shuffle(r.w).slice(0, 2)]);
    state.q = { q: pickText(r.q), opts, ok: opts.indexOf(r.ok), ex: pickText(r.ex), raw: r }; state.lock = false; state.hop = null; state.city = "";
    $("#txQ", wrap).textContent = state.q.q; fb.textContent = ""; fb.className = "tx__fb";
    box.innerHTML = ""; opts.forEach((o, k) => { const b = el("button", "tx__o", `<i style="background:${TAXI[k]}">${k + 1}</i><span>${o}</span>`); b.addEventListener("click", () => choose(k)); box.append(b); });
  }
  function choose(k) {
    if (state.lock || state.over) return; state.lock = true; state.asked++;
    const ok = k === state.q.ok, now = performance.now(); state.hop = { k, t: now, x0: 90, ok }; state.city = CITIES[(state.stamps + state.asked) % CITIES.length];
    const b = box.children[k];
    if (ok) { state.stamps++; state.streak++; state.best = Math.max(state.best, state.streak); popIt(b); burstOn(b, "#3fd9a0"); fb.className = "tx__fb ok"; fb.innerHTML = `<b>${tx.stamp}: ${state.city}!</b> ${state.q.ex}`; }
    else { state.streak = 0; shake(b); state.missed.push(state.q.raw); box.children[state.q.ok].classList.add("ok"); b.classList.add("no"); fb.className = "tx__fb no"; fb.innerHTML = `<b>${tx.wrong} ${state.city}.</b> ${tx.right}: <b>${state.q.opts[state.q.ok]}</b>. ${state.q.ex}`; }
    $("#txS", wrap).textContent = state.stamps; $("#txK", wrap).textContent = state.streak;
    setTimeout(() => { if (!state.over) next(); }, ok ? 1500 : 2800);
  }
  const keyH = e => { if (state.over) return; const k = ["1", "2", "3"].indexOf(e.key); if (k >= 0) choose(k); };
  addEventListener("keydown", keyH);
  const clock = setInterval(() => { const left = Math.max(0, Math.ceil((state.end - performance.now()) / 1000)); $("#txT", wrap).textContent = left; if (left <= 0) finish(); }, 250);
  function finish() {
    if (state.over) return; state.over = true; clearInterval(clock); removeEventListener("keydown", keyH);
    const acc = state.asked ? Math.round(state.stamps / state.asked * 100) : 0;
    const miss = [...new Map(state.missed.map(r => [pickText(r.q) + r.ok, r])).values()].slice(0, 6).map(r => `<li>${pickText(r.q)} <b>${r.ok}</b></li>`).join("");
    host.innerHTML = `<div class="tx__end"><h3>${tx.done}</h3><p><b>${state.stamps}</b> ${tx.stamps2} · ${acc}% ${tx.acc} · ${tx.best} ${state.best}</p>${miss ? `<p><b>${tx.revisit}</b></p><ul>${miss}</ul>` : `<p>${tx.perfect}</p>`}<div class="gx-row" style="justify-content:center"><button class="btn btn--signal" id="txAgain">${tx.again}</button><a class="btn btn--ghost" href="#exam">${tx.skip}</a></div></div>`;
    $("#txAgain", host).addEventListener("click", () => mountTaxi(host, { bank, tx, onDone }));
    if (onDone) onDone(state);
  }
  $("#txQuit", wrap).addEventListener("click", finish);
  /* cosmetic drawing only */
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const sky = g.createLinearGradient(0, 0, 0, 120); sky.addColorStop(0, "#1a2a5a"); sky.addColorStop(1, "#ff9d6b");
  const bld = Array.from({ length: 16 }, (_, i) => ({ x: i * 48, w: 30 + (i * 17) % 24, h: 40 + (i * 37) % 60 }));
  function wrapFit(txt, maxW, size) { g.font = `800 ${size}px sans-serif`; while (g.measureText(txt).width > maxW && size > 9) { size--; g.font = `800 ${size}px sans-serif`; } return txt; }
  function draw(now) {
    if (state.over) return; requestAnimationFrame(draw);
    g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = sky; g.fillRect(0, 0, cv.width, 120);
    g.fillStyle = "#16203f"; bld.forEach(b => { g.fillRect(b.x, 120 - b.h, b.w, b.h); g.fillStyle = "#ffd98a"; for (let y = 120 - b.h + 6; y < 114; y += 12) g.fillRect(b.x + 6, y, 4, 5); g.fillStyle = "#16203f"; });
    g.fillStyle = "#2b2f3a"; g.fillRect(0, 120, cv.width, 150); g.fillStyle = "#8c8f98"; g.fillRect(0, 270, cv.width, 30);
    g.fillStyle = "#f2f2e6"; for (let l = 1; l < 3; l++) for (let x = ((now / 40) % 40) - 40; x < cv.width; x += 40) g.fillRect(x, 120 + l * 50 - 2, 22, 4);
    g.fillStyle = "#7dffd0"; rr(640, 126, 72, 138, 12); g.fill(); g.fillStyle = "#06231a"; g.font = "800 11px sans-serif"; g.textAlign = "center"; g.fillText(tx.passport, 676, 140);
    for (let s = 0; s < Math.min(state.stamps, 9); s++) { g.fillStyle = s % 2 ? "#c43a52" : "#2f7dd1"; g.beginPath(); g.arc(660 + (s % 2) * 32, 162 + Math.floor(s / 2) * 24, 9, 0, 6.3); g.fill(); }
    for (let k = 0; k < 3; k++) {
      let x = taxiX(k, now); const y = 128 + k * 50;
      if (state.hop && state.hop.k === k) { const p = Math.min(1, (now - state.hop.t) / 900); x = taxiX(k, now); state.hop.x = x; }
      g.fillStyle = TAXI[k]; rr(x, y + 8, 116, 30, 10); g.fill(); rr(x + 22, y - 2, 70, 18, 8); g.fill();
      g.fillStyle = "#1b2233"; g.beginPath(); g.arc(x + 26, y + 38, 8, 0, 6.3); g.arc(x + 90, y + 38, 8, 0, 6.3); g.fill();
      g.fillStyle = "#06231a"; g.textAlign = "center"; g.font = "800 13px sans-serif"; g.fillText(String(k + 1), x + 58, y + 14);
      if (state.q) { const t = wrapFit(state.q.opts[k], 104, 12); g.fillStyle = "#06231a"; g.fillText(t.length > 22 ? t.slice(0, 21) + "…" : t, x + 58, y + 29); }
    }
    let sx = 38, sy = 270;
    if (state.hop) { const k = state.hop.k, p = Math.min(1, (now - state.hop.t) / 700), tx2 = state.hop.x + 58, ty = 128 + k * 50 - 12; sx = 38 + (tx2 - 38) * p; sy = 270 + (ty - 270) * p - Math.sin(p * Math.PI) * 30; if (p >= 1) { sx = tx2 + (now - state.hop.t - 700) * 0.02; sy = ty; } }
    g.fillStyle = "#e0483a"; rr(sx - 14, sy - 22, 28, 22, 5); g.fill(); g.strokeStyle = "#7a1f1a"; g.lineWidth = 3; g.beginPath(); g.moveTo(sx - 6, sy - 22); g.lineTo(sx - 6, sy - 28); g.lineTo(sx + 6, sy - 28); g.lineTo(sx + 6, sy - 22); g.stroke(); g.fillStyle = "#222"; g.beginPath(); g.arc(sx - 9, sy + 2, 3, 0, 6.3); g.arc(sx + 9, sy + 2, 3, 0, 6.3); g.fill();
  }
  next(); requestAnimationFrame(draw);
}
