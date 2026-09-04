/* ============================================================================
 * assets/AssetManager.js — Procedural low-poly asset factory
 * ----------------------------------------------------------------------------
 * Every mesh in the game is generated here from simple geometry — no external
 * art files. Geometries and materials are cached and shared so thousands of
 * instances stay cheap. Flat shading gives the faceted low-poly look.
 * ========================================================================== */
import * as THREE from 'three';

export const PALETTE = {};
PALETTE.grass    = 0x6f8f4e;
PALETTE.grassDry = 0xc4a24a;
PALETTE.mud      = 0x8a6f47;
PALETTE.mudDry   = 0xb08a55;
PALETTE.reed     = 0x7c9a3e;
PALETTE.reedDry  = 0xb59a45;
PALETTE.trunk    = 0x6b4f34;
PALETTE.leaf     = 0x4e7a3a;
PALETTE.leafDark = 0x3d6330;
PALETTE.waterClear = 0x2f8f9e;
PALETTE.waterMurk  = 0x5f7a3a;
PALETTE.roof     = 0xb2553f;
PALETTE.wall     = 0xd8c7a4;
PALETTE.wood     = 0x9c7a4d;
PALETTE.fish     = 0xc9b26a;
PALETTE.fishBig  = 0x5f6f7a;
PALETTE.bird     = 0x3a4a55;
PALETTE.raptor   = 0x6b5540;
PALETTE.frog     = 0x5d8a3a;
PALETTE.crayfish = 0xb04a33;

/* Deterministic value noise for gentle terrain/scatter (no deps). */
export function makeNoise(seed = 1) {
  const rand = (x, y) => {
    let n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const tl = rand(xi, yi), tr = rand(xi + 1, yi);
    const bl = rand(xi, yi + 1), br = rand(xi + 1, yi + 1);
    const u = smooth(xf), v = smooth(yf);
    return lerp(lerp(tl, tr, u), lerp(bl, br, u), v); // bilinear value noise, 0..1
  };
}

export class AssetManager {
  constructor() {
    this.geo = {};
    this.mat = {};
    this._buildShared();
  }

  _mat(key, opts) {
    if (!this.mat[key]) this.mat[key] = new THREE.MeshStandardMaterial({ flatShading: true, ...opts });
    return this.mat[key];
  }

  _buildShared() {
    // Materials
    this._mat('grass', { color: PALETTE.grass, roughness: 1 });
    this._mat('reed', { color: PALETTE.reed, roughness: 0.9 });
    this._mat('trunk', { color: PALETTE.trunk, roughness: 1 });
    this._mat('leaf', { color: PALETTE.leaf, roughness: 1 });
    this._mat('leafDark', { color: PALETTE.leafDark, roughness: 1 });
    this._mat('roof', { color: PALETTE.roof, roughness: 0.8 });
    this._mat('wall', { color: PALETTE.wall, roughness: 0.9 });
    this._mat('wood', { color: PALETTE.wood, roughness: 0.9 });
    this._mat('fish', { color: PALETTE.fish, roughness: 0.5, metalness: 0.1 });
    this._mat('fishBig', { color: PALETTE.fishBig, roughness: 0.5, metalness: 0.1 });
    this._mat('bird', { color: PALETTE.bird, roughness: 0.7 });
    this._mat('raptor', { color: PALETTE.raptor, roughness: 0.7 });
    this._mat('frog', { color: PALETTE.frog, roughness: 0.8 });
    this._mat('crayfish', { color: PALETTE.crayfish, roughness: 0.6 });
    this._mat('farm', { color: 0x9a8b3d, roughness: 1 });

    // Geometries (unit-ish; scaled per instance)
    this.geo.reed = this._reedGeo();
    this.geo.reedHead = new THREE.SphereGeometry(0.06, 5, 4);
    this.geo.trunk = new THREE.CylinderGeometry(0.12, 0.18, 1, 5);
    this.geo.canopy = new THREE.IcosahedronGeometry(0.8, 0);
    this.geo.box = new THREE.BoxGeometry(1, 1, 1);
    this.geo.roof = new THREE.ConeGeometry(0.8, 0.7, 4);
    this.geo.fish = this._fishGeo();
    this.geo.bird = this._birdGeo();
    this.geo.frog = new THREE.IcosahedronGeometry(0.18, 0);
    this.geo.crayfish = new THREE.CapsuleGeometry(0.08, 0.16, 2, 5);
    this.geo.plank = new THREE.BoxGeometry(1, 0.06, 0.5);
    this.geo.post = new THREE.CylinderGeometry(0.05, 0.05, 1, 4);
    this.geo.visitor = new THREE.CapsuleGeometry(0.09, 0.18, 2, 4);
    this.geo.lily = new THREE.CircleGeometry(0.35, 6);
  }

  _reedGeo() {
    // A thin tapered blade (two-sided) for a reed stalk.
    const g = new THREE.PlaneGeometry(0.09, 1, 1, 4);
    g.translate(0, 0.5, 0); // pivot at base so it sways from the ground
    return g;
  }

  _fishGeo() {
    // Elongated diamond body + tail.
    const g = new THREE.ConeGeometry(0.12, 0.5, 4);
    g.rotateZ(Math.PI / 2);
    return g;
  }

  _birdGeo() {
    // Simple V-wing shape from a flattened cone pair (a boomerang-ish body).
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(0.5, 0.12); shape.lineTo(0.16, 0.02);
    shape.lineTo(0, 0.16); shape.lineTo(-0.16, 0.02); shape.lineTo(-0.5, 0.12); shape.lineTo(0, 0);
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    return g;
  }

  m(key) { return this.mat[key]; }
}
