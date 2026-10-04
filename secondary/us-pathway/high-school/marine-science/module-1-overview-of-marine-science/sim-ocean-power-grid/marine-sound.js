/* OceanCurrents procedural sound (Web Audio, no files). Port of soundEffects.ts.
   Always-visible mute button lives in the simulator's control bar (CLAUDE.md §6). */
class SoundManager {
  constructor() { this.ctx = null; this.muted = false; this.boat = null; this.heli = null; try { const s = localStorage.getItem("ocean_audio_muted"); if (s !== null) this.muted = s === "true"; } catch (e) {} }
  init() {
    if (!this.ctx) { const A = window.AudioContext || window.webkitAudioContext; if (A) { try { this.ctx = new A(); } catch (e) {} } }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }
  getMuted() { return this.muted; }
  toggleMute() {
    this.muted = !this.muted; try { localStorage.setItem("ocean_audio_muted", String(this.muted)); } catch (e) {}
    const now = this.ctx ? this.ctx.currentTime : 0;   // running engine loops follow the mute switch immediately
    if (this.boat) this.boat.gain.gain.setValueAtTime(this.muted ? 0 : 0.2, now);
    if (this.heli) this.heli.master.gain.setValueAtTime(this.muted ? 0 : 0.25, now);
    return this.muted;
  }
  isBoatPlaying() { return !!this.boat; }
  isHelicopterPlaying() { return !!this.heli; }
  noise(now, freq, q, vol) {
    const c = this.ctx, buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true; const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(freq, now); f.Q.setValueAtTime(q, now);
    const g = c.createGain(); g.gain.setValueAtTime(this.muted ? 0 : vol, now); src.connect(f); f.connect(g); g.connect(c.destination); src.start(now); return { src, g };
  }
  /* Workboat: continuous marine diesel chug + propeller wash while it sails and services, plus a horn blast on departure */
  startBoatLoop() {
    if (!this.init() || this.boat) return; const c = this.ctx, now = c.currentTime;
    const o1 = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), gain = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o1.type = "sawtooth"; o1.frequency.setValueAtTime(82, now); o2.type = "triangle"; o2.frequency.setValueAtTime(164, now); f.type = "lowpass"; f.frequency.setValueAtTime(280, now); f.Q.setValueAtTime(1.8, now);
    lfo.type = "sine"; lfo.frequency.setValueAtTime(5.2, now); lg.gain.setValueAtTime(0.08, now); lfo.connect(lg); lg.connect(gain.gain); lfo.start(now);
    gain.gain.setValueAtTime(this.muted ? 0 : 0.2, now); o1.connect(f); o2.connect(f); f.connect(gain); gain.connect(c.destination); o1.start(now); o2.start(now);
    let nz = null; try { nz = this.noise(now, 260, 0.9, 0.04); } catch (e) {}
    this.boat = { o1, o2, lfo, gain, nz }; this.playBoatHorn();
  }
  stopBoatLoop() {
    if (!this.boat || !this.ctx) return; const n = this.boat, now = this.ctx.currentTime; this.boat = null;
    try { n.gain.gain.setValueAtTime(Math.max(0.0002, n.gain.gain.value), now); n.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7); if (n.nz) n.nz.g.gain.setValueAtTime(0, now);
      setTimeout(() => { try { n.o1.stop(); n.o2.stop(); n.lfo.stop(); if (n.nz) n.nz.src.stop(); } catch (e) {} }, 750); } catch (e) {}
  }
  playBoatSound() { this.startBoatLoop(); }
  /* Helicopter: turbine whine + signature rotor chop ("whop-whop") from take-off until it lands again */
  startHelicopterLoop() {
    if (!this.init() || this.heli) return; const c = this.ctx, now = c.currentTime;
    const master = c.createGain(); master.gain.setValueAtTime(0.001, now); master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.25, now + 0.4); master.connect(c.destination);
    const t1 = c.createOscillator(), t2 = c.createOscillator(), tg = c.createGain(); t1.type = "sine"; t1.frequency.setValueAtTime(460, now); t1.frequency.linearRampToValueAtTime(520, now + 1.2); t2.type = "sine"; t2.frequency.setValueAtTime(920, now); t2.frequency.linearRampToValueAtTime(1040, now + 1.2);
    tg.gain.setValueAtTime(0.05, now); t1.connect(tg); t2.connect(tg); tg.connect(master); t1.start(now); t2.start(now);
    const bo = c.createOscillator(), bf = c.createBiquadFilter(), bg = c.createGain(), lfo = c.createOscillator(), depth = c.createGain();
    bo.type = "sawtooth"; bo.frequency.setValueAtTime(115, now); bf.type = "bandpass"; bf.frequency.setValueAtTime(240, now); bf.Q.setValueAtTime(2.2, now);
    lfo.type = "sine"; lfo.frequency.setValueAtTime(10.8, now); depth.gain.setValueAtTime(0.14, now); lfo.connect(depth); depth.connect(bg.gain); lfo.start(now);
    bg.gain.setValueAtTime(0.18, now); bo.connect(bf); bf.connect(bg); bg.connect(master); bo.start(now);
    let nz = null; try { const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true; const nf = c.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.setValueAtTime(420, now); nf.Q.setValueAtTime(1.2, now);
      const ng = c.createGain(); ng.gain.setValueAtTime(0.06, now); depth.connect(ng.gain); src.connect(nf); nf.connect(ng); ng.connect(master); src.start(now); nz = src; } catch (e) {}
    this.heli = { t1, t2, bo, lfo, master, nz };
  }
  stopHelicopterLoop() {
    if (!this.heli || !this.ctx) return; const n = this.heli, now = this.ctx.currentTime; this.heli = null;
    try { n.t1.frequency.linearRampToValueAtTime(260, now + 0.9); n.t2.frequency.linearRampToValueAtTime(520, now + 0.9); n.master.gain.setValueAtTime(Math.max(0.0002, n.master.gain.value), now); n.master.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
      setTimeout(() => { try { n.t1.stop(); n.t2.stop(); n.bo.stop(); n.lfo.stop(); if (n.nz) n.nz.stop(); n.master.disconnect(); } catch (e) {} }, 1050); } catch (e) {}
  }
  stopAll() { this.stopBoatLoop(); this.stopHelicopterLoop(); }
  tone(type, freqs, t0, dur, vol, at = 0) {
    if (this.muted || !this.init()) return;
    const c = this.ctx, now = c.currentTime + t0, o = c.createOscillator(), g = c.createGain();
    o.type = type; freqs.forEach(([f, dt, exp]) => exp ? o.frequency.exponentialRampToValueAtTime(f, now + dt) : o.frequency.setValueAtTime(f, now + dt));
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g); g.connect(c.destination); o.start(now); o.stop(now + dur + 0.05);
  }
  playPlaceSound() { this.tone("sine", [[440, 0], [880, 0.12, 1], [1320, 0.35, 1]], 0, 0.4, 0.2); }
  playRepairSound() { this.tone("triangle", [[523.25, 0], [659.25, 0.08], [783.99, 0.16]], 0, 0.4, 0.18); this.tone("sine", [[1046.5, 0]], 0.2, 0.25, 0.14); }
  playClick() { this.tone("sine", [[800, 0], [400, 0.04, 1]], 0, 0.04, 0.08); }
  playWarningAlert() { this.tone("sawtooth", [[320, 0], [280, 0.1]], 0, 0.25, 0.15); }
  playBoatHorn() { [0, 0.22].forEach(d => { this.tone("sawtooth", [[220, 0]], d, 0.18, 0.12); this.tone("sine", [[277.18, 0]], d, 0.18, 0.1); }); }
  playAlertChime() { [587.33, 440.0].forEach((f, i) => this.tone("sine", [[f, 0]], i * 0.15, 0.28, 0.15)); }
  playPraiseChime() { [440, 554.37, 659.25].forEach((f, i) => this.tone("triangle", [[f, 0]], i * 0.08, 0.25, 0.14)); }
  playVictoryFanfare() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone("sine", [[f, 0]], i * 0.12, 0.35, 0.2)); }
}
export const soundManager = new SoundManager();
