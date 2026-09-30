/* Sowing Sorter — a sorting-conveyor bonus round, local to sim-seed-germination-lab.
   (CLAUDE.md §4 Bonus Game Mechanic Library: "Sorting conveyor". Not the shared tunnel-rush or rover-quest.)

   Real photos of growing situations ride a belt toward a sorting gate. The student diverts each one into
   a bin — "Wakes up" / "Stays dormant" / "Depends on the seed" — before it reaches the end of the belt.

   Rules honoured (CLAUDE.md §4/§6): bonus and skippable, no lives and no fail state (a late or wrong sort
   just resets the streak and shows the right answer plus a one-line memory hook, in place); the round is
   time-boxed on wall-clock time (setInterval + Date.now, never rAF, which only draws); the bins are real
   <button>s and keys 1-3 work; reduced motion is respected; a mute button is always visible. */
import { setTTS, ttsEnabled, speak } from "../../../../../../../engine/accessibility.js?v=6";

const CSS = `
.cv{background:#04120d;border:1px solid #2f6b4d;border-radius:var(--radius-lg,14px);overflow:hidden;color:#e8fff2;font-family:var(--font-data,monospace);}
.cv__hud{display:flex;flex-wrap:wrap;gap:.5rem 1.2rem;align-items:center;padding:.6rem .9rem;background:#061a12;border-bottom:1px solid #1d4d38;font-size:.8rem;}
.cv__hud b{font-size:1.15rem;color:#a6ff5c;font-variant-numeric:tabular-nums;margin-left:.3em;}
.cv__time{flex:1 1 140px;height:9px;border-radius:999px;background:#0d241d;border:1px solid #2f6b4d;overflow:hidden;min-width:120px;}
.cv__time i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#3fd08b,#a6ff5c);transition:width .25s linear;}
.cv__scene{position:relative;height:340px;overflow:hidden;background:radial-gradient(120% 90% at 50% 0%,#1d5a43 0%,#0d3324 45%,#04120d 100%);}
.cv__glass{position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 78px,rgba(166,255,92,.05) 78px 80px);pointer-events:none;}
.cv__lamp{position:absolute;top:-30px;width:220px;height:260px;background:radial-gradient(closest-side,rgba(255,240,180,.28),transparent);pointer-events:none;}
.cv__belt{position:absolute;left:-4%;right:-4%;bottom:26px;height:70px;background:
  repeating-linear-gradient(90deg,#2a3a33 0 22px,#1a2822 22px 44px);border-top:5px solid #4d6b5f;border-bottom:8px solid #0a1410;
  box-shadow:0 14px 26px rgba(0,0,0,.6);animation:cvbelt 1.2s linear infinite;background-size:44px 100%;}
@keyframes cvbelt{to{background-position:44px 0}}
.cv__gate{position:absolute;right:10px;bottom:24px;width:14px;height:190px;border-radius:7px;background:linear-gradient(180deg,rgba(166,255,92,.0),rgba(166,255,92,.55));border:1px dashed #a6ff5c;pointer-events:none;}
.cv__gatelbl{position:absolute;right:28px;bottom:210px;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:#a6ff5c;pointer-events:none;}
.cv__card{position:absolute;left:0;bottom:70px;width:172px;border-radius:12px;background:#f4fff8;color:#062014;overflow:hidden;
  box-shadow:0 10px 22px rgba(0,0,0,.55);transform-origin:50% 100%;will-change:transform;border:3px solid #cfeedd;}
.cv__card img{display:block;width:100%;height:112px;object-fit:cover;background:#bcd9c8;}
.cv__card figcaption{font:600 .72rem/1.25 var(--font-body,system-ui,sans-serif);padding:.4rem .5rem .45rem;min-height:2.9em;}
.cv__card.is-active{border-color:#ffd45c;box-shadow:0 0 0 3px rgba(255,212,92,.55),0 12px 26px rgba(0,0,0,.6);}
.cv__card.is-active::after{content:"SORT ME";position:absolute;top:6px;left:6px;font:800 .6rem var(--font-data,monospace);letter-spacing:.12em;
  background:#ffd45c;color:#3a2a00;border-radius:999px;padding:.15em .6em;}
.cv__card.is-out{transition:transform .5s cubic-bezier(.5,0,.75,.4),opacity .5s ease;opacity:0;}
.cv__toast{position:absolute;left:50%;top:12px;transform:translateX(-50%);max-width:92%;padding:.55rem .9rem;border-radius:12px;font:700 .82rem/1.35 var(--font-body,system-ui,sans-serif);
  background:#0d241d;border:2px solid #3fd08b;color:#e8fff2;text-align:center;opacity:0;pointer-events:none;transition:opacity .2s;z-index:5;}
.cv__toast.show{opacity:1}
.cv__toast.bad{border-color:#ffb04a;background:#2a1a06;}
.cv__pop{position:absolute;font:800 1.2rem var(--font-data,monospace);color:#a6ff5c;pointer-events:none;z-index:6;animation:cvpop .9s ease-out forwards;text-shadow:0 2px 6px #000;}
.cv__pop.bad{color:#ffb04a}
@keyframes cvpop{from{transform:translateY(0);opacity:1}to{transform:translateY(-54px);opacity:0}}
.cv__spark{position:absolute;width:8px;height:8px;border-radius:50%;pointer-events:none;z-index:6;}
.cv__bins{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;padding:.6rem;background:#061a12;border-top:1px solid #1d4d38;}
.cv__bin{position:relative;display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.6rem .4rem .55rem;border-radius:12px;border:2px solid var(--bc);
  background:color-mix(in srgb,var(--bc) 18%,#04120d);color:#f2fff7;font:800 .82rem var(--font-body,system-ui,sans-serif);cursor:pointer;transition:transform .12s,background .12s;}
.cv__bin:hover,.cv__bin:focus-visible{background:color-mix(in srgb,var(--bc) 34%,#04120d);transform:translateY(-2px);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--bc) 60%,transparent);}
.cv__bin svg{width:34px;height:34px}
.cv__bin small{font:600 .66rem var(--font-data,monospace);opacity:.85;text-align:center}
.cv__bin kbd{position:absolute;top:5px;left:8px;font:700 .65rem var(--font-data,monospace);opacity:.8}
.cv__bin.flash-ok{animation:cvok .5s ease}
.cv__bin.flash-bad{animation:cvbad .5s ease}
@keyframes cvok{0%{box-shadow:0 0 0 0 #a6ff5c}50%{box-shadow:0 0 0 10px rgba(166,255,92,.35);transform:scale(1.06)}100%{box-shadow:0 0 0 0 transparent}}
@keyframes cvbad{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.cv__foot{display:flex;flex-wrap:wrap;gap:.5rem 1rem;align-items:center;padding:.5rem .8rem;background:#04120d;border-top:1px solid #1d4d38;font-size:.7rem;color:#9fd8b6;}
.cv__mute{display:inline-flex;align-items:center;gap:.4em;border:1px solid #2f6b4d;background:#0d241d;color:#cfeedd;border-radius:999px;padding:.25em .8em;font:inherit;cursor:pointer;}
.cv__mute:hover{border-color:#7bffb0;color:#7bffb0}
.cv__end{padding:1.2rem 1rem;text-align:center;background:radial-gradient(120% 100% at 50% 0%,#14352a,#04120d);}
.cv__end h3{margin:0 0 .3rem;font-size:1.4rem;color:#a6ff5c}
.cv__stats{display:flex;justify-content:center;gap:1.4rem;margin:.6rem 0 1rem;flex-wrap:wrap}
.cv__stats div{font-size:.72rem;color:#9fd8b6}.cv__stats b{display:block;font-size:1.5rem;color:#fff}
.cv__review{display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;margin:.6rem 0 1rem;text-align:left}
.cv__review figure{margin:0;width:150px;background:#0d241d;border:1px solid #2f6b4d;border-radius:10px;overflow:hidden;font:600 .68rem/1.3 var(--font-body,system-ui,sans-serif)}
.cv__review img{width:100%;height:70px;object-fit:cover;display:block}.cv__review figcaption{padding:.35rem .45rem}
.cv__review em{color:#ffd45c;font-style:normal}
.cv__credits{font-size:.68rem;color:var(--ink-3,#6b7a72);padding:.5rem .2rem}
.cv__credits a{color:inherit}
[data-reduced-motion="on"] .cv__belt{animation:none}
[data-reduced-motion="on"] .cv__card.is-out,[data-reduced-motion="on"] .cv__pop{transition:none;animation:none}
@media (max-width:560px){.cv__card{width:132px}.cv__card img{height:84px}.cv__scene{height:300px}}
`;

