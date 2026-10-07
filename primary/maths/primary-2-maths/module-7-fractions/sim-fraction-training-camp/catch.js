/* Benchmark Catch — timing/rhythm-catch bonus round (local to this activity).
   A glowing ball sweeps along a 0-1 number line; the student presses CATCH
   when it is over where the shown fraction sits. Time-boxed on a wall-clock
   setInterval (never rAF). No fail state: a miss just reveals the true spot. */
let css = false;
function styles() {
  if (css) return; css = true;
  const s = document.createElement("style");
  s.textContent = `
.bc{border-radius:var(--radius-lg);overflow:hidden;background:linear-gradient(180deg,#0d2238,#143a5c 60%,#1d5a74);color:#eaf6ff;border:1px solid #0a1a2b;box-shadow:var(--shadow-2);padding:var(--sp-4);position:relative}
.bc__hud{display:flex;justify-content:space-between;font-family:var(--font-data);font-size:.72rem;letter-spacing:.06em;text-transform:uppercase}
.bc__hud b{display:block;font-size:1.2rem;letter-spacing:0;font-family:var(--font-ui)}
.bc__card{display:flex;flex-direction:column;align-items:center;gap:.4rem;margin:var(--sp-4) auto;padding:.8rem 1.4rem;border-radius:var(--radius);background:#fff;color:#12304d;width:max-content;box-shadow:0 8px 20px rgba(0,0,0,.35)}
.bc__card img{width:11rem;height:auto}.bc__card strong{font-size:2rem;line-height:1}
.bc__line{position:relative;height:6rem;margin:var(--sp-3) 1.4rem 0}
.bc__rail{position:absolute;left:0;right:0;top:2.2rem;height:.7rem;border-radius:99px;background:linear-gradient(90deg,#a24f7a,#3f8f6b 50%,#e0b64c);box-shadow:0 0 0 3px rgba(255,255,255,.15)}
.bc__tick{position:absolute;top:3.5rem;transform:translateX(-50%);font-weight:800;font-size:1rem}
.bc__ball{position:absolute;top:1.15rem;width:2.6rem;height:2.6rem;margin-left:-1.3rem;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffd34d 45%,#f08a1c);box-shadow:0 0 18px 6px rgba(255,200,70,.55)}
.bc__pin{position:absolute;top:0;width:3px;height:3.4rem;margin-left:-1px;background:#7dffb4;border-radius:2px;box-shadow:0 0 10px #7dffb4;opacity:0}
.bc__pin.on{opacity:1}
.bc__pin span{position:absolute;top:-1.4rem;left:50%;transform:translateX(-50%);font-weight:800;font-size:.85rem;color:#7dffb4;white-space:nowrap}
.bc__msg{min-height:3.6rem;text-align:center;margin:var(--sp-3) 0;font-weight:700}
.bc__msg small{display:block;font-weight:500;opacity:.9}
.bc__go{display:block;margin:0 auto;font:inherit;font-weight:900;font-size:1.3rem;padding:.7em 2.6em;border-radius:99px;border:0;background:#ffd34d;color:#3a2600;cursor:pointer;box-shadow:0 5px 0 #b8861a;touch-action:manipulation}
.bc__go:active{transform:translateY(3px);box-shadow:0 2px 0 #b8861a}.bc__go:disabled{opacity:.5}
.bc__pop{position:absolute;left:50%;top:38%;transform:translateX(-50%);font-weight:900;font-size:2rem;color:#ffd34d;text-shadow:0 2px 8px #000;pointer-events:none;animation:bc-rise 1s ease-out forwards}
@keyframes bc-rise{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,-3rem)}}
:root[data-reduced-motion="on"] .bc__pop{animation:none;opacity:1}
.bc__end{text-align:center;padding:var(--sp-5) 0}.bc__end h3{margin:0 0 .5rem;font-size:1.6rem}
.bc__row{display:flex;gap:.6rem;justify-content:center;margin-top:var(--sp-4);flex-wrap:wrap}
`;
  document.head.append(s);
}
const ZONES = [[0.05, 3, "Bullseye!"], [0.12, 2, "Great catch!"], [0.2, 1, "Close!"]];

