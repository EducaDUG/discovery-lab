/* ==========================================================================
   DISCOVERY LAB — NATURAL VOICES   (engine/natural-voice.js)

   Free, open-source neural text-to-speech (Piper, MIT) running ENTIRELY in the
   student's browser through WebAssembly: no API key, no server, no cost, and
   no text ever leaves the device. The engine files are vendored in
   engine/vendor/piper/. The voice model (about 60-80 MB) is downloaded ONCE,
   only when a student turns "Natural voice" on and uses a voice, from the
   public Hugging Face model repository (a disclosed exception to
   "nothing from a CDN", like Google sign-in on the admin page), and then kept
   in the browser's Cache Storage so it works offline afterwards.

   If anything fails (no WebAssembly, blocked network, old browser), callers
   fall back to the browser's built-in voices automatically.
   ========================================================================== */

const BASE = "https://huggingface.co/diffusionstudio/piper-voices/resolve/main/";
const DIR = new URL("vendor/piper/", import.meta.url).href;
const CACHE = "dl-piper-voices-v1";

/* key = lang-accent-gender. Spain Spanish is one two-speaker model (0 = male, 1 = female). */
const VOICES = {
  "es-spain-female": { path: "es/es_ES/sharvard/medium/es_ES-sharvard-medium", sid: 1 },
  "es-spain-male":   { path: "es/es_ES/sharvard/medium/es_ES-sharvard-medium", sid: 0 },
  "es-latam-female": { path: "es/es_MX/claude/high/es_MX-claude-high" },
  "es-latam-male":   { path: "es/es_MX/ald/medium/es_MX-ald-medium" },
  "en-uk-female":    { path: "en/en_GB/alba/medium/en_GB-alba-medium" },
  "en-uk-male":      { path: "en/en_GB/alan/medium/en_GB-alan-medium" },
  "en-us-female":    { path: "en/en_US/amy/medium/en_US-amy-medium" },
  "en-us-male":      { path: "en/en_US/ryan/medium/en_US-ryan-medium" },
};

export function naturalSupported() {
  return typeof WebAssembly === "object" && typeof caches !== "undefined" && !!window.fetch;
}

export function voiceKey(lang, accent, gender) {
  const l = lang === "es" ? "es" : "en";
  const a = l === "es" ? (accent === "latam" ? "latam" : "spain") : (accent === "us" ? "us" : "uk");
  const g = gender === "male" ? "male" : "female";
  return `${l}-${a}-${g}`;
}

let ortPromise = null, phonPromise = null;
function loadOrt() {
  if (window.ort) { window.ort.env.wasm.wasmPaths = DIR; window.ort.env.wasm.numThreads = 1; return Promise.resolve(window.ort); }
  return ortPromise || (ortPromise = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = DIR + "ort.wasm.min.js"; s.onload = () => res(window.ort); s.onerror = () => rej(new Error("ort")); document.head.appendChild(s);
  }).then(ort => { ort.env.wasm.wasmPaths = DIR; ort.env.wasm.numThreads = 1; return ort; }));
}
function loadPhon() { return phonPromise || (phonPromise = import(DIR + "piper-phonemize.mjs").then(m => m.createPiperPhonemize)); }

async function cachedFetch(url, onProgress) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(url);
  if (hit) return hit.arrayBuffer();
  const r = await fetch(url);
  if (!r.ok) throw new Error("fetch " + r.status);
  const total = +r.headers.get("content-length") || 0;
  const reader = r.body.getReader(); const parts = []; let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value); got += value.length;
    if (onProgress && total) onProgress(got / total);
  }
  const blob = new Blob(parts);
  try { await cache.put(url, new Response(blob)); } catch (e) { /* storage full: still works this session */ }
  return blob.arrayBuffer();
}

