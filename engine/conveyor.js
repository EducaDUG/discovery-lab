/* ==========================================================================
   DISCOVERY LAB — SHARED SORTING-CONVEYOR MODULE   (engine/conveyor.js)

   Bonus Game Mechanic Library entry "Sorting conveyor" (CLAUDE.md §4,
   agreed 2026-09-23 — same shared-module split as arcade.js/quest3d.js).
   Items travel along a real moving belt toward a row of bins; the student
   must sort each one into the correct bin before it reaches the end. This
   is deliberately a different feel from both existing genres:
   - arcade.js (tunnel-rush): one item flies toward the camera in 3D depth.
   - quest3d.js (rover-quest): the student drives around collecting items.
   - conveyor.js (this file): a continuous horizontal stream the student
     reacts to and diverts, Gizmos/CK-12-style direct manipulation rather
     than arcade chrome — a moving belt with real drop-into-bin physics.

   Usage from an activity:

     import { mountConveyorSort, renderConveyorLaunch } from "../../.../engine/conveyor.js?v=1";
     const run = mountConveyorSort(host, {
       bins: [ { id, label, color, icon(svg string, optional) }, ... ],
       items: [ { id, label, binId, img(optional) }, ... ],
       rounds: 24,
       strings: { ... },
       onExit(stats) { ... }   // stats: {score, hits, total, accuracy, bestStreak}
     });

   Same design constraints as arcade.js/quest3d.js — do not "fix" away:
   - No fail state, no lives; a missed/wrong item just resets the streak.
   - Real <button> bins, never pointer-picking off the moving item itself.
   - A full round runs close to two minutes regardless of answer speed —
     each item's scheduled travel time is always waited out (see arcade.js's
     same rule) so a confident student can't speed-run the round.
   - Fully keyboard-operable (number keys 1-9 mirror the bin buttons).
   - Reduced-motion aware; its own always-visible mute button (CLAUDE.md §6).
   ========================================================================== */

import { ttsEnabled, setTTS } from "./accessibility.js?v=6";

