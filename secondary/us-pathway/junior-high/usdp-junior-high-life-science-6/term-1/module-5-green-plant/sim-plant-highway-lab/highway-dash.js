/* Highway Dash — a steer-through-the-answer runner, local to sim-plant-highway-lab.
   (CLAUDE.md §4 Bonus Game Mechanic Library: "Steer-through-the-answer runner" with quiz-in-the-action.
   Not the shared tunnel-rush, not rover-quest, not the sorting conveyor used by the seed lab.)

   The student drives a sugar truck up the inside of a plant stem. A question appears, and three coloured
   gates scroll toward the truck, each one a possible answer. The student steers the truck into a lane
   (arrow keys, 1-3, or the lane buttons) and the lane they are in when the gates arrive is their answer.
   The run never stops for a quiz, a wrong gate shows the right answer and a one-line memory hook in place.

   Rules honoured (CLAUDE.md §4/§6): bonus and skippable, no lives and no fail state, the round is
   time-boxed on wall-clock time (setInterval + Date.now, never rAF, which only draws), answers are real
   <button>s with keys 1-3 and arrow keys, reduced motion is respected, a mute button is always visible. */
import { setTTS, ttsEnabled, speak } from "../../../../../../../engine/accessibility.js?v=6";

const CSS = `
.hd{background:#06201f;border:1px solid #1f6a5f;border-radius:var(--radius-lg,14px);overflow:hidden;color:#eafff6;font-family:var(--font-data,monospace);}
.hd__hud{display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;align-items:center;padding:.6rem .9rem;background:#08302c;border-bottom:1px solid #1f6a5f;font-size:.8rem;}
.hd__hud b{font-size:1.15rem;color:#ffd45c;font-variant-numeric:tabular-nums;margin-left:.3em;}
.hd__time{flex:1 1 140px;height:9px;border-radius:999px;background:#0b2a27;border:1px solid #1f6a5f;overflow:hidden;min-width:120px;}
.hd__time i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#3fc8ff,#ffd45c);transition:width .25s linear;}
.hd__prompt{display:flex;gap:.8rem;align-items:center;padding:.6rem .9rem;background:#0a3a35;border-bottom:1px solid #1f6a5f;min-height:4.4rem;}
.hd__prompt img{width:64px;height:64px;object-fit:cover;border-radius:10px;border:2px solid #ffd45c;flex:none;background:#0b2a27;}
.hd__prompt p{margin:0;font:800 1rem/1.3 var(--font-body,system-ui,sans-serif);}
.hd__stage{position:relative;line-height:0;background:#04201d;}
.hd__stage canvas{display:block;width:100%;height:auto;aspect-ratio:640/360;}
.hd__toast{position:absolute;left:50%;top:10px;transform:translateX(-50%);max-width:94%;padding:.5rem .85rem;border-radius:12px;font:700 .82rem/1.35 var(--font-body,system-ui,sans-serif);
  background:#0b2a27;border:2px solid #7bffb0;color:#eafff6;text-align:center;opacity:0;pointer-events:none;transition:opacity .2s;z-index:3;}
.hd__toast.show{opacity:1}
.hd__toast.bad{border-color:#ffb04a;background:#2a1a06;}
.hd__lanes{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;padding:.6rem;background:#08302c;border-top:1px solid #1f6a5f;}
.hd__lane{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.2rem;min-height:3.4rem;padding:.5rem .4rem;border-radius:12px;border:2px solid var(--lc);
  background:color-mix(in srgb,var(--lc) 16%,#04201d);color:#f4fffa;font:800 .84rem/1.2 var(--font-body,system-ui,sans-serif);cursor:pointer;text-align:center;transition:transform .12s,background .12s;}
.hd__lane:hover,.hd__lane:focus-visible{background:color-mix(in srgb,var(--lc) 34%,#04201d);transform:translateY(-2px);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--lc) 60%,transparent);}
.hd__lane[aria-pressed=true]{background:color-mix(in srgb,var(--lc) 52%,#04201d);box-shadow:0 0 0 3px var(--lc);}
.hd__lane kbd{position:absolute;top:4px;left:8px;font:700 .65rem var(--font-data,monospace);opacity:.8}
.hd__lane.shake{animation:hdshake .4s}
@keyframes hdshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.hd__foot{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center;padding:.5rem .8rem;background:#04201d;border-top:1px solid #1f6a5f;font-size:.7rem;color:#9fe0cf;}
.hd__mute{display:inline-flex;align-items:center;gap:.4em;border:1px solid #1f6a5f;background:#0b2a27;color:#cfeee5;border-radius:999px;padding:.25em .8em;font:inherit;cursor:pointer;}
.hd__mute:hover{border-color:#7bffb0;color:#7bffb0}
.hd__mute svg{width:16px;height:16px}
.hd__end{padding:1.2rem 1rem;text-align:center;background:radial-gradient(120% 100% at 50% 0%,#0f4a43,#04201d);}
.hd__end h3{margin:0 0 .3rem;font-size:1.4rem;color:#ffd45c}
.hd__stats{display:flex;justify-content:center;gap:1.4rem;margin:.6rem 0 1rem;flex-wrap:wrap}
.hd__stats div{font-size:.72rem;color:#9fe0cf}.hd__stats b{display:block;font-size:1.5rem;color:#fff}
.hd__review{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;margin:.6rem 0 1rem;text-align:left}
.hd__review div{width:210px;background:#0b2a27;border:1px solid #1f6a5f;border-radius:10px;padding:.5rem .6rem;font:600 .7rem/1.35 var(--font-body,system-ui,sans-serif)}
.hd__review em{color:#ffd45c;font-style:normal}
.hd__credits{font-size:.68rem;color:var(--ink-3,#6b7a72);padding:.5rem .2rem}
.hd__credits a{color:inherit}
@media (max-width:560px){.hd__lane{font-size:.74rem}.hd__prompt img{width:48px;height:48px}}
`;

