// =============================================
// Subjects Online — PWA Registration
// =============================================

(function () {
  "use strict";

  // ========================
  // 0. PWA Smart Startup Redirect
  // ========================
  (function pwaStartupRedirect() {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");

    if (!isStandalone) return;

    const uid = localStorage.getItem("subjectsOnlineUID");
    const path = window.location.pathname;
    let page = path.split("/").filter(Boolean).pop() || "";
    if (page && !page.includes(".")) page += ".html";

    // Base path = everything before the filename
    // e.g. /Subjects-Online-2/  (handles GitHub Pages subdirectories)
    const base = path.substring(0, path.lastIndexOf("/") + 1);

    const authPages = ["login.html", "index.html", "welcome.html", ""];
    const protectedPages = [
      "dashboard.html",
      "browse.html",
      "profile.html",
      "favorites.html",
      "player.html",
      "quizzes.html",
      "chapters.html",
      "sections.html",
      "subject.html",
      "essays.html",
    ];

    if (uid) {
      // Already logged in → skip welcome/login, go straight to dashboard
      if (authPages.includes(page)) {
        const landingTarget =
          localStorage.getItem("soLandingPage") || "dashboard.html";
        if (landingTarget !== "dashboard.html") {
          sessionStorage.setItem("soCustomLandingTriggered", "true");
        }
        window.location.replace(base + landingTarget);
      }
    } else {
      // Not logged in → don't allow protected pages
      if (protectedPages.includes(page)) {
        window.location.replace(base + "login.html");
      }
    }
  })();

  // ========================
  // 1. Detect base path (fixes GitHub Pages subdirectory)
  // ========================
  function getBasePath() {
    const scripts = document.querySelectorAll("script[src]");
    for (const s of scripts) {
      if (s.src.includes("pwa.js")) {
        // e.g. https://user.github.io/repo-name/js/pwa.js → /repo-name/
        const url = new URL(s.src);
        const parts = url.pathname.split("/");
        parts.pop(); // remove pwa.js
        parts.pop(); // remove js/
        return parts.join("/") + "/";
      }
    }
    return "/";
  }

  // ========================
  // 2. Register Service Worker
  // ========================
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const base = getBasePath();
      const swUrl = base + "sw.js";
      navigator.serviceWorker
        .register(swUrl, { scope: base })
        .then((reg) => {
          console.log("[PWA] SW registered. Scope:", reg.scope);
          reg.addEventListener("updatefound", () => {
            const nw = reg.installing;
            nw.addEventListener("statechange", () => {
              if (
                nw.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                showUpdateToast();
              }
            });
          });
        })
        .catch((err) => console.warn("[PWA] SW registration failed:", err));
    });
  }

  // ========================
  // 3. Install Prompt capture
  // ========================
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e; // save it — will be used when user clicks the bubble
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    removeBubbleBtn();
    localStorage.setItem("pwa-installed", "true");
  });

  // Expose global trigger function for navbar button
  window.triggerPWAInstall = function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(({ outcome }) => {
        console.log("[PWA] User choice:", outcome);
        deferredPrompt = null;
        if (outcome === "accepted") removeBubbleBtn();
      });
    } else {
      showInstallGuide();
    }
  };

  // ========================
  // 4. Floating Bubble Button
  // ========================
  function showBubbleBtn() {
    if (localStorage.getItem("so_pwa_dismissed") === "true") return;
    if (document.getElementById("pwa-bubble")) return;

    // ── Styles ──────────────────────────────
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pwa-float {
        0%,100% { transform: translateY(0px) scale(1); }
        50%      { transform: translateY(-8px) scale(1.03); }
      }
      @keyframes pwa-pulse-ring {
        0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201,168,76,0.55); }
        70%  { transform: scale(1);    box-shadow: 0 0 0 14px rgba(201,168,76,0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201,168,76,0); }
      }
      @keyframes pwa-pop-in {
        0%   { opacity:0; transform: scale(0.4) translateY(30px); }
        70%  { transform: scale(1.1) translateY(-4px); }
        100% { opacity:1; transform: scale(1) translateY(0); }
      }
      @keyframes pwa-pop-out {
        0%   { opacity:1; transform: scale(1); }
        100% { opacity:0; transform: scale(0.4) translateY(20px); }
      }

      #pwa-bubble {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        animation: pwa-pop-in 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards;
        cursor: pointer;
        user-select: none;
      }
      #pwa-bubble.hiding {
        animation: pwa-pop-out 0.4s ease forwards;
      }

      #pwa-bubble-btn {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(145deg, #0d1b3e 0%, #1a2f6e 60%, #0d1b3e 100%);
        box-shadow:
          0 8px 32px rgba(13,27,62,0.45),
          0 0 0 2px rgba(201,168,76,0.6),
          inset 0 1px 1px rgba(255,255,255,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        animation:
          pwa-float 3s ease-in-out infinite,
          pwa-pulse-ring 2.5s ease-out infinite;
        transition: transform 0.15s ease, box-shadow 0.2s ease;
        position: relative;
        overflow: visible;
      }
      #pwa-bubble-btn::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        background: conic-gradient(
          from 0deg,
          #c9a84c 0%,
          transparent 40%,
          #c9a84c 70%,
          transparent 100%
        );
        opacity: 0.5;
        animation: pwa-float 3s ease-in-out infinite reverse;
        z-index: -1;
        filter: blur(2px);
      }
      #pwa-bubble-btn:hover {
        transform: scale(1.12) !important;
        box-shadow:
          0 12px 40px rgba(13,27,62,0.6),
          0 0 0 3px rgba(201,168,76,0.9),
          inset 0 1px 1px rgba(255,255,255,0.2);
        animation: pwa-pulse-ring 1s ease-out infinite !important;
      }
      #pwa-bubble-btn:active {
        transform: scale(0.95) !important;
      }
      #pwa-bubble-btn svg {
        width: 26px;
        height: 26px;
        color: #f0d080;
        filter: drop-shadow(0 0 6px rgba(201,168,76,0.8));
        flex-shrink: 0;
      }

      #pwa-bubble-label {
        background: linear-gradient(135deg, #0d1b3e, #1a2f6e);
        color: #f0d080;
        font-size: 11px;
        font-weight: 700;
        font-family: system-ui, -apple-system, sans-serif;
        padding: 4px 10px;
        border-radius: 20px;
        border: 1px solid rgba(201,168,76,0.4);
        white-space: nowrap;
        box-shadow: 0 4px 16px rgba(13,27,62,0.3);
        letter-spacing: 0.02em;
      }

      #pwa-bubble-dismiss {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: none;
        background: rgba(13,27,62,0.7);
        color: rgba(255,255,255,0.5);
        font-size: 11px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, color 0.2s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      #pwa-bubble-dismiss:hover {
        background: rgba(239,68,68,0.8);
        color: white;
      }

      #pwa-bubble-btn::before {
        content: 'Download App';
        position: absolute;
        right: calc(100% + 12px);
        top: 50%;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #0d1b3e, #1a2f6e);
        color: #f0d080;
        font-size: 12px;
        font-weight: 700;
        font-family: system-ui, sans-serif;
        padding: 6px 12px;
        border-radius: 10px;
        border: 1px solid rgba(201,168,76,0.4);
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s, transform 0.25s;
        transform: translateY(-50%) translateX(8px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
      #pwa-bubble-btn:hover::before {
        opacity: 1;
        transform: translateY(-50%) translateX(0);
      }
    `;
    document.head.appendChild(style);

    // ── Markup ──────────────────────────────
    const bubble = document.createElement("div");
    bubble.id = "pwa-bubble";
    bubble.innerHTML = `
      <button id="pwa-bubble-btn" title="Download App">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2
               M7 10l5 5 5-5
               M12 15V3"/>
        </svg>
      </button>
      <div id="pwa-bubble-label">Download Now</div>
      <button id="pwa-bubble-dismiss" title="Close">✕</button>
    `;
    document.body.appendChild(bubble);

    // ── Events ──────────────────────────────
    document
      .getElementById("pwa-bubble-btn")
      .addEventListener("click", async () => {
        window.triggerPWAInstall();
      });

    document
      .getElementById("pwa-bubble-dismiss")
      .addEventListener("click", () => {
        localStorage.setItem("so_pwa_dismissed", "true");
        removeBubbleBtn();
      });
  }

  function removeBubbleBtn() {
    const bubble = document.getElementById("pwa-bubble");
    if (!bubble) return;
    bubble.classList.add("hiding");
    setTimeout(() => bubble.remove(), 400);
  }

  // ========================
  // 5. Update Toast
  // ========================
  function showUpdateToast() {
    if (document.getElementById("pwa-update-toast")) return;
    const toast = document.createElement("div");
    toast.id = "pwa-update-toast";

    const s = document.createElement("style");
    s.textContent = `
      @keyframes pwa-toast-in {
        from { opacity:0; transform:translateX(-50%) translateY(-20px); }
        to   { opacity:1; transform:translateX(-50%) translateY(0); }
      }
      #pwa-update-toast {
        position:fixed; top:80px; left:50%;
        transform:translateX(-50%);
        z-index:99999;
        background:linear-gradient(135deg,#0d1b3e,#1a2f6e);
        border:1px solid rgba(201,168,76,0.5);
        color:white; padding:10px 18px;
        border-radius:14px;
        display:flex; align-items:center; gap:10px;
        font-family:system-ui,sans-serif; font-size:13px;
        box-shadow:0 10px 40px rgba(0,0,0,0.4);
        animation:pwa-toast-in 0.4s ease;
        white-space:nowrap;
      }
      #pwa-update-toast button {
        background:linear-gradient(135deg,#c9a84c,#f0d080);
        color:#0d1b3e; border:none;
        padding:5px 12px; border-radius:8px;
        font-weight:700; cursor:pointer; font-size:12px;
      }
    `;
    document.head.appendChild(s);
    toast.innerHTML = `<span>🔄 يوجد تحديث جديد!</span>
      <button onclick="window.location.reload()">تحديث الآن</button>
      <button onclick="this.closest('#pwa-update-toast').remove()"
        style="background:transparent!important;color:rgba(255,255,255,0.5)!important;padding:0 4px!important;">✕</button>`;
    document.body.appendChild(toast);
  }

  // ========================
  // 6. Standalone class
  // ========================
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  ) {
    document.documentElement.classList.add("pwa-standalone");
  }

  // ========================
  // 7. Manual Install Guide Modal
  // ========================
  function showInstallGuide() {
    if (document.getElementById("pwa-guide-modal")) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);

    const steps = isIOS
      ? [
          {
            icon: "⬆️",
            text: "اضغط على زرار الـ <strong>Share</strong> في Safari",
          },
          { icon: "📲", text: 'اختار <strong>"Add to Home Screen"</strong>' },
          {
            icon: "✅",
            text: "اضغط <strong>Add</strong> وهيتحمل على الشاشة الرئيسية",
          },
        ]
      : isAndroid
        ? [
            {
              icon: "⋮",
              text: "افتح القائمة في <strong>Chrome</strong> (النقاط الثلاثة)",
            },
            { icon: "📲", text: 'اختار <strong>"Add to Home screen"</strong>' },
            { icon: "✅", text: "اضغط <strong>Add</strong> وجاهز!" },
          ]
        : [
            {
              icon: "🖥️",
              text: "افتح السايت في <strong>Chrome</strong> أو <strong>Edge</strong>",
            },
            {
              icon: "⬇️",
              text: "اضغط على أيقونة التثبيت في <strong>شريط العنوان</strong>",
            },
            {
              icon: "✅",
              text: "اضغط <strong>Install</strong> وهيتثبت كتطبيق",
            },
          ];

    const s = document.createElement("style");
    s.textContent = `
      @keyframes pwa-guide-in {
        from { opacity:0; transform:scale(0.85); }
        to   { opacity:1; transform:scale(1); }
      }
      #pwa-guide-overlay {
        position:fixed; inset:0; z-index:999999;
        background:rgba(0,0,0,0.55);
        backdrop-filter:blur(6px);
        display:flex; align-items:center; justify-content:center;
        padding:20px;
      }
      #pwa-guide-modal {
        background:linear-gradient(160deg,#0d1b3e 0%,#1a2f6e 100%);
        border:1px solid rgba(201,168,76,0.35);
        border-radius:24px;
        padding:28px 24px;
        max-width:360px; width:100%;
        box-shadow:0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.1);
        animation:pwa-guide-in 0.4s cubic-bezier(0.34,1.56,0.64,1);
        position:relative;
        font-family:system-ui,-apple-system,sans-serif;
        text-align:center;
      }
      #pwa-guide-modal .pwa-guide-icon-wrap {
        width:72px;height:72px;border-radius:20px;
        overflow:hidden;margin:0 auto 16px;
        border:2px solid rgba(201,168,76,0.4);
        box-shadow:0 8px 24px rgba(0,0,0,0.4);
      }
      #pwa-guide-modal .pwa-guide-icon-wrap img {
        width:100%;height:100%;object-fit:cover;
      }
      #pwa-guide-modal h3 {
        color:#f0d080; font-size:18px; font-weight:800;
        margin:0 0 6px; letter-spacing:-0.02em;
      }
      #pwa-guide-modal p {
        color:rgba(255,255,255,0.6); font-size:13px; margin:0 0 20px;
      }
      #pwa-guide-steps {
        display:flex; flex-direction:column; gap:12px;
        text-align:right; margin-bottom:22px;
      }
      .pwa-guide-step {
        display:flex; align-items:center; gap:12px;
        background:rgba(255,255,255,0.06);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:14px; padding:12px 14px;
      }
      .pwa-guide-step-num {
        width:28px;height:28px;border-radius:50%;
        background:linear-gradient(135deg,#c9a84c,#f0d080);
        color:#0d1b3e; font-weight:800; font-size:13px;
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;
      }
      .pwa-guide-step span {
        color:rgba(255,255,255,0.85); font-size:13px; line-height:1.5;
      }
      .pwa-guide-step span strong { color:#f0d080; }
      #pwa-guide-close {
        width:100%; padding:12px;
        background:linear-gradient(135deg,#c9a84c,#f0d080);
        color:#0d1b3e; border:none; border-radius:14px;
        font-weight:800; font-size:14px; cursor:pointer;
        transition:transform 0.2s, box-shadow 0.2s;
        letter-spacing:0.01em;
      }
      #pwa-guide-close:hover {
        transform:scale(1.03);
        box-shadow:0 6px 24px rgba(201,168,76,0.4);
      }
      #pwa-guide-x {
        position:absolute; top:14px; right:16px;
        background:rgba(255,255,255,0.08); border:none;
        color:rgba(255,255,255,0.4); font-size:16px;
        width:28px;height:28px;border-radius:50%;
        cursor:pointer;display:flex;align-items:center;justify-content:center;
        transition:background 0.2s;
      }
      #pwa-guide-x:hover { background:rgba(239,68,68,0.3);color:white; }
    `;
    document.head.appendChild(s);

    const stepsHTML = steps
      .map(
        (step, i) => `
      <div class="pwa-guide-step">
        <div class="pwa-guide-step-num">${i + 1}</div>
        <span>${step.text}</span>
      </div>
    `,
      )
      .join("");

    const overlay = document.createElement("div");
    overlay.id = "pwa-guide-overlay";
    overlay.innerHTML = `
      <div id="pwa-guide-modal">
        <button id="pwa-guide-x">✕</button>
        <div class="pwa-guide-icon-wrap">
          <img src="images/icon-512.png" alt="Subjects Online">
        </div>
        <h3>ثبّت التطبيق 📲</h3>
        <p>تابع الخطوات البسيطة دي وهيتثبت على جهازك</p>
        <div id="pwa-guide-steps">${stepsHTML}</div>
        <button id="pwa-guide-close">فهمت! 👍</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    document.getElementById("pwa-guide-close").addEventListener("click", close);
    document.getElementById("pwa-guide-x").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }
})();
