/* ============================================================================
 * audio/AudioManager.js — Procedural WebAudio ambience + SFX
 * ----------------------------------------------------------------------------
 * All sound is synthesized at runtime (filtered noise wind/water bed, gentle
 * pad, and short synthesized stingers). No audio files -> no licences. Audio is
 * created lazily on first user gesture (browser autoplay policy) and can be
 * muted globally.
 * ========================================================================== */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.started = false;
    this.master = null;
    this.ambientGain = null;
  }

  /* Must be called from a user gesture (e.g. the Start button). */
  start() {
    if (this.started) { this._resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.6;
    this.master.connect(this.ctx.destination);
    this._buildAmbience();
    this.started = true;
  }
  _resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  _noiseBuffer(seconds = 2) {
    const len = this.ctx.sampleRate * seconds;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  _buildAmbience() {
    const ctx = this.ctx;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.5;
    this.ambientGain.connect(this.master);

    // Wind/water bed: looping filtered noise, slow LFO on the filter.
    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuffer(3); noise.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; lp.Q.value = 0.6;
    const nGain = ctx.createGain(); nGain.gain.value = 0.16;
    noise.connect(lp).connect(nGain).connect(this.ambientGain);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 240;
    lfo.connect(lfoGain).connect(lp.frequency);
    noise.start(); lfo.start();

    // Warm pad: two detuned sines an octave apart, very quiet.
    const padGain = ctx.createGain(); padGain.gain.value = 0.05; padGain.connect(this.ambientGain);
    [110, 164.8, 220].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      o.detune.value = (i - 1) * 4;
      const g = ctx.createGain(); g.gain.value = 0.5 / (i + 1);
      o.connect(g).connect(padGain); o.start();
    });
    this._wind = { lp };
  }

  /* Set ambience mood: mud/dry/warm shifts the wind filter + pad level. */
  setMood({ climate = 0, waterQuality = 1 } = {}) {
    if (!this.started || this.muted) return;
    const now = this.ctx.currentTime;
    // hotter/drier -> brighter, hissier wind
    this._wind.lp.frequency.setTargetAtTime(400 + climate * 900, now, 1.5);
    this.ambientGain.gain.setTargetAtTime(0.35 + (1 - waterQuality) * 0.2, now, 1.5);
  }

  toggleMute() { this.setMuted(!this.muted); return this.muted; }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.05);
  }

  /* ---- Short synthesized SFX -------------------------------------------- */
  _blip(freq, dur, type = 'sine', vol = 0.25, slideTo = null) {
    if (!this.started || this.muted) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g).connect(this.master); o.start(now); o.stop(now + dur + 0.02);
  }

  select()   { this._blip(520, 0.08, 'triangle', 0.18); }
  hover()    { this._blip(680, 0.04, 'sine', 0.06); }
  confirm()  { this._blip(440, 0.12, 'triangle', 0.2, 660); }
  positive() { this._blip(523, 0.15, 'sine', 0.22, 784); setTimeout(() => this._blip(784, 0.18, 'sine', 0.18), 90); }
  negative() { this._blip(300, 0.25, 'sawtooth', 0.18, 140); }
  year()     { this._blip(392, 0.2, 'triangle', 0.16, 523); }

  event(tone) {
    if (tone === 'good') this.positive();
    else if (tone === 'bad') { this._blip(220, 0.4, 'sawtooth', 0.2, 110); }
    else this._blip(330, 0.25, 'triangle', 0.16);
  }
  whoosh() {
    if (!this.started || this.muted) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = this._noiseBuffer(1);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 400;
    bp.frequency.exponentialRampToValueAtTime(1800, now + 0.5);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    src.connect(bp).connect(g).connect(this.master); src.start(now); src.stop(now + 0.8);
  }
}