export const DEFAULT_STRINGS = {
  title: "Bonus round — Sorting Conveyor",
  instructions: "Sort each item into the correct bin before it reaches the end of the belt.",
  score: "Score", streak: "Streak", best: "Best streak", progress: "Item",
  correct: "Sorted!", wrong: "Wrong bin.", missed: "Missed it.",
  finishTitle: "Round complete!", accuracy: "Accuracy",
  playAgain: "Play again", continueLabel: "Continue",
  skip: "Skip bonus round", play: "Play bonus round",
  soundOn: "Sound on", soundOff: "Sound off",
};

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const s = document.createElement("style");
  s.id = "dl-conveyor-styles";
  s.textContent = `
.conv{position:relative;border-radius:var(--radius-lg);overflow:hidden;background:#1a1710;
  border:1px solid #2c2517;box-shadow:var(--shadow-2);}
.conv__stage{position:relative;width:100%;min-height:16rem;padding:var(--sp-5) var(--sp-4) 0;}
.conv__hud{display:flex;justify-content:space-between;gap:var(--sp-2);padding:0 0 var(--sp-3);
  font-family:var(--font-data);color:#ffe9b8;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;}
.conv__hud b{display:block;font-size:1.1rem;letter-spacing:0;font-family:var(--font-ui);}
.conv__belt{position:relative;height:6.5rem;border-radius:var(--radius);overflow:hidden;
  background:repeating-linear-gradient(90deg,#4a3c22 0 2.2rem,#3a2f1a 2.2rem 2.4rem);
  border:3px solid #6b5530;box-shadow:inset 0 6px 14px rgba(0,0,0,.4);}
.conv__belt.is-moving{background-position-x:0;animation:conv-scroll 1.1s linear infinite;}
@keyframes conv-scroll{from{background-position-x:0}to{background-position-x:-2.4rem}}
.conv__item{position:absolute;top:50%;transform:translateY(-50%);width:4.4rem;height:4.4rem;
  border-radius:var(--radius);background:#fff;display:grid;place-items:center;font-weight:800;
  box-shadow:0 6px 14px rgba(0,0,0,.35);will-change:left;z-index:2;}
.conv__item img{width:80%;height:80%;object-fit:contain;}
.conv__item.is-falling{transition:transform .5s cubic-bezier(.3,0,.7,1),opacity .5s ease;opacity:0;}
.conv__item.is-falling.ok{transform:translateY(3.2rem) scale(.5) rotate(12deg);}
.conv__item.is-falling.bad{transform:translateY(-1.6rem) translateX(-1.2rem) rotate(-18deg);opacity:0;}
.conv__endline{position:absolute;top:0;bottom:0;right:5.6rem;width:2px;background:repeating-linear-gradient(#ff8a7a 0 6px,transparent 6px 12px);opacity:.7;}
.conv__bins{display:flex;gap:var(--sp-2);flex-wrap:wrap;justify-content:center;padding:var(--sp-4) var(--sp-3);}
.conv__bin{flex:1 1 6rem;max-width:9rem;display:flex;flex-direction:column;align-items:center;gap:.4em;
  padding:.7em .5em;border-radius:var(--radius);border:2px solid transparent;background:var(--bin-color,#333);
  color:#fff;font:inherit;font-weight:800;font-size:var(--step--1);cursor:pointer;touch-action:manipulation;
  transition:transform var(--dur-fast) var(--ease),box-shadow var(--dur-fast) var(--ease);position:relative;}
.conv__bin:hover{transform:translateY(-2px);}
.conv__bin:active{transform:translateY(0);}
.conv__bin svg{width:1.5rem;height:1.5rem;}
.conv__bin__key{position:absolute;top:3px;left:5px;font-family:var(--font-data);font-size:.6rem;opacity:.75;}
.conv__bin.is-correct{box-shadow:0 0 0 3px #fff,0 0 20px 4px rgba(255,255,255,.6);}
.conv__bin.is-wrong{box-shadow:0 0 0 3px #fff;filter:brightness(.6);}
.conv__toast{position:absolute;top:1.2rem;left:50%;transform:translate(-50%,-8px);z-index:5;pointer-events:none;
  font-family:var(--font-display);font-weight:800;font-size:var(--step-1);opacity:0;transition:opacity .2s,transform .2s;
  text-shadow:0 2px 8px rgba(0,0,0,.6);}
.conv__toast.show{opacity:1;transform:translate(-50%,0);}
.conv.is-shake{animation:conv-shake .35s;}
@keyframes conv-shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-4px)}40%,60%{transform:translateX(4px)}}
.conv__foot{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);padding:var(--sp-3);
  background:#120f0a;color:#d9c497;font-family:var(--font-data);font-size:.68rem;flex-wrap:wrap;}
.conv__mute{flex:none;display:inline-flex;align-items:center;gap:.4em;border:1px solid #6b5530;background:#1a1710;
  color:#ffe9b8;border-radius:999px;padding:.4em .8em;font:inherit;font-size:.68rem;cursor:pointer;touch-action:manipulation;}
.conv__mute:hover{border-color:#ffcf6b;color:#ffcf6b;}
.conv__mute svg{width:1rem;height:1rem;flex:none;}
.conv__finish{position:absolute;inset:0;z-index:6;display:grid;place-items:center;background:rgba(20,16,8,.94);
  color:#ffe9b8;text-align:center;padding:var(--sp-4);}
.conv__finish h3{font-family:var(--font-display);font-size:var(--step-2);margin-bottom:.3em;}
.conv__finish .conv__stats{display:flex;gap:var(--sp-5);justify-content:center;margin:var(--sp-4) 0;flex-wrap:wrap;}
.conv__finish .conv__stat b{display:block;font-size:var(--step-2);font-family:var(--font-display);color:#ffcf6b;}
.conv__finish .conv__stat span{font-family:var(--font-data);font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:#d9c497;}
.conv__finish__actions{display:flex;gap:var(--sp-3);justify-content:center;flex-wrap:wrap;}
.conv-launch{padding:var(--sp-5);border-radius:var(--radius-lg);border:2px dashed var(--line-strong);
  background:var(--surface);text-align:center;}
.conv-launch p{margin-bottom:var(--sp-3);}
`;
  document.head.appendChild(s);
}

function reducedMotion() { return document.documentElement.getAttribute("data-reduced-motion") === "on"; }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function buildQueue(items, rounds) {
  const q = [];
  while (q.length < rounds) q.push(...shuffle(items));
  return q.slice(0, rounds);
}

