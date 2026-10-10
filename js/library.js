/* =========================================================
   SUBJECTS ONLINE — Library Controller (Ultra Luxury Vault)
   ========================================================= */

(function () {
  let currentFolderId = null;
  let currentTab = "all";
  let searchQuery = "";
  let sortMethod = "newest";
  let viewMode = "grid"; // 'grid' | 'list'
  let isSelectMode = false;
  let selectedItems = new Set();
  let editingFolderId = null;
  let itemToMoveId = null;
  let isBulkMove = false;
  let pendingImportFile = null;
  let lastDeletedSnapshot = null;
  let toastTimeout = null;

  const colorMap = {
    blue: { class: "folder-color-blue", hex: "#0284c7" },
    emerald: { class: "folder-color-emerald", hex: "#10b981" },
    purple: { class: "folder-color-purple", hex: "#8b5cf6" },
    amber: { class: "folder-color-amber", hex: "#f59e0b" },
    rose: { class: "folder-color-rose", hex: "#f43f5e" },
    cyan: { class: "folder-color-cyan", hex: "#06b6d4" },
  };

  document.addEventListener("DOMContentLoaded", () => {
    initLibrary();
  });

  function initLibrary() {
    bindCoreDOM();
    bindModals();
    renderLibrary();
    checkStorage();
  }

  // ── Helper: Data Access ──
  function getLibraryData() {
    return JSON.parse(localStorage.getItem("so_offline_library") || "[]");
  }

  function saveLibraryData(lib) {
    localStorage.setItem("so_offline_library", JSON.stringify(lib));
  }

  function getFoldersData() {
    return JSON.parse(localStorage.getItem("so_offline_folders") || "[]");
  }

  function saveFoldersData(folders) {
    localStorage.setItem("so_offline_folders", JSON.stringify(folders));
  }

  function sanitizeFilename(name) {
    return (
      String(name || "Document")
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[. ]+$/g, "") || "Document"
    );
  }

  function stripPdfExt(name) {
    return String(name || "")
      .replace(/\.pdf$/i, "")
      .trim();
  }

  function ensurePdfExt(name) {
    const clean = sanitizeFilename(name);
    return /\.pdf$/i.test(clean) ? clean : clean + ".pdf";
  }

  function namesMatch(a, b) {
    return stripPdfExt(a).toLowerCase() === stripPdfExt(b).toLowerCase();
  }

  function getItemDownloadName(item) {
    const titleName = item.title || item.originalFileName || "Document";
    return ensurePdfExt(titleName);
  }

  function uniquifyFilenames(names) {
    const used = new Set();
    return names.map((name) => {
      const match = name.match(/^(.*)(\.pdf)$/i);
      const base = match ? match[1] : name;
      const ext = match ? match[2] : "";
      let candidate = name;
      let i = 2;
      while (used.has(candidate.toLowerCase())) {
        candidate = `${base} (${i})${ext}`;
        i++;
      }
      used.add(candidate.toLowerCase());
      return candidate;
    });
  }

  function triggerBlobDownload(blob, filename) {
    const a = document.createElement("a");
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 2500);
  }

  async function getPdfBlob(item) {
    if (!item || !item.url) throw new Error("Missing file");
    try {
      const cache = await caches.open("offline-materials");
      const cached = await cache.match(item.url);
      if (cached) return await cached.blob();
    } catch (e) {}
    const res = await fetch(item.url);
    if (!res.ok) throw new Error("Could not fetch PDF");
    return await res.blob();
  }

  const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(data) {
    let crc = 0 ^ -1;
    for (let i = 0; i < data.length; i++)
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
    return (crc ^ -1) >>> 0;
  }

  function zipU16(n) {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, n, true);
    return b;
  }

  function zipU32(n) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n >>> 0, true);
    return b;
  }

  function concatBytes(parts) {
    const len = parts.reduce((sum, p) => sum + p.length, 0);
    const out = new Uint8Array(len);
    let offset = 0;
    for (const p of parts) {
      out.set(p, offset);
      offset += p.length;
    }
    return out;
  }

  function buildZipArchive(entries) {
    const now = new Date();
    const dosTime =
      ((now.getHours() & 0x1f) << 11) |
      ((now.getMinutes() & 0x3f) << 5) |
      (Math.floor(now.getSeconds() / 2) & 0x1f);
    const dosDate =
      (((now.getFullYear() - 1980) & 0x7f) << 9) |
      (((now.getMonth() + 1) & 0xf) << 5) |
      (now.getDate() & 0x1f);
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const flags = 0x0800;

    for (const entry of entries) {
      const nameBytes = encoder.encode(String(entry.path).replace(/\\/g, "/"));
      const data = entry.data;
      const crc = crc32(data);
      const local = concatBytes([
        zipU32(0x04034b50),
        zipU16(20),
        zipU16(flags),
        zipU16(0),
        zipU16(dosTime),
        zipU16(dosDate),
        zipU32(crc),
        zipU32(data.length),
        zipU32(data.length),
        zipU16(nameBytes.length),
        zipU16(0),
        nameBytes,
        data,
      ]);
      localParts.push(local);
      centralParts.push(
        concatBytes([
          zipU32(0x02014b50),
          zipU16(20),
          zipU16(20),
          zipU16(flags),
          zipU16(0),
          zipU16(dosTime),
          zipU16(dosDate),
          zipU32(crc),
          zipU32(data.length),
          zipU32(data.length),
          zipU16(nameBytes.length),
          zipU16(0),
          zipU16(0),
          zipU16(0),
          zipU16(0),
          zipU32(0),
          zipU32(offset),
          nameBytes,
        ]),
      );
      offset += local.length;
    }

    const centralDir = concatBytes(centralParts);
    return concatBytes([
      ...localParts,
      centralDir,
      zipU32(0x06054b50),
      zipU16(0),
      zipU16(0),
      zipU16(entries.length),
      zipU16(entries.length),
      zipU32(centralDir.length),
      zipU32(offset),
      zipU16(0),
    ]);
  }

  async function downloadPdfItem(item) {
    showToast("Preparing download…");
    const blob = await getPdfBlob(item);
    triggerBlobDownload(blob, getItemDownloadName(item));
    showToast(`Downloaded "${getItemDownloadName(item)}"`);
  }

  async function downloadItemsAsZip(items, zipName, folderPrefix) {
    if (!items.length) {
      showToast("No PDFs to download");
      return;
    }
    showToast("Preparing ZIP…");
    const names = uniquifyFilenames(items.map(getItemDownloadName));
    const prefix = folderPrefix
      ? sanitizeFilename(folderPrefix).replace(/\/+$/g, "") + "/"
      : "";
    const entries = [];
    for (let i = 0; i < items.length; i++) {
      const blob = await getPdfBlob(items[i]);
      entries.push({
        path: prefix + names[i],
        data: new Uint8Array(await blob.arrayBuffer()),
      });
    }
    const zipBytes = buildZipArchive(entries);
    triggerBlobDownload(
      new Blob([zipBytes], { type: "application/zip" }),
      ensureZipExt(zipName),
    );
    showToast(`Downloaded "${ensureZipExt(zipName)}"`);
  }

  function ensureZipExt(name) {
    const clean = sanitizeFilename(name);
    return /\.zip$/i.test(clean) ? clean : clean + ".zip";
  }

  async function downloadFolderById(folderId) {
    const folders = getFoldersData();
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    const items = getLibraryData().filter((i) => i.folderId === folderId);
    if (!items.length) {
      showToast(`Folder "${folder.title}" is empty`);
      return;
    }
    await downloadItemsAsZip(items, folder.title, folder.title);
  }

  // ── Main Render Controller ──
  function renderLibrary() {
    const library = getLibraryData();
    const folders = getFoldersData();

    updateStatsDeck(library, folders);
    updateTabBadges(library, folders);

    const grid = document.getElementById("library-grid");
    const emptyState = document.getElementById("library-empty");
    const noResults = document.getElementById("lib-no-results");
    const toolbar = document.getElementById("lib-main-toolbar");
    const breadcrumbWrap = document.getElementById("lib-breadcrumb-wrap");
    const btnBack = document.getElementById("btn-back-folder");
    const currentFolderBadge = document.getElementById(
      "current-folder-title-badge",
    );
    const currentFolderName = document.getElementById("current-folder-name");

    // Breadcrumbs & Folder Title
    if (currentFolderId === null) {
      btnBack.classList.add("hidden");
      currentFolderBadge.classList.add("hidden");
      currentFolderBadge.classList.remove("flex");
    } else {
      const curFolder = folders.find((f) => f.id === currentFolderId);
      btnBack.classList.remove("hidden");
      currentFolderBadge.classList.remove("hidden");
      currentFolderBadge.classList.add("flex");
      if (currentFolderName)
        currentFolderName.textContent = curFolder ? curFolder.title : "Folder";
    }

    const btnDownloadFolder = document.getElementById(
      "btn-download-current-folder",
    );
    if (btnDownloadFolder) {
      btnDownloadFolder.classList.toggle("hidden", currentFolderId === null);
    }

    // Scope items by active folder
    let activeItems = library.filter(
      (i) => (i.folderId || null) === currentFolderId,
    );
    let activeFolders = currentFolderId === null ? folders : [];

    // Check if library is truly empty (root & no items at all)
    const isCompletelyEmpty =
      currentFolderId === null && folders.length === 0 && library.length === 0;
    const isFolderEmpty = currentFolderId !== null && activeItems.length === 0;

    if ((isCompletelyEmpty || isFolderEmpty) && !searchQuery) {
      grid.innerHTML = "";
      grid.classList.add("hidden");
      toolbar.classList.toggle("hidden", isCompletelyEmpty);
      noResults.classList.add("hidden");
      noResults.classList.remove("flex");
      emptyState.classList.remove("hidden");

      const emptyTitle = emptyState.querySelector(".lib-empty-title");
      const emptyDesc = emptyState.querySelector(".lib-empty-desc");
      const emptyCta = emptyState.querySelector(".lib-cta");

      if (isFolderEmpty) {
        if (emptyTitle) emptyTitle.textContent = "This Folder is Empty";
        if (emptyDesc)
          emptyDesc.textContent =
            "Move PDF documents here from your main library or import new ones.";
        if (emptyCta) emptyCta.classList.add("hidden");
      } else {
        if (emptyTitle) emptyTitle.textContent = "Your Library is Empty";
        if (emptyDesc)
          emptyDesc.textContent =
            'Open any study material and tap "Save Offline", or import your own local PDF files to access them anywhere without internet.';
        if (emptyCta) emptyCta.classList.remove("hidden");
      }
      return;
    }

    emptyState.classList.add("hidden");
    toolbar.classList.remove("hidden");
    grid.classList.remove("hidden");

    // Apply Tab Filter
    if (currentTab === "folders") {
      activeItems = [];
    } else if (currentTab === "pdfs") {
      activeFolders = [];
    } else if (currentTab === "pinned") {
      activeItems = activeItems.filter((i) => i.isPinned);
      activeFolders = activeFolders.filter((f) => f.isPinned);
    } else if (currentTab === "read") {
      activeItems = activeItems.filter((i) => i.isRead);
      activeFolders = [];
    }

    // Apply Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      activeItems = activeItems.filter((i) =>
        (i.title || "").toLowerCase().includes(q),
      );
      activeFolders = activeFolders.filter((f) =>
        (f.title || "").toLowerCase().includes(q),
      );
    }

    // Apply Sorting
    activeFolders.sort(getSortComparator(sortMethod));
    activeItems.sort(getSortComparator(sortMethod));

    if (activeFolders.length === 0 && activeItems.length === 0) {
      grid.innerHTML = "";
      noResults.classList.remove("hidden");
      noResults.classList.add("flex");
      return;
    }

    noResults.classList.add("hidden");
    noResults.classList.remove("flex");

    // Adjust Grid vs List classes
    if (viewMode === "list") {
      grid.className = "lib-list-container";
      grid.innerHTML = [
        ...activeFolders.map((f) => renderFolderListRow(f, library)),
        ...activeItems.map((i) => renderPDFListRow(i)),
      ].join("");
    } else {
      grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
      grid.innerHTML = [
        ...activeFolders.map((f) => renderFolderCardHTML(f, library)),
        ...activeItems.map((i) => renderPDFCardHTML(i)),
      ].join("");
    }

    bindCardEvents(grid);

    // GSAP entrance
    if (typeof gsap !== "undefined") {
      gsap.fromTo(
        grid.children,
        { y: 20, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.45,
          stagger: 0.04,
          ease: "power3.out",
        },
      );
    }
  }

  // ── Sorting Logic ──
  function getSortComparator(method) {
    return (a, b) => {
      // Pinned items always on top
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (method === "newest")
        return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
      if (method === "oldest")
        return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
      if (method === "az") return (a.title || "").localeCompare(b.title || "");
      if (method === "za") return (b.title || "").localeCompare(a.title || "");
      if (method === "size")
        return (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0);
      return 0;
    };
  }

  // ── Render Helpers: Folder Card (Grid) ──
  function renderFolderCardHTML(f, library) {
    const isSelected = selectedItems.has(f.id);
    const folderItems = library.filter((i) => i.folderId === f.id);
    const color = colorMap[f.color || "blue"] || colorMap["blue"];
    const isPinned = !!f.isPinned;

    // Calculate total size inside folder
    let totalBytes = 0;
    folderItems.forEach((item) => {
      totalBytes += item.fileSizeBytes || 1024 * 1024 * 1.5;
    });
    const sizeStr = (totalBytes / (1024 * 1024)).toFixed(1) + " MB";

    return `
        <div class="lib-card ${color.class} ${isSelected ? "selected" : ""}" data-id="${f.id}" data-type="folder">
            <div class="flex items-start justify-between mb-4 relative z-10">
                <div class="lib-card-icon-halo shadow-md">
                    📁
                </div>
                <div class="flex items-center gap-1.5" onclick="event.stopPropagation()">
                    ${
                      isSelectMode
                        ? `
                        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-sky-500 border-sky-500 text-white" : "border-gray-300 dark:border-gray-600"}">
                            ${isSelected ? "✓" : ""}
                        </div>
                    `
                        : `
                        <button class="lib-micro-btn ${isPinned ? "pinned" : ""} pin-folder-btn" data-id="${f.id}" title="${isPinned ? "Unpin" : "Pin to Top"}">
                            <svg class="w-4 h-4" fill="${isPinned ? "currentColor" : "none"}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                        </button>
                        <button class="lib-micro-btn edit-folder-btn" data-id="${f.id}" title="Edit Folder">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        <button class="lib-micro-btn color-folder-btn" data-id="${f.id}" title="Color Accent">
                            <span class="w-3.5 h-3.5 rounded-full border border-black/20" style="background: ${color.hex};"></span>
                        </button>
                        <button class="lib-micro-btn download-folder-btn" data-id="${f.id}" title="Download folder as ZIP">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        </button>
                        <button class="lib-micro-btn danger delete-folder-btn" data-id="${f.id}" title="Delete Folder">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    `
                    }
                </div>
            </div>

            <h3 class="font-heading text-lg font-extrabold mb-1 truncate" style="color: var(--lib-navy);">${f.title}</h3>
            <p class="text-xs font-medium mb-4 opacity-75" style="color: var(--lib-navy-soft);">
                ${folderItems.length} Document${folderItems.length !== 1 ? "s" : ""} • ${sizeStr}
            </p>

            <div class="mt-auto pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs font-bold" style="color: var(--lib-navy);">
                <span>Open Folder</span>
                <span class="text-sky-500">→</span>
            </div>
        </div>`;
  }

  // ── Render Helpers: PDF Card (Grid) ──
  function renderPDFCardHTML(item) {
    const isSelected = selectedItems.has(item.id);
    const isPinned = !!item.isPinned;
    const isRead = !!item.isRead;
    const dateStr = new Date(item.dateAdded || Date.now()).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric" },
    );
    const sizeStr = item.fileSizeBytes
      ? (item.fileSizeBytes / (1024 * 1024)).toFixed(1) + " MB"
      : "1.8 MB";

    return `
        <div class="lib-card ${isSelected ? "selected" : ""}" data-id="${item.id}" data-type="pdf">
            <div class="flex items-start justify-between mb-4 relative z-10">
                <div class="lib-card-icon-halo bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-950/60 dark:to-sky-900/40 text-sky-600 dark:text-sky-400">
                    📄
                </div>
                <div class="flex items-center gap-1.5" onclick="event.stopPropagation()">
                    ${
                      isSelectMode
                        ? `
                        <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-sky-500 border-sky-500 text-white" : "border-gray-300 dark:border-gray-600"}">
                            ${isSelected ? "✓" : ""}
                        </div>
                    `
                        : `
                        <button class="lib-micro-btn ${isPinned ? "pinned" : ""} pin-pdf-btn" data-id="${item.id}" title="${isPinned ? "Unpin" : "Pin to Top"}">
                            <svg class="w-4 h-4" fill="${isPinned ? "currentColor" : "none"}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                        </button>
                        <button class="lib-micro-btn ${isRead ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" : ""} toggle-read-btn" data-id="${item.id}" title="${isRead ? "Mark as Unread" : "Mark as Read"}">
                            ${isRead ? "✅" : "○"}
                        </button>
                        <button class="lib-micro-btn rename-pdf-btn" data-id="${item.id}" title="Rename PDF">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>

                        <button class="lib-micro-btn move-pdf-btn" data-id="${item.id}" title="Move to Folder">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                        </button>
                        <button class="lib-micro-btn danger delete-pdf-btn" data-id="${item.id}" data-url="${item.url}" title="Remove PDF">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    `
                    }
                </div>
            </div>

            <h3 class="font-heading text-base font-bold mb-1.5 line-clamp-2" style="color: var(--lib-navy);">${item.title}</h3>
            <div class="flex items-center gap-2 mb-4 text-xs font-semibold" style="color: var(--lib-navy-soft);">
                <span>${sizeStr}</span>
                <span>•</span>
                <span>${dateStr}</span>
                ${item.isCustom ? `<span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold">Custom</span>` : ""}
            </div>

            <div class="mt-auto pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                ${isRead ? `<span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">✓ Completed</span>` : "<span></span>"}
                <button class="lib-action-btn-primary download-pdf-btn text-xs py-1.5 px-3.5" data-id="${item.id}" onclick="event.stopPropagation()">
                    open
                </button>
            </div>
        </div>`;
  }

  // ── Render Helpers: List Rows ──
  function renderFolderListRow(f, library) {
    const isSelected = selectedItems.has(f.id);
    const folderItems = library.filter((i) => i.folderId === f.id);
    const isPinned = !!f.isPinned;

    return `
        <div class="lib-list-row ${isSelected ? "selected" : ""}" data-id="${f.id}" data-type="folder">
            <div class="flex items-center gap-3.5 min-w-0">
                <span class="text-2xl">📁</span>
                <div class="truncate">
                    <h4 class="font-heading text-sm font-bold truncate" style="color: var(--lib-navy);">${f.title}</h4>
                    <p class="text-xs" style="color: var(--lib-navy-soft);">${folderItems.length} items</p>
                </div>
            </div>
            <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                <button class="lib-micro-btn ${isPinned ? "pinned" : ""} pin-folder-btn" data-id="${f.id}">★</button>
                <button class="lib-micro-btn edit-folder-btn" data-id="${f.id}">✏️</button>
                <button class="lib-micro-btn download-folder-btn" data-id="${f.id}" title="Download folder as ZIP">⬇️</button>
                <button class="lib-micro-btn danger delete-folder-btn" data-id="${f.id}">🗑️</button>
            </div>
        </div>`;
  }

  function renderPDFListRow(item) {
    const isSelected = selectedItems.has(item.id);
    const isPinned = !!item.isPinned;
    const isRead = !!item.isRead;
    const sizeStr = item.fileSizeBytes
      ? (item.fileSizeBytes / (1024 * 1024)).toFixed(1) + " MB"
      : "1.8 MB";

    return `
        <div class="lib-list-row ${isSelected ? "selected" : ""}" data-id="${item.id}" data-type="pdf">
            <div class="flex items-center gap-3.5 min-w-0">
                <span class="text-2xl">📄</span>
                <div class="truncate">
                    <h4 class="font-heading text-sm font-bold truncate" style="color: var(--lib-navy);">${item.title}</h4>
                    <p class="text-xs" style="color: var(--lib-navy-soft);">${sizeStr}${isRead ? " • Completed" : ""}</p>
                </div>
            </div>
            <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                <button class="lib-micro-btn ${isRead ? "text-emerald-500" : ""} toggle-read-btn" data-id="${item.id}">${isRead ? "✅" : "○"}</button>
                <button class="lib-micro-btn rename-pdf-btn" data-id="${item.id}" title="Rename PDF">✏️</button>
                <button class="lib-micro-btn move-pdf-btn" data-id="${item.id}">📂</button>
                <button class="lib-action-btn-primary download-pdf-btn text-xs py-1 px-3" data-id="${item.id}">Download Now</button>
                <button class="lib-micro-btn danger delete-pdf-btn" data-id="${item.id}" data-url="${item.url}">🗑️</button>
            </div>
        </div>`;
  }

  // ── Metric Counters ──
  function updateStatsDeck(library, folders) {
    const readCount = library.filter((i) => i.isRead).length;
    const readPct =
      library.length > 0 ? Math.round((readCount / library.length) * 100) : 0;

    animateValue("stat-folders-count", folders.length);
    animateValue("stat-docs-count", library.length);
    animateValue("stat-read-count", readCount);

    const readLabel = document.getElementById("stat-read-label");
    if (readLabel) readLabel.textContent = `${readPct}% Read`;
  }

  function animateValue(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const start = parseInt(el.textContent, 10) || 0;
    if (typeof gsap !== "undefined") {
      const obj = { val: start };
      gsap.to(obj, {
        val: targetValue,
        duration: 0.45,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = Math.round(obj.val);
        },
      });
    } else {
      el.textContent = targetValue;
    }
  }

  function updateTabBadges(library, folders) {
    const pinnedCount =
      library.filter((i) => i.isPinned).length +
      folders.filter((f) => f.isPinned).length;
    const readCount = library.filter((i) => i.isRead).length;

    const bAll = document.getElementById("tab-count-all");
    const bFolders = document.getElementById("tab-count-folders");
    const bPdfs = document.getElementById("tab-count-pdfs");
    const bPinned = document.getElementById("tab-count-pinned");
    const bRead = document.getElementById("tab-count-read");

    if (bAll) bAll.textContent = library.length + folders.length;
    if (bFolders) bFolders.textContent = folders.length;
    if (bPdfs) bPdfs.textContent = library.length;
    if (bPinned) bPinned.textContent = pinnedCount;
    if (bRead) bRead.textContent = readCount;
  }

  // ── Event Binders ──
  function bindCoreDOM() {
    // Helper to update active highlights across pills and cards
    const syncActiveTabUI = (tab) => {
      currentTab = tab;
      document.querySelectorAll(".lib-tab-pill").forEach((b) => {
        b.classList.toggle("active", b.dataset.tab === tab);
      });
      document
        .getElementById("stat-card-folders")
        ?.classList.toggle("active", tab === "folders");
      document
        .getElementById("stat-card-docs")
        ?.classList.toggle("active", tab === "pdfs");
    };

    // Tab buttons
    document.querySelectorAll(".lib-tab-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        syncActiveTabUI(btn.dataset.tab);
        renderLibrary();
      });
    });

    // Search
    const searchInput = document.getElementById("search-input");
    const searchClear = document.getElementById("search-clear-btn");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        if (searchClear)
          searchClear.style.display = searchQuery ? "block" : "none";
        renderLibrary();
      });
    }
    if (searchClear) {
      searchClear.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        searchQuery = "";
        searchClear.style.display = "none";
        renderLibrary();
      });
    }

    // Reset Filter button
    const resetBtn = document.getElementById("lib-reset-filter-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        searchQuery = "";
        if (searchInput) searchInput.value = "";
        if (searchClear) searchClear.style.display = "none";
        syncActiveTabUI("all");
        renderLibrary();
      });
    }

    // Stat Card Clicks (filter triggers)
    document
      .getElementById("stat-card-folders")
      ?.addEventListener("click", () => {
        syncActiveTabUI("folders");
        renderLibrary();
      });
    document.getElementById("stat-card-docs")?.addEventListener("click", () => {
      syncActiveTabUI("pdfs");
      renderLibrary();
    });
    document
      .getElementById("stat-card-storage")
      ?.addEventListener("click", () => {
        openStorageModal();
      });

    // Folder Breadcrumb Back
    document
      .getElementById("btn-back-folder")
      ?.addEventListener("click", () => {
        currentFolderId = null;
        isSelectMode = false;
        hideBulkBar();
        renderLibrary();
      });

    document
      .getElementById("btn-download-current-folder")
      ?.addEventListener("click", async () => {
        if (!currentFolderId) return;
        try {
          await downloadFolderById(currentFolderId);
        } catch (err) {
          console.error(err);
          showToast("Could not download folder");
        }
      });

    // Select Mode Toggle
    const selectBtn = document.getElementById("btn-select-mode");
    if (selectBtn) {
      selectBtn.addEventListener("click", () => {
        isSelectMode = !isSelectMode;
        selectBtn.classList.toggle("active", isSelectMode);
        selectedItems.clear();
        if (isSelectMode) showBulkBar();
        else hideBulkBar();
        renderLibrary();
      });
    }

    // Bulk Dock actions
    document
      .getElementById("btn-cancel-select")
      ?.addEventListener("click", () => {
        isSelectMode = false;
        selectBtn?.classList.remove("active");
        selectedItems.clear();
        hideBulkBar();
        renderLibrary();
      });

    document.getElementById("btn-select-all")?.addEventListener("click", () => {
      const library = getLibraryData().filter(
        (i) => (i.folderId || null) === currentFolderId,
      );
      const folders = currentFolderId === null ? getFoldersData() : [];
      const allIds = [...folders.map((f) => f.id), ...library.map((i) => i.id)];

      if (selectedItems.size === allIds.length) {
        selectedItems.clear();
      } else {
        allIds.forEach((id) => selectedItems.add(id));
      }
      updateBulkCount();
      renderLibrary();
    });

    document.getElementById("btn-bulk-read")?.addEventListener("click", () => {
      if (selectedItems.size === 0) return;
      let lib = getLibraryData();
      lib.forEach((item) => {
        if (selectedItems.has(item.id)) item.isRead = true;
      });
      saveLibraryData(lib);
      isSelectMode = false;
      selectBtn?.classList.remove("active");
      selectedItems.clear();
      hideBulkBar();
      triggerConfetti();
      showToast("Selected items marked as read");
      renderLibrary();
    });

    document.getElementById("btn-bulk-move")?.addEventListener("click", () => {
      if (selectedItems.size === 0) return;
      openMoveModal(null, true);
    });

    document
      .getElementById("btn-bulk-download")
      ?.addEventListener("click", async () => {
        if (selectedItems.size === 0) return;
        const lib = getLibraryData();
        const folders = getFoldersData();
        const zipEntries = [];
        const usedPaths = new Set();

        const takePath = (path) => {
          const match = path.match(/^(.*)(\.pdf)$/i);
          const base = match ? match[1] : path;
          const ext = match ? match[2] : "";
          let candidate = path;
          let i = 2;
          while (usedPaths.has(candidate.toLowerCase())) {
            candidate = `${base} (${i})${ext}`;
            i++;
          }
          usedPaths.add(candidate.toLowerCase());
          return candidate;
        };

        try {
          showToast("Preparing ZIP…");
          const selectedFolders = folders.filter((f) =>
            selectedItems.has(f.id),
          );
          const selectedPdfs = lib.filter((i) => selectedItems.has(i.id));

          for (const folder of selectedFolders) {
            const folderItems = lib.filter((i) => i.folderId === folder.id);
            const prefix = sanitizeFilename(folder.title);
            for (const item of folderItems) {
              const blob = await getPdfBlob(item);
              zipEntries.push({
                path: takePath(`${prefix}/${getItemDownloadName(item)}`),
                data: new Uint8Array(await blob.arrayBuffer()),
              });
            }
          }

          for (const item of selectedPdfs) {
            const blob = await getPdfBlob(item);
            zipEntries.push({
              path: takePath(getItemDownloadName(item)),
              data: new Uint8Array(await blob.arrayBuffer()),
            });
          }

          if (!zipEntries.length) {
            showToast("No PDFs to download");
            return;
          }

          const zipName =
            selectedFolders.length === 1 && selectedPdfs.length === 0
              ? selectedFolders[0].title
              : "Library Selection";
          const zipBytes = buildZipArchive(zipEntries);
          triggerBlobDownload(
            new Blob([zipBytes], { type: "application/zip" }),
            ensureZipExt(zipName),
          );
          showToast(`Downloaded "${ensureZipExt(zipName)}"`);
        } catch (err) {
          console.error(err);
          showToast("Could not download selection");
        }
      });

    document
      .getElementById("btn-bulk-delete")
      ?.addEventListener("click", async () => {
        if (selectedItems.size === 0) return;
        if (confirm(`Remove ${selectedItems.size} selected items?`)) {
          let lib = getLibraryData();
          let folders = getFoldersData();

          lastDeletedSnapshot = {
            library: [...lib],
            folders: [...folders],
          };

          const cache = await caches.open("offline-materials");
          for (const id of selectedItems) {
            const fIdx = folders.findIndex((f) => f.id === id);
            if (fIdx !== -1) {
              folders.splice(fIdx, 1);
              lib.forEach((i) => {
                if (i.folderId === id) i.folderId = null;
              });
              continue;
            }
            const iIdx = lib.findIndex((i) => i.id === id);
            if (iIdx !== -1) {
              try {
                await cache.delete(lib[iIdx].url);
              } catch (e) {}
              lib.splice(iIdx, 1);
            }
          }

          saveLibraryData(lib);
          saveFoldersData(folders);

          isSelectMode = false;
          selectBtn?.classList.remove("active");
          selectedItems.clear();
          hideBulkBar();
          showToast("Selected items deleted");
          renderLibrary();
          checkStorage();
        }
      });

    // Toast Undo
    document.getElementById("lib-toast-undo")?.addEventListener("click", () => {
      if (lastDeletedSnapshot) {
        saveLibraryData(lastDeletedSnapshot.library);
        saveFoldersData(lastDeletedSnapshot.folders);
        lastDeletedSnapshot = null;
        hideToast();
        showToast("Restored successfully");
        renderLibrary();
        checkStorage();
      }
    });
  }

  function showBulkBar() {
    const bar = document.getElementById("bulk-action-bar");
    if (bar) bar.classList.add("show");
    updateBulkCount();
  }

  function hideBulkBar() {
    const bar = document.getElementById("bulk-action-bar");
    if (bar) bar.classList.remove("show");
  }

  function updateBulkCount() {
    const el = document.getElementById("selected-count");
    if (el) el.textContent = `${selectedItems.size} Selected`;
  }

  // ── Card Action Events ──
  function bindCardEvents(container) {
    // Card Click (Navigate or Select)
    container.querySelectorAll(".lib-card, .lib-list-row").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const type = card.dataset.type;

        if (isSelectMode) {
          if (selectedItems.has(id)) selectedItems.delete(id);
          else selectedItems.add(id);
          updateBulkCount();
          renderLibrary();
        } else {
          if (type === "folder") {
            currentFolderId = id;
            renderLibrary();
          }
        }
      });
    });

    // Pin Folder
    container.querySelectorAll(".pin-folder-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        let folders = getFoldersData();
        const f = folders.find((item) => item.id === id);
        if (f) {
          f.isPinned = !f.isPinned;
          saveFoldersData(folders);
          renderLibrary();
        }
      });
    });

    // Pin PDF
    container.querySelectorAll(".pin-pdf-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        let lib = getLibraryData();
        const i = lib.find((item) => item.id === id);
        if (i) {
          i.isPinned = !i.isPinned;
          saveLibraryData(lib);
          renderLibrary();
        }
      });
    });

    // Mark as Read Toggle
    container.querySelectorAll(".toggle-read-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        let lib = getLibraryData();
        const i = lib.find((item) => item.id === id);
        if (i) {
          i.isRead = !i.isRead;
          saveLibraryData(lib);
          if (i.isRead) triggerConfetti();
          renderLibrary();
        }
      });
    });

    // Edit Folder Name
    container.querySelectorAll(".edit-folder-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const folders = getFoldersData();
        const f = folders.find((item) => item.id === id);
        if (f) {
          openFolderNameModal({
            title: "Rename Folder",
            defaultValue: f.title,
            callback: (newName) => {
              f.title = newName;
              saveFoldersData(folders);
              renderLibrary();
            },
          });
        }
      });
    });

    // Color Folder
    container.querySelectorAll(".color-folder-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openColorModal(btn.dataset.id);
      });
    });

    container.querySelectorAll(".download-folder-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await downloadFolderById(btn.dataset.id);
        } catch (err) {
          console.error(err);
          showToast("Could not download folder");
        }
      });
    });

    // Delete Folder
    container.querySelectorAll(".delete-folder-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (
          confirm(
            "Delete this folder? PDFs inside will be moved back to the main library.",
          )
        ) {
          let folders = getFoldersData();
          let lib = getLibraryData();

          lastDeletedSnapshot = { library: [...lib], folders: [...folders] };

          folders = folders.filter((f) => f.id !== id);
          lib.forEach((item) => {
            if (item.folderId === id) item.folderId = null;
          });

          saveFoldersData(folders);
          saveLibraryData(lib);

          showToast("Folder deleted");
          renderLibrary();
        }
      });
    });

    // Move PDF
    container.querySelectorAll(".move-pdf-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openMoveModal(btn.dataset.id, false);
      });
    });

    container.querySelectorAll(".rename-pdf-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const lib = getLibraryData();
        const item = lib.find((i) => i.id === id);
        if (!item) return;
        openFolderNameModal({
          title: "Rename PDF",
          defaultValue: stripPdfExt(item.title) || item.title,
          callback: (newName) => {
            item.title = stripPdfExt(newName) || newName;
            saveLibraryData(lib);
            renderLibrary();
          },
        });
      });
    });

    container.querySelectorAll(".download-pdf-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const lib = getLibraryData();
        const item = lib.find((i) => i.id === btn.dataset.id);
        if (!item) return;
        try {
          await downloadPdfItem(item);
        } catch (err) {
          console.error(err);
          showToast("Could not download PDF");
        }
      });
    });

    // Delete PDF
    container.querySelectorAll(".delete-pdf-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const url = btn.dataset.url;
        if (confirm("Remove this document from offline library?")) {
          let lib = getLibraryData();
          let folders = getFoldersData();

          lastDeletedSnapshot = { library: [...lib], folders: [...folders] };

          lib = lib.filter((i) => i.id !== id);
          saveLibraryData(lib);

          try {
            const cache = await caches.open("offline-materials");
            await cache.delete(url);
          } catch (err) {}

          showToast("Document removed");
          renderLibrary();
          checkStorage();
        }
      });
    });
  }

  // ── Modals & Dialogs ──
  function bindModals() {
    // 1. Folder Name Modal
    const folderModal = document.getElementById("folder-name-modal");
    const folderInput = document.getElementById("folder-name-input");
    const btnNewFolder = document.getElementById("btn-new-folder");

    btnNewFolder?.addEventListener("click", () => {
      openFolderNameModal({
        title: "Create New Folder",
        defaultValue: "",
        callback: (name) => {
          const folders = getFoldersData();
          const newF = {
            id: "folder_" + Date.now(),
            title: name,
            color: "blue",
            dateAdded: new Date().toISOString(),
            isPinned: false,
          };
          folders.push(newF);
          saveFoldersData(folders);
          triggerConfetti();
          renderLibrary();
        },
      });
    });

    document
      .getElementById("close-folder-name-modal")
      ?.addEventListener("click", closeFolderNameModal);
    document
      .getElementById("cancel-folder-name-btn")
      ?.addEventListener("click", closeFolderNameModal);
    document
      .getElementById("confirm-folder-name-btn")
      ?.addEventListener("click", submitFolderNameModal);
    folderInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitFolderNameModal();
      if (e.key === "Escape") closeFolderNameModal();
    });

    // 2. Color Modal
    document
      .getElementById("close-color-modal")
      ?.addEventListener("click", closeColorModal);
    document.querySelectorAll(".color-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const color = btn.dataset.color;
        if (editingFolderId) {
          const folders = getFoldersData();
          const f = folders.find((item) => item.id === editingFolderId);
          if (f) {
            f.color = color;
            saveFoldersData(folders);
            renderLibrary();
          }
        }
        closeColorModal();
      });
    });

    // 3. Move Modal
    document
      .getElementById("close-move-modal")
      ?.addEventListener("click", closeMoveModal);
    document
      .getElementById("cancel-move-btn")
      ?.addEventListener("click", closeMoveModal);
    document
      .getElementById("confirm-move-btn")
      ?.addEventListener("click", () => {
        const select = document.getElementById("move-folder-select");
        const targetId = select.value === "root" ? null : select.value;
        let lib = getLibraryData();

        if (isBulkMove) {
          selectedItems.forEach((id) => {
            const item = lib.find((i) => i.id === id);
            if (item) item.folderId = targetId;
          });
          isSelectMode = false;
          document
            .getElementById("btn-select-mode")
            ?.classList.remove("active");
          selectedItems.clear();
          hideBulkBar();
        } else if (itemToMoveId) {
          const item = lib.find((i) => i.id === itemToMoveId);
          if (item) item.folderId = targetId;
        }

        saveLibraryData(lib);
        closeMoveModal();
        showToast("Moved successfully");
        renderLibrary();
      });

    // 4. Import PDF Modal
    const importModal = document.getElementById("import-modal");
    const btnImport = document.getElementById("btn-import-pdf");
    const btnEmptyImport = document.getElementById("btn-empty-import");
    const fileInput = document.getElementById("pdf-file-input");
    const dropzone = document.getElementById("pdf-dropzone");
    const browseBtn = document.getElementById("btn-browse-file");
    const importTitle = document.getElementById("import-title-input");
    const confirmImportBtn = document.getElementById("confirm-import-btn");

    const openImport = () => {
      pendingImportFile = null;
      if (importTitle) importTitle.value = "";
      if (confirmImportBtn) confirmImportBtn.disabled = true;
      importModal?.classList.add("open");
    };

    btnImport?.addEventListener("click", openImport);
    btnEmptyImport?.addEventListener("click", openImport);
    document
      .getElementById("close-import-modal")
      ?.addEventListener("click", () => importModal?.classList.remove("open"));
    document
      .getElementById("cancel-import-btn")
      ?.addEventListener("click", () => importModal?.classList.remove("open"));

    browseBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput?.click();
    });
    dropzone?.addEventListener("click", () => fileInput?.click());

    fileInput?.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });

    // Drag & Drop
    dropzone?.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone?.addEventListener("dragleave", () =>
      dropzone.classList.remove("dragover"),
    );
    dropzone?.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    function handleFileSelect(file) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        alert("Please select a valid PDF file.");
        return;
      }
      pendingImportFile = file;
      if (importTitle && !importTitle.value) {
        importTitle.value = file.name.replace(/\.pdf$/i, "");
      }
      if (confirmImportBtn) confirmImportBtn.disabled = false;
    }

    confirmImportBtn?.addEventListener("click", async () => {
      if (!pendingImportFile) return;
      const title = (importTitle?.value || pendingImportFile.name).trim();
      const fakeUrl = "custom_pdf_" + Date.now() + ".pdf";

      // Cache file in CacheStorage
      try {
        const cache = await caches.open("offline-materials");
        const response = new Response(pendingImportFile, {
          headers: { "Content-Type": "application/pdf" },
        });
        await cache.put(fakeUrl, response);
      } catch (err) {
        console.warn("Cache write fallback:", err);
      }

      let lib = getLibraryData();
      lib.push({
        id: "custom_" + Date.now(),
        title: title,
        url: fakeUrl,
        type: "pdf",
        folderId: currentFolderId,
        dateAdded: new Date().toISOString(),
        isPinned: false,
        isRead: false,
        isCustom: true,
        originalFileName: pendingImportFile.name,
        fileSizeBytes: pendingImportFile.size,
      });

      saveLibraryData(lib);
      importModal?.classList.remove("open");
      triggerConfetti();
      showToast(`Imported "${title}"`);
      renderLibrary();
      checkStorage();
    });

    // 5. Storage Modal
    document
      .getElementById("close-storage-modal")
      ?.addEventListener("click", () => {
        document.getElementById("storage-modal")?.classList.remove("open");
      });

    document
      .getElementById("btn-clear-read-cache")
      ?.addEventListener("click", async () => {
        let lib = getLibraryData();
        const readItems = lib.filter((i) => i.isRead);
        if (readItems.length === 0) {
          alert("No completed files found to clear.");
          return;
        }
        if (confirm(`Remove ${readItems.length} read files to free space?`)) {
          const cache = await caches.open("offline-materials");
          for (const item of readItems) {
            try {
              await cache.delete(item.url);
            } catch (e) {}
          }
          lib = lib.filter((i) => !i.isRead);
          saveLibraryData(lib);
          showToast("Cleared read items");
          populateStorageModal();
          renderLibrary();
          checkStorage();
        }
      });
  }

  // Modal Helpers
  let _folderCallback = null;
  function openFolderNameModal({
    title = "New Folder",
    defaultValue = "",
    callback,
  }) {
    _folderCallback = callback;
    const modal = document.getElementById("folder-name-modal");
    const titleEl = document.getElementById("folder-name-modal-title");
    const input = document.getElementById("folder-name-input");

    if (titleEl) titleEl.textContent = title;
    if (input) input.value = defaultValue;
    modal?.classList.add("open");
    setTimeout(() => input?.focus(), 50);
  }

  function closeFolderNameModal() {
    document.getElementById("folder-name-modal")?.classList.remove("open");
    _folderCallback = null;
  }

  function submitFolderNameModal() {
    const input = document.getElementById("folder-name-input");
    const val = input ? input.value.trim() : "";
    if (!val) return;
    const cb = _folderCallback;
    closeFolderNameModal();
    if (cb) cb(val);
  }

  function openColorModal(folderId) {
    editingFolderId = folderId;
    document.getElementById("color-modal")?.classList.add("open");
  }

  function closeColorModal() {
    document.getElementById("color-modal")?.classList.remove("open");
    editingFolderId = null;
  }

  function openMoveModal(itemId, bulk = false) {
    itemToMoveId = itemId;
    isBulkMove = bulk;
    const select = document.getElementById("move-folder-select");
    const folders = getFoldersData();

    if (select) {
      select.innerHTML = '<option value="root">📁 Root (Main Library)</option>';
      folders.forEach((f) => {
        select.innerHTML += `<option value="${f.id}">📁 ${f.title}</option>`;
      });
    }
    document.getElementById("move-modal")?.classList.add("open");
  }

  function closeMoveModal() {
    document.getElementById("move-modal")?.classList.remove("open");
    itemToMoveId = null;
  }

  function openStorageModal() {
    document.getElementById("storage-modal")?.classList.add("open");
    populateStorageModal();
  }

  async function populateStorageModal() {
    const list = document.getElementById("storage-file-list");
    if (!list) return;

    const lib = getLibraryData();
    if (lib.length === 0) {
      list.innerHTML =
        '<p class="text-center py-6 text-sm text-gray-400">No offline files saved.</p>';
      return;
    }

    list.innerHTML = lib
      .map((item) => {
        const dateStr = new Date(
          item.dateAdded || Date.now(),
        ).toLocaleDateString();
        const sizeMB = item.fileSizeBytes
          ? (item.fileSizeBytes / (1024 * 1024)).toFixed(1)
          : "1.8";
        return `
            <div class="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <div class="truncate pr-4">
                    <p class="font-bold text-sm truncate" style="color: var(--lib-navy);">${item.title}</p>
                    <p class="text-xs opacity-70">${sizeMB} MB • Saved ${dateStr} ${item.isRead ? '• <span class="text-emerald-500 font-bold">✓ Read</span>' : ""}</p>
                </div>
                <button class="text-red-500 hover:bg-red-500/10 p-2 rounded-lg text-xs font-bold transition-colors shrink-0" onclick="window._libDeleteStorageItem('${item.id}', '${item.url}')">
                    Delete
                </button>
            </div>`;
      })
      .join("");
  }

  window._libDeleteStorageItem = async (id, url) => {
    let lib = getLibraryData();
    lib = lib.filter((i) => i.id !== id);
    saveLibraryData(lib);

    try {
      const cache = await caches.open("offline-materials");
      await cache.delete(url);
    } catch (e) {}

    populateStorageModal();
    renderLibrary();
    checkStorage();
  };

  // ── Storage Calculator ──
  async function checkStorage() {
    try {
      let usedBytes = 0;
      const cache = await caches.open("offline-materials");
      const requests = await cache.keys();

      for (const req of requests) {
        const res = await cache.match(req);
        if (res) {
          const blob = await res.blob();
          usedBytes += blob.size;
        }
      }

      const usageMB = (usedBytes / (1024 * 1024)).toFixed(2);
      let quotaMB = "1000";
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota !== undefined) {
          quotaMB = (estimate.quota / (1024 * 1024)).toFixed(0);
        }
      }

      const statUsage = document.getElementById("stat-storage-used");
      const modalUsage = document.getElementById("storage-modal-used");
      const fill = document.getElementById("stat-storage-fill");
      const progress = document.getElementById("storage-progress-bar");

      if (statUsage) statUsage.textContent = `${usageMB} MB`;
      if (modalUsage) modalUsage.textContent = `${usageMB} MB / ${quotaMB} MB`;

      const percent = Math.min(
        100,
        Math.max(2, (usedBytes / (quotaMB * 1024 * 1024)) * 100),
      );
      if (fill) fill.style.width = `${percent}%`;
      if (progress) progress.style.width = `${percent}%`;
    } catch (err) {}
  }

  // ── Toast & Confetti ──
  function showToast(message) {
    const toast = document.getElementById("lib-toast");
    const msgEl = document.getElementById("lib-toast-msg");
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => hideToast(), 4500);
  }

  function hideToast() {
    document.getElementById("lib-toast")?.classList.remove("show");
  }

  function triggerConfetti() {
    if (typeof confetti === "function") {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#0ea5e9", "#f59e0b", "#10b981", "#6366f1"],
      });
    }
  }
})();
