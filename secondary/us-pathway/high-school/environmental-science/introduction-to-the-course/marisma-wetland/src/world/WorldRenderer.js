/* ============================================================================
 * world/WorldRenderer.js — Three.js scene, camera, light, sky, terrain, water
 * ----------------------------------------------------------------------------
 * Owns the WebGL scene and everything non-living: the basin terrain, the
 * animated water surface, sky dome, sun/hemisphere lighting, fog, weather
 * particle effects (fire smoke, rain) and scripted camera cinematics.
 * The living entities live in EntitySystem; this class exposes hooks it uses.
 * ========================================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AssetManager, makeNoise } from '../assets/AssetManager.js';

const BASIN_R = 52;      // radius of the depression that holds water
const TERR_SIZE = 220;   // terrain plane extent
const TERR_SEG = 120;    // terrain resolution

export class WorldRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.assets = new AssetManager();
    this.noise = makeNoise(7);
    this.clock = new THREE.Clock();
    this.time = 0;
    this._cam = { active: false, t: 0, dur: 1, from: new THREE.Vector3(), to: new THREE.Vector3(),
                  fromTarget: new THREE.Vector3(), toTarget: new THREE.Vector3(), onDone: null };
    this.state = null;
    this._initRenderer();
    this._initScene();
    this._initLights();
    this._initSky();
    this._buildTerrain();
    this._buildWater();
    this._initWeather();
    this._initHighlight();
  }

  /* Glowing footprint shown when the player is choosing an action. */
  _initHighlight() {
    const g = new THREE.RingGeometry(0.72, 1, 40);
    g.rotateX(-Math.PI / 2);
    this.highlight = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x4fd1a5, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    this.highlight.visible = false;
    this.scene.add(this.highlight);
    // Zone anchors (centre x,z and radius), matching EntitySystem placements.
    const R = BASIN_R;
    this._zones = {
      water:   { x: 0, z: 0, r: R * 0.95 },
      housing: { x: Math.cos(Math.PI * 0.25) * R * 1.3, z: Math.sin(Math.PI * 0.25) * R * 1.3, r: R * 0.5 },
      farm:    { x: -R * 1.15, z: 0, r: R * 0.6 },
      tourism: { x: 0, z: R * 0.8, r: R * 0.3 },
      edge:    { x: 0, z: 0, r: R * 1.12 }
    };
  }
  highlightZone(zone) {
    const z = this._zones[zone];
    if (!z) { this.clearHighlight(); return; }
    this.highlight.position.set(z.x, (this._waterY || 0) + 0.6, z.z);
    this.highlight.scale.setScalar(z.r);
    this.highlight.visible = true;
  }
  clearHighlight() { if (this.highlight) this.highlight.visible = false; }
  zoneCenter(zone) {
    const z = this._zones[zone] || this._zones.water;
    return new THREE.Vector3(z.x, (this._waterY || 0) + 1, z.z);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)); // clamp DPR for laptop perf
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.fog = new THREE.Fog(0xcfe0d8, 90, 260);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 800);
    this.camera.position.set(0, 62, 88);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI * 0.47; // keep camera above the horizon
    this.controls.minPolarAngle = Math.PI * 0.12;
    this.controls.target.set(0, 0, 0);
    this.controls.enablePan = false;
    this.controls.autoRotate = false;
  }

  _initLights() {
    this.hemi = new THREE.HemisphereLight(0xbfe0ea, 0x5a6a3a, 0.75);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff2d8, 1.9);
    this.sun.position.set(48, 70, 30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const d = 90;
    Object.assign(this.sun.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 1, far: 260 });
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
  }

  _initSky() {
    // Gradient sky dome (cheap; no textures).
    const uniforms = {
      top: { value: new THREE.Color(0x5fa8d6) },
      bottom: { value: new THREE.Color(0xdcebe4) },
      offset: { value: 12 }, exponent: { value: 0.7 }
    };
    this.skyUniforms = uniforms;
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(400, 24, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, uniforms,
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `,
        fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bottom; uniform float offset; uniform float exponent;
          void main(){ float h = normalize(vP + vec3(0.0,offset,0.0)).y; float t = pow(clamp(h,0.0,1.0), exponent);
          gl_FragColor = vec4(mix(bottom, top, t), 1.0);} `
      })
    );
    this.scene.add(sky);

    // Drifting low-poly clouds.
    this.clouds = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: 0.9, roughness: 1 });
    for (let i = 0; i < 8; i++) {
      const c = new THREE.Group();
      const n = 3 + (i % 3);
      for (let j = 0; j < n; j++) {
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(4 + Math.random() * 3, 0), cloudMat);
        puff.position.set(j * 5 - n * 2, Math.random() * 2, Math.random() * 3);
        c.add(puff);
      }
      c.position.set((Math.random() - 0.5) * 300, 70 + Math.random() * 30, (Math.random() - 0.5) * 300);
      c.scale.setScalar(0.8 + Math.random());
      this.clouds.add(c);
    }
    this.scene.add(this.clouds);
  }

  /* ---- Terrain basin (vertex-coloured, drought-aware) --------------------- */
  _buildTerrain() {
    const g = new THREE.PlaneGeometry(TERR_SIZE, TERR_SIZE, TERR_SEG, TERR_SEG);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    this._baseHeights = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z);
      let h;
      if (d < BASIN_R) {
        const t = d / BASIN_R;
        h = -5.5 * (1 - t * t);                       // smooth bowl down to the basin floor
      } else {
        const rise = Math.min(1, (d - BASIN_R) / 40);
        h = rise * (3 + this.noise(x * 0.03, z * 0.03) * 6); // gentle hills outside
      }
      h += (this.noise(x * 0.12, z * 0.12) - 0.5) * 0.9;    // fine texture
      this._baseHeights[i] = h;
      pos.setY(i, h);
    }
    g.computeVertexNormals();
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
    this.terrainGeo = g;
    this.terrain = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
    this.terrain.receiveShadow = true;
    this.terrain.name = 'terrain';
    this.scene.add(this.terrain);
    this._colourTerrain(0.2, 0.7); // droughtFactor, greenness defaults
  }

  // droughtFactor 0..1 (1 = parched), greenness 0..1 (vegetation health)
  _colourTerrain(droughtFactor, greenness) {
    const col = this.terrainGeo.attributes.color;
    const pos = this.terrainGeo.attributes.position;
    const grass = new THREE.Color(0x6f8f4e), dry = new THREE.Color(0xc4a24a);
    const mud = new THREE.Color(0x836b45), mudDry = new THREE.Color(0xa9814e);
    const waterY = this._waterY != null ? this._waterY : -1;
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const h = this._baseHeights[i];
      const nearWater = h < waterY + 1.5;            // exposed shore / basin floor
      if (nearWater) {
        c.copy(mud).lerp(mudDry, droughtFactor);
      } else {
        c.copy(grass).lerp(dry, droughtFactor * 0.85 + (1 - greenness) * 0.4);
      }
      // subtle variation
      const v = 0.92 + this.noise(pos.getX(i) * 0.2, pos.getZ(i) * 0.2) * 0.16;
      col.setXYZ(i, c.r * v, c.g * v, c.b * v);
    }
    col.needsUpdate = true;
  }

  /* ---- Animated water ----------------------------------------------------- */
  _buildWater() {
    const g = new THREE.PlaneGeometry(BASIN_R * 2.1, BASIN_R * 2.1, 60, 60);
    g.rotateX(-Math.PI / 2);
    this.waterGeo = g;
    this._waterBase = Float32Array.from(g.attributes.position.array);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x2f8f9e, transparent: true, opacity: 0.86, roughness: 0.18, metalness: 0.2, flatShading: false
    });
    this.water = new THREE.Mesh(g, this.waterMat);
    this.water.name = 'water';
    this.water.receiveShadow = true;
    this._waterY = -1;
    this.water.position.y = this._waterY;
    this.scene.add(this.water);
  }

  /* ---- Weather particles -------------------------------------------------- */
  _initWeather() {
    // Fire smoke
    const N = 160;
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this.smoke = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x555555, size: 3.2, transparent: true, opacity: 0, depthWrite: false }));
    this.smoke.visible = false;
    this._smokeN = N; this._smokeLife = 0; this._smokeOrigin = new THREE.Vector3();
    this.scene.add(this.smoke);

    // Rain
    const R = 500;
    const rg = new THREE.BufferGeometry();
    const rp = new Float32Array(R * 3);
    for (let i = 0; i < R; i++) { rp[i * 3] = (Math.random() - 0.5) * 130; rp[i * 3 + 1] = Math.random() * 70; rp[i * 3 + 2] = (Math.random() - 0.5) * 130; }
    rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    this.rain = new THREE.Points(rg, new THREE.PointsMaterial({ color: 0x9fc6d8, size: 0.5, transparent: true, opacity: 0 }));
    this.rain.visible = false; this._rainLife = 0;
    this.scene.add(this.rain);
  }

  triggerWeather(kind) {
    if (kind === 'wildfire') { this.smoke.visible = true; this._smokeLife = 6; this.smoke.material.opacity = 0.55; }
    if (kind === 'flood' || kind === 'drought-rain') { this.rain.visible = true; this._rainLife = 5; this.rain.material.opacity = 0.5; }
  }
  setSmokeOrigin(v) { this._smokeOrigin.copy(v); }

  /* ---- Reflect the simulation state in the world ------------------------- */
  applyState(state, opts = {}) {
    this.state = state;
    const wa = state.waterAvailability / 100;         // 0..1
    const wq = state.waterQuality / 100;
    const algae = state.algae / 100;
    const climate = state.climatePressure / 100;

    // Water level & surface area
    this._waterYTarget = -3.6 + wa * 3.1;             // low in drought, high when full
    const waterScale = 0.62 + wa * 0.44;
    this._waterScaleTarget = waterScale;
    if (opts.immediate) { this._waterY = this._waterYTarget; this.water.position.y = this._waterY; this.water.scale.set(waterScale, 1, waterScale); }

    // Water colour: clear teal -> murky green with poor quality & algae
    const clear = new THREE.Color(0x2f8f9e), murk = new THREE.Color(0x5c7838), pea = new THREE.Color(0x7fa63a);
    const col = clear.clone().lerp(murk, 1 - wq).lerp(pea, algae * 0.7);
    this.waterMat.color.copy(col);
    this.waterMat.opacity = 0.72 + (1 - wq) * 0.2;
    this.waterMat.roughness = 0.12 + (1 - wq) * 0.5 + algae * 0.2; // clean water is glassier

    // Terrain drought/greenness colouring
    const droughtFactor = THREE.MathUtils.clamp(1 - wa, 0, 1) * 0.9 + climate * 0.1;
    const greenness = THREE.MathUtils.clamp(state.biodiversity / 100 * 0.6 + wa * 0.4, 0, 1);
    this._colourTerrain(droughtFactor, greenness);

    // Sun/sky mood: warmer & hazier as climate rises
    const sunWarm = new THREE.Color(0xfff2d8).lerp(new THREE.Color(0xffb066), climate * 0.7);
    this.sun.color.copy(sunWarm);
    this.sun.intensity = 1.9 - climate * 0.4;
    this.fog.color.setHex(0xcfe0d8).lerp(new THREE.Color(0xe8d3b0), climate * 0.5);
    this.skyUniforms.top.value.setHex(0x5fa8d6).lerp(new THREE.Color(0x87b8d0), climate * 0.5);
    this.hemi.intensity = 0.75 - climate * 0.15;
  }

  /* ---- Camera cinematics -------------------------------------------------- */
  moveCamera(to, target, dur = 2.2, onDone = null) {
    this._cam.active = true; this._cam.t = 0; this._cam.dur = dur;
    this._cam.from.copy(this.camera.position); this._cam.to.copy(to);
    this._cam.fromTarget.copy(this.controls.target); this._cam.toTarget.copy(target);
    this._cam.onDone = onDone;
    this.controls.enabled = false;
  }
  introSweep(onDone) {
    this.camera.position.set(0, 120, 4);
    this.controls.target.set(0, 0, 0);
    this.moveCamera(new THREE.Vector3(0, 62, 88), new THREE.Vector3(0, 0, 0), 4.5, () => { this.controls.enabled = true; if (onDone) onDone(); });
  }
  focusOn(worldPos, onDone) {
    const dir = worldPos.clone().normalize();
    const cam = worldPos.clone().add(new THREE.Vector3(dir.x * 22, 26, dir.z * 22 + 20));
    this.moveCamera(cam, worldPos, 1.6, () => {
      setTimeout(() => this.moveCamera(new THREE.Vector3(0, 62, 88), new THREE.Vector3(0, 0, 0), 2.0, () => { this.controls.enabled = true; if (onDone) onDone(); }), 1400);
    });
  }
  droughtPullback() { this.moveCamera(new THREE.Vector3(0, 90, 120), new THREE.Vector3(0, -2, 0), 3.0, () => { this.controls.enabled = true; }); }

  /* ---- Raycast helper for inspection ------------------------------------- */
  raycast(ndc, objects) {
    if (!this._ray) this._ray = new THREE.Raycaster();
    this._ray.setFromCamera(ndc, this.camera);
    return this._ray.intersectObjects(objects, true);
  }
  worldToScreen(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight, visible: p.z < 1 };
  }

  /* ---- Per-frame update --------------------------------------------------- */
  update() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    const t = this.time;

    // Water level/scale easing toward targets (satisfying transitions)
    if (this._waterYTarget != null) {
      this._waterY += (this._waterYTarget - this._waterY) * Math.min(1, dt * 1.5);
      this.water.position.y = this._waterY;
      const s = this.water.scale.x + (this._waterScaleTarget - this.water.scale.x) * Math.min(1, dt * 1.5);
      this.water.scale.set(s, 1, s);
    }

    // Water waves (vertex ripple)
    const wp = this.waterGeo.attributes.position, base = this._waterBase;
    for (let i = 0; i < wp.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      const y = Math.sin(x * 0.12 + t * 1.1) * 0.18 + Math.cos(z * 0.15 + t * 0.9) * 0.16;
      wp.setY(i, y);
    }
    wp.needsUpdate = true;

    // Clouds drift
    this.clouds.children.forEach((c, i) => {
      c.position.x += dt * (1.2 + (i % 3) * 0.4);
      if (c.position.x > 170) c.position.x = -170;
    });

    // Smoke rise
    if (this.smoke.visible) {
      this._smokeLife -= dt;
      const sp = this.smoke.geometry.attributes.position;
      for (let i = 0; i < this._smokeN; i++) {
        let y = sp.getY(i);
        if (y <= 0 || Math.random() < 0.02) {
          sp.setXYZ(i, this._smokeOrigin.x + (Math.random() - 0.5) * 8, 0.5, this._smokeOrigin.z + (Math.random() - 0.5) * 8);
        } else {
          sp.setXYZ(i, sp.getX(i) + (Math.random() - 0.5) * 0.2, y + dt * (3 + Math.random() * 2), sp.getZ(i));
        }
      }
      sp.needsUpdate = true;
      this.smoke.material.opacity = Math.max(0, this._smokeLife / 6) * 0.55;
      if (this._smokeLife <= 0) this.smoke.visible = false;
    }
    // Rain fall
    if (this.rain.visible) {
      this._rainLife -= dt;
      const rp = this.rain.geometry.attributes.position;
      for (let i = 0; i < rp.count; i++) {
        let y = rp.getY(i) - dt * 60;
        if (y < 0) y = 70;
        rp.setY(i, y);
      }
      rp.needsUpdate = true;
      this.rain.material.opacity = Math.max(0, this._rainLife / 5) * 0.5;
      if (this._rainLife <= 0) this.rain.visible = false;
    }

    // Scripted camera tween
    if (this._cam.active) {
      this._cam.t += dt;
      const k = Math.min(1, this._cam.t / this._cam.dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // easeInOutQuad
      this.camera.position.lerpVectors(this._cam.from, this._cam.to, e);
      this.controls.target.lerpVectors(this._cam.fromTarget, this._cam.toTarget, e);
      if (k >= 1) { this._cam.active = false; const cb = this._cam.onDone; this._cam.onDone = null; if (cb) cb(); }
    }

    // Pulse the action highlight
    if (this.highlight && this.highlight.visible) {
      this.highlight.material.opacity = 0.35 + Math.sin(t * 3) * 0.22;
      this.highlight.rotation.y += dt * 0.4;
    }

    // Keep sun following its target
    this.sun.target.position.set(0, 0, 0);
    this.controls.update();
    return dt;
  }

  render() { this.renderer.render(this.scene, this.camera); }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  }

  get waterLevelY() { return this._waterY; }

  // Approximate terrain height at a world (x,z), matching _buildTerrain so that
  // entities sit on the ground. Excludes the fine per-vertex jitter.
  heightAt(x, z) {
    const d = Math.sqrt(x * x + z * z);
    let h;
    if (d < BASIN_R) { const t = d / BASIN_R; h = -5.5 * (1 - t * t); }
    else { const rise = Math.min(1, (d - BASIN_R) / 40); h = rise * (3 + this.noise(x * 0.03, z * 0.03) * 6); }
    return h;
  }
  get basinR() { return BASIN_R; }
}
