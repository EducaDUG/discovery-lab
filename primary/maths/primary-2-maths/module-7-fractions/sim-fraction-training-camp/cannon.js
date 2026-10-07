/* Fraction Cannon — realistic-3D launch-and-land bonus round (local to this activity).
   Hold to charge the cannon, release to fire: the ball flies a real parabolic arc and lands
   on a 3D number-line runway (0 at the start, 1 at the far end). The student estimates where
   the shown fraction sits and charges the right power. Time-boxed on a wall-clock setInterval;
   rAF only draws. No lives, no fail state, generous retries. Makes no sound. */
let css = false;
function styles() {
  if (css) return; css = true;
  const s = document.createElement("style");
  s.textContent = `
.fc{position:relative;border-radius:var(--radius-lg);overflow:hidden;background:#8fd0f5;border:1px solid #0a1a2b;box-shadow:var(--shadow-2);color:#fff}
.fc canvas{display:block;width:100%;height:21rem;touch-action:none}
.fc__hud{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;padding:.6rem .9rem;font-family:var(--font-data);font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;text-shadow:0 1px 4px #000;pointer-events:none}
.fc__hud b{display:block;font-size:1.2rem;letter-spacing:0;font-family:var(--font-ui)}
.fc__card{position:absolute;left:50%;top:2.6rem;transform:translateX(-50%);background:#fff;color:#12304d;border-radius:var(--radius);padding:.45rem .9rem;display:flex;align-items:center;gap:.7rem;box-shadow:0 6px 16px rgba(0,0,0,.35);pointer-events:none}
.fc__card img{width:6.5rem}.fc__card strong{font-size:1.7rem;line-height:1}
.fc__msg{position:absolute;left:0;right:0;bottom:4.6rem;text-align:center;font-weight:800;text-shadow:0 2px 6px #000;padding:0 1rem;pointer-events:none}
.fc__msg small{display:block;font-weight:600}
.fc__bar{display:flex;flex-direction:column;gap:.5rem;padding:.7rem 1rem 1rem;background:#12304d}
.fc__meter{position:relative;height:1.1rem;border-radius:99px;background:#0a1a2b;overflow:hidden;border:2px solid #ffffff55}
.fc__fill{height:100%;width:0;background:linear-gradient(90deg,#a24f7a,#3f8f6b 50%,#e0b64c)}
.fc__m{position:absolute;top:0;bottom:0;width:2px;background:#fff9}
.fc__go{font:inherit;font-weight:900;font-size:1.15rem;padding:.7em 1em;border-radius:99px;border:0;background:#ffd34d;color:#3a2600;cursor:pointer;box-shadow:0 5px 0 #b8861a;touch-action:none;user-select:none}
.fc__go:disabled{opacity:.5}.fc__go.is-held{transform:translateY(3px);box-shadow:0 2px 0 #b8861a}
.fc__end{text-align:center;padding:var(--sp-5);background:#12304d}.fc__end h3{margin:0 0 .5rem;font-size:1.6rem}
.fc__row{display:flex;gap:.6rem;justify-content:center;margin-top:var(--sp-4);flex-wrap:wrap}
`;
  document.head.append(s);
}

const ZONES = [[0.05, 3, "Bullseye!"], [0.12, 2, "Great shot!"], [0.2, 1, "Close!"]];
const LEN = 24, G = 9.8, ANG = Math.PI / 4;

function labelSprite(THREE, text, color) {
  const c = document.createElement("canvas"); c.width = 128; c.height = 64;
  const x = c.getContext("2d"); x.font = "bold 44px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.lineWidth = 8; x.strokeStyle = "#0a1a2b"; x.strokeText(text, 64, 34); x.fillStyle = color; x.fillText(text, 64, 34);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
  sp.scale.set(2.4, 1.2, 1); return sp;
}

export function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); } catch { return false; }
}