const sessions = {};
function getSession(key, onProgress) {
  if (sessions[key]) return sessions[key];
  const v = VOICES[key];
  if (!v) return Promise.reject(new Error("no voice"));
  return (sessions[key] = (async () => {
    const [ort, phon] = await Promise.all([loadOrt(), loadPhon()]);
    const cfg = JSON.parse(new TextDecoder().decode(await cachedFetch(BASE + v.path + ".onnx.json")));
    const model = await cachedFetch(BASE + v.path + ".onnx", onProgress);
    const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
    return { ort, phon, cfg, session, sid: v.sid || 0 };
  })().catch(e => { delete sessions[key]; throw e; }));
}

function phonemeIds(S, text) {
  return new Promise(async (resolve, reject) => {
    try {
      const mod = await S.phon({
        print: d => { try { resolve(JSON.parse(d).phoneme_ids); } catch (e) { reject(e); } },
        printErr: () => {},
        locateFile: u => DIR + (u.endsWith(".wasm") ? "piper_phonemize.wasm" : u.endsWith(".data") ? "piper_phonemize.data" : u),
      });
      mod.callMain(["-l", S.cfg.espeak.voice, "--input", JSON.stringify([{ text }]), "--espeak_data", "/espeak-ng-data"]);
    } catch (e) { reject(e); }
  });
}

async function synth(S, text) {
  const ids = await phonemeIds(S, text);
  const { ort, cfg, session } = S;
  const feeds = {
    input: new ort.Tensor("int64", ids, [1, ids.length]),
    input_lengths: new ort.Tensor("int64", [ids.length]),
    scales: new ort.Tensor("float32", [cfg.inference.noise_scale, cfg.inference.length_scale, cfg.inference.noise_w]),
  };
  if (Object.keys(cfg.speaker_id_map || {}).length) feeds.sid = new ort.Tensor("int64", [S.sid]);
  const { output } = await session.run(feeds);
  return wav(output.data, cfg.audio.sample_rate);
}

function wav(f32, rate) {
  const n = f32.length, b = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) b.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); b.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt ");
  b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
  b.setUint32(24, rate, true); b.setUint32(28, rate * 2, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true);
  w(36, "data"); b.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, f32[i])); b.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  return new Blob([b], { type: "audio/wav" });
}

function sentences(text) {
  const t = String(text).replace(/\s+/g, " ").trim();
  const m = t.match(/[^.!?…]+[.!?…]*\s*/g) || [t];
  const out = []; let cur = "";
  m.forEach(s => { if ((cur + s).length > 220 && cur) { out.push(cur.trim()); cur = ""; } cur += s; });
  if (cur.trim()) out.push(cur.trim());
  return out;
}

let token = 0, audio = null;
export function stopNatural() {
  token++;
  if (audio) { try { audio.pause(); } catch (e) { /* ignore */ } audio = null; }
}

/* Speak with a natural voice. Resolves true if it played, false if it could not
   (the caller then falls back to the browser voice). onStatus(percent|null) reports the one-time download. */
export async function speakNatural(text, { lang, accent, gender, onStatus } = {}) {
  const key = voiceKey(lang, accent, gender);
  if (!naturalSupported() || !VOICES[key]) return false;
  const my = ++token;
  if (audio) { try { audio.pause(); } catch (e) { /* ignore */ } audio = null; }
  try {
    const S = await getSession(key, p => onStatus && onStatus(Math.round(p * 100)));
    onStatus && onStatus(null);
    if (my !== token) return true;
    const parts = sentences(text);
    let next = synth(S, parts[0]);
    for (let i = 0; i < parts.length; i++) {
      const blob = await next;
      if (my !== token) return true;
      next = i + 1 < parts.length ? synth(S, parts[i + 1]) : null;
      await new Promise(res => {
        const a = new Audio(URL.createObjectURL(blob)); audio = a;
        a.onended = a.onerror = () => { URL.revokeObjectURL(a.src); res(); };
        a.play().catch(res);
      });
    }
    return true;
  } catch (e) {
    onStatus && onStatus(null);
    console.warn("Natural voice unavailable, using browser voice:", e);
    return false;
  }
}