const BIN_ICONS = {
  wake: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 35V19" stroke="#a6ff5c" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M20 21C11 21 8 13 8 8c8 0 12 4 12 13z" fill="#3fd08b"/><path d="M20 18c0-7 4-11 12-11 0 6-3 11-12 11z" fill="#a6ff5c"/><ellipse cx="20" cy="36" rx="9" ry="2.5" fill="#6b4a2b"/></svg>`,
  dormant: `<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="22" rx="9" ry="12" fill="#8fb4ff"/><path d="M14 16c3-3 9-3 12 0" stroke="#eaf1ff" stroke-width="2" fill="none" stroke-linecap="round"/><text x="27" y="12" font-size="10" font-weight="800" fill="#eaf1ff" font-family="sans-serif">z</text><text x="32" y="7" font-size="7" font-weight="800" fill="#eaf1ff" font-family="sans-serif">z</text></svg>`,
  depends: `<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="13" cy="24" rx="7" ry="9" fill="#ffd45c"/><ellipse cx="27" cy="24" rx="7" ry="9" fill="#ff9d4a"/><path d="M20 6v9M20 15l-6 5M20 15l6 5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>`,
};
const SPEAKER_ON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const SPEAKER_OFF = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lerp = (a, b, t) => a + (b - a) * t;
const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