export function mountFractionCannon(host, { THREE, items, durationMs = 120000, strings: S, onExit }) {
  styles();
  const reduced = document.documentElement.dataset.reducedMotion === "on";
  host.innerHTML = `<div class="fc" role="group" aria-label="${S.title}">
    <canvas id="fc-c" aria-label="${S.title}"></canvas>
    <div class="fc__hud"><div>${S.time}<b id="fc-t">2:00</b></div><div>${S.streak}<b id="fc-s">0</b></div><div>${S.score}<b id="fc-p">0</b></div></div>
    <div class="fc__card"><img id="fc-i" alt=""><strong id="fc-f"></strong></div>
    <p class="fc__msg" id="fc-m" aria-live="polite"></p>
    <div class="fc__bar"><div style="font-size:.85rem;text-align:center">${S.instructions}</div>
      <div class="fc__meter"><div class="fc__fill" id="fc-fill"></div><i class="fc__m" style="left:0"></i><i class="fc__m" style="left:50%"></i><i class="fc__m" style="right:0"></i></div>
      <button type="button" class="fc__go" id="fc-go">${S.hold}</button></div></div>`;
  const $ = id => host.querySelector("#" + id);
  const canvas = $("fc-c");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fd0f5); scene.fog = new THREE.Fog(0x8fd0f5, 30, 70);
  const cam = new THREE.PerspectiveCamera(50, 2, 0.1, 120);
  const camBase = new THREE.Vector3(LEN / 2, 6, 13), look = new THREE.Vector3(LEN / 2, 1, 0);
  scene.add(new THREE.HemisphereLight(0xcfeaff, 0x4a7a3a, 0.9));
  const sun = new THREE.DirectionalLight(0xfff1cf, 1.1); sun.position.set(10, 20, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -20, right: 30, top: 15, bottom: -15 }); scene.add(sun);

  // grass with noise texture
  const gc = document.createElement("canvas"); gc.width = gc.height = 128; const gx = gc.getContext("2d");
  gx.fillStyle = "#4d8f3c"; gx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { gx.fillStyle = `rgba(${30 + Math.random() * 40},${100 + Math.random() * 70},40,.45)`; gx.fillRect(Math.random() * 128, Math.random() * 128, 2, 4); }
  const gt = new THREE.CanvasTexture(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(14, 8); gt.encoding = THREE.sRGBEncoding;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(LEN / 2, -0.01, 0); ground.receiveShadow = true; scene.add(ground);

  // number-line runway (gradient strip)
  const rc = document.createElement("canvas"); rc.width = 512; rc.height = 8; const rx = rc.getContext("2d");
  const rg = rx.createLinearGradient(0, 0, 512, 0); rg.addColorStop(0, "#a24f7a"); rg.addColorStop(.5, "#3f8f6b"); rg.addColorStop(1, "#e0b64c");
  rx.fillStyle = rg; rx.fillRect(0, 0, 512, 8);
  const rt = new THREE.CanvasTexture(rc); rt.encoding = THREE.sRGBEncoding;
  const strip = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.15, 2.6), new THREE.MeshStandardMaterial({ map: rt, roughness: 0.55 }));
  strip.position.set(LEN / 2, 0.07, 0); strip.receiveShadow = true; scene.add(strip);
  [[0, "0", "#ffb3dc"], [LEN / 2, "1/2", "#9dffcf"], [LEN, "1", "#ffe58a"]].forEach(([x, t, col]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 12), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }));
    post.position.set(x, 1.4, -1.9); post.castShadow = true; scene.add(post);
    const l = labelSprite(THREE, t, col); l.position.set(x, 3.4, -1.9); scene.add(l);
  });
  for (let i = 1; i < 8; i++) { if (i === 4) continue; const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 2.6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })); m.position.set(LEN * i / 8, 0.16, 0); scene.add(m); }

  // cannon
  const cannon = new THREE.Group(); cannon.position.set(-1.2, 0.9, 0);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 2.2, 20), new THREE.MeshStandardMaterial({ color: 0x2a3b4d, metalness: 0.6, roughness: 0.35 }));
  barrel.rotation.z = -(Math.PI / 2 - ANG); barrel.position.set(0.6, 0.5, 0); barrel.castShadow = true; cannon.add(barrel);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.5, 20), new THREE.MeshStandardMaterial({ color: 0x7a4a22 }));
  wheel.rotation.x = Math.PI / 2; wheel.castShadow = true; cannon.add(wheel); scene.add(cannon);

  // ball, pin, ring
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 16), new THREE.MeshStandardMaterial({ color: 0xffc83d, emissive: 0xf08a1c, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.3 }));
  ball.castShadow = true; ball.visible = false; scene.add(ball);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 6, 8), new THREE.MeshBasicMaterial({ color: 0x7dffb4, transparent: true, opacity: 0.75 }));
  pin.visible = false; scene.add(pin);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.75, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.2; scene.add(ring);

  // drifting clouds (idle motion)
  const clouds = []; for (let i = 0; i < 6; i++) {
    const cl = new THREE.Group();
    for (let j = 0; j < 4; j++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random(), 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })); b.position.set(j * 1.4, Math.random() * 0.5, Math.random()); cl.add(b); }
    cl.position.set(Math.random() * 60 - 10, 14 + Math.random() * 6, -12 - Math.random() * 14); scene.add(cl); clouds.push(cl);
  }

  // particle burst
  const NP = 70, pg = new THREE.BufferGeometry(), pp = new Float32Array(NP * 3), pv = new Float32Array(NP * 3);
  pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  const pm = new THREE.PointsMaterial({ color: 0xffe08a, size: 0.35, transparent: true, opacity: 0, depthWrite: false });
  scene.add(new THREE.Points(pg, pm)); let pLife = 0;
  function burst(x, col) {
    pm.color.set(col); pm.opacity = 1; pLife = 1;
    for (let i = 0; i < NP; i++) { pp.set([x, 0.3, 0], i * 3); const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4; pv.set([Math.cos(a) * s, 3 + Math.random() * 5, Math.sin(a) * s], i * 3); }
  }

  // game state
  let score = 0, streak = 0, best = 0, hits = 0, played = 0, cur = null, order = [];
  let charging = false, chargeStart = 0, power = 0, flying = null, locked = true, ended = false, shake = 0, ringT = 0;
  const t0 = performance.now(); let raf = 0, timer = 0;
  const powerAt = now => { const p = ((now - chargeStart) % 1900) / 1900; return p < 0.5 ? p * 2 : 2 - p * 2; };

  function next() {
    if (!order.length) order = items.map((_, i) => i).sort(() => Math.random() - 0.5);
    cur = items[order.pop()]; played++;
    $("fc-i").src = cur.img; $("fc-f").textContent = cur.label; $("fc-m").innerHTML = ""; $("fc-fill").style.width = "0";
    pin.visible = false; ball.visible = false; locked = false; $("fc-go").disabled = false;
  }
  function startCharge(e) { if (locked || charging || ended) return; if (e && e.preventDefault) e.preventDefault(); charging = true; chargeStart = performance.now(); $("fc-go").classList.add("is-held"); }
  function fire() {
    if (!charging) return; charging = false; $("fc-go").classList.remove("is-held");
    const pw = Math.max(0.03, power); locked = true; $("fc-go").disabled = true;
    const R = pw * LEN, v = Math.sqrt(G * R / Math.sin(2 * ANG)), T = 2 * v * Math.sin(ANG) / G;
    flying = { v, T, R, pw, start: performance.now() }; ball.visible = true;
    shake = reduced ? 0 : 0.35;
    setTimeout(() => land(pw), T * 1000);
  }
  function land(pw) {
    flying = null; if (ended) return;
    const v = cur.num / cur.den, z = ZONES.find(zz => Math.abs(pw - v) <= zz[0]);
    if (z) { score += z[1] * 10 + Math.min(streak, 5) * 2; streak++; best = Math.max(best, streak); hits++; } else streak = 0;
    ball.position.set(pw * LEN, 0.4, 0); ball.visible = true;
    ring.position.x = pw * LEN; ringT = 1; ring.material.color.set(z ? 0x7dffb4 : 0xff8a7a);
    pin.position.set(v * LEN, 3, 0); pin.visible = true;
    burst(pw * LEN, z ? 0x7dffb4 : 0xffb199); if (!reduced) shake = z ? 0.5 : 0.25;
    $("fc-m").innerHTML = (z ? "✓ " + z[2] + " +" + z[1] * 10 : S.off) + `<small>${cur.label} ${S.sitsNear} <b>${cur.near}</b>. ${cur.hook}</small>`;
    setTimeout(() => { if (!ended) next(); }, 2200);
  }

  function resize() { const w = canvas.clientWidth || 600, h = canvas.clientHeight || 336; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  let last = performance.now();
  function frame() {
    raf = requestAnimationFrame(frame); if (ended) return;
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (charging) { power = powerAt(now); $("fc-fill").style.width = power * 100 + "%"; barrel.rotation.z = -(Math.PI / 2 - ANG) + (reduced ? 0 : Math.sin(now / 40) * 0.01); }
    let fx = LEN / 2;
    if (flying) {
      const t = Math.min((now - flying.start) / 1000, flying.T);
      ball.position.set(-0.2 + flying.v * Math.cos(ANG) * t * (flying.R / (flying.v * Math.cos(ANG) * flying.T)), 1.2 + flying.v * Math.sin(ANG) * t - 0.5 * G * t * t, 0);
      ball.position.y = Math.max(0.4, ball.position.y); fx = LEN / 2 + (ball.position.x - LEN / 2) * 0.35;
    }
    for (const c of clouds) { c.position.x += dt * (reduced ? 0 : 0.6); if (c.position.x > 55) c.position.x = -20; }
    if (pLife > 0) { pLife -= dt * 0.9; pm.opacity = Math.max(0, pLife); for (let i = 0; i < NP; i++) { pv[i * 3 + 1] -= 14 * dt; for (let k = 0; k < 3; k++) pp[i * 3 + k] += pv[i * 3 + k] * dt; if (pp[i * 3 + 1] < 0.1) pp[i * 3 + 1] = 0.1; } pg.attributes.position.needsUpdate = true; }
    if (ringT > 0) { ringT -= dt * 0.9; ring.material.opacity = Math.max(0, ringT); ring.scale.setScalar(1 + (1 - ringT) * 2.5); }
    if (pin.visible) pin.material.opacity = 0.55 + Math.sin(now / 160) * 0.2;
    if (shake > 0) shake = Math.max(0, shake - dt * 1.4);
    cam.position.set(camBase.x + (fx - LEN / 2) * 0.5 + (Math.random() - 0.5) * shake, camBase.y + (Math.random() - 0.5) * shake + Math.sin(now / 1800) * 0.25, camBase.z);
    look.x = fx; cam.lookAt(look);
    renderer.render(scene, cam);
  }
  function tick() {
    const left = Math.max(0, durationMs - (performance.now() - t0));
    $("fc-t").textContent = Math.floor(left / 60000) + ":" + String(Math.ceil(left / 1000) % 60).padStart(2, "0");
    $("fc-s").textContent = streak; $("fc-p").textContent = score;
    if (left <= 0) finish();
  }
  function cleanup() {
    clearInterval(timer); cancelAnimationFrame(raf); removeEventListener("keydown", kd); removeEventListener("keyup", ku); removeEventListener("resize", resize);
    removeEventListener("pointerup", fire); renderer.dispose();
  }
  function finish() {
    if (ended) return; ended = true; cleanup();
    const acc = played ? Math.round(hits / played * 100) : 0;
    host.innerHTML = `<div class="fc"><div class="fc__end"><h3>${S.finishTitle}</h3>
      <p>${S.score}: <b>${score}</b> · ${S.accuracy}: <b>${acc}%</b> · ${S.best}: <b>${best}</b></p>
      <div class="fc__row"><button class="btn" id="fc-again">${S.playAgain}</button><button class="btn btn--ghost" id="fc-done">${S.continueLabel}</button></div></div></div>`;
    host.querySelector("#fc-again").onclick = () => mountFractionCannon(host, { THREE, items, durationMs, strings: S, onExit });
    host.querySelector("#fc-done").onclick = () => onExit && onExit({ score, accuracy: acc, bestStreak: best });
  }
  const kd = e => { if (e.code === "Space" && !e.repeat && host.contains(canvas)) { e.preventDefault(); startCharge(); } };
  const ku = e => { if (e.code === "Space") fire(); };
  $("fc-go").addEventListener("pointerdown", startCharge);
  addEventListener("pointerup", fire);
  addEventListener("keydown", kd); addEventListener("keyup", ku); addEventListener("resize", resize);
  resize(); next(); timer = setInterval(tick, 100); frame();
}
