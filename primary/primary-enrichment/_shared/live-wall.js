/* ==========================================================================
   PRIMARY ENRICHMENT — LIVE WALL
   Thin wrapper around Firebase Realtime Database for the live layer shared
   by every Primary Enrichment activity: who has joined, the live scoreboard,
   and a positive-only reaction stream. Content activities never talk to
   Firebase directly — they only call the functions below.

   Loaded as an ES module. Expects the vendored Firebase compat scripts
   (engine/vendor/firebase/firebase-app-compat.js and
   firebase-database-compat.js) to already be on the page as classic
   <script> tags, which attach the global `firebase` object.

   Data shape, under enrichment-sessions/{sessionId}:
     players/{playerId}: { name, score, joinedAt }
     reactions/{pushId}: { emoji, name, ts }

   A playerId is a random id kept in sessionStorage for this tab only —
   nothing that identifies a student beyond the first name they typed.
   onDisconnect removes the player automatically if they close the tab.
   ========================================================================== */

import { FIREBASE_CONFIG, FIREBASE_READY } from "./firebase-config.js";

const REACTIONS = ["❤️", "👍", "🙂", "⭐"];
let app = null, db = null, sessionRef = null, playerId = null;

function ensureApp() {
  if (app) return app;
  if (typeof firebase === "undefined") throw new Error("Firebase SDK not loaded on page.");
  app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.database();
  return app;
}

function randomId() {
  return "p" + Math.random().toString(36).slice(2, 10);
}

/** Today's fixed room id for a track, e.g. "english" -> "english-2026-09-07".
 *  A new room every day, so nothing lingers between sessions. */
export function todaysSessionId(track) {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${track}-${iso}`;
}

/** True only once firebase-config.js has been filled in. Callers should fall
 *  back to a solo, non-live experience when this is false. */
export function isLive() {
  return FIREBASE_READY;
}

/** Join a session with a first name (already trimmed/limited by the caller).
 *  Returns { playerId }. Safe to call once per page load. */
export function joinSession(sessionId, name) {
  ensureApp();
  playerId = randomId();
  sessionRef = db.ref(`enrichment-sessions/${sessionId}`);
  const playerRef = sessionRef.child(`players/${playerId}`);
  playerRef.set({ name, score: 0, joinedAt: firebase.database.ServerValue.TIMESTAMP });
  playerRef.onDisconnect().remove();
  window.addEventListener("pagehide", () => playerRef.remove());
  return { playerId };
}

/** Add (or subtract) points for the current player. */
export function addScore(sessionId, delta) {
  if (!sessionRef || !playerId) return;
  sessionRef.child(`players/${playerId}/score`).transaction(s => (s || 0) + delta);
}

/** Send one of the four fixed positive reactions — never free text. */
export function sendReaction(sessionId, emoji, name) {
  if (!REACTIONS.includes(emoji)) return;
  ensureApp();
  db.ref(`enrichment-sessions/${sessionId}/reactions`).push({
    emoji, name: name || "Someone", ts: firebase.database.ServerValue.TIMESTAMP
  });
}

/** Live leaderboard: callback(players) fires on every change, players sorted
 *  by score desc, each { id, name, score }. */
export function onPlayers(sessionId, callback) {
  ensureApp();
  const ref = db.ref(`enrichment-sessions/${sessionId}/players`);
  const handler = snap => {
    const val = snap.val() || {};
    const list = Object.entries(val)
      .map(([id, p]) => ({ id, name: p.name, score: p.score || 0 }))
      .sort((a, b) => b.score - a.score);
    callback(list);
  };
  ref.on("value", handler);
  return () => ref.off("value", handler);
}

/** Live reaction stream: callback(reaction) fires once per NEW reaction sent
 *  after this listener attached (history is not replayed). */
export function onReactions(sessionId, callback) {
  ensureApp();
  const ref = db.ref(`enrichment-sessions/${sessionId}/reactions`).limitToLast(1);
  let first = true;
  const handler = snap => {
    if (first) { first = false; return; } // skip the one existing item on attach
    const val = snap.val();
    if (val) callback(val);
  };
  ref.on("child_added", handler);
  return () => ref.off("child_added", handler);
}

export { REACTIONS };