export function mountBenchmarkCatch(host, { items, durationMs = 120000, strings: S, onExit }) {
  styles();
  let score = 0, streak = 0, best = 0, hits = 0, played = 0, cur = null;
  let t0 = 0, itemStart = 0, locked = true, timer = null, ended = false, order = [];
  const PERIOD = 3600, LIMIT = 7500, PAUSE = 1700;
  host.innerHTML = `<div class="bc" role="group" aria-label="${S.title}">
    <div class="bc__hud"><div>${S.time}<b id="bc-t">2:00</b></div><div>${S.streak}<b id="bc-s">0</b></div><div>${S.score}<b id="bc-p">0</b></div></div>
    <p style="text-align:center;margin:.6rem 0 0">${S.instructions}</p>
    <div class="bc__card"><img id="bc-i" alt=""><strong id="bc-f"></strong></div>
    <div class="bc__line"><div class="bc__rail"></div>
      <span class="bc__tick" style="left:0">0</span><span class="bc__tick" style="left:50%">1/2</span><span class="bc__tick" style="left:100%">1</span>
      <div class="bc__pin" id="bc-pin"><span id="bc-pl"></span></div><div class="bc__ball" id="bc-b"></div></div>
    <p class="bc__msg" id="bc-m" aria-live="polite"></p>
    <button type="button" class="bc__go" id="bc-go">${S.catchLabel}</button></div>`;
  const $ = id => host.querySelector("#" + id);
  const root = host.querySelector(".bc");
  const pos = ms => { const p = (ms % PERIOD) / PERIOD; return p < 0.5 ? p * 2 : 2 - p * 2; };
  function next() {
    if (!order.length) order = items.map((_, i) => i).sort(() => Math.random() - 0.5);
    cur = items[order.pop()]; played++;
    $("bc-i").src = cur.img; $("bc-f").textContent = cur.label;
    $("bc-pin").classList.remove("on"); $("bc-m").textContent = "";
    itemStart = performance.now(); locked = false; $("bc-go").disabled = false;
  }
  function resolve(missed) {
    if (locked) return; locked = true; $("bc-go").disabled = true;
    const v = cur.num / cur.den, p = pos(performance.now() - itemStart);
    const z = missed ? null : ZONES.find(zz => Math.abs(p - v) <= zz[0]);
    if (z) { score += z[1] * 10 + Math.min(streak, 5) * 2; streak++; best = Math.max(best, streak); hits++; } else streak = 0;
    $("bc-pin").style.left = v * 100 + "%"; $("bc-pl").textContent = cur.label; $("bc-pin").classList.add("on");
    $("bc-m").innerHTML = (z ? "✓ " + z[2] : (missed ? S.missed : S.off)) + `<small>${cur.label} ${S.sitsNear} <b>${cur.near}</b>. ${cur.hook}</small>`;
    if (z) { const pop = document.createElement("div"); pop.className = "bc__pop"; pop.textContent = "+" + (z[1] * 10); root.append(pop); setTimeout(() => pop.remove(), 1000); }
    setTimeout(() => { if (!ended) next(); }, PAUSE);
  }
  function tick() {
    const now = performance.now(), left = Math.max(0, durationMs - (now - t0));
    $("bc-t").textContent = Math.floor(left / 60000) + ":" + String(Math.ceil(left / 1000) % 60).padStart(2, "0");
    $("bc-s").textContent = streak; $("bc-p").textContent = score;
    $("bc-b").style.left = pos(now - itemStart) * 100 + "%";
    if (!locked && now - itemStart > LIMIT) resolve(true);
    if (left <= 0) finish();
  }
  function finish() {
    if (ended) return; ended = true; clearInterval(timer); document.removeEventListener("keydown", onKey);
    const acc = played ? Math.round(hits / played * 100) : 0;
    host.innerHTML = `<div class="bc"><div class="bc__end"><h3>${S.finishTitle}</h3>
      <p>${S.score}: <b>${score}</b> · ${S.accuracy}: <b>${acc}%</b> · ${S.best}: <b>${best}</b></p>
      <div class="bc__row"><button class="btn" id="bc-again">${S.playAgain}</button><button class="btn btn--ghost" id="bc-done">${S.continueLabel}</button></div></div></div>`;
    host.querySelector("#bc-again").onclick = () => mountBenchmarkCatch(host, { items, durationMs, strings: S, onExit });
    host.querySelector("#bc-done").onclick = () => onExit && onExit({ score, accuracy: acc, bestStreak: best });
  }
  function onKey(e) {
    if (e.code !== "Space" || locked || !host.contains(root)) return;
    if (e.target.tagName === "BUTTON") return; // the focused button handles its own press
    e.preventDefault(); resolve(false);
  }
  $("bc-go").addEventListener("click", () => resolve(false));
  document.addEventListener("keydown", onKey);
  t0 = performance.now(); next(); timer = setInterval(tick, 33);
}
