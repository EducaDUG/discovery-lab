/* ==========================================================================
   PRIMARY ENRICHMENT ADMIN — GOOGLE DRIVE SYNC CONFIG

   Used only by the hidden admin page (primary/primary-enrichment/admin/) to
   automatically copy class records into a "Discovery Lab" folder in Diego's
   own Google Drive. Nothing else on the site touches this file.

   HOW TO FILL THIS IN — do this in Google Cloud Console, in the SAME
   project as Firebase (a Firebase project IS a Google Cloud project with
   the same ID — pick "learning-lab-8529e" from the project dropdown at
   https://console.cloud.google.com/):

     1. APIs & Services -> Library -> search "Google Drive API" -> Enable.

     2. APIs & Services -> OAuth consent screen -> User type: External ->
        Create. Fill in an app name (e.g. "Discovery Lab Admin"), your own
        email as support + developer contact -> Save and Continue through
        the Scopes step (leave it empty, skip) -> on the Test users step,
        add your own Google email -> Save and Continue -> Back to Dashboard.
        (This app stays in "Testing" mode forever, which is fine — it is
        only ever used by you. The first time you connect, Google will show
        an "unverified app" warning; click "Advanced" -> "Go to Discovery
        Lab Admin (unsafe)" — this is expected and safe for your own app.)

     3. APIs & Services -> Credentials -> Create Credentials -> OAuth
        client ID -> Application type: Web application -> name it anything
        -> under "Authorized JavaScript origins" add:
          https://educadug.github.io
        -> Create. Copy the Client ID shown (ends in
        ".apps.googleusercontent.com") and paste it below.

   SECURITY NOTE: like the Firebase config, this Client ID is not a secret
   — OAuth client IDs are meant to be public. The actual security boundary
   is: (a) the OAuth consent screen's Testing mode only lets YOUR Google
   account grant access at all, and (b) the requested scope (drive.file)
   only ever lets this page see files it created itself — never anything
   else in your Drive.
   ========================================================================== */

export const GOOGLE_CLIENT_ID = "REPLACE_ME.apps.googleusercontent.com";

export const GOOGLE_DRIVE_READY = GOOGLE_CLIENT_ID !== "REPLACE_ME.apps.googleusercontent.com";