const SPEAKER_ON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const SPEAKER_OFF = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

/* cfg: { questions:[{id,q,options:[a,b,c],answer:index,hook,img?}], laneColors:[3 css colours], durationMs, travelMs, cycleMs,
          credits:[{img,title,author,license,licenseUrl,page}], strings, onExit(stats) } */
export function mountHighwayDash(host, cfg) {
  if (!document.getElementById("hd-css")) { const st = document.createElement("style"); st.id = "hd-css"; st.textContent = CSS; document.head.append(st); }
  const S = Object.assign({ title: "Highway Dash", score: "Score", streak: "Streak", best: "Best streak", answered: "Answered", timeLeft: "Time left",
    finishTitle: "Delivery complete!", accuracy: "Accuracy", playAgain: "Play again", continueLabel: "Continue", revisit: "Worth another look",
    soundOn: "Sound on", soundOff: "Sound off", credits: "Photo credits",
    hint: "Steer your sugar truck into a lane with the arrow keys, keys 1 to 3, or the lane buttons. The lane you are in when the gates arrive is your answer. A wrong gate never ends the run.",
    right: "Correct!", wrong: "Not quite.", missed: "Missed it.", rightAnswer: "The answer is", lane: "Lane", waiting: "Next question coming up..." }, cfg.strings || {});
  const DUR = cfg.durationMs || 120000, TRAVEL = cfg.travelMs || 6500, CYCLE = cfg.cycleMs || 8200;
  const COLORS = cfg.laneColors || ["#3fc8ff", "#ff7c5c", "#ffd45c"];

  host.innerHTML = "";
  const root = document.createElement("section"); root.className = "hd"; root.setAttribute("aria-label", S.title);
  root.innerHTML = `
    <div class="hd__hud" aria-live="off">
      <span>${esc(S.score)}<b data-k="score">0</b></span><span>${esc(S.streak)}<b data-k="streak">0</b></span><span>${esc(S.answered)}<b data-k="done">0</b></span>
      <span class="hd__time" role="progressbar" aria-label="${esc(S.timeLeft)}" aria-valuemin="0" aria-valuemax="100"><i></i></span>
    </div>
    <div class="hd__prompt"><img alt="" hidden><p data-k="prompt" aria-live="polite">${esc(S.waiting)}</p></div>
    <div class="hd__stage"><canvas width="640" height="360"></canvas><div class="hd__toast" role="status" aria-live="polite"></div></div>
    <div class="hd__lanes" role="group" aria-label="${esc(S.lane)}"></div>
    <div class="hd__foot"><button type="button" class="hd__mute"></button><span>${esc(S.hint)}</span></div>`;
  host.append(root);
  const cv = root.querySelector("canvas"), ctx = cv.getContext("2d"), W = 640, H = 360;
  const toast = root.querySelector(".hd__toast"), lanesEl = root.querySelector(".hd__lanes");
  const hud = k => root.querySelector(`[data-k="${k}"]`), timeBar = root.querySelector(".hd__time i"), timeWrap = root.querySelector(".hd__time");
  const promptImg = root.querySelector(".hd__prompt img");
  const muteBtn = root.querySelector(".hd__mute");
  const paintMute = () => { const on = ttsEnabled(); muteBtn.innerHTML = (on ? SPEAKER_ON : SPEAKER_OFF) + `<span>${esc(on ? S.soundOn : S.soundOff)}</span>`; muteBtn.setAttribute("aria-label", on ? S.soundOn : S.soundOff); };
  muteBtn.addEventListener("click", () => { setTTS(!ttsEnabled()); paintMute(); }); paintMute();

  const laneX = [W * 0.2, W * 0.5, W * 0.8];
  const laneBtns = [0, 1, 2].map(i => {
    const b = document.createElement("button"); b.type = "button"; b.className = "hd__lane"; b.style.setProperty("--lc", COLORS[i]);
    b.setAttribute("aria-pressed", i === 1 ? "true" : "false");
    b.innerHTML = `<kbd>${i + 1}</kbd><span data-k="lane${i}">${esc(S.lane)} ${i + 1}</span>`;
    b.addEventListener("click", () => steer(i)); lanesEl.append(b); return b;
  });
  const laneLbl = i => laneBtns[i].querySelector("span");

  const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";
  let score = 0, streak = 0, best = 0, answered = 0, correct = 0, total = 0, finished = false, raf = 0, tick = 0, toastT = 0;
  let lane = 1, truckX = laneX[1], scroll = 0, gate = null, nextAt = 0, bag = [];
  const wrongList = [], sparks = [], drops = [];
  const t0 = Date.now();
  for (let i = 0; i < 26; i++) drops.push({ x: 20 + Math.random() * (W - 40), y: Math.random() * H, v: 30 + Math.random() * 40, up: i % 2 === 0, r: 2 + Math.random() * 2.5 });

  function steer(i) {
    if (finished) return; lane = Math.max(0, Math.min(2, i));
    laneBtns.forEach((b, k) => b.setAttribute("aria-pressed", k === lane ? "true" : "false"));
  }
  const onKey = e => {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { e.preventDefault(); steer(lane - 1); }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); steer(lane + 1); }
    else if ("123".indexOf(e.key) >= 0 && e.key.length === 1) { e.preventDefault(); steer(+e.key - 1); }
  };
  document.addEventListener("keydown", onKey);

  function nextQ() {
    if (!bag.length) bag = shuffle(cfg.questions);
    return bag.pop();
  }
  function spawn(now) {
    const q = nextQ();
    const order = shuffle([0, 1, 2]); // order[laneIndex] = option index shown in that lane
    gate = { q, order, born: now, resolved: false };
    root.querySelector('[data-k="prompt"]').textContent = q.q;
    if (q.img) { promptImg.src = q.img; promptImg.alt = q.alt || ""; promptImg.hidden = false; } else promptImg.hidden = true;
    [0, 1, 2].forEach(i => { laneLbl(i).textContent = q.options[order[i]]; laneBtns[i].setAttribute("aria-label", `${i + 1}. ${q.options[order[i]]}`); });
    if (ttsEnabled()) speak(q.q);
  }
  function say(html, bad) {
    toast.innerHTML = html; toast.classList.toggle("bad", !!bad); toast.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("show"), 3400);
    if (ttsEnabled()) speak(toast.textContent);
  }
  function burst(x, y, colors) {
    if (reduced()) return;
    for (let i = 0; i < 22; i++) { const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90; sparks.push({ x, y, vx: Math.cos(a) * d, vy: Math.sin(a) * d - 30, life: 1, c: colors[i % colors.length] }); }
  }
  function paintHud() { hud("score").textContent = score; hud("streak").textContent = streak; hud("done").textContent = answered; }

  function resolve(g) {
    g.resolved = true; total++; answered++;
    const optIdx = g.order[lane], ok = optIdx === g.q.answer, rightText = g.q.options[g.q.answer];
    const cx = laneX[lane];
    if (ok) {
      streak++; best = Math.max(best, streak); correct++;
      const gain = 10 + Math.min(streak, 10) * 2; score += gain; burst(cx, 250, ["#ffd45c", "#7bffb0", "#3fc8ff"]);
      say(`✔ ${esc(S.right)} +${gain}<br><span style="font-weight:600">${esc(g.q.hook)}</span>`);
    } else {
      streak = 0; wrongList.push(g.q);
      laneBtns[lane].classList.add("shake"); setTimeout(() => laneBtns[lane].classList.remove("shake"), 420);
      say(`${esc(S.wrong)} ${esc(S.rightAnswer)} <b>${esc(rightText)}</b>.<br><span style="font-weight:600">${esc(g.q.hook)}</span>`, true);
    }
    g.result = ok; g.resultAt = Date.now(); paintHud();
  }

  /* ---- drawing (rAF is cosmetic only) ---- */
  let last = performance.now();
  function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
  function wrap(text, maxW, lines = 3) {
    const words = String(text).split(" "), out = []; let cur = "";
    words.forEach(w => { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; });
    out.push(cur); return out.slice(0, lines);
  }
  function draw(now) {
    if (finished) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!reduced()) scroll = (scroll + dt * 120) % 80;
    truckX += (laneX[lane] - truckX) * Math.min(1, dt * 9);
    ctx.clearRect(0, 0, W, H);
    // stem wall and road
    const g1 = ctx.createLinearGradient(0, 0, 0, H); g1.addColorStop(0, "#0c4a40"); g1.addColorStop(1, "#052a26");
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(63,200,255,.06)"; ctx.fillRect(W / 6, 0, W / 3, H);
    ctx.fillStyle = "rgba(255,124,92,.06)"; ctx.fillRect(W / 2, 0, W / 3, H);
    ctx.strokeStyle = "rgba(160,255,220,.10)"; ctx.lineWidth = 1;
    for (let y = -80 + scroll; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3; ctx.setLineDash([22, 18]); ctx.lineDashOffset = -scroll * 1.2;
    [W / 3, (2 * W) / 3].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); });
    ctx.setLineDash([]);
    // ambient: water up, sugar down
    drops.forEach(d => {
      if (!reduced()) { d.y += (d.up ? -1 : 1) * d.v * dt; if (d.y < -6) d.y = H + 6; if (d.y > H + 6) d.y = -6; }
      ctx.fillStyle = d.up ? "rgba(63,200,255,.55)" : "rgba(255,124,92,.55)"; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill();
    });
    // gates
    if (gate) {
      const age = Date.now() - gate.born, p = Math.min(age / TRAVEL, 1.15), y = -90 + p * (300 + 90 - 30);
      if (age < TRAVEL + 900) {
        ctx.font = "800 15px 'Nunito',system-ui,sans-serif"; ctx.textAlign = "center";
        [0, 1, 2].forEach(i => {
          const x = laneX[i], w = 160, h = 78, col = COLORS[i];
          const picked = gate.resolved && lane === i, right = gate.resolved && gate.order[i] === gate.q.answer;
          ctx.save(); ctx.globalAlpha = gate.resolved && !picked && !right ? 0.45 : 1;
          rr(x - w / 2, y - h / 2, w, h, 14); ctx.fillStyle = "rgba(4,32,29,.92)"; ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = gate.resolved ? (right ? "#7bffb0" : picked ? "#ffb04a" : col) : col; ctx.stroke();
          ctx.fillStyle = "#f4fffa";
          const lines = wrap(gate.q.options[gate.order[i]], w - 18);
          lines.forEach((ln, k) => ctx.fillText(ln, x, y + 5 + (k - (lines.length - 1) / 2) * 18));
          ctx.restore();
        });
      }
    }
    // truck
    const tx = truckX, ty = 300, bob = reduced() ? 0 : Math.sin(now / 90) * 1.4;
    ctx.save(); ctx.translate(tx, ty + bob);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(0, 30, 34, 7, 0, 0, 7); ctx.fill();
    rr(-26, -8, 52, 36, 7); ctx.fillStyle = "#ff7c5c"; ctx.fill();
    rr(-22, -34, 44, 28, 7); ctx.fillStyle = "#ffd45c"; ctx.fill();
    rr(-16, -29, 32, 12, 4); ctx.fillStyle = "#bfeaff"; ctx.fill();
    ctx.fillStyle = "#fff"; [-12, 0, 12].forEach((o, k) => { ctx.fillRect(o - 4, 2 + (k % 2) * 6, 8, 8); });
    ctx.fillStyle = "#0b2a27"; ctx.strokeStyle = "#eafff6"; ctx.lineWidth = 3;
    [-16, 16].forEach(o => { ctx.beginPath(); ctx.arc(o, 28, 7, 0, 7); ctx.fill(); ctx.stroke(); });
    ctx.restore();
    // sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.life -= dt * 1.4; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 120 * dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = s.life; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(s.x, s.y, 4 * s.life + 1, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    }
    raf = requestAnimationFrame(draw);
  }

  /* ---- game clock: wall-clock interval, never rAF ---- */
  function clock() {
    if (finished) return;
    const now = Date.now(), el = now - t0;
    if (el >= DUR) { finish(); return; }
    if (gate && !gate.resolved && now - gate.born >= TRAVEL) resolve(gate);
    if (now >= nextAt && DUR - el > TRAVEL * 0.8) { spawn(now); nextAt = now + CYCLE; }
    const pct = Math.max(0, 100 * (1 - el / DUR)); timeBar.style.width = pct + "%"; timeWrap.setAttribute("aria-valuenow", Math.round(pct));
  }
  function cleanup() { finished = true; clearInterval(tick); cancelAnimationFrame(raf); clearTimeout(toastT); document.removeEventListener("keydown", onKey); }
  function finish() {
    cleanup();
    const acc = total ? Math.round(100 * correct / total) : 0;
    const uniq = [...new Map(wrongList.map(q => [q.id, q])).values()].slice(0, 6);
    root.innerHTML = `<div class="hd__end"><h3>${esc(S.finishTitle)}</h3>
      <div class="hd__stats"><div><b>${score}</b>${esc(S.score)}</div><div><b>${acc}%</b>${esc(S.accuracy)}</div><div><b>${best}</b>${esc(S.best)}</div><div><b>${correct}/${total}</b>${esc(S.answered)}</div></div>
      ${uniq.length ? `<p style="margin:.2rem 0;font-size:.78rem;color:#9fe0cf">${esc(S.revisit)}</p><div class="hd__review">${uniq.map(q => `<div>${esc(q.q)}<br><em>${esc(q.options[q.answer])}</em>. ${esc(q.hook)}</div>`).join("")}</div>` : `<p style="color:#7bffb0">A perfect run. Every gate was right!</p>`}
      <div style="display:flex;justify-content:center;gap:.6rem;flex-wrap:wrap"><button type="button" class="btn" data-a="again">${esc(S.playAgain)}</button><button type="button" class="btn btn--signal" data-a="done">${esc(S.continueLabel)}</button></div></div>`;
    root.querySelector('[data-a="again"]').addEventListener("click", () => mountHighwayDash(host, cfg));
    root.querySelector('[data-a="done"]').addEventListener("click", () => cfg.onExit && cfg.onExit({ score, accuracy: acc, bestStreak: best, correct, total }));
  }

  if (cfg.credits && cfg.credits.length) {
    const d = document.createElement("details"); d.className = "hd__credits";
    d.innerHTML = `<summary>${esc(S.credits)}</summary>` + cfg.credits.map(c => `<div>${esc(c.title)}, ${esc(c.author)}, <a href="${esc(c.licenseUrl || c.page)}" target="_blank" rel="noopener">${esc(c.license)}</a> (<a href="${esc(c.page)}" target="_blank" rel="noopener">source</a>)</div>`).join("");
    host.append(d);
  }

  paintHud(); nextAt = Date.now() + 1200;
  tick = setInterval(clock, 100); raf = requestAnimationFrame(draw);
  return { stop: cleanup };
}
