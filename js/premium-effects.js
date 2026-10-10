/* premium-effects.js — Tooltip, Dark Mode Ripple, Toast Notifications
   Loaded at BOTTOM of body after shared-nav.js, so all elements exist. */

// ── Mobile Performance Guard ─────────────────────────────────────────────────
// On phones/small screens we kill heavy JS effects to prevent lag
const IS_MOBILE =
  window.innerWidth <= 768 ||
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

if (IS_MOBILE && typeof gsap !== "undefined") {
  // Stub out GSAP so existing code doesn't error, but nothing actually animates
  const noopGsap = new Proxy(
    {},
    {
      get: () => new Proxy(() => {}, { get: () => () => {} }),
    },
  );
  window.gsap = noopGsap;
}

(function () {
  // ============================================================
  // 1. ELEGANT TOOLTIPS
  // ============================================================
  (function initTooltips() {
    const style = document.createElement("style");
    style.textContent = `
            #so-tooltip {
                position: fixed;
                z-index: 999996;
                pointer-events: none;
                background: rgba(10, 15, 30, 0.90);
                color: #e2e8f0;
                font-size: 0.72rem;
                font-family: Inter, system-ui, sans-serif;
                font-weight: 600;
                letter-spacing: 0.05em;
                padding: 5px 12px;
                border-radius: 8px;
                white-space: nowrap;
                box-shadow: 0 4px 20px rgba(0,0,0,0.35);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.10);
                opacity: 0;
                transform: translateY(6px) scale(0.94);
                transition: opacity 0.2s ease, transform 0.2s ease;
            }
            #so-tooltip.visible {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        `;
    document.head.appendChild(style);

    const tip = document.createElement("div");
    tip.id = "so-tooltip";
    document.body.appendChild(tip);

    // Map element IDs → tooltip text
    const tooltipMap = {
      "snav-dark-btn": "Toggle Dark Mode",
      "snav-notif-btn": "Notifications",
    };
    Object.entries(tooltipMap).forEach(([id, label]) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute("data-tooltip", label);
    });

    function showTip(target) {
      const text = target.getAttribute("data-tooltip");
      if (!text) return;
      tip.textContent = text;
      tip.classList.add("visible");
      const rect = target.getBoundingClientRect();
      const w = tip.offsetWidth;
      let left = rect.left + rect.width / 2 - w / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      tip.style.left = left + "px";
      tip.style.top = rect.bottom + 8 + "px";
    }

    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-tooltip]");
      if (t) showTip(t);
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest("[data-tooltip]")) tip.classList.remove("visible");
    });
    document.addEventListener("click", () => tip.classList.remove("visible"));
  })();

  // ============================================================
  // 2. DARK MODE RIPPLE
  // ============================================================
  (function initRipple() {
    const style = document.createElement("style");
    style.textContent = `
            #so-dm-ripple {
                position: fixed;
                border-radius: 50%;
                pointer-events: none;
                z-index: 999993;
                width: 0; height: 0;
                top: 0; left: 0;
                opacity: 0;
                transform: scale(0);
            }
            #so-dm-ripple.ripple-go {
                transition: transform 0.75s cubic-bezier(0.22, 1, 0.36, 1),
                            opacity 0.75s ease;
                transform: scale(1);
                opacity: 0;
            }
        `;
    document.head.appendChild(style);

    const ripple = document.createElement("div");
    ripple.id = "so-dm-ripple";
    document.body.appendChild(ripple);

    const darkBtn = document.getElementById("snav-dark-btn");
    if (!darkBtn) return;

    darkBtn.addEventListener(
      "click",
      (e) => {
        // Check BEFORE the toggle fires (shared-nav listener runs after ours
        // only if we're first; use capture=false, so same order)
        // We detect the CURRENT state before toggle
        const goingDark =
          !document.documentElement.classList.contains("dark-mode");

        const size = Math.hypot(window.innerWidth, window.innerHeight) * 2.5;
        const x = e.clientX - size / 2;
        const y = e.clientY - size / 2;

        // Kill any running animation
        ripple.classList.remove("ripple-go");
        ripple.style.transition = "none";
        ripple.style.transform = "scale(0)";
        ripple.style.opacity = "0.22";
        ripple.style.width = size + "px";
        ripple.style.height = size + "px";
        ripple.style.left = x + "px";
        ripple.style.top = y + "px";
        ripple.style.background = goingDark
          ? "radial-gradient(circle, #080808 0%, transparent 60%)"
          : "radial-gradient(circle, #eef2ff 0%, transparent 60%)";

        // Force reflow, then let CSS class animate it
        void ripple.offsetWidth;
        ripple.style.transition = "";
        ripple.classList.add("ripple-go");

        setTimeout(() => ripple.classList.remove("ripple-go"), 800);
      },
      true,
    ); // capture=true so we run before shared-nav's listener
  })();

  // ============================================================
  // 3. TOAST NOTIFICATION SYSTEM  (window.showToast)
  // ============================================================
  (function initToast() {
    const style = document.createElement("style");
    style.textContent = `
            #so-toasts {
                position: fixed;
                bottom: 28px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999997;
                display: flex;
                flex-direction: column-reverse;
                align-items: center;
                gap: 8px;
                pointer-events: none;
            }
            .so-toast {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 11px 22px;
                border-radius: 999px;
                font-family: Inter, system-ui, sans-serif;
                font-size: 0.83rem;
                font-weight: 600;
                color: #fff;
                border: 1px solid rgba(255,255,255,0.18);
                box-shadow: 0 8px 30px rgba(0,0,0,0.25);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                pointer-events: auto;
                opacity: 0;
                transform: translateY(20px) scale(0.93);
                transition: opacity 0.38s cubic-bezier(0.22,1,0.36,1),
                            transform 0.38s cubic-bezier(0.22,1,0.36,1);
                will-change: transform, opacity;
            }
            .so-toast.in  { opacity: 1; transform: translateY(0) scale(1); }
            .so-toast.out { opacity: 0; transform: translateY(10px) scale(0.96); }
            .so-toast-success { background: rgba(4, 120, 87, 0.94); }
            .so-toast-info    { background: rgba(29, 78, 216, 0.94); }
            .so-toast-warning { background: rgba(180, 83, 9, 0.94); }
            .so-toast-error   { background: rgba(185, 28, 28, 0.94); }
        `;
    document.head.appendChild(style);

    const container = document.createElement("div");
    container.id = "so-toasts";
    document.body.appendChild(container);

    const ICON = { success: "✅", info: "ℹ️", warning: "⚠️", error: "❌" };

    window.showToast = function (msg, type = "success", ms = 3200) {
      const t = document.createElement("div");
      t.className = `so-toast so-toast-${type}`;
      t.innerHTML = `<span style="font-size:1rem">${ICON[type] || "✅"}</span><span>${msg}</span>`;
      container.appendChild(t);

      // Double-RAF for CSS transition to fire
      requestAnimationFrame(() =>
        requestAnimationFrame(() => t.classList.add("in")),
      );

      setTimeout(() => {
        t.classList.remove("in");
        t.classList.add("out");
        setTimeout(() => t.remove(), 420);
      }, ms);
    };

    // --- Auto-hooks ---

    // Fav buttons (browse / essays / favorites pages)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".fav-btn");
      if (!btn) return;
      // Read state 200ms later after the JS handler flips the class
      setTimeout(() => {
        const added =
          btn.classList.contains("active") ||
          btn.getAttribute("aria-pressed") === "true" ||
          btn.dataset.faved === "1";
        window.showToast(
          added ? "Added to Favorites ❤️" : "Removed from Favorites",
          added ? "success" : "warning",
        );
      }, 200);
    });

    // Planner form
    document.addEventListener("submit", (e) => {
      if (e.target && e.target.id === "planner-form") {
        const inp = document.getElementById("planner-input");
        if (inp && inp.value.trim())
          setTimeout(
            () => window.showToast("Task added to Planner 📋", "info"),
            80,
          );
      }
    });

    // Save / Update buttons (profile page)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest('button[type="submit"], button.save-btn');
      if (!btn) return;
      const txt = btn.textContent.trim().toLowerCase();
      if (txt.includes("save") || txt.includes("update"))
        setTimeout(
          () => window.showToast("Saved successfully ✨", "success"),
          150,
        );
    });
  })();
})();
