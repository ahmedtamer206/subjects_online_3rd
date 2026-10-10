/* =========================================================
   SUBJECTS ONLINE — Favorites Controller (Luxury Edition)
   ========================================================= */

(function () {
  let currentTab = "all";
  let searchQuery = "";
  let sortMode = "recent";
  let lastRemovedItem = null;
  let toastTimeout = null;

  document.addEventListener("DOMContentLoaded", () => {
    initFavoritesPage();
  });

  function getFullCatalog() {
    const allMaterials = Object.values(MATERIALS).flat();
    // Tag materials with type
    const mats = allMaterials.map((m) => ({ ...m, itemType: "material" }));
    const essays = (typeof ESSAYS !== "undefined" ? ESSAYS : []).map((e) => ({
      ...e,
      itemType: "essay",
    }));
    return [...mats, ...essays];
  }

  function initFavoritesPage() {
    renderFavorites();
    bindControls();
  }

  function renderFavorites() {
    const favs = getFavorites();
    const catalog = getFullCatalog();
    const favItems = catalog.filter((item) => favs.includes(item.id));

    updateStats(favItems, favs);
    updateTabBadges(favItems);

    const grid = document.getElementById("favorites-grid");
    const empty = document.getElementById("favorites-empty");
    const noResults = document.getElementById("fav-no-results");
    const toolbar = document.getElementById("fav-toolbar");
    const statsDeck = document.getElementById("fav-stats-deck");

    if (favItems.length === 0) {
      grid.innerHTML = "";
      grid.classList.add("hidden");
      if (toolbar) toolbar.classList.add("hidden");
      noResults.classList.add("hidden");
      noResults.classList.remove("flex");
      empty.classList.remove("hidden");
      renderSuggestions();
      if (typeof gsap !== "undefined") {
        gsap.fromTo(
          empty,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
        );
      }
      return;
    }

    empty.classList.add("hidden");
    if (toolbar) toolbar.classList.remove("hidden");
    grid.classList.remove("hidden");

    // Apply tab filtering
    let filtered = favItems.filter((item) => {
      if (currentTab === "materials") return item.itemType === "material";
      if (currentTab === "essays") return item.itemType === "essay";
      return true;
    });

    // Apply search filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const desc = (item.desc || "").toLowerCase();
        const doc = (item.doctor || "").toLowerCase();
        const tag = (item.tag || "").toLowerCase();
        return (
          title.includes(q) ||
          desc.includes(q) ||
          doc.includes(q) ||
          tag.includes(q)
        );
      });
    }

    // Apply sorting
    filtered = sortItems(filtered, sortMode, favs);

    if (filtered.length === 0) {
      grid.innerHTML = "";
      noResults.classList.remove("hidden");
      noResults.classList.add("flex");
      return;
    }

    noResults.classList.add("hidden");
    noResults.classList.remove("flex");

    // Render card HTML
    grid.innerHTML = filtered
      .map((item) => {
        if (item.itemType === "essay") {
          return essayCardHTML(item, true);
        }
        const pinned = getPinned();
        return materialCardHTML(item, true, pinned.includes(item.id));
      })
      .join("");

    bindCardEvents(grid);

    // GSAP entry animation
    if (typeof gsap !== "undefined") {
      gsap.fromTo(
        grid.children,
        { y: 30, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.55,
          stagger: 0.05,
          ease: "power3.out",
        },
      );
    }
  }

  function sortItems(items, mode, favOrder) {
    const list = [...items];
    if (mode === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (mode === "progress") {
      list.sort((a, b) => {
        const progA = a.itemType === "material" ? getSubjectProgress(a) : 0;
        const progB = b.itemType === "material" ? getSubjectProgress(b) : 0;
        return progB - progA;
      });
    } else {
      // 'recent' mode: preserved order in favs array (reversed for newest first)
      list.sort((a, b) => favOrder.indexOf(b.id) - favOrder.indexOf(a.id));
    }
    return list;
  }

  function updateStats(favItems, favs) {
    const materials = favItems.filter((i) => i.itemType === "material");
    const essays = favItems.filter((i) => i.itemType === "essay");

    let totalProgress = 0;
    materials.forEach((m) => {
      totalProgress += getSubjectProgress(m);
    });
    const avgProgress =
      materials.length > 0 ? Math.round(totalProgress / materials.length) : 0;

    animateValue("stat-total", favItems.length);
    animateValue("stat-subjects", materials.length);
    animateValue("stat-essays", essays.length);

    const progEl = document.getElementById("stat-progress");
    if (progEl) progEl.textContent = `${avgProgress}%`;
  }

  function animateValue(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const start = parseInt(el.textContent, 10) || 0;
    if (typeof gsap !== "undefined") {
      const obj = { val: start };
      gsap.to(obj, {
        val: targetValue,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = Math.round(obj.val);
        },
      });
    } else {
      el.textContent = targetValue;
    }
  }

  function updateTabBadges(favItems) {
    const matCount = favItems.filter((i) => i.itemType === "material").length;
    const essayCount = favItems.filter((i) => i.itemType === "essay").length;

    const bAll = document.getElementById("tab-badge-all");
    const bMat = document.getElementById("tab-badge-materials");
    const bEss = document.getElementById("tab-badge-essays");

    if (bAll) bAll.textContent = favItems.length;
    if (bMat) bMat.textContent = matCount;
    if (bEss) bEss.textContent = essayCount;
  }

  function bindControls() {
    // Tab buttons
    document.querySelectorAll(".fav-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".fav-tab-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentTab = btn.dataset.tab;
        renderFavorites();
      });
    });

    // Search input
    const searchInput = document.getElementById("fav-search-input");
    const searchClear = document.getElementById("fav-search-clear");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        if (searchClear) {
          searchClear.style.display = searchQuery ? "block" : "none";
        }
        renderFavorites();
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        searchQuery = "";
        searchClear.style.display = "none";
        renderFavorites();
      });
    }

    // Sort select
    const sortSelect = document.getElementById("fav-sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        sortMode = e.target.value;
        renderFavorites();
      });
    }

    // Reset filter button
    const resetBtn = document.getElementById("fav-reset-filters-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        searchQuery = "";
        if (searchClear) searchClear.style.display = "none";
        currentTab = "all";
        document.querySelectorAll(".fav-tab-btn").forEach((b) => {
          b.classList.toggle("active", b.dataset.tab === "all");
        });
        renderFavorites();
      });
    }

    // Clear All Modal
    const clearBtn = document.getElementById("fav-clear-all-btn");
    const modal = document.getElementById("fav-clear-modal");
    const cancelBtn = document.getElementById("modal-cancel-btn");
    const confirmBtn = document.getElementById("modal-confirm-btn");

    if (clearBtn && modal) {
      clearBtn.addEventListener("click", () => {
        modal.classList.add("open");
      });
    }

    if (cancelBtn && modal) {
      cancelBtn.addEventListener("click", () => {
        modal.classList.remove("open");
      });
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("open");
      });
    }

    if (confirmBtn && modal) {
      confirmBtn.addEventListener("click", () => {
        modal.classList.remove("open");
        saveFavorites([]);
        showToast("All favorites cleared");
        renderFavorites();
      });
    }

    // Toast undo button
    const undoBtn = document.getElementById("fav-toast-undo");
    if (undoBtn) {
      undoBtn.addEventListener("click", () => {
        if (lastRemovedItem) {
          let favs = getFavorites();
          if (!favs.includes(lastRemovedItem.id)) {
            favs.push(lastRemovedItem.id);
            saveFavorites(favs);
          }
          hideToast();
          renderFavorites();
        }
      });
    }
  }

  function bindCardEvents(container) {
    bindActionButtons(container);

    container.querySelectorAll(".fav-btn").forEach((btn) => {
      // Replace click listener with smooth item removal
      btn.replaceWith(btn.cloneNode(true));
    });

    container.querySelectorAll(".fav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.id;
        const card = btn.closest(".material-card, .essay-card");

        const catalog = getFullCatalog();
        lastRemovedItem = catalog.find((i) => i.id === id) || {
          id,
          title: "Item",
        };

        // Toggle storage
        toggleFav(id, btn);

        // Animate card removal
        if (card && typeof gsap !== "undefined") {
          gsap.to(card, {
            scale: 0.85,
            opacity: 0,
            y: -15,
            duration: 0.35,
            ease: "power2.in",
            onComplete: () => {
              showToast(
                `Removed "${lastRemovedItem.title || "Item"}" from favorites`,
              );
              renderFavorites();
            },
          });
        } else {
          showToast(`Removed from favorites`);
          renderFavorites();
        }
      });
    });
  }

  function showToast(message) {
    const toast = document.getElementById("fav-toast");
    const msgEl = document.getElementById("fav-toast-msg");
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      hideToast();
    }, 4000);
  }

  function hideToast() {
    const toast = document.getElementById("fav-toast");
    if (toast) toast.classList.remove("show");
  }

  function renderSuggestions() {
    const container = document.getElementById("fav-suggestions-grid");
    if (!container) return;

    const allMaterials = Object.values(MATERIALS).flat();
    const suggestions = [
      allMaterials[0] || {
        id: "a1",
        title: "Corporate Accounting",
        icon: "📊",
        accent: "#2563eb",
      },
      allMaterials[1] || {
        id: "a2",
        title: "Principles of Cost Accounting",
        icon: "🧮",
        accent: "#7c3aed",
      },
      typeof ESSAYS !== "undefined" && ESSAYS[0]
        ? { ...ESSAYS[0], itemType: "essay" }
        : {
            id: "es1",
            title: "Digital Transformation",
            doctor: "Dr. Mohamed Hassan",
            itemType: "essay",
          },
    ];

    container.innerHTML = suggestions
      .map((item) => {
        const isEssay = item.itemType === "essay";
        const link = isEssay ? "essays.html" : `subject.html?id=${item.id}`;
        const icon = isEssay ? "✍️" : item.icon || "📚";
        const sub = isEssay ? item.doctor || "Essay" : "Subject Material";

        return `
            <a href="${link}" class="group block p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-black/5 dark:border-white/10 hover:border-amber-500/40 transition-all hover:-translate-y-1 text-left no-underline shadow-sm">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">${icon}</span>
                    <div class="min-w-0 flex-1">
                        <h4 class="font-heading text-xs font-bold truncate text-slate-800 dark:text-slate-100 group-hover:text-amber-600 transition-colors">${item.title}</h4>
                        <p class="text-[11px] text-slate-400 truncate">${sub}</p>
                    </div>
                </div>
            </a>`;
      })
      .join("");
  }
})();
