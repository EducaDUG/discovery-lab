/* ==========================================================================
   PRIMARY ENRICHMENT — ADMIN (Mr Guevara only)
   Thin wrapper around Firebase Auth + the enrichment-history archive for
   the hidden class-records page. Nothing here is loaded by any student-
   facing activity — only primary/primary-enrichment/admin/index.html.

   Real access control lives in the database's own Security Rules (reads
   on enrichment-history restricted to Mr Guevara's signed-in email) —
   signing in here is what makes those rules let the reads through, it
   is not itself the security boundary.

   Expects the vendored Firebase compat scripts (app, auth, database) to
   already be on the page as classic <script> tags.
   ========================================================================== */

import { FIREBASE_CONFIG } from "./firebase-config.js";

let app = null;

function ensureApp() {
  if (app) return app;
  if (typeof firebase === "undefined") throw new Error("Firebase SDK not loaded on page.");
  app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
  return app;
}

/** callback(user | null) fires immediately with current state, then on every change. */
export function onAuthChange(callback) {
  ensureApp();
  return firebase.auth().onAuthStateChanged(callback);
}

export async function signIn(email, password) {
  ensureApp();
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

export function signOutAdmin() {
  ensureApp();
  return firebase.auth().signOut();
}

/** Live read of every track's history, flattened and newest first.
 *  Returns an unsubscribe function. Only resolves data once the caller is
 *  signed in as the permitted account — otherwise the Security Rules deny
 *  the read and this reports an empty list. */
export function onHistory(callback) {
  ensureApp();
  const ref = firebase.database().ref("enrichment-history");
  const handler = snap => {
    const val = snap.val() || {};
    const rows = [];
    for (const track in val) {
      for (const id in val[track]) {
        rows.push({ id, track, ...val[track][id] });
      }
    }
    rows.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    callback(rows);
  };
  ref.on("value", handler, err => callback([], err));
  return () => ref.off("value", handler);
}