/* cfg: { cards:[{id,img,caption,answer,hook}], bins:[{id,label,sub,color}], durationMs, travelMs, spawnMs,
          credits:[{img,title,author,license,licenseUrl,page}], strings, onExit(stats) } */
export function mountConveyor(host, cfg) {
  if (!document.getElementById("cv-css")) { const st = document.createElement("style"); st.id = "cv-css"; st.textContent = CSS; document.head.append(st); }
  const S = Object.assign({ score: "Score", streak: "Streak", best: "Best streak", sorted: "Sorted", timeLeft: "Time left",
    finishTitle: "Round complete!", accuracy: "Accuracy", playAgain: "Play again", continueLabel: "Continue", revisit: "Worth another look",
    soundOn: "Sound on", soundOff: "Sound off", credits: "Photo credits", hint: "Sort each photo before it reaches the gate. Press 1, 2 or 3, or tap a bin. A late or wrong sort just resets your streak — never a fail.",
    right: "Correct!", wrong: "Not quite —", missed: "Missed it —", rightAnswer: "it's" }, cfg.strings || {});
  const DUR = cfg.durationMs || 120000, TRAVEL = cfg.travelMs || 9500, SPAWN = cfg.spawnMs || 4800;
  const binById = Object.fromEntries(cfg.bins.map(b => [b.id, b]));

  host.innerHTML = "";
  const root = document.createElement("section"); root.className = "cv"; root.setAttribute("aria-label", "Sowing Sorter bonus round");
  root.innerHTML = `
    <div class="cv__hud" aria-live="off">
      <span>${S.score}<b data-k="score">0</b></span><span>${S.streak}<b data-k="streak">0</b></span><span>${S.sorted}<b data-k="sorted">0</b></span>
      <span class="cv__time" role="progressbar" aria-label="${S.timeLeft}" aria-valuemin="0" aria-valuemax="100"><i></i></span>
    </div>
    <div class="cv__scene"><div class="cv__glass"></div><div class="cv__lamp" style="left:8%"></div><div class="cv__lamp" style="left:52%"></div>
      <div class="cv__belt"></div><div class="cv__gate"></div><div class="cv__gatelbl">Sorting gate</div>
      <div class="cv__toast" role="status" aria-live="polite"></div></div>
    <div class="cv__bins" role="group" aria-label="Bins"></div>
    <div class="cv__foot"><button type="button" class="cv__mute"></button><span>${esc(S.hint)}</span></div>`;
  host.append(root);
  const scene = root.querySelector(".cv__scene"), toast = root.querySelector(".cv__toast"), binsEl = root.querySelector(".cv__bins");
  const hud = k => root.querySelector(`[data-k="${k}"]`), timeBar = root.querySelector(".cv__time i"), timeWrap = root.querySelector(".cv__time");
  const muteBtn = root.querySelector(".cv__mute");
  const paintMute = () => { const on = ttsEnabled(); muteBtn.innerHTML = (on ? SPEAKER_ON : SPEAKER_OFF) + `<span>${on ? S.soundOn : S.soundOff}</span>`; muteBtn.setAttribute("aria-label", on ? S.soundOn : S.soundOff); };
  muteBtn.addEventListener("click", () => { setTTS(!ttsEnabled()); paintMute(); }); paintMute();

  const binBtns = {};
  cfg.bins.forEach((b, i) => {
    const el = document.createElement("button"); el.type = "button"; el.className = "cv__bin"; el.style.setProperty("--bc", b.color);
    el.innerHTML = `<kbd>${i + 1}</kbd>${BIN_ICONS[b.id] || ""}<span>${esc(b.label)}</span><small>${esc(b.sub || "")}</small>`;
    el.setAttribute("aria-label", `${i + 1}. ${b.label}. ${b.sub || ""}`);
    el.addEventListener("click", () => sortActive(b.id));
    binBtns[b.id] = el; binsEl.append(el);
  });

  const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";
  let W = scene.clientWidth || 640;
  const onResize = () => { W = scene.clientWidth || W; };
  window.addEventListener("resize", onResize);

  /* ---- state ---- */
  let score = 0, streak = 0, best = 0, sorted = 0, correct = 0, total = 0;
  const wrongList = [];
  let bag = [], live = [], nextSpawn = 0, t0 = Date.now(), finished = false, raf = 0, tick = 0, toastT = 0;
  const cardW = () => (W < 560 ? 132 : 172);

  const nextCard = () => {
    if (!bag.length) bag = shuffle(cfg.cards.concat(cfg.cards.filter(c => c.answer === "depends")));
    let c = bag.pop();
    if (live.length && live[live.length - 1].card === c && bag.length) { const alt = bag.pop(); bag.unshift(c); c = alt; }
    return c;
  };
  function spawn(now) {
    const card = nextCard();
    const el = document.createElement("figure"); el.className = "cv__card";
    el.innerHTML = `<img src="${esc(card.img)}" alt="${esc(card.alt || card.caption)}" draggable="false"><figcaption>${esc(card.caption)}</figcaption>`;
    scene.append(el);
    live.push({ card, el, born: now, phase: Math.random() * 6, state: "riding" });
  }
  const pos = (it, now) => {
    const p = (now - it.born) / TRAVEL, cw = cardW();
    const x = lerp(-cw, W - cw - 26, Math.min(p, 1.02));
    const sc = lerp(0.82, 1.04, Math.min(p, 1));
    const bob = reduced() ? 0 : Math.sin(now / 170 + it.phase) * 2.5;
    return { x, sc, bob, p };
  };
  function draw() {
    if (finished) return;
    const now = Date.now();
    live.forEach(it => {
      if (it.state !== "riding") return;
      const q = pos(it, now);
      it.el.style.transform = `translate(${q.x}px,${q.bob}px) scale(${q.sc})`;
    });
    raf = requestAnimationFrame(draw);
  }
  function activeItem() {
    let a = null; live.forEach(it => { if (it.state === "riding" && (!a || it.born < a.born)) a = it; });
    live.forEach(it => it.el.classList.toggle("is-active", it === a));
    return a;
  }

  /* ---- juice ---- */
  function say(html, bad) {
    toast.innerHTML = html; toast.classList.toggle("bad", !!bad); toast.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove("show"), 3600);
    if (ttsEnabled()) speak(toast.textContent);
  }
  function pop(txt, x, y, bad) {
    const p = document.createElement("div"); p.className = "cv__pop" + (bad ? " bad" : ""); p.textContent = txt; p.style.left = x + "px"; p.style.top = y + "px";
    scene.append(p); setTimeout(() => p.remove(), 950);
  }
  function burst(x, y, colors) {
    if (reduced()) return;
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("span"); s.className = "cv__spark"; s.style.left = x + "px"; s.style.top = y + "px"; s.style.background = colors[i % colors.length];
      scene.append(s);
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
      s.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.2)`, opacity: 0 }], { duration: 650, easing: "ease-out" }).onfinish = () => s.remove();
    }
  }
  function paintHud() {
    hud("score").textContent = score; hud("streak").textContent = streak; hud("sorted").textContent = sorted;
  }

  /* ---- sorting ---- */
  function resolve(it, choice, wasLate) {
    if (it.state !== "riding") return;
    it.state = "out"; total++;
    const ok = !wasLate && choice === it.card.answer, right = binById[it.card.answer];
    const q = pos(it, Date.now()), sceneR = scene.getBoundingClientRect();
    let tx = q.x + cardW() / 2, ty = scene.clientHeight - 90;
    if (choice && binBtns[choice]) { const r = binBtns[choice].getBoundingClientRect(); tx = r.left + r.width / 2 - sceneR.left - cardW() / 2; ty = scene.clientHeight + 40; }
    it.el.classList.remove("is-active"); it.el.classList.add("is-out");
    it.el.style.transform = `translate(${choice ? tx : q.x + 60}px,${ty - 200}px) scale(.35)`;
    setTimeout(() => { it.el.remove(); live = live.filter(x => x !== it); }, 560);
    const cx = Math.min(Math.max(q.x + cardW() / 2, 40), W - 40), cy = scene.clientHeight - 150;
    if (ok) {
      streak++; best = Math.max(best, streak); correct++; sorted++;
      const gain = 10 + Math.min(streak, 10) * 2; score += gain;
      pop("+" + gain, cx, cy); burst(cx, cy, ["#a6ff5c", "#3fd08b", "#ffd45c"]);
      binBtns[choice].classList.add("flash-ok"); setTimeout(() => binBtns[choice].classList.remove("flash-ok"), 520);
      say(`✔ ${esc(S.right)} <br><span style="font-weight:600">${esc(it.card.hook)}</span>`);
    } else {
      streak = 0; if (!wasLate) sorted++;
      wrongList.push(it.card);
      pop(wasLate ? "late" : "✗", cx, cy, true);
      if (choice && binBtns[choice]) { binBtns[choice].classList.add("flash-bad"); setTimeout(() => binBtns[choice].classList.remove("flash-bad"), 520); }
      say(`${esc(wasLate ? S.missed : S.wrong)} ${esc(S.rightAnswer)} <b>${esc(right.label)}</b>.<br><span style="font-weight:600">${esc(it.card.hook)}</span>`, true);
    }
    paintHud(); activeItem();
  }
  function sortActive(binId) { if (finished) return; const a = activeItem(); if (a) resolve(a, binId, false); else { binBtns[binId].classList.add("flash-bad"); setTimeout(() => binBtns[binId].classList.remove("flash-bad"), 500); say("Wait for the next photo to arrive on the belt…"); } }

  const onKey = e => {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    const i = "123".indexOf(e.key); if (i >= 0 && cfg.bins[i]) { e.preventDefault(); sortActive(cfg.bins[i].id); }
  };
  document.addEventListener("keydown", onKey);

  /* ---- game clock: wall-clock interval, never rAF ---- */
  function clock() {
    if (finished) return;
    const now = Date.now(), el = now - t0;
    if (el >= DUR) { finish(); return; }
    if (now >= nextSpawn && DUR - el > TRAVEL * 0.7) { spawn(now); nextSpawn = now + SPAWN; }
    live.forEach(it => { if (it.state === "riding" && now - it.born >= TRAVEL) resolve(it, null, true); });
    const pct = Math.max(0, 100 * (1 - el / DUR)); timeBar.style.width = pct + "%"; timeWrap.setAttribute("aria-valuenow", Math.round(pct));
    activeItem();
  }
  function cleanup() { finished = true; clearInterval(tick); cancelAnimationFrame(raf); clearTimeout(toastT); document.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); }
  function finish() {
    cleanup();
    const acc = total ? Math.round(100 * correct / total) : 0;
    const uniq = [...new Map(wrongList.map(c => [c.id, c])).values()].slice(0, 6);
    root.innerHTML = `<div class="cv__end"><h3>${esc(S.finishTitle)}</h3>
      <div class="cv__stats"><div><b>${score}</b>${S.score}</div><div><b>${acc}%</b>${S.accuracy}</div><div><b>${best}</b>${S.best}</div><div><b>${correct}/${total}</b>${S.sorted}</div></div>
      ${uniq.length ? `<p style="margin:.2rem 0;font-size:.78rem;color:#9fd8b6">${esc(S.revisit)}</p><div class="cv__review">${uniq.map(c => `<figure><img src="${esc(c.img)}" alt=""><figcaption>${esc(c.caption)}<br><em>${esc(binById[c.answer].label)}</em> — ${esc(c.hook)}</figcaption></figure>`).join("")}</div>` : `<p style="color:#a6ff5c">A perfect sort — every photo in the right bin!</p>`}
      <div class="cluster" style="justify-content:center;display:flex;gap:.6rem;flex-wrap:wrap"><button type="button" class="btn" data-a="again">${esc(S.playAgain)}</button><button type="button" class="btn btn--signal" data-a="done">${esc(S.continueLabel)}</button></div></div>`;
    root.querySelector('[data-a="again"]').addEventListener("click", () => mountConveyor(host, cfg));
    root.querySelector('[data-a="done"]').addEventListener("click", () => cfg.onExit && cfg.onExit({ score, accuracy: acc, bestStreak: best, correct, total }));
  }

  if (cfg.credits && cfg.credits.length) {
    const d = document.createElement("details"); d.className = "cv__credits";
    d.innerHTML = `<summary>${esc(S.credits)}</summary>` + cfg.credits.map(c => `<div>${esc(c.title)} — ${esc(c.author)}, <a href="${esc(c.licenseUrl || c.page)}" target="_blank" rel="noopener">${esc(c.license)}</a> (<a href="${esc(c.page)}" target="_blank" rel="noopener">source</a>)</div>`).join("");
    host.append(d);
  }

  spawn(Date.now()); nextSpawn = Date.now() + SPAWN; paintHud(); activeItem();
  tick = setInterval(clock, 100); raf = requestAnimationFrame(draw);
  return { stop: cleanup };
}
