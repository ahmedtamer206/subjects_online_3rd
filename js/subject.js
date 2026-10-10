/* =========================================================
   subject.js — Spotlight Tab Edition (Compact Redesign)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const subjectId = params.get("id") || "a1";

  // ── Find subject ─────────────────────────────────────
  let subject = null,
    deptLabel = "";
  for (const [key, items] of Object.entries(MATERIALS)) {
    const found = items.find((i) => i.id === subjectId);
    if (found) {
      subject = found;
      deptLabel = key.charAt(0).toUpperCase() + key.slice(1);
      break;
    }
  }
  if (!subject) {
    document.getElementById("subj-title").textContent = "Subject not found";
    return;
  }

  // ── Set CSS variable for tab active color ─────────────
  document.documentElement.style.setProperty(
    "--subject-accent",
    subject.accent,
  );
  document.documentElement.style.setProperty("--subject-glow", subject.color);

  // ── Track visits & Last Opened ────────────────────────
  const visits = JSON.parse(localStorage.getItem("soVisits") || "{}");
  visits[subjectId] = (visits[subjectId] || 0) + 1;
  localStorage.setItem("soVisits", JSON.stringify(visits));

  const lastOpened = JSON.parse(localStorage.getItem("soLastOpened") || "{}");
  lastOpened[subjectId] = Date.now();
  localStorage.setItem("soLastOpened", JSON.stringify(lastOpened));

  // ── Populate hero ─────────────────────────────────────
  document.title = `${subject.title} — Subjects Online`;
  document.getElementById("subj-title").textContent = subject.title;
  document.getElementById("subj-desc").textContent = subject.desc;
  document.getElementById("subj-icon").textContent = subject.icon;
  document.getElementById("subj-dept").textContent = deptLabel;

  // Background for the whole hero area
  document.getElementById("subj-hero-bg").style.background =
    `radial-gradient(ellipse 80% 60% at 50% -10%, ${subject.color} 0%, transparent 70%),
         linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)`;

  // Album Cover gradient (cinematic dark gradient from the accent)
  const albumGlow = document.getElementById("subj-album-glow");
  albumGlow.style.background = `linear-gradient(135deg, ${darkenHex(subject.accent, 30)} 0%, ${subject.accent} 60%, ${subject.color} 100%)`;

  // ── Section Data ─────────────────────────────────────
  const STUDY = [
    {
      id: "cc",
      img: "images/sections/course-content.png",
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
      iconBg: "#dbeafe",
      accent: "#3b82f6",
      glow: "rgba(59,130,246,0.35)",
      title: "Course Content",
      tag: "Full Explanations",
      tagColor: "#1d4ed8",
      tagBg: "#dbeafe",
      desc: "Comprehensive, in-depth lecture coverage — every module is thoroughly explained with clarity, structured logic, and practical examples.",
    },

    {
      id: "qz",
      img: "images/sections/quizzes.png",
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
      iconBg: "#fce7f3",
      accent: "#db2777",
      glow: "rgba(219,39,119,0.3)",
      title: "Quizzes",
      tag: "Step-by-Step Solutions",
      tagColor: "#9d174d",
      tagBg: "#fce7f3",
      desc: "Step-by-step quiz walkthroughs and detailed solutions explaining the core reasoning behind every correct answer.",
    },

    {
      id: "sc",
      img: "images/sections/sections.png",
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>`,
      iconBg: "#ede9fe",
      accent: "#8b5cf6",
      glow: "rgba(139,92,246,0.3)",
      title: "Sections",
      tag: "Full Section Solutions",
      tagColor: "#6d28d9",
      tagBg: "#ede9fe",
      desc: "Complete section exercises solved and analyzed in detail to master practical application, formulas, and problem-solving.",
    },

    {
      id: "sk",
      img: "images/sections/summaries.png",
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z"/></svg>`,
      iconBg: "#dcfce7",
      accent: "#10b981",
      glow: "rgba(16,185,129,0.3)",
      title: "Summaries & Keywords",
      tag: "Keywords & Summaries",
      tagColor: "#065f46",
      tagBg: "#dcfce7",
      desc: "Key terminology breakdowns and concise executive summaries for rapid revision after every single chapter.",
    },

    {
      id: "qa",
      img: "images/sections/qa.png",
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      iconBg: "#fef3c7",
      accent: "#f59e0b",
      glow: "rgba(245,158,11,0.3)",
      title: "Questions & Answers",
      tag: "Test Bank + Extra Q",
      tagColor: "#92400e",
      tagBg: "#fef3c7",
      desc: "Complete test bank solutions supplemented with extra practice questions to solidify your mastery of the material.",
    },

    {
      id: "fr",
      img: "images/sections/final-review.png",
      icon: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
      iconBg: "#fee2e2",
      accent: "#ef4444",
      glow: "rgba(239,68,68,0.3)",
      title: "Final Review",
      tag: "End-of-Term Revision",
      tagColor: "#991b1b",
      tagBg: "#fee2e2",
      desc: "Comprehensive end-of-term revision guides, comparative tables, and essential exam prep material formatted for quick reference.",
    },
  ];

  // ── Render Tab Nav ────────────────────────────────────
  const tabNav = document.getElementById("tab-nav");
  tabNav.innerHTML = STUDY.map(
    (s, i) => `
        <button class="tab-pill ${i === 0 ? "active" : ""}"
                data-tab="${s.id}" role="tab"
                aria-selected="${i === 0}"
                style="${i === 0 ? `--subject-accent:${s.accent};--subject-glow:${s.glow};` : ""}">
            <span class="tab-pill-icon">${s.icon}</span>
            ${s.title}
        </button>
    `,
  ).join('<div class="tab-sep" aria-hidden="true"></div>');

  // ── Render Spotlight Panels ───────────────────────────
  const spWrap = document.getElementById("spotlight-wrap");
  spWrap.innerHTML = STUDY.map(
    (s, i) => `
        <div class="spotlight-panel ${i === 0 ? "sp-active" : ""}" id="sp-${s.id}" role="tabpanel">
            <!-- Left slab -->
            <div class="sp-left">
                <div class="sp-left-bg" style="background: linear-gradient(135deg, ${s.accent}, ${s.iconBg});"></div>
                <img src="${s.img}" alt="${s.title}" class="sp-left-img">
            </div>

            <!-- Right content -->
            <div class="sp-right">
                <div class="sp-tag" style="color:${s.tagColor};border-color:${s.iconBg};background:${s.iconBg}80;">
                    ${s.tag}
                </div>

                <h2 class="sp-title">${s.title}</h2>
                <p class="sp-desc">${s.desc}</p>

                <div class="sp-cta-row">
                    <a href="${s.id === "cc" ? `chapters.html?id=${subjectId}` : s.id === "qz" ? `quizzes.html?id=${subjectId}` : s.id === "sc" ? `sections.html?id=${subjectId}` : s.id === "sk" ? `summaries.html?id=${subjectId}` : s.id === "qa" ? `qa.html?id=${subjectId}` : "#"}" class="sp-cta-btn" style="background: linear-gradient(135deg, ${s.accent}, ${darkenHex(s.accent, 15)});">
                        <span>Open Section</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                        </svg>
                    </a>
                    ${
                      s.id === "fr"
                        ? `
                    <span class="sp-coming-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Coming soon
                    </span>`
                        : ""
                    }
                </div>
            </div>
        </div>
    `,
  ).join("");

  // ── Tab Switching ─────────────────────────────────────
  let currentTab = STUDY[0].id;
  const tabPills = tabNav.querySelectorAll(".tab-pill");

  tabPills.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = btn.dataset.tab;
      if (tabId === currentTab) return;

      // Update tab button active states
      tabPills.forEach((b) => {
        b.classList.remove("active");
        b.removeAttribute("style");
      });
      btn.classList.add("active");

      // Set section accent color
      const sec = STUDY.find((s) => s.id === tabId);
      if (sec) {
        document.documentElement.style.setProperty(
          "--subject-accent",
          sec.accent,
        );
      }

      // Hide all spotlight panels and show selected one
      document.querySelectorAll(".spotlight-panel").forEach((p) => {
        p.classList.remove("sp-active");
        p.style.opacity = "";
        p.style.transform = "";
      });

      const next = document.getElementById(`sp-${tabId}`);
      if (next) {
        next.classList.add("sp-active");
        if (typeof gsap !== "undefined") {
          gsap.fromTo(
            next,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" },
          );
        }
      }
      currentTab = tabId;
    });
  });

  // ── Entrance Animations ───────────────────────────────
  if (typeof gsap !== "undefined") {
    gsap.fromTo(
      ".subj-album-cover",
      { y: 30, opacity: 0, scale: 0.9 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.05,
      },
    );

    gsap.fromTo(
      ".subj-album-info",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.15 },
    );

    gsap.fromTo(
      ".tab-pill",
      { y: 12, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.2,
      },
    );

    gsap.fromTo(
      ".spotlight-wrap",
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: "power3.out", delay: 0.4 },
    );
  }
});

// ── Helper: darken a hex color by % ──────────────────────
function darkenHex(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * percent));
  const b = Math.max(0, (num & 0xff) - Math.round(2.55 * percent));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
