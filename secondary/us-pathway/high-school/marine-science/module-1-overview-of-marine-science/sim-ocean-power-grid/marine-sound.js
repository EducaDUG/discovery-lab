/* OceanCurrents procedural sound (Web Audio, no files). Port of soundEffects.ts.
   Always-visible mute button lives in the simulator's control bar (CLAUDE.md §6). */
class SoundManager {
  constructor() { this.ctx = null; this.muted = false; try { const s = localStorage.getItem("ocean_audio_muted"); if (s !== null) this.muted = s === "true"; } catch (e) {} }
  init() {
    if (!this.ctx) { const A = window.AudioContext || window.webkitAudioContext; if (A) { try { this.ctx = new A(); } catch (e) {} } }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }
  getMuted() { return this.muted; }
  toggleMute() { this.muted = !this.muted; try { localStorage.setItem("ocean_audio_muted", String(this.muted)); } catch (e) {} return this.muted; }
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
  playVictoryFanfare() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone("sine", [[f, 0]], i * 0.12, 0.35, 0.2)); }
}
export const soundManager = new SoundManager();
