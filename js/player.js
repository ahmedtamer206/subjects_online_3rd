/* =========================================================
   player.js — CS50/edX Light Mode Player + Accordion Weeks
   No Notes. No PDFs. Video only.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------
  // 1. URL Parameters & Storage
  // ---------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type") || "video";
  const url = params.get("url");
  const title = params.get("title") || "Lecture Video";
  const sec = params.get("sec") || "chapters";

  let subjectId = params.get("subjectId");
  let lecId = params.get("lecId");

  // Handle parameter naming variations:
  // chapters.js / quizzes.js pass ?id=<subjectId>&lecId=<lecId>
  // player.js internal links might pass ?id=<lecId>&subjectId=<subjectId>
  if (params.get("lecId")) {
    lecId = params.get("lecId");
    if (!subjectId) subjectId = params.get("id");
  } else if (params.get("subjectId")) {
    subjectId = params.get("subjectId");
    if (!lecId) lecId = params.get("id");
  } else if (params.get("id")) {
    const cand = params.get("id");
    let isSubject = false;
    if (typeof MATERIALS !== "undefined") {
      for (const d in MATERIALS) {
        if (MATERIALS[d].some((m) => m.id === cand)) {
          isSubject = true;
          break;
        }
      }
    }
    if (isSubject) {
      subjectId = cand;
    } else {
      lecId = cand;
    }
  }

  // ---------------------------------------------------------
  // 3. Find Subject in MATERIALS (with fallback by URL or lecId)
  // ---------------------------------------------------------
  let currentSubject = null;
  if (typeof MATERIALS !== "undefined") {
    if (subjectId) {
      for (const dept in MATERIALS) {
        const found = MATERIALS[dept].find((m) => m.id === subjectId);
        if (found) {
          currentSubject = found;
          break;
        }
      }
    }

    // Auto-detect subject if subjectId was missing or invalid
    if (!currentSubject) {
      for (const dept in MATERIALS) {
        for (const subj of MATERIALS[dept]) {
          if (!subj.content) continue;
          for (const sKey in subj.content) {
            const chaps = subj.content[sKey] || [];
            for (const ch of chaps) {
              const weeks =
                ch.weeks && ch.weeks.length > 0
                  ? ch.weeks
                  : [{ lectures: ch.lectures || [] }];
              for (const w of weeks) {
                for (const l of w.lectures || []) {
                  if (
                    (url && l.url === url) ||
                    (lecId && String(l.id) === String(lecId))
                  ) {
                    currentSubject = subj;
                    subjectId = subj.id;
                    if (!lecId) lecId = l.id;
                    break;
                  }
                }
                if (currentSubject) break;
              }
              if (currentSubject) break;
            }
            if (currentSubject) break;
          }
          if (currentSubject) break;
        }
        if (currentSubject) break;
      }
    }
  }

  const storeMap = {
    chapters: "soCompletedLectures",
    quizzes: "soCompletedQuizzes",
    sections: "soCompletedSections",
    summaries: "soCompletedSummaries",
    qa: "soCompletedQA",
    finalReview: "soCompletedFinalReview",
  };
  const targetStoreKey = storeMap[sec] || "soCompletedLectures";

  // ---------------------------------------------------------
  // 2. DOM Elements
  // ---------------------------------------------------------
  const videoEl = document.getElementById("video-player");
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const videoHeadingTitle = document.getElementById("video-heading-title");
  const videoHeadingSub = document.getElementById("video-heading-sub");
  const breadcrumbCourse = document.getElementById("breadcrumb-course");
  const breadcrumbSubject = document.getElementById("breadcrumb-subject");
  const breadcrumbChapter = document.getElementById("breadcrumb-chapter");
  const breadcrumbTitle = document.getElementById("breadcrumb-title");
  const backBtn = document.getElementById("back-nav-btn");
  const prevLecBtn = document.getElementById("prev-lec-btn");
  const nextLecBtn = document.getElementById("next-lec-btn");
  const playlistSidebar = document.getElementById("playlist-sidebar");
  const toggleSidebarBtn = document.getElementById("toggle-sidebar-btn");
  const closeSidebarBtn = document.getElementById("close-sidebar-btn");
  const accordionContainer = document.getElementById(
    "accordion-weeks-container",
  );
  const playlistStatsEl = document.getElementById("playlist-stats");
  const playlistProgressFill = document.getElementById(
    "playlist-progress-fill",
  );
  const playlistCourseTitle = document.getElementById("playlist-course-title");

  // Set header text
  if (title) {
    if (videoHeadingTitle) videoHeadingTitle.textContent = title;
    if (breadcrumbTitle) breadcrumbTitle.textContent = title;
    document.title = `${title} — Subjects Online`;
  }

  if (currentSubject) {
    if (breadcrumbSubject) {
      breadcrumbSubject.textContent = currentSubject.title;
      breadcrumbSubject.onclick = () => {
        window.location.href = `chapters.html?id=${subjectId}`;
      };
    }
    if (breadcrumbCourse) {
      breadcrumbCourse.onclick = () => {
        window.location.href = "dashboard.html";
      };
    }
    if (playlistCourseTitle) {
      playlistCourseTitle.textContent = currentSubject.title;
    }
    if (backBtn) {
      backBtn.onclick = () => {
        window.location.href = `chapters.html?id=${subjectId}`;
      };
    }
  }

  // ---------------------------------------------------------
  // 4. Build Weeks & Video Lectures (Traverses ch.weeks & ch.lectures)
  // ---------------------------------------------------------
  function getWeeksData() {
    if (!currentSubject || !currentSubject.content) return [];
    const content = currentSubject.content;
    const rawChapters = content[sec] || content.chapters || [];

    const allWeeks = [];
    rawChapters.forEach((ch, chIdx) => {
      const chNum = ch.num !== undefined ? ch.num : chIdx + 1;
      const chTitle =
        ch.title && ch.title.trim() && ch.title.trim() !== "NA"
          ? ch.title.trim()
          : "";

      // In MATERIALS, lectures are inside ch.weeks[].lectures or directly on ch.lectures
      const weeksList =
        ch.weeks && ch.weeks.length > 0
          ? ch.weeks
          : [{ num: chNum, title: chTitle, lectures: ch.lectures || [] }];

      weeksList.forEach((w, wIdx) => {
        const weekNum = w.num !== undefined ? w.num : wIdx + 1;
        const wTitle =
          w.title &&
          w.title.trim() &&
          w.title.trim() !== "m-d" &&
          w.title.trim() !== "NA"
            ? w.title.trim()
            : "";

        // Filter out PDFs — only keep videos
        const videoLectures = (w.lectures || []).filter((l) => {
          const isPdf =
            l.type === "pdf" || (l.url && l.url.toLowerCase().endsWith(".pdf"));
          return !isPdf;
        });

        let displayName = `Week ${weekNum}`;
        if (wTitle) {
          displayName += ` – ${wTitle}`;
        } else if (chTitle && rawChapters.length > 1) {
          displayName += ` (${chTitle})`;
        }

        allWeeks.push({
          uniqueId: `ch${chNum}-wk${weekNum}-${wIdx}`,
          chapterNum: chNum,
          num: weekNum,
          title: wTitle,
          displayName: displayName,
          lectures: videoLectures,
        });
      });
    });

    return allWeeks;
  }

  function getAllCourseVideos() {
    const weeks = getWeeksData();
    const videos = [];
    weeks.forEach((w) => {
      w.lectures.forEach((lec) => {
        videos.push({ ...lec, weekNum: w.num, weekDisplayName: w.displayName });
      });
    });
    return videos;
  }

  // ---------------------------------------------------------
  // 5. Previous & Next Navigation (Strict Priority: lecId > title > url)
  // ---------------------------------------------------------
  function isCurrentVideo(v) {
    if (lecId && v.id !== undefined && v.id !== null) {
      return String(v.id) === String(lecId);
    }
    if (title && v.title) {
      return v.title.trim().toLowerCase() === title.trim().toLowerCase();
    }
    if (url && v.url) {
      return v.url === url;
    }
    return false;
  }

  const allVideos = getAllCourseVideos();
  let currentIndex = allVideos.findIndex((v) => isCurrentVideo(v));
  if (currentIndex === -1 && url) {
    currentIndex = allVideos.findIndex((v) => v.url === url);
  }
  const prevLec = currentIndex > 0 ? allVideos[currentIndex - 1] : null;
  const nextLec =
    currentIndex >= 0 && currentIndex < allVideos.length - 1
      ? allVideos[currentIndex + 1]
      : null;

  // Update subtitle & breadcrumb
  if (currentIndex !== -1) {
    const item = allVideos[currentIndex];
    if (breadcrumbChapter)
      breadcrumbChapter.textContent = `Week ${item.weekNum}`;
    if (videoHeadingSub) {
      videoHeadingSub.textContent = `${item.weekDisplayName} • ${currentSubject ? currentSubject.title : "Course"}`;
    }
  }

  if (prevLecBtn) {
    prevLecBtn.disabled = !prevLec;
    if (prevLec)
      prevLecBtn.onclick = () =>
        navigateToLecture(prevLec.id, prevLec.title, "video", prevLec.url);
  }
  if (nextLecBtn) {
    nextLecBtn.disabled = !nextLec;
    if (nextLec)
      nextLecBtn.onclick = () =>
        navigateToLecture(nextLec.id, nextLec.title, "video", nextLec.url);
  }

  // ---------------------------------------------------------
  // 6. Sidebar Toggle
  // ---------------------------------------------------------
  function toggleSidebar() {
    if (!playlistSidebar) return;
    playlistSidebar.classList.toggle("hidden");
    const hidden = playlistSidebar.classList.contains("hidden");
    localStorage.setItem("so_syllabus_hidden", hidden ? "1" : "0");
    if (toggleSidebarBtn)
      toggleSidebarBtn.title = hidden ? "Show Sidebar" : "Hide Sidebar";
  }

  if (toggleSidebarBtn)
    toggleSidebarBtn.addEventListener("click", toggleSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", toggleSidebar);

  // Restore preference
  if (localStorage.getItem("so_syllabus_hidden") === "1" && playlistSidebar) {
    playlistSidebar.classList.add("hidden");
  }

  // ---------------------------------------------------------
  // 7. Focus Mode
  // ---------------------------------------------------------
  const focusBtn = document.getElementById("focus-btn");
  const focusBtnText = document.getElementById("focus-btn-text");
  if (focusBtn) {
    focusBtn.addEventListener("click", () => {
      document.body.classList.toggle("focus-mode");
      const on = document.body.classList.contains("focus-mode");
      if (focusBtnText) focusBtnText.textContent = on ? "Exit" : "Focus";
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("focus-mode"))
        focusBtn.click();
    });
  }

  // ---------------------------------------------------------
  // 8. Download (D Key)
  // ---------------------------------------------------------
  function downloadCurrentMedia() {
    if (!url) return;
    let fileName = title || "Lecture";
    if (!fileName.toLowerCase().endsWith(".mp4")) fileName += ".mp4";
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    const dlBtn = document.querySelector(".btn-plyr-download");
    if (dlBtn) {
      const tip = dlBtn.querySelector(".custom-tooltip");
      if (tip) {
        const old = tip.textContent;
        tip.textContent = "Downloading... ✓";
        setTimeout(() => {
          tip.textContent = old;
        }, 2000);
      }
    }
  }

  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement
      ? document.activeElement.tagName.toLowerCase()
      : "";
    if (
      tag === "input" ||
      tag === "textarea" ||
      (document.activeElement && document.activeElement.isContentEditable)
    )
      return;
    if (e.key === "d" || e.key === "D") {
      e.preventDefault();
      downloadCurrentMedia();
    } else if (e.key === "?") {
      e.preventDefault();
      toggleShortcutsModal();
    }
  });

  // ---------------------------------------------------------
  // 9. Shortcuts Modal
  // ---------------------------------------------------------
  const shortcutsBtn = document.getElementById("shortcuts-btn");
  const shortcutsModal = document.getElementById("shortcuts-modal");
  const closeShortcutsBtn = document.getElementById("close-shortcuts-btn");
  const gotItShortcutsBtn = document.getElementById("got-it-shortcuts-btn");

  function toggleShortcutsModal() {
    if (shortcutsModal) shortcutsModal.classList.toggle("hidden");
  }

  if (shortcutsBtn)
    shortcutsBtn.addEventListener("click", toggleShortcutsModal);
  if (closeShortcutsBtn)
    closeShortcutsBtn.addEventListener("click", toggleShortcutsModal);
  if (gotItShortcutsBtn)
    gotItShortcutsBtn.addEventListener("click", toggleShortcutsModal);
  if (shortcutsModal)
    shortcutsModal.addEventListener("click", (e) => {
      if (e.target === shortcutsModal) toggleShortcutsModal();
    });

  // ---------------------------------------------------------
  // 10. Initialize Plyr Video Player
  // ---------------------------------------------------------
  if (!url) {
    showError();
    return;
  }

  // Detect if URL is external (GitHub Releases, etc.)
  const isExternalUrl = url.startsWith("http://") || url.startsWith("https://");

  const isMobile = window.innerWidth < 640;
  const controlsList = isMobile
    ? ["play-large", "play", "progress", "current-time", "fullscreen"]
    : [
        "play-large",
        "play",
        "rewind",
        "fast-forward",
        "progress",
        "current-time",
        "duration",
        "mute",
        "volume",
        "settings",
        "pip",
        "fullscreen",
      ];

  // For external URLs, set the src directly on the video element first
  // This avoids Plyr's multi-source setup which breaks with 302 redirects
  if (isExternalUrl) {
    videoEl.removeAttribute("crossorigin");
    videoEl.src = url;
  }

  const player = new Plyr(videoEl, {
    controls: controlsList,
    settings: ["captions", "quality", "speed", "loop"],
    quality: { default: 1080, options: [1080, 720, 480] },
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
    keyboard: { focused: true, global: true },
    tooltips: { controls: true, seek: true },
  });

  // For local files, use Plyr's source setter; for external, the src is already set
  if (!isExternalUrl) {
    player.source = {
      type: "video",
      title: title,
      sources: [
        { src: url, type: "video/mp4", size: 1080 },
        { src: url, type: "video/mp4", size: 720 },
        { src: url, type: "video/mp4", size: 480 },
      ],
    };
  }

  const storageKey = `so_vid_progress_${encodeURIComponent(url)}`;

  player.on("ready", () => {
    hideLoading();
    injectCustomControls(player);
    setupDoubleTapSeek(player);
    renderAccordionWeeks();

    const saved = localStorage.getItem(storageKey);
    if (saved && !isNaN(saved)) player.currentTime = parseFloat(saved);

    if (player.duration && !isNaN(player.duration) && player.duration > 0) {
      localStorage.setItem(
        "so_dur_" + encodeURIComponent(url),
        Math.round(player.duration),
      );
    }
  });

  player.on("loadedmetadata", () => {
    if (player.duration && !isNaN(player.duration) && player.duration > 0) {
      localStorage.setItem(
        "so_dur_" + encodeURIComponent(url),
        Math.round(player.duration),
      );
    }
  });

  player.on("timeupdate", () => {
    if (player.currentTime > 5 && !player.ended)
      localStorage.setItem(storageKey, player.currentTime);
    handleABLoop(player);
  });

  player.on("ended", () => {
    localStorage.removeItem(storageKey);

    // Mark done
    if (lecId && subjectId) {
      const store = JSON.parse(localStorage.getItem(targetStoreKey) || "{}");
      store[subjectId + "_" + lecId] = true;
      localStorage.setItem(targetStoreKey, JSON.stringify(store));
      renderAccordionWeeks();
    }

    // Auto-next
    if (nextLec) {
      const overlay = document.getElementById("auto-next-overlay");
      const nextTitleEl = document.getElementById("next-lec-title");
      if (nextTitleEl) nextTitleEl.textContent = nextLec.title;
      if (overlay) overlay.classList.remove("hidden");

      let countdown = 5;
      const timerText = document.getElementById("next-timer-text");
      const timerCircle = document.getElementById("next-timer-circle");
      if (timerText) timerText.textContent = countdown;
      if (timerCircle) timerCircle.style.strokeDashoffset = 0;

      const timer = setInterval(() => {
        countdown--;
        if (countdown >= 0) {
          if (timerText) timerText.textContent = countdown;
          if (timerCircle)
            timerCircle.style.strokeDashoffset =
              213 - ((5 - countdown) / 5) * 213;
        }
        if (countdown <= 0) {
          clearInterval(timer);
          navigateToLecture(nextLec.id, nextLec.title, "video", nextLec.url);
        }
      }, 1000);

      const cancelBtn = document.getElementById("cancel-next-btn");
      if (cancelBtn)
        cancelBtn.onclick = () => {
          clearInterval(timer);
          overlay.classList.add("hidden");
        };

      const playNowBtn = document.getElementById("play-next-btn");
      if (playNowBtn)
        playNowBtn.onclick = () => {
          clearInterval(timer);
          navigateToLecture(nextLec.id, nextLec.title, "video", nextLec.url);
        };
    }
  });

  player.on("error", showError);
  videoEl.addEventListener("canplay", hideLoading);
  videoEl.addEventListener("error", showError);

  // ---------------------------------------------------------
  // 11. Custom Plyr Controls (A-B Loop, Speed, Boost, Download)
  // ---------------------------------------------------------
  function injectCustomControls(player) {
    const controls = player.elements
      ? player.elements.controls
      : document.querySelector(".plyr__controls");
    if (!controls || controls.querySelector(".btn-plyr-ab")) return;

    const abBtn = makeBtn(
      "btn-plyr-ab",
      `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg><span class="custom-tooltip" id="ab-loop-tooltip">A-B Loop</span>`,
    );

    const speedBtn = makeBtn(
      "btn-plyr-speed",
      `<span id="plyr-speed-label" style="font-weight:900;font-family:ui-monospace,monospace;font-size:0.68rem;color:#0284c7;background:#e0f2fe;padding:2px 6px;border-radius:4px;border:1px solid rgba(2,132,199,0.15);">1x</span>
            <span class="custom-tooltip">Speed</span>`,
    );

    const boostBtn = makeBtn(
      "btn-plyr-boost",
      `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
            </svg><span id="plyr-boost-badge" style="margin-left:2px;font-size:0.56rem;font-weight:800;color:#94a3b8;">100%</span>
            <span class="custom-tooltip" id="plyr-boost-tooltip">Audio Boost</span>`,
    );

    const dlBtn = makeBtn(
      "btn-plyr-download",
      `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" style="color:#0284c7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg><span style="margin-left:3px;padding:1px 5px;font-size:0.56rem;font-weight:700;font-family:ui-monospace,monospace;background:#e0f2fe;color:#0284c7;border-radius:3px;border:1px solid rgba(2,132,199,0.15);">D</span>
            <span class="custom-tooltip">Download (D)</span>`,
    );

    const target =
      controls.querySelector('[data-plyr="settings"]') ||
      controls.querySelector('[data-plyr="fullscreen"]');
    [abBtn, speedBtn, boostBtn, dlBtn].forEach((b) => {
      if (target) controls.insertBefore(b, target);
      else controls.appendChild(b);
    });

    setupABLoop(player, abBtn);
    setupSpeedCycle(player, speedBtn);
    setupAudioBoost(videoEl, boostBtn);
    dlBtn.addEventListener("click", downloadCurrentMedia);
  }

  function makeBtn(cls, html) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `plyr__control custom-plyr-btn ${cls}`;
    b.innerHTML = html;
    return b;
  }

  // ---------------------------------------------------------
  // 12. A-B Loop
  // ---------------------------------------------------------
  let loopA = null,
    loopB = null,
    isLooping = false;

  function setupABLoop(player, btn) {
    const tip = btn.querySelector(".custom-tooltip");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (loopA === null) {
        loopA = player.currentTime;
        btn.classList.add("active");
        if (tip) tip.textContent = `A: ${fmt(loopA)} → Click B`;
      } else if (loopB === null) {
        loopB = player.currentTime <= loopA ? loopA + 5 : player.currentTime;
        isLooping = true;
        if (tip) tip.textContent = `Loop [${fmt(loopA)}–${fmt(loopB)}] Click ✕`;
      } else {
        loopA = loopB = null;
        isLooping = false;
        btn.classList.remove("active");
        if (tip) tip.textContent = "A-B Loop";
      }
    });
  }

  function handleABLoop(player) {
    if (isLooping && loopA !== null && loopB !== null) {
      if (player.currentTime >= loopB || player.currentTime < loopA)
        player.currentTime = loopA;
    }
  }

  // ---------------------------------------------------------
  // 13. Speed Cycle
  // ---------------------------------------------------------
  function setupSpeedCycle(player, btn) {
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const label = btn.querySelector("#plyr-speed-label");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const next =
        speeds[(speeds.indexOf(player.speed || 1) + 1) % speeds.length];
      player.speed = next;
      if (label) label.textContent = `${next}x`;
    });
    player.on("ratechange", () => {
      if (label) label.textContent = `${player.speed}x`;
    });
  }

  // ---------------------------------------------------------
  // 14. Audio Boost
  // ---------------------------------------------------------
  let audioCtx = null,
    gainNode = null,
    boostLevel = 1.0;

  function setupAudioBoost(video, btn) {
    const badge = btn.querySelector("#plyr-boost-badge");
    const tip = btn.querySelector("#plyr-boost-tooltip");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      try {
        if (!audioCtx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AC();
          const src = audioCtx.createMediaElementSource(video);
          gainNode = audioCtx.createGain();
          src.connect(gainNode);
          gainNode.connect(audioCtx.destination);
        }
        if (audioCtx.state === "suspended") audioCtx.resume();
        boostLevel = boostLevel === 1.0 ? 1.5 : boostLevel === 1.5 ? 2.0 : 1.0;
        gainNode.gain.value = boostLevel;
        const pct = `${Math.round(boostLevel * 100)}%`;
        if (badge) badge.textContent = pct;
        if (tip) tip.textContent = `Boost: ${pct}`;
        btn.classList.toggle("active", boostLevel > 1.0);
      } catch (err) {
        console.warn("Audio boost error:", err);
      }
    });
  }

  // ---------------------------------------------------------
  // 15. Double-Tap Seek
  // ---------------------------------------------------------
  function setupDoubleTapSeek(player) {
    const wrapper = document.getElementById("player-wrapper");
    const rLeft = document.getElementById("seek-ripple-left");
    const rRight = document.getElementById("seek-ripple-right");
    if (!wrapper) return;

    wrapper.addEventListener("dblclick", (e) => {
      if (
        e.target.closest(".plyr__controls") ||
        e.target.closest(".plyr__menu")
      )
        return;
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;

      if (x < rect.width * 0.45) {
        player.currentTime = Math.max(0, player.currentTime - 10);
        flash(rLeft);
      } else if (x > rect.width * 0.55) {
        player.currentTime = Math.min(player.duration, player.currentTime + 10);
        flash(rRight);
      }
    });

    function flash(el) {
      if (!el) return;
      el.classList.remove("active");
      void el.offsetWidth;
      el.classList.add("active");
    }
  }

  // =========================================================
  // 16. Render CS50 Accordion Weeks (STRICTLY NO PDFS)
  // =========================================================
  function renderAccordionWeeks() {
    if (!accordionContainer) return;

    const weeks = getWeeksData();
    const store = JSON.parse(localStorage.getItem(targetStoreKey) || "{}");

    if (weeks.length === 0) {
      accordionContainer.innerHTML =
        '<div style="padding:32px;text-align:center;color:#94a3b8;font-size:0.75rem;">No video lectures found.</div>';
      return;
    }

    // Stats
    let totalVids = 0,
      totalDone = 0;
    weeks.forEach((w) =>
      w.lectures.forEach((l) => {
        totalVids++;
        if (store[subjectId + "_" + l.id]) totalDone++;
      }),
    );
    if (playlistStatsEl)
      playlistStatsEl.textContent = `${totalDone} / ${totalVids}`;
    if (playlistProgressFill)
      playlistProgressFill.style.width =
        totalVids > 0 ? `${Math.round((totalDone / totalVids) * 100)}%` : "0%";

    accordionContainer.innerHTML = weeks
      .map((week) => {
        const vids = week.lectures;
        const done = vids.filter((l) => !!store[subjectId + "_" + l.id]).length;
        const total = vids.length;
        const allDone = total > 0 && done === total;
        const partial = done > 0 && done < total;
        const hasCurrent = vids.some((l) => isCurrentVideo(l));

        // Progress icon
        let icon;
        if (allDone) {
          icon = `<div class="week-progress-circle" style="background:#10b981;color:#fff;">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>`;
        } else if (partial) {
          icon = `<div class="week-progress-circle" style="color:#10b981;">
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 000 18V3z"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                </div>`;
        } else {
          icon = `<div class="week-progress-circle" style="color:#cbd5e1;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
                </div>`;
        }

        // Lessons
        const lessons = vids
          .map((lec) => {
            const isCur = isCurrentVideo(lec);
            const isDone = !!store[subjectId + "_" + lec.id];
            return `
                    <div class="lesson-item ${isCur ? "is-current" : ""}" onclick="navigateToLecture('${lec.id}','${encodeURIComponent(lec.title)}','video','${encodeURIComponent(lec.url)}')">
                        <div class="lesson-status-circle ${isDone ? "is-done" : ""}" onclick="toggleLessonDone(event,'${lec.id}')" title="${isDone ? "Done" : "Mark done"}">
                            ${isDone ? '<svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ""}
                        </div>
                        <span class="lesson-title">${esc(lec.title)}</span>
                        ${isCur ? '<span class="playing-badge">Playing</span>' : ""}
                    </div>`;
          })
          .join("");

        const weekDomId = `wk-${week.uniqueId || week.num}`;
        return `
                <div class="week-card ${hasCurrent ? "open active-week" : ""}" id="${weekDomId}">
                    <div class="week-header" onclick="toggleWeek('${weekDomId}')">
                        <div class="week-header-left">
                            ${icon}
                            <span class="week-name">${esc(week.displayName)}</span>
                        </div>
                        <div class="week-header-right">
                            <span class="week-count">${done}/${total}</span>
                            <svg class="week-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                    </div>
                    <div class="week-body">
                        ${total > 0 ? lessons : '<div style="padding:10px;text-align:center;color:#94a3b8;font-size:0.68rem;">No videos yet.</div>'}
                    </div>
                </div>`;
      })
      .join("");
  }

  // Global functions
  window.toggleWeek = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("open");
  };

  window.toggleLessonDone = (e, id) => {
    e.stopPropagation();
    if (!subjectId) return;
    const key = subjectId + "_" + id;
    const store = JSON.parse(localStorage.getItem(targetStoreKey) || "{}");
    store[key] = !store[key];
    localStorage.setItem(targetStoreKey, JSON.stringify(store));
    renderAccordionWeeks();
  };

  window.navigateToLecture = (id, t, tp, u) => {
    const encU = encodeURIComponent(decodeURIComponent(u));
    const encT = encodeURIComponent(decodeURIComponent(t));
    window.location.href = `player.html?id=${subjectId || ""}&subjectId=${subjectId || ""}&lecId=${id}&type=video&url=${encU}&title=${encT}&sec=${sec}`;
  };

  // Initial render
  renderAccordionWeeks();

  // ---------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------
  function hideLoading() {
    if (loadingState) loadingState.classList.add("fade-out");
  }
  function showError() {
    if (loadingState) loadingState.classList.add("fade-out");
    if (errorState) errorState.classList.remove("hidden");
  }

  function fmt(s) {
    if (!s || isNaN(s)) return "0:00";
    const h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
      : `${m}:${String(sec).padStart(2, "0")}`;
  }

  function esc(t) {
    if (!t) return "";
    return t
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
