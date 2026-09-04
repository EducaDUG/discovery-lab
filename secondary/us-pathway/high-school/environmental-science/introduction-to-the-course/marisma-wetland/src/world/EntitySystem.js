/* ============================================================================
 * world/EntitySystem.js — Instanced living things + structures + animation
 * ----------------------------------------------------------------------------
 * All the life and human structures in the world. Counts and appearance are
 * driven by the simulation state (populations, levers). Repeated elements use
 * InstancedMesh with a fixed capacity — we precompute stable placements and
 * reveal a subset via .count, so updates are cheap and the world stays fluid.
 * Creatures (fish, birds, frogs, insects) get their matrices updated per frame.
 * ========================================================================== */
import * as THREE from 'three';

const CAPS = { reeds: 520, lily: 130, tree: 130, house: 26, farm: 64, cray: 44, fish: 40, bird: 16, raptor: 4, frog: 14, insect: 220 };

// Small seeded RNG so placements are stable between rebuilds.
function srand(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class EntitySystem {
  constructor(scene, assets, world) {
    this.scene = scene; this.assets = assets; this.world = world;
    this.rand = srand(12345);
    this.dummy = new THREE.Object3D();
    this._tmpColor = new THREE.Color();
    this.inspectables = [];
    this.state = null;
    this._buildReeds();
    this._buildLilies();
    this._buildTrees();
    this._buildHouses();
    this._buildFarm();
    this._buildTourism();
    this._buildCrayfish();
    this._buildFish();
    this._buildBirds();
    this._buildRaptors();
    this._buildFrogs();
    this._buildInsects();
  }

  _im(geo, mat, cap, name) {
    const m = new THREE.InstancedMesh(geo, mat, cap);
    m.count = 0; m.name = name; m.castShadow = true; m.receiveShadow = true;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(m);
    return m;
  }

  /* ---- REEDS: ring around the water edge, sway in the wind (shader) ------- */
  _buildReeds() {
    const mat = this.assets.m('reed').clone();
    mat.side = THREE.DoubleSide;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = { value: 0 };
      this._reedUniforms = sh.uniforms;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float ix = instanceMatrix[3].x, iz = instanceMatrix[3].z;
          float sway = sin(uTime*1.6 + ix*0.5 + iz*0.4);
          transformed.x += sway * position.y * 0.28;
          transformed.z += cos(uTime*1.3 + iz*0.5) * position.y * 0.20;`);
    };
    this.reedMat = mat;
    this.reeds = this._im(this.assets.geo.reed, mat, CAPS.reeds, 'reeds');
    // Precompute placements in an annulus just inside the basin rim.
    this._reedSpots = [];
    for (let i = 0; i < CAPS.reeds; i++) {
      const a = this.rand() * Math.PI * 2;
      const r = this.world.basinR * (0.60 + this.rand() * 0.34);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      this._reedSpots.push({ x, z, s: 1.4 + this.rand() * 1.8, rot: this.rand() * Math.PI });
    }
  }

  /* ---- LILIES / algae patches floating on the water ---------------------- */
  _buildLilies() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x3f7a3a, flatShading: true, roughness: 0.9, side: THREE.DoubleSide });
    this.lilyMat = mat;
    this.lilies = this._im(this.assets.geo.lily, mat, CAPS.lily, 'lilies');
    this._lilySpots = [];
    for (let i = 0; i < CAPS.lily; i++) {
      const a = this.rand() * Math.PI * 2, r = this.rand() * this.world.basinR * 0.7;
      this._lilySpots.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.6 + this.rand() * 1.1 });
    }
  }

  /* ---- TREES scattered on the higher ground (grow with corridors) -------- */
  _buildTrees() {
    this.treeTrunks = this._im(this.assets.geo.trunk, this.assets.m('trunk'), CAPS.tree, 'treeTrunks');
    this.treeCanopy = this._im(this.assets.geo.canopy, this.assets.m('leaf'), CAPS.tree, 'treeCanopy');
    this._treeSpots = [];
    for (let i = 0; i < CAPS.tree; i++) {
      const a = this.rand() * Math.PI * 2;
      const r = this.world.basinR * (1.02 + this.rand() * 0.9);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      // keep trees out of the housing (+x,+z) and farm (-x) sectors mostly
      this._treeSpots.push({ x, z, s: 2.2 + this.rand() * 2.6, h: 2.4 + this.rand() * 1.8 });
    }
  }

  /* ---- HOUSES (one hillside sector), grow with housingLevel -------------- */
  _buildHouses() {
    this.houseWalls = this._im(this.assets.geo.box, this.assets.m('wall'), CAPS.house, 'houseWalls');
    this.houseRoofs = this._im(this.assets.geo.roof, this.assets.m('roof'), CAPS.house, 'houseRoofs');
    this._houseSpots = [];
    for (let i = 0; i < CAPS.house; i++) {
      const a = (-0.35 + this.rand() * 0.7);                 // NE sector
      const baseA = Math.PI * 0.25 + a;
      const r = this.world.basinR * (1.05 + this.rand() * 0.55);
      this._houseSpots.push({ x: Math.cos(baseA) * r, z: Math.sin(baseA) * r, s: 1.6 + this.rand() * 1.0, rot: this.rand() * Math.PI });
    }
  }

  /* ---- FARM tiles (SW sector), coverage from farmingIntensity ------------ */
  _buildFarm() {
    const geo = new THREE.BoxGeometry(6, 0.3, 6);
    this.farm = this._im(geo, this.assets.m('farm').clone(), CAPS.farm, 'farm');
    this.farm.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAPS.farm * 3), 3);
    this._farmSpots = [];
    let idx = 0;
    for (let gx = -6; gx <= 6 && idx < CAPS.farm; gx++) {
      for (let gz = -6; gz <= 6 && idx < CAPS.farm; gz++) {
        const x = -this.world.basinR * 1.25 + gx * 6.5;
        const z = -this.world.basinR * 0.5 + gz * 6.5;
        if (Math.sqrt(x * x + z * z) < this.world.basinR * 1.02) continue;
        this._farmSpots.push({ x, z }); idx++;
      }
    }
  }

  /* ---- TOURISM: boardwalk + platform + visitors -------------------------- */
  _buildTourism() {
    this.tourGroup = new THREE.Group();
    this.scene.add(this.tourGroup);
    this.visitors = this._im(this.assets.geo.visitor, this.assets.m('bird').clone(), 12, 'visitors');
    this.visitors.material = new THREE.MeshStandardMaterial({ color: 0xcf6a4a, flatShading: true });
    this._visitorSpots = [];
  }

  /* ---- Invasive CRAYFISH near the shore ---------------------------------- */
  _buildCrayfish() {
    this.crayfish = this._im(this.assets.geo.crayfish, this.assets.m('crayfish'), CAPS.cray, 'crayfish');
    this._craySpots = [];
    for (let i = 0; i < CAPS.cray; i++) {
      const a = this.rand() * Math.PI * 2, r = this.world.basinR * (0.5 + this.rand() * 0.4);
      this._craySpots.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, rot: this.rand() * Math.PI });
    }
  }

  /* ---- CREATURES (animated each frame) ----------------------------------- */
  _buildFish() {
    this.fish = this._im(this.assets.geo.fish, this.assets.m('fish'), CAPS.fish, 'fish');
    this.fishBig = this._im(this.assets.geo.fish, this.assets.m('fishBig'), 12, 'fishBig');
    this._fishData = []; this._fishBigData = [];
    for (let i = 0; i < CAPS.fish; i++) this._fishData.push(this._newSwimmer(0.7 + this.rand() * 0.5));
    for (let i = 0; i < 12; i++) this._fishBigData.push(this._newSwimmer(1.6 + this.rand() * 0.6));
  }
  _newSwimmer(s) {
    const a = this.rand() * Math.PI * 2, r = this.rand() * this.world.basinR * 0.65;
    return { a, r, depth: 0.6 + this.rand() * 1.6, spd: 0.15 + this.rand() * 0.25, s, wob: this.rand() * 6 };
  }
  _buildBirds() {
    this.birds = this._im(this.assets.geo.bird, this.assets.m('bird'), CAPS.bird, 'birds');
    this._birdData = [];
    for (let i = 0; i < CAPS.bird; i++) {
      this._birdData.push({ a: this.rand() * 6.28, r: this.world.basinR * (0.4 + this.rand() * 0.5), h: 6 + this.rand() * 10, spd: 0.1 + this.rand() * 0.15, s: 2 + this.rand() * 1.5, landing: this.rand() });
    }
  }
  _buildRaptors() {
    this.raptors = this._im(this.assets.geo.bird, this.assets.m('raptor'), CAPS.raptor, 'raptors');
    this._raptorData = [];
    for (let i = 0; i < CAPS.raptor; i++) this._raptorData.push({ a: this.rand() * 6.28, r: this.world.basinR * (0.7 + this.rand() * 0.6), h: 22 + this.rand() * 10, spd: 0.08 + this.rand() * 0.05, s: 3.4 });
  }
  _buildFrogs() {
    this.frogs = this._im(this.assets.geo.frog, this.assets.m('frog'), CAPS.frog, 'frogs');
    this._frogData = [];
    for (let i = 0; i < CAPS.frog; i++) {
      const a = this.rand() * 6.28;
      this._frogData.push({ a, r: this.world.basinR * (0.72 + this.rand() * 0.16), phase: this.rand() * 6.28, spd: 0.6 + this.rand() });
    }
  }
  _buildInsects() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CAPS.insect * 3), 3));
    this.insects = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf0e6a0, size: 0.5, transparent: true, opacity: 0.85, depthWrite: false }));
    this.insects.name = 'insects';
    this.scene.add(this.insects);
    this._insectData = [];
    for (let i = 0; i < CAPS.insect; i++) {
      const a = this.rand() * 6.28, r = this.world.basinR * (0.55 + this.rand() * 0.5);
      this._insectData.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, phase: this.rand() * 6.28, sp: 1 + this.rand() * 2 });
    }
  }

  /* ======================================================================
   * APPLY STATE — set counts & rebuild structures to match the simulation
   * ==================================================================== */
  applyState(state) {
    this.state = state;
    const p = state.pops, L = state.levers;
    const wy = this.world.waterLevelY;
    const frac = (v) => THREE.MathUtils.clamp(v / 100, 0, 1);

    // Reeds — count scales with reed population and wetland area
    const reedN = Math.floor(CAPS.reeds * frac(p.reeds) * (0.5 + state.wetlandArea / 1600));
    this._setInstances(this.reeds, reedN, this._reedSpots, (o, spot) => {
      const gy = this.world.heightAt(spot.x, spot.z);
      o.position.set(spot.x, Math.max(gy, wy - 0.3), spot.z);
      o.rotation.set(0, spot.rot, 0);
      o.scale.set(spot.s, spot.s * (0.7 + frac(p.reeds) * 0.6), spot.s);
    });
    // dry-out colour for reeds when water is scarce
    this.reedMat.color.setHex(0x7c9a3e).lerp(this._tmpColor.setHex(0xb59a45), 1 - frac(state.waterAvailability));

    // Lilies + algae scum — from aquatic plants and algae
    const lilyN = Math.floor(CAPS.lily * (frac(p.aquaticPlants) * 0.7 + frac(state.algae) * 0.5));
    this._setInstances(this.lilies, Math.min(CAPS.lily, lilyN), this._lilySpots, (o, spot) => {
      o.position.set(spot.x, wy + 0.06, spot.z);
      o.rotation.set(-Math.PI / 2, 0, 0);
      o.scale.set(spot.s, spot.s, spot.s);
    });
    // green up the scum when algae is high
    this.lilyMat.color.setHex(0x3f7a3a).lerp(this._tmpColor.setHex(0x86b23e), frac(state.algae));

    // Trees — baseline + corridors greenery
    const treeN = Math.floor(CAPS.tree * (0.28 + frac(L.corridors) * 0.55 + frac(state.biodiversity) * 0.25));
    this._setInstances(this.treeTrunks, treeN, this._treeSpots, (o, spot) => {
      const gy = this.world.heightAt(spot.x, spot.z);
      o.position.set(spot.x, gy + spot.h / 2, spot.z);
      o.scale.set(spot.s * 0.5, spot.h, spot.s * 0.5);
      o.rotation.set(0, 0, 0);
    });
    this._setInstances(this.treeCanopy, treeN, this._treeSpots, (o, spot) => {
      const gy = this.world.heightAt(spot.x, spot.z);
      o.position.set(spot.x, gy + spot.h + spot.s * 0.4, spot.z);
      o.scale.setScalar(spot.s);
      o.rotation.set(0, spot.s, 0);
    });

    // Houses — from housingLevel
    const houseN = Math.floor(CAPS.house * frac(L.housingLevel));
    this._setInstances(this.houseWalls, houseN, this._houseSpots, (o, spot) => {
      const gy = this.world.heightAt(spot.x, spot.z);
      o.position.set(spot.x, gy + spot.s * 0.5, spot.z);
      o.rotation.set(0, spot.rot, 0);
      o.scale.set(spot.s * 2.2, spot.s * 1.4, spot.s * 2.0);
    });
    this._setInstances(this.houseRoofs, houseN, this._houseSpots, (o, spot) => {
      const gy = this.world.heightAt(spot.x, spot.z);
      o.position.set(spot.x, gy + spot.s * 1.35, spot.z);
      o.rotation.set(0, spot.rot + Math.PI / 4, 0);
      o.scale.set(spot.s * 1.9, spot.s * 1.2, spot.s * 1.9);
    });

    // Farm — coverage from farmingIntensity; runoff tint from fertiliser
    const farmN = Math.floor(this._farmSpots.length * frac(L.farmingIntensity));
    const dry = frac(state.waterAvailability);
    for (let i = 0; i < this._farmSpots.length; i++) {
      const spot = this._farmSpots[i];
      if (i < farmN) {
        const gy = this.world.heightAt(spot.x, spot.z);
        this.dummy.position.set(spot.x, gy + 0.15, spot.z);
        this.dummy.rotation.set(0, 0, 0); this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.farm.setMatrixAt(i, this.dummy.matrix);
        // greener with water, more ochre when dry / heavily fertilised
        const c = new THREE.Color(0x6f9a3a).lerp(new THREE.Color(0xc2a63d), 0.4 + (1 - dry) * 0.4 + frac(state.levers.fertiliserUse) * 0.2);
        this.farm.setColorAt(i, c);
      }
    }
    this.farm.count = farmN;
    this.farm.instanceMatrix.needsUpdate = true;
    if (this.farm.instanceColor) this.farm.instanceColor.needsUpdate = true;

    // Tourism — build boardwalk/platform once when tourismLevel crosses thresholds
    this._buildTourStructures(L.tourismLevel);
    const visN = Math.floor(12 * frac(L.tourismLevel) * frac(state.publicSupport));
    this._setInstances(this.visitors, visN, this._visitorSpots.length ? this._visitorSpots : [{ x: 0, z: this.world.basinR * 0.9 }], (o, spot, i) => {
      const base = this._visitorSpots.length ? this._visitorSpots[i % this._visitorSpots.length] : { x: 0, z: this.world.basinR * 0.9 };
      const gy = Math.max(this.world.heightAt(base.x, base.z), wy);
      o.position.set(base.x + (this.rand() - 0.5) * 3, gy + 0.6, base.z + (this.rand() - 0.5) * 3);
      o.scale.setScalar(1);
    });

    // Invasive crayfish — from invasive population
    const crayN = Math.floor(CAPS.cray * frac(p.invasive));
    this._setInstances(this.crayfish, crayN, this._craySpots, (o, spot) => {
      o.position.set(spot.x, wy - 0.1, spot.z);
      o.rotation.set(0, spot.rot, 0);
      o.scale.setScalar(1 + frac(p.invasive) * 0.5);
    });

    // Creature counts (activity dampened by poor water quality)
    const act = 0.4 + frac(state.waterQuality) * 0.6;
    this._fishCount = Math.floor(CAPS.fish * frac(p.smallFish) * act);
    this._fishBigCount = Math.floor(12 * frac(p.largeFish) * act);
    this._birdCount = Math.floor(CAPS.bird * frac(p.waterBirds));
    this._raptorCount = Math.floor(CAPS.raptor * frac(p.birdsOfPrey));
    this._frogCount = Math.floor(CAPS.frog * frac(p.frogs) * act);
    this._insectCount = Math.floor(CAPS.insect * frac(p.insects));
    this.fish.count = this._fishCount; this.fishBig.count = this._fishBigCount;
    this.birds.count = this._birdCount; this.raptors.count = this._raptorCount; this.frogs.count = this._frogCount;
  }

  _buildTourStructures(level) {
    if (this._tourBuiltLevel != null && Math.abs(this._tourBuiltLevel - level) < 6) return;
    this._tourBuiltLevel = level;
    this.tourGroup.clear(); this._visitorSpots = [];
    if (level < 20) return;
    const woodMat = this.assets.m('wood');
    // A boardwalk from the shore out over the water on the +Z side.
    const startR = this.world.basinR * 1.0, endR = this.world.basinR * 0.55;
    const planks = 8;
    for (let i = 0; i < planks; i++) {
      const r = startR - (startR - endR) * (i / (planks - 1));
      const y = Math.max(this.world.heightAt(0, r), this.world.waterLevelY) + 0.2;
      const plank = new THREE.Mesh(this.assets.geo.plank, woodMat);
      plank.position.set(0, y, r); plank.scale.set(3, 1, 3.2); plank.castShadow = true;
      this.tourGroup.add(plank);
      this._visitorSpots.push({ x: (this.rand() - 0.5) * 2, z: r });
      const post = new THREE.Mesh(this.assets.geo.post, woodMat);
      post.position.set(1.4, y - 1, r); post.scale.set(1, 2.4, 1);
      this.tourGroup.add(post);
    }
    if (level > 45) {
      // viewing platform at the end
      const plat = new THREE.Mesh(this.assets.geo.plank, woodMat);
      const y = Math.max(this.world.heightAt(0, endR), this.world.waterLevelY) + 0.25;
      plat.position.set(0, y, endR); plat.scale.set(7, 1.3, 7);
      this.tourGroup.add(plat);
      // simple railings
      const rail = new THREE.Mesh(new THREE.BoxGeometry(7, 0.15, 0.15), woodMat);
      rail.position.set(0, y + 1, endR - 3.4); this.tourGroup.add(rail);
    }
  }

  // Reveal `n` instances of an InstancedMesh using stable spots + a placer fn.
  _setInstances(mesh, n, spots, place) {
    n = Math.max(0, Math.min(mesh.instanceMatrix.count, n));
    for (let i = 0; i < n; i++) {
      const spot = spots[i % spots.length];
      this.dummy.position.set(0, 0, 0); this.dummy.rotation.set(0, 0, 0); this.dummy.scale.set(1, 1, 1);
      place(this.dummy, spot, i);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(i, this.dummy.matrix);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
  }

  /* ======================================================================
   * ANIMATE — per frame
   * ==================================================================== */
  update(dt, t) {
    if (this._reedUniforms) this._reedUniforms.uTime.value = t;
    const wy = this.world.waterLevelY;
    const d = this.dummy;

    // Small fish glide in slow arcs below the surface
    const swim = (data, mesh, count, sBias) => {
      for (let i = 0; i < count; i++) {
        const f = data[i];
        f.a += dt * f.spd;
        const x = Math.cos(f.a) * f.r + Math.sin(t + f.wob) * 1.2;
        const z = Math.sin(f.a) * f.r + Math.cos(t + f.wob) * 1.2;
        const y = wy - f.depth + Math.sin(t * 2 + f.wob) * 0.15;
        d.position.set(x, y, z);
        d.rotation.set(0, -f.a + Math.PI / 2, Math.sin(t * 3 + f.wob) * 0.2);
        d.scale.setScalar(f.s * sBias);
        d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
      }
      if (count > 0) mesh.instanceMatrix.needsUpdate = true;
    };
    swim(this._fishData, this.fish, this._fishCount || 0, 1);
    swim(this._fishBigData, this.fishBig, this._fishBigCount || 0, 1);

    // Water birds circle and occasionally skim/land
    for (let i = 0; i < (this._birdCount || 0); i++) {
      const b = this._birdData[i]; b.a += dt * b.spd;
      const land = 0.5 + 0.5 * Math.sin(t * 0.3 + b.landing * 6);
      const h = wy + 1 + b.h * land;
      const x = Math.cos(b.a) * b.r, z = Math.sin(b.a) * b.r;
      d.position.set(x, h, z);
      const flap = 1 + Math.sin(t * 10 + i) * 0.3;
      d.rotation.set(0, -b.a, 0); d.scale.set(b.s, b.s * flap, b.s);
      d.updateMatrix(); this.birds.setMatrixAt(i, d.matrix);
    }
    if (this._birdCount) this.birds.instanceMatrix.needsUpdate = true;

    // Raptors circle high with slow banking
    for (let i = 0; i < (this._raptorCount || 0); i++) {
      const rp = this._raptorData[i]; rp.a += dt * rp.spd;
      d.position.set(Math.cos(rp.a) * rp.r, wy + rp.h, Math.sin(rp.a) * rp.r);
      d.rotation.set(0, -rp.a, Math.sin(rp.a) * 0.3); d.scale.setScalar(rp.s);
      d.updateMatrix(); this.raptors.setMatrixAt(i, d.matrix);
    }
    if (this._raptorCount) this.raptors.instanceMatrix.needsUpdate = true;

    // Frogs hop along the shoreline
    for (let i = 0; i < (this._frogCount || 0); i++) {
      const fr = this._frogData[i]; fr.phase += dt * fr.spd;
      const hop = Math.max(0, Math.sin(fr.phase)) * 0.8;
      const x = Math.cos(fr.a) * fr.r, z = Math.sin(fr.a) * fr.r;
      const gy = Math.max(this.world.heightAt(x, z), wy) + 0.2;
      d.position.set(x, gy + hop, z); d.rotation.set(0, fr.a, 0); d.scale.setScalar(1);
      d.updateMatrix(); this.frogs.setMatrixAt(i, d.matrix);
      fr.a += dt * 0.05;
    }
    if (this._frogCount) this.frogs.instanceMatrix.needsUpdate = true;

    // Insect motes shimmer above the vegetation
    const ip = this.insects.geometry.attributes.position;
    const iN = this._insectCount || 0;
    for (let i = 0; i < ip.count; i++) {
      if (i < iN) {
        const m = this._insectData[i];
        const y = wy + 1.2 + Math.sin(t * m.sp + m.phase) * 1.1 + 1;
        ip.setXYZ(i, m.x + Math.sin(t * 0.7 + m.phase) * 1.5, y, m.z + Math.cos(t * 0.6 + m.phase) * 1.5);
      } else {
        ip.setXYZ(i, 0, -999, 0);
      }
    }
    ip.needsUpdate = true;
  }

  /* Objects the player can click to inspect. */
  getInspectables() {
    return [this.reeds, this.fish, this.fishBig, this.birds, this.raptors, this.frogs, this.crayfish, this.houseWalls, this.treeCanopy, this.farm];
  }
}
