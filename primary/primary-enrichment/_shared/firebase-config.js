/* ==========================================================================
   PRIMARY ENRICHMENT — LIVE SESSION BACKEND CONFIG

   This is the ONE file to edit to switch on live sessions for every Primary
   Enrichment activity (English, Maths, Science). It is not used anywhere
   else on the site — every other Discovery Lab activity stays fully
   client-side per CLAUDE.md Section 7.

   HOW TO FILL THIS IN (about 3 minutes):
     1. Go to https://console.firebase.google.com/ and sign in with your
        Google account.
     2. Click "Add project" -> name it e.g. "discovery-lab-enrichment" ->
        you can skip Google Analytics for this project -> Create.
     3. In the left sidebar: Build -> Realtime Database -> Create Database.
        Choose any location close to your students -> start in TEST MODE
        (this keeps setup simple; test mode rules expire after 30 days, so
        come back to this file's "SECURITY RULES" note below before then).
     4. Back in the project overview, click the "</>" (web) icon to register
        a web app -> give it any nickname -> Register app. Firebase shows you
        a `firebaseConfig` object — copy it.
     5. Paste the values into FIREBASE_CONFIG below, replacing every
        "REPLACE_ME". Save this file. That's it — no other file changes.

   SECURITY NOTE: this config (apiKey included) is not a secret — it is
   normal for it to sit in public client-side code; Firebase access control
   comes from the database's own Security Rules, not from hiding this object.
   Test-mode rules allow anyone with the project URL to read/write while
   enabled. Because every Primary Enrichment session only ever stores a first
   name, a live score and a preset reaction emoji (never full answers, never
   stored beyond the session), this trade-off is acceptable for a first
   trial. Before the 30-day test-mode window closes, replace the rules with:
     {
       "rules": {
         "enrichment-sessions": {
           "$sessionId": { ".read": true, ".write": true }
         }
       }
     }
   (Realtime Database -> Rules tab -> paste -> Publish.)
   ========================================================================== */

export const FIREBASE_CONFIG = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  databaseURL: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

export const FIREBASE_READY = !Object.values(FIREBASE_CONFIG).some(v => v === "REPLACE_ME");
