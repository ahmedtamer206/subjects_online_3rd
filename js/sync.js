/* ===================================================
   SUBJECTS ONLINE — LocalStorage Only
   ===================================================
   Firebase / Firestore cloud sync has been completely removed.
   The website now uses localStorage only.
   =================================================== */

/*
  IMPORTANT:
  - Data survives normal refreshes and closing/reopening the site.
  - Clearing browser/site data or localStorage deletes the saved data.
  - Data is NOT shared between different devices/browsers.

  This file intentionally does not initialize Firebase, read Firestore,
  upload data, or attach Firebase auth listeners.
*/

// ─────────────────────────────────────────────────────
// Compatibility functions
// ─────────────────────────────────────────────────────

// If older parts of the website still call these functions,
// they simply do nothing.
// They will NOT connect to Firebase or delete local data.

async function syncFromFirebase() {
  console.log(
    "💾 [LocalStorage] Cloud sync is disabled. Using localStorage only.",
  );

  return false;
}

async function syncToFirebase() {
  console.log(
    "💾 [LocalStorage] Cloud sync is disabled. Using localStorage only.",
  );

  return false;
}

// ─────────────────────────────────────────────────────
// Compatibility function
// ─────────────────────────────────────────────────────

// Kept in case another file calls startCloudSync().
// It does NOT initialize Firebase and does NOT start cloud sync.

function startCloudSync() {
  console.log(
    "💾 [LocalStorage] Local-only mode enabled. Firebase sync disabled.",
  );
}

// ─────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────

window.SubjectsOnlineCloudSync = {
  syncFromFirebase: syncFromFirebase,
  syncToFirebase: syncToFirebase,
  startCloudSync: startCloudSync,
};

// ─────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────

console.log("💾 [LocalStorage] Subjects Online is running in local-only mode.");