export function renderConveyorLaunch(host, { strings = {}, onPlay, onSkip }) {
  ensureStyles();
  const S = { ...DEFAULT_STRINGS, ...strings };
  host.innerHTML = "";
  const card = document.createElement("div"); card.className = "conv-launch";
  card.innerHTML = `<p class="eyebrow">${S.title}</p><p>${S.instructions}</p>`;
  const row = document.createElement("div"); row.className = "cluster"; row.style.justifyContent = "center";
  const playBtn = document.createElement("button"); playBtn.type = "button"; playBtn.className = "btn btn--signal";
  playBtn.textContent = "🎮 " + S.play;
  playBtn.addEventListener("click", onPlay);
  const skipBtn = document.createElement("button"); skipBtn.type = "button"; skipBtn.className = "btn btn--ghost";
  skipBtn.textContent = S.skip + " →";
  skipBtn.addEventListener("click", onSkip);
  row.append(playBtn, skipBtn);
  card.append(row);
  host.append(card);
}

export function mountConveyorSort(host, opts) {
  ensureStyles();
  const S = { ...DEFAULT_STRINGS, ...(opts.strings || {}) };
  const bins = opts.bins;
  const rounds = opts.rounds || 24;
  const queue = buildQueue(opts.items, rounds);

  const state = { index: 0, score: 0, streak: 0, bestStreak: 0, hits: 0, answered: false, disposed: false, travelMs: 5600, spawnedAt: 0 };
  const START_TRAVEL = 5600, MIN_TRAVEL = 2600, RAMP = 90, SETTLE_PAD = 400;

  host.innerHTML = "";
  const wrap = document.createElement("div"); wrap.className = "conv";
  const stage = document.createElement("div"); stage.className = "conv__stage";
  const hud = document.createElement("div"); hud.className = "conv__hud";
  hud.innerHTML = `<div>${S.progress}<b id="cv-progress">1 / ${rounds}</b></div>
    <div style="text-align:center">${S.streak}<b id="cv-streak">0</b></div>
    <div style="text-align:right">${S.score}<b id="cv-score">0</b></div>`;
  const belt = document.createElement("div"); belt.className = "conv__belt" + (reducedMotion() ? "" : " is-moving");
  const endline = document.createElement("div"); endline.className = "conv__endline";
  const toast = document.createElement("div"); toast.className = "conv__toast";
  belt.append(endline);
  stage.append(hud, belt, toast);
  wrap.append(stage);

  const binBar = document.createElement("div"); binBar.className = "conv__bins"; binBar.setAttribute("role", "group");
  binBar.setAttribute("aria-label", S.title);
  const binBtns = {};
  bins.forEach((bin, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "conv__bin";
    b.style.setProperty("--bin-color", bin.color);
    b.innerHTML = `<span class="conv__bin__key">${i + 1}</span>${bin.icon ? `<svg viewBox="0 0 64 64" aria-hidden="true">${bin.icon}</svg>` : ""}<span>${bin.label}</span>`;
    b.addEventListener("click", () => answer(bin.id));
    binBtns[bin.id] = b;
    binBar.append(b);
  });
  wrap.append(binBar);

  const foot = document.createElement("div"); foot.className = "conv__foot";
  foot.innerHTML = `<span>${S.best}: <b id="cv-best">0</b></span><span>${S.instructions}</span>`;
  const SPEAKER_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  const SPEAKER_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  const muteBtn = document.createElement("button"); muteBtn.type = "button"; muteBtn.className = "conv__mute";
  function paintMute() {
    const on = ttsEnabled();
    muteBtn.innerHTML = (on ? SPEAKER_ON : SPEAKER_OFF) + `<span>${on ? S.soundOn : S.soundOff}</span>`;
    muteBtn.setAttribute("aria-label", on ? S.soundOn : S.soundOff);
  }
  paintMute();
  muteBtn.addEventListener("click", () => { setTTS(!ttsEnabled()); paintMute(); });
  foot.prepend(muteBtn);
  wrap.append(foot);
  host.append(wrap);

  function onKey(e) {
    const n = Number(e.key);
    if (n >= 1 && n <= bins.length) answer(bins[n - 1].id);
  }
  document.addEventListener("keydown", onKey);

  function flashBin(id, cls) {
    const b = binBtns[id]; if (!b) return;
    b.classList.remove("is-correct", "is-wrong"); void b.offsetWidth; b.classList.add(cls);
    setTimeout(() => b.classList.remove(cls), 420);
  }
  function showToast(text, color) {
    toast.textContent = text; toast.style.color = color;
    toast.classList.remove("show"); void toast.offsetWidth; toast.classList.add("show");
  }
  function shakeStage() {
    if (reducedMotion()) return;
    wrap.classList.remove("is-shake"); void wrap.offsetWidth; wrap.classList.add("is-shake");
  }

  function paintHud() {
    stage.querySelector("#cv-progress").textContent = `${Math.min(state.index + 1, rounds)} / ${rounds}`;
    stage.querySelector("#cv-streak").textContent = state.streak;
    stage.querySelector("#cv-score").textContent = state.score;
    wrap.querySelector("#cv-best").textContent = state.bestStreak;
  }
  paintHud();

  let itemEl = null, rafId = null;
  function spawnItem(item, travelMs) {
    if (itemEl) itemEl.remove();
    itemEl = document.createElement("div"); itemEl.className = "conv__item";
    itemEl.innerHTML = item.img ? `<img src="${item.img}" alt="">` : `<span>${item.label}</span>`;
    itemEl.style.left = "-4.4rem";
    belt.append(itemEl);
    const startTime = performance.now();
    const beltWidth = belt.clientWidth;
    const endX = beltWidth - 5.0 * parseFloat(getComputedStyle(document.documentElement).fontSize || 16);
    function step(now) {
      if (state.disposed || !itemEl) return;
      const t = Math.min(1, (now - startTime) / travelMs);
      const x = -70 + t * (endX + 70);
      itemEl.style.left = x + "px";
      if (t >= 1) { timeUp(); return; }
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
  }

  function answer(binId) {
    if (state.disposed || state.answered || !state.current) return;
    state.answered = true;
    if (rafId) cancelAnimationFrame(rafId);
    const item = state.current;
    const correct = binId === item.binId;
    if (correct) {
      state.score += 10 + state.streak * 2;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      state.hits += 1;
      flashBin(binId, "is-correct");
      showToast(S.correct, "#8fff9c");
      if (itemEl) { itemEl.classList.add("is-falling", "ok"); }
    } else {
      state.streak = 0;
      flashBin(binId, "is-wrong");
      flashBin(item.binId, "is-correct");
      showToast(S.wrong, "#ff8a7a");
      shakeStage();
      if (itemEl) { itemEl.classList.add("is-falling", "bad"); }
    }
    paintHud();
    const elapsed = performance.now() - state.spawnedAt;
    setTimeout(nextItem, Math.max(SETTLE_PAD, state.travelMs - elapsed + SETTLE_PAD));
  }

  function timeUp() {
    if (state.disposed || state.answered || !state.current) return;
    state.answered = true;
    state.streak = 0;
    flashBin(state.current.binId, "is-correct");
    showToast(S.missed, "#ffd45c");
    if (itemEl) { itemEl.classList.add("is-falling", "bad"); }
    paintHud();
    setTimeout(nextItem, SETTLE_PAD);
  }

  function nextItem() {
    if (state.disposed) return;
    state.index += 1;
    if (state.index >= rounds) return finish();
    state.current = queue[state.index];
    state.answered = false;
    state.travelMs = Math.max(MIN_TRAVEL, START_TRAVEL - state.index * RAMP);
    state.spawnedAt = performance.now();
    paintHud();
    spawnItem(state.current, state.travelMs);
  }

  function finish() {
    const accuracy = Math.round((state.hits / rounds) * 100);
    const box = document.createElement("div"); box.className = "conv__finish";
    box.innerHTML = `<div>
      <h3>${S.finishTitle}</h3>
      <div class="conv__stats">
        <div class="conv__stat"><b>${state.score}</b><span>${S.score}</span></div>
        <div class="conv__stat"><b>${accuracy}%</b><span>${S.accuracy}</span></div>
        <div class="conv__stat"><b>${state.bestStreak}</b><span>${S.best}</span></div>
      </div>
      <div class="conv__finish__actions">
        <button type="button" class="btn btn--ghost" id="cv-again">↺ ${S.playAgain}</button>
        <button type="button" class="btn btn--signal" id="cv-continue">${S.continueLabel} →</button>
      </div>
    </div>`;
    stage.append(box);
    box.querySelector("#cv-again").addEventListener("click", () => {
      dispose(); const fresh = mountConveyorSort(host, opts);
      Object.assign(run, fresh);
    });
    box.querySelector("#cv-continue").addEventListener("click", () => {
      if (opts.onExit) opts.onExit({ score: state.score, hits: state.hits, total: rounds, accuracy, bestStreak: state.bestStreak });
    });
  }

  function dispose() {
    state.disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    document.removeEventListener("keydown", onKey);
  }

  nextItem();
  const run = { dispose };
  return run;
}
