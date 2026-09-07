/* ==========================================================================
   PRIMARY ENRICHMENT ADMIN — GOOGLE DRIVE SYNC
   Thin wrapper around Google Identity Services (OAuth) + the Drive REST API
   so the admin page can keep a "Discovery Lab" folder in Diego's own Drive
   up to date with the class records, automatically, whenever he has the
   admin page open — no manual export/upload needed.

   Loaded only by primary/primary-enrichment/admin/index.html, which also
   loads Google's own Identity Services script as a classic <script> tag —
   the ONE disclosed exception to this project's "everything vendored, no
   CDN" rule (see CLAUDE.md Section 15/16). That script cannot be vendored:
   Google's OAuth popup flow only works when it runs from Google's own
   origin, by design.

   Scope used: drive.file — this app can only ever see/edit files it
   created itself, never anything else already in Diego's Drive.
   ========================================================================== */

import { GOOGLE_CLIENT_ID } from "./google-drive-config.js";

const FOLDER_NAME = "Discovery Lab";
const FILE_NAME = "Discovery Lab Class Records.csv";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

let tokenClient = null;
let accessToken = null;
let folderId = null;
let fileId = null;
let statusCallback = () => {};

function setStatus(status, detail) {
  statusCallback(status, detail);
}

function ensureTokenClient() {
  if (tokenClient) return tokenClient;
  if (typeof google === "undefined" || !google.accounts?.oauth2) {
    throw new Error("Google Identity Services script not loaded.");
  }
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPE,
    callback: () => {}
  });
  return tokenClient;
}

/** Register a callback for connection status changes:
 *  status = "connected" | "disconnected" | "connecting" | "error" */
export function onDriveStatus(callback) {
  statusCallback = callback;
}

export function isDriveConnected() {
  return !!accessToken;
}

/** Try to get an access token without showing any popup — works only if
 *  Diego already granted access in this browser before and is still
 *  signed into Google. Silent by design; failing quietly just means the
 *  explicit "Connect Google Drive" button stays visible. */
export function trySilentConnect() {
  return new Promise(resolve => {
    try {
      const client = ensureTokenClient();
      client.callback = resp => {
        if (resp.access_token) {
          accessToken = resp.access_token;
          setStatus("connected");
          resolve(true);
        } else {
          resolve(false);
        }
      };
      client.error_callback = () => resolve(false);
      client.requestAccessToken({ prompt: "none" });
    } catch {
      resolve(false);
    }
  });
}

/** Explicit connect — must be called from a real click handler (Google
 *  requires a user gesture to show the consent popup). */
export function connectDrive() {
  return new Promise((resolve, reject) => {
    try {
      const client = ensureTokenClient();
      setStatus("connecting");
      client.callback = resp => {
        if (resp.access_token) {
          accessToken = resp.access_token;
          setStatus("connected");
          resolve(true);
        } else {
          setStatus("error", "No access token returned.");
          reject(new Error("No access token returned."));
        }
      };
      client.error_callback = err => {
        setStatus("error", err?.message || "Google sign-in was cancelled or failed.");
        reject(err);
      };
      client.requestAccessToken({ prompt: "consent" });
    } catch (e) {
      setStatus("error", e.message);
      reject(e);
    }
  });
}

async function driveFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` }
  });
  if (res.status === 401) {
    accessToken = null;
    setStatus("disconnected");
    throw new Error("Google Drive session expired — reconnect.");
  }
  if (!res.ok) throw new Error(`Drive API error ${res.status}: ${await res.text()}`);
  return res;
}

async function findOrCreateFolder() {
  if (folderId) return folderId;
  const q = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`);
  const found = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`).then(r => r.json());
  if (found.files?.length) {
    folderId = found.files[0].id;
    return folderId;
  }
  const created = await driveFetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" })
  }).then(r => r.json());
  folderId = created.id;
  return folderId;
}

async function findOrCreateFile(parentId) {
  if (fileId) return fileId;
  const q = encodeURIComponent(`name='${FILE_NAME}' and '${parentId}' in parents and trashed=false`);
  const found = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`).then(r => r.json());
  if (found.files?.length) {
    fileId = found.files[0].id;
    return fileId;
  }
  const boundary = "discoverylab" + Math.random().toString(36).slice(2);
  const metadata = { name: FILE_NAME, parents: [parentId], mimeType: "text/csv" };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: text/csv\r\n\r\n\r\n` +
    `--${boundary}--`;
  const created = await driveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body
  }).then(r => r.json());
  fileId = created.id;
  return fileId;
}

/** Build the same CSV shape used for the manual export, for reuse by both. */
export function rowsToCSV(rows) {
  const header = ["Date", "Track", "Activity", "Name", "Score", "Max", "Percent"];
  const lines = [header.join(",")];
  rows.forEach(r => {
    const cells = [r.dateKey || "", r.track || "", r.activityTitle || r.activityId || "", r.name || "", r.score, r.maxScore, r.percent];
    lines.push(cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
  });
  return lines.join("\n");
}

/** Overwrite the Drive file's contents with the current full record set.
 *  Safe to call often — it's one small text upload, not an append. */
export async function syncRows(rows) {
  if (!accessToken) throw new Error("Not connected to Google Drive.");
  const folder = await findOrCreateFolder();
  const file = await findOrCreateFile(folder);
  await driveFetch(`https://www.googleapis.com/upload/drive/v3/files/${file}?uploadType=media`, {
    method: "PATCH",
    headers: { "Content-Type": "text/csv" },
    body: rowsToCSV(rows)
  });
  return true;
}
