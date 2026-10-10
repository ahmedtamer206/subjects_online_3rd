/* ===================================================
   SUBJECTS ONLINE — Profile & Account Settings (profile.js)
   Complete Interactive Hub: Identity, Preferences & Student Tools
   =================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // ── 1. Tab Navigation ────────────────────────────────────────────────────────
  const tabNavBtns = document.querySelectorAll(".settings-nav-tab");
  const tabPanes = {
    identity: document.getElementById("pane-identity"),
    preferences: document.getElementById("pane-preferences"),
    tools: document.getElementById("pane-tools"),
  };

  tabNavBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      tabNavBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      Object.keys(tabPanes).forEach((k) => {
        if (tabPanes[k]) {
          if (k === target) {
            tabPanes[k].classList.remove("hidden");
            if (typeof gsap !== "undefined") {
              gsap.fromTo(
                tabPanes[k].children,
                { y: 20, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.45,
                  stagger: 0.08,
                  ease: "power2.out",
                },
              );
            }
          } else {
            tabPanes[k].classList.add("hidden");
          }
        }
      });
    });
  });

  // ── 2. DOM Element References ────────────────────────────────────────────────
  const nameInput = document.getElementById("profile-name");
  const deptInput = document.getElementById("profile-dept");
  const form = document.getElementById("profile-form");
  const saveProfileBtn = document.getElementById("save-profile-btn");

  const avatarDisplay = document.getElementById("profile-avatar-display");
  const displayName = document.getElementById("display-profile-name");
  const displayDept = document.getElementById("display-profile-dept");
  const deptHubTitle = document.getElementById("dept-hub-title");
  const authStatusPill = document.getElementById("profile-auth-status-pill");

  const themeBtns = document.querySelectorAll(".color-palette-btn");
  const uploadInput = document.getElementById("avatar-upload");
  const removeBtn = document.getElementById("avatar-remove");

  // Preferences Elements
  const semesterBtns = document.querySelectorAll("#semester-selector button");
  const targetBtns = document.querySelectorAll("#daily-target-selector button");
  const targetLabel = document.getElementById("daily-target-label");
  const speedBtns = document.querySelectorAll("#speed-selector button");
  const qualityBtns = document.querySelectorAll("#quality-selector button");
  const seekBtns = document.querySelectorAll("#seek-selector button");
  const fontBtns = document.querySelectorAll("#font-size-selector button");
  const pdfBtns = document.querySelectorAll("#pdf-mode-selector button");

  const landingPageSelect = document.getElementById("pref-landing-page");
  const viewDensitySelect = document.getElementById("pref-view-density");
  const progressStyleSelect = document.getElementById("pref-progress-style");

  const autoplayToggle = document.getElementById("pref-autoplay-toggle");
  const soundsToggle = document.getElementById("pref-sounds-toggle");
  const autoSaveNotesToggle = document.getElementById(
    "pref-autosave-notes-toggle",
  );
  const shortcutsToggle = document.getElementById("pref-shortcuts-toggle");
  const hideCompletedToggle = document.getElementById(
    "pref-hide-completed-toggle",
  );
  const instructorToggle = document.getElementById(
    "pref-instructor-priority-toggle",
  );
  const motionToggle = document.getElementById("pref-motion-toggle");

  // Google Linking & Account Info
  const unlinkedBox = document.getElementById("unlinked-account-box");
  const linkedBox = document.getElementById("linked-account-box");
  const linkedEmailText = document.getElementById("linked-email-text");
  const linkGoogleBtn = document.getElementById("link-google-btn");
  const uidDisplay = document.getElementById("account-uid-display");
  const copyUidBtn = document.getElementById("copy-uid-btn");
  const logoutBtn = document.getElementById("logout-btn");

  // Toast Notification
  const toastEl = document.getElementById("settings-toast");
  const toastTitle = document.getElementById("toast-title");
  const toastDesc = document.getElementById("toast-desc");
  const toastIconWrapper = document.getElementById("toast-icon-wrapper");

  // ── 3. Load State from LocalStorage ──────────────────────────────────────────
  let currentName = localStorage.getItem("subjectsOnlineName") || "";
  let currentDept = localStorage.getItem("subjectsOnlineDept") || "Accounting";
  let currentTheme =
    localStorage.getItem("subjectsOnlineAvatarTheme") || "blue";
  let currentImage = localStorage.getItem("subjectsOnlineAvatarImage") || null;
  let currentEmail = localStorage.getItem("subjectsOnlineEmail") || "";
  let currentUID = localStorage.getItem("subjectsOnlineUID") || "";
  let authProvider =
    localStorage.getItem("subjectsOnlineAuthProvider") || "manual";

  // Preferences
  let currentSemester = localStorage.getItem("soSemester") || "1";
  let dailyTarget = localStorage.getItem("soDailyTarget") || "2";
  let playbackSpeed = localStorage.getItem("soPlaybackSpeed") || "1";
  let videoQuality = localStorage.getItem("soVideoQuality") || "auto";
  let seekDuration = localStorage.getItem("soSeekDuration") || "10";
  let readingFont = localStorage.getItem("soReadingFontSize") || "normal";
  let pdfMode = localStorage.getItem("soPdfOpenMode") || "viewer";

  let landingPage = localStorage.getItem("soLandingPage") || "dashboard.html";
  let viewDensity = localStorage.getItem("soViewDensity") || "comfortable";
  let progressStyle = localStorage.getItem("soProgressStyle") || "ring";

  let autoplayNext = localStorage.getItem("soAutoplayNext") !== "false";
  let soundEffects = localStorage.getItem("soSoundEffects") !== "false";
  let autoSaveNotes = localStorage.getItem("soAutoSaveNotes") !== "false";
  let shortcutsOn = localStorage.getItem("soShortcutsEnabled") !== "false";
  let hideCompleted = localStorage.getItem("soHideCompleted") === "true";
  let instructorOn = localStorage.getItem("soInstructorPriority") !== "false";
  let reduceMotion = localStorage.getItem("soReduceMotion") === "true";

  // Populate Initial Inputs
  nameInput.value = currentName;
  deptInput.value = currentDept;

  // ── 4. Theme Gradients Definition ────────────────────────────────────────────
  const themeGradients = {
    blue: "bg-gradient-to-br from-blue-600 to-cyan-400",
    emerald: "bg-gradient-to-br from-emerald-500 to-teal-400",
    rose: "bg-gradient-to-br from-rose-500 to-pink-500",
    violet: "bg-gradient-to-br from-violet-600 to-purple-500",
    amber: "bg-gradient-to-br from-amber-400 to-orange-500",
    indigo: "bg-gradient-to-br from-indigo-600 to-blue-800",
  };

  // ── 5. Avatar Rendering Function ─────────────────────────────────────────────
  function renderAvatar(theme, imgSrc = null) {
    if (!avatarDisplay) return;

    Object.values(themeGradients).forEach((cls) => {
      cls.split(" ").forEach((c) => avatarDisplay.classList.remove(c));
    });

    if (imgSrc) {
      avatarDisplay.style.backgroundImage = `url(${imgSrc})`;
      avatarDisplay.textContent = "";
      avatarDisplay.classList.remove("bg-gradient-to-br");
      if (removeBtn) removeBtn.classList.remove("hidden");
    } else {
      avatarDisplay.style.backgroundImage = "none";
      const letter = nameInput.value.trim()
        ? nameInput.value.trim()[0].toUpperCase()
        : currentName
          ? currentName[0].toUpperCase()
          : "S";
      avatarDisplay.textContent = letter;

      avatarDisplay.classList.add("bg-gradient-to-br");
      const gradientCls = themeGradients[theme] || themeGradients["blue"];
      gradientCls.split(" ").forEach((c) => avatarDisplay.classList.add(c));

      if (removeBtn) removeBtn.classList.add("hidden");
    }

    themeBtns.forEach((btn) => {
      if (btn.dataset.theme === theme) btn.classList.add("active");
      else btn.classList.remove("active");
    });

    if (typeof updateAdminAvatarDisplay === "function") {
      updateAdminAvatarDisplay();
    }
  }

  // ── 6. Account & Cloud Status Rendering ──────────────────────────────────────
  function renderAccountStatus() {
    const isGoogle = authProvider === "google" || Boolean(currentEmail);

    if (uidDisplay) {
      uidDisplay.textContent = currentUID || "manual-" + Date.now();
    }

    if (isGoogle && currentEmail) {
      if (unlinkedBox) unlinkedBox.classList.add("hidden");
      if (linkedBox) linkedBox.classList.remove("hidden");
      if (linkedEmailText) linkedEmailText.textContent = currentEmail;

      if (authStatusPill) {
        authStatusPill.className =
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-900/50";
        authStatusPill.innerHTML = `
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Cloud Sync Active</span>
                `;
      }
    } else {
      if (unlinkedBox) unlinkedBox.classList.remove("hidden");
      if (linkedBox) linkedBox.classList.add("hidden");

      if (authStatusPill) {
        authStatusPill.className =
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200/60 dark:border-amber-900/50";
        authStatusPill.innerHTML = `
                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Local Profile (Not Linked)</span>
                `;
      }
    }
  }

  // ── 7. Preferences UI Rendering ──────────────────────────────────────────────
  function renderPreferences() {
    // Semester
    semesterBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.semester === currentSemester);
    });

    // Daily Target
    targetBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.target === dailyTarget);
    });
    if (targetLabel) targetLabel.textContent = `${dailyTarget} Tasks / Day`;

    // Video Speeds
    speedBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.speed === playbackSpeed);
    });

    // Video Quality
    qualityBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.quality === videoQuality);
    });

    // Seek Duration
    seekBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.seek === seekDuration);
    });

    // Font Size
    fontBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.font === readingFont);
    });

    // PDF Mode
    pdfBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.pdf === pdfMode);
    });

    // Dropdowns
    if (landingPageSelect) landingPageSelect.value = landingPage;
    if (viewDensitySelect) viewDensitySelect.value = viewDensity;
    if (progressStyleSelect) progressStyleSelect.value = progressStyle;

    // Toggles
    if (autoplayToggle) autoplayToggle.checked = autoplayNext;
    if (soundsToggle) soundsToggle.checked = soundEffects;
    if (autoSaveNotesToggle) autoSaveNotesToggle.checked = autoSaveNotes;
    if (shortcutsToggle) shortcutsToggle.checked = shortcutsOn;
    if (hideCompletedToggle) hideCompletedToggle.checked = hideCompleted;
    if (instructorToggle) instructorToggle.checked = instructorOn;
    if (motionToggle) motionToggle.checked = reduceMotion;
  }

  // ── 8. Initial Page Render ───────────────────────────────────────────────────
  if (displayName) displayName.textContent = currentName || "Student";
  if (displayDept) displayDept.textContent = currentDept || "Accounting";
  if (deptHubTitle)
    deptHubTitle.textContent = `Official channels for ${currentDept || "Accounting"}`;

  renderAvatar(currentTheme, currentImage);
  renderAccountStatus();
  renderPreferences();

  // ── 9. Interactive Inputs Event Listeners ─────────────────────────────────────
  nameInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (displayName) displayName.textContent = val || "Student";
    if (!currentImage) {
      avatarDisplay.textContent = val ? val[0].toUpperCase() : "S";
    }
  });

  deptInput.addEventListener("change", (e) => {
    const selected = e.target.value;
    if (displayDept) displayDept.textContent = selected;
    if (deptHubTitle)
      deptHubTitle.textContent = `Official channels for ${selected}`;
    renderScheduleBuilder();
    renderOutputTimetableTable();
  });

  // Button Selectors Listeners
  semesterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSemester = btn.dataset.semester;
      renderPreferences();
    });
  });

  targetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      dailyTarget = btn.dataset.target;
      renderPreferences();
    });
  });

  speedBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      playbackSpeed = btn.dataset.speed;
      renderPreferences();
    });
  });

  qualityBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      videoQuality = btn.dataset.quality;
      renderPreferences();
    });
  });

  seekBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      seekDuration = btn.dataset.seek;
      renderPreferences();
    });
  });

  // Live change listeners for dropdowns
  if (viewDensitySelect) {
    viewDensitySelect.addEventListener("change", (e) => {
      viewDensity = e.target.value;
      localStorage.setItem("soViewDensity", viewDensity);
      const isCompact = viewDensity === "compact";
      document.documentElement.classList.toggle("density-compact", isCompact);
      document.body?.classList.toggle("density-compact", isCompact);
      showToast(
        "Density Updated",
        isCompact ? "Compact view enabled." : "Comfortable view enabled.",
      );
    });
  }

  if (progressStyleSelect) {
    progressStyleSelect.addEventListener("change", (e) => {
      progressStyle = e.target.value;
      localStorage.setItem("soProgressStyle", progressStyle);
      document.documentElement.setAttribute(
        "data-progress-style",
        progressStyle,
      );
      showToast(
        "Progress Style Updated",
        `Tracker style set to ${progressStyle}.`,
      );
    });
  }

  if (landingPageSelect) {
    landingPageSelect.addEventListener("change", (e) => {
      landingPage = e.target.value;
      localStorage.setItem("soLandingPage", landingPage);
      showToast(
        "Landing Page Updated",
        `Default start page set to ${landingPage}.`,
      );
    });
  }

  if (motionToggle) {
    motionToggle.addEventListener("change", (e) => {
      reduceMotion = e.target.checked;
      localStorage.setItem("soReduceMotion", reduceMotion.toString());
      document.documentElement.classList.toggle("reduce-motion", reduceMotion);
      document.body?.classList.toggle("reduce-motion", reduceMotion);
      showToast(
        "Motion Settings",
        reduceMotion ? "Reduced motion enabled." : "Normal animations enabled.",
      );
    });
  }

  fontBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      readingFont = btn.dataset.font;
      localStorage.setItem("soReadingFontSize", readingFont);
      document.documentElement.setAttribute("data-font-size", readingFont);
      renderPreferences();
    });
  });

  pdfBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      pdfMode = btn.dataset.pdf;
      localStorage.setItem("soPdfOpenMode", pdfMode);
      renderPreferences();
      showToast("PDF Action", `PDF documents set to ${pdfMode}.`);
    });
  });

  themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTheme = btn.dataset.theme;
      renderAvatar(currentTheme, currentImage);
      if (typeof gsap !== "undefined") {
        gsap.fromTo(
          btn,
          { scale: 0.9 },
          { scale: 1.08, duration: 0.35, ease: "back.out(2)" },
        );
      }
    });
  });

  // ── 9.5. Expandable Preferred Instructor Accordion ───────────────────────────
  const prefInstructorExpandBtn = document.getElementById(
    "pref-instructor-expand-btn",
  );
  const prefInstructorChevron = document.getElementById(
    "pref-instructor-chevron",
  );
  const instructorAccordion = document.getElementById(
    "instructor-preferences-accordion",
  );
  const instructorDeptTag = document.getElementById("instructor-dept-tag");
  const instructorSubjectsList = document.getElementById(
    "instructor-subjects-list",
  );

  const defaultDoctorsMap = {
    "Corporate Accounting": [
      "Dr. Mohamed Hassan",
      "Dr. Ahmed Nour",
      "Dr. Sara Khalil",
    ],
    "Principles of Cost Accounting": [
      "Dr. Tarek Mahmoud",
      "Dr. Mohamed Hassan",
      "Dr. Laila Mansour",
    ],
    "Specialized Accounting Systems": [
      "Dr. Ahmed Nour",
      "Dr. Khaled Ibrahim",
      "Dr. Mona Reda",
    ],
    "Quantitative Analysis for Business": [
      "Dr. Laila Mansour",
      "Dr. Tarek Mahmoud",
      "Dr. Sara Khalil",
    ],
    "Principles of Financial Management": [
      "Dr. Khaled Ibrahim",
      "Dr. Mohamed Hassan",
      "Dr. Ahmed Nour",
    ],
    "Money and Banking Economics": [
      "Dr. Sara Khalil",
      "Dr. Laila Mansour",
      "Dr. Tarek Mahmoud",
    ],
    "Tax Systems": ["Dr. Mona Reda", "Dr. Ahmed Nour", "Dr. Mohamed Hassan"],

    "Strategic Management": [
      "Dr. Hassan El-Sayed",
      "Dr. Rania Mahmoud",
      "Dr. Mohamed Hassan",
    ],
    "Marketing Analytics": [
      "Dr. Sara Khalil",
      "Dr. Rania Mahmoud",
      "Dr. Ahmed Nour",
    ],
    "Operations Research": [
      "Dr. Laila Mansour",
      "Dr. Tarek Mahmoud",
      "Dr. Khaled Ibrahim",
    ],
    "Public Institutions Management": [
      "Dr. Hassan El-Sayed",
      "Dr. Mona Reda",
      "Dr. Sara Khalil",
    ],
    "Principles of Insurance": [
      "Dr. Khaled Ibrahim",
      "Dr. Tarek Mahmoud",
      "Dr. Mohamed Hassan",
    ],

    "History of Economic Thought": [
      "Dr. Sara Khalil",
      "Dr. Mohamed Hassan",
      "Dr. Rania Mahmoud",
    ],
    "Comparative Economic Systems": [
      "Dr. Hassan El-Sayed",
      "Dr. Laila Mansour",
      "Dr. Ahmed Nour",
    ],
    "Industrial Economics": [
      "Dr. Tarek Mahmoud",
      "Dr. Khaled Ibrahim",
      "Dr. Mona Reda",
    ],
    "Statistics for Economists": [
      "Dr. Laila Mansour",
      "Dr. Sara Khalil",
      "Dr. Ahmed Nour",
    ],

    "Applied Statistics (1)": [
      "Dr. Laila Mansour",
      "Dr. Tarek Mahmoud",
      "Dr. Sara Khalil",
    ],
    "Statistics and Computer Lab": [
      "Dr. Laila Mansour",
      "Dr. Ahmed Nour",
      "Dr. Khaled Ibrahim",
    ],
    "Quantitative Analysis Techniques": [
      "Dr. Tarek Mahmoud",
      "Dr. Laila Mansour",
      "Dr. Mohamed Hassan",
    ],

    "Ports and Customs Management": [
      "Dr. Khaled Ibrahim",
      "Dr. Tarek Mahmoud",
      "Dr. Mohamed Hassan",
    ],
  };

  function renderInstructorAccordion() {
    if (!instructorSubjectsList) return;
    const dept = deptInput ? deptInput.value : currentDept;
    if (instructorDeptTag) instructorDeptTag.textContent = dept;

    const deptKey = getDeptKey(dept);
    let materials = [];
    if (typeof MATERIALS !== "undefined" && MATERIALS[deptKey]) {
      materials = MATERIALS[deptKey];
    } else {
      const names =
        sampleSubjectsByDept[dept] || sampleSubjectsByDept["Accounting"] || [];
      materials = names.map((name, idx) => ({
        id: `sub_${idx}`,
        title: name,
        icon: "📘",
      }));
    }

    let savedPrefs = {};
    try {
      savedPrefs = JSON.parse(
        localStorage.getItem("soPreferredInstructors") || "{}",
      );
    } catch {
      savedPrefs = {};
    }

    instructorSubjectsList.innerHTML = "";

    materials.forEach((subj) => {
      const doctors = defaultDoctorsMap[subj.title] || [
        "Dr. Mohamed Hassan",
        "Dr. Ahmed Nour",
        "Dr. Sara Khalil",
      ];
      const currentSelected =
        savedPrefs[subj.id] || savedPrefs[subj.title] || doctors[0];

      const item = document.createElement("div");
      item.className =
        "p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2";

      const optionsHtml = doctors
        .map(
          (doc) =>
            `<option value="${doc}" ${doc === currentSelected ? "selected" : ""}>👨‍🏫 ${doc}</option>`,
        )
        .join("");

      item.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-base">${subj.icon || "📘"}</span>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title="${subj.title}">${subj.title}</span>
                </div>
                <select data-subjid="${subj.id}" data-subjtitle="${subj.title}" class="instructor-doc-select settings-input w-full p-2 rounded-xl text-xs font-semibold appearance-none cursor-pointer">
                    ${optionsHtml}
                </select>
            `;

      instructorSubjectsList.appendChild(item);
    });

    // Add event listeners to doctor selectors
    instructorSubjectsList
      .querySelectorAll(".instructor-doc-select")
      .forEach((selectEl) => {
        selectEl.addEventListener("change", (e) => {
          const id = e.target.dataset.subjid;
          const title = e.target.dataset.subjtitle;
          const selectedDoc = e.target.value;

          savedPrefs[id] = selectedDoc;
          savedPrefs[title] = selectedDoc;
          localStorage.setItem(
            "soPreferredInstructors",
            JSON.stringify(savedPrefs),
          );
          showToast(
            "Instructor Preferred",
            `Set ${selectedDoc} as favorite for ${title}.`,
            "success",
          );
          if (typeof debouncedSyncToFirebase === "function")
            debouncedSyncToFirebase();
        });
      });
  }

  if (prefInstructorExpandBtn && instructorAccordion) {
    prefInstructorExpandBtn.addEventListener("click", () => {
      const isHidden = instructorAccordion.classList.contains("hidden");
      if (isHidden) {
        instructorAccordion.classList.remove("hidden");
        if (prefInstructorChevron)
          prefInstructorChevron.classList.add("rotate-180");
        renderInstructorAccordion();
      } else {
        instructorAccordion.classList.add("hidden");
        if (prefInstructorChevron)
          prefInstructorChevron.classList.remove("rotate-180");
      }
    });
  }

  // Re-render accordion if department changes
  if (deptInput) {
    deptInput.addEventListener("change", () => {
      if (
        instructorAccordion &&
        !instructorAccordion.classList.contains("hidden")
      ) {
        renderInstructorAccordion();
      }
    });
  }

  // ── 10. Image Upload & Removal ───────────────────────────────────────────────
  if (uploadInput) {
    uploadInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          currentImage = uploadEvent.target.result;
          renderAvatar(currentTheme, currentImage);
          showToast(
            "Photo Updated",
            "Click Save Changes to persist your new picture.",
          );
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      currentImage = null;
      if (uploadInput) uploadInput.value = "";
      renderAvatar(currentTheme, currentImage);
      showToast("Photo Removed", "Default gradient avatar restored.");
    });
  }

  // ── 11. Google Account Linking ───────────────────────────────────────────────
  if (linkGoogleBtn) {
    linkGoogleBtn.addEventListener("click", async () => {
      const originalBtnContent = linkGoogleBtn.innerHTML;
      linkGoogleBtn.disabled = true;
      linkGoogleBtn.style.opacity = "0.75";
      linkGoogleBtn.innerHTML = `
                <svg class="animate-spin w-4 h-4 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span>Connecting...</span>
            `;

      try {
        const result = await signInWithGoogle();
        const user = result.user;

        currentEmail = user.email || "";
        currentUID = user.uid;
        authProvider = "google";

        localStorage.setItem("subjectsOnlineEmail", currentEmail);
        localStorage.setItem("subjectsOnlineUID", currentUID);
        localStorage.setItem("subjectsOnlineAuthProvider", "google");
        localStorage.setItem("subjectsOnlinePhotoURL", user.photoURL || "");

        if (!currentImage && user.photoURL) {
          currentImage = user.photoURL;
          localStorage.setItem("subjectsOnlineAvatarImage", currentImage);
        }

        if (typeof syncFromFirebase === "function") {
          await syncFromFirebase(user.uid);
        }

        if (!nameInput.value.trim() && user.displayName) {
          nameInput.value = user.displayName;
          if (displayName) displayName.textContent = user.displayName;
        }

        renderAvatar(currentTheme, currentImage);
        renderAccountStatus();
        showToast(
          "Google Account Linked! 🎉",
          "Your profile and study tools are now synced to the cloud.",
          "success",
        );
      } catch (err) {
        console.error("Account linking failed:", err);
        let errMessage = "Failed to link Google account.";
        if (err.code === "auth/popup-closed-by-user")
          errMessage = "Popup was closed.";
        showToast("Connection Error", errMessage, "error");
      } finally {
        linkGoogleBtn.disabled = false;
        linkGoogleBtn.style.opacity = "1";
        linkGoogleBtn.innerHTML = originalBtnContent;
      }
    });
  }

  // ── 12. Copy UID Functionality ──────────────────────────────────────────────
  if (copyUidBtn) {
    copyUidBtn.addEventListener("click", () => {
      const uidToCopy =
        currentUID || (uidDisplay ? uidDisplay.textContent : "");
      if (uidToCopy) {
        navigator.clipboard.writeText(uidToCopy).then(() => {
          showToast(
            "UID Copied",
            "Account identifier copied to clipboard.",
            "success",
          );
        });
      }
    });
  }

  // ── 13. TOOL: Grade & Final Target Calculator ────────────────────────────────
  const calcMidterm = document.getElementById("calc-midterm");
  const calcCoursework = document.getElementById("calc-coursework");
  const calcTarget = document.getElementById("calc-target-grade");
  const calcScoreEl = document.getElementById("calc-needed-score");
  const calcBadgeEl = document.getElementById("calc-difficulty-badge");

  function calculateFinalTarget() {
    if (!calcMidterm || !calcCoursework || !calcTarget || !calcScoreEl) return;

    const midterm = parseFloat(calcMidterm.value) || 0;
    const coursework = parseFloat(calcCoursework.value) || 0;
    const targetTotal = parseFloat(calcTarget.value) || 85;

    const currentEarned = midterm + coursework; // out of 30
    const needed = targetTotal - currentEarned; // needed out of 70

    if (needed <= 0) {
      calcScoreEl.textContent = "0 / 70 (Secured! 🎉)";
      calcBadgeEl.className =
        "px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300";
      calcBadgeEl.textContent = "Guaranteed Target!";
    } else if (needed > 70) {
      calcScoreEl.textContent = `${needed.toFixed(1)} / 70 (Over Max)`;
      calcBadgeEl.className =
        "px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300";
      calcBadgeEl.textContent = "Needs Extra Credit";
    } else {
      calcScoreEl.textContent = `${Math.ceil(needed)} / 70`;
      if (needed <= 45) {
        calcBadgeEl.className =
          "px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300";
        calcBadgeEl.textContent = "Very Achievable";
      } else if (needed <= 58) {
        calcBadgeEl.className =
          "px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300";
        calcBadgeEl.textContent = "Moderate Effort";
      } else {
        calcBadgeEl.className =
          "px-3 py-1 rounded-xl text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300";
        calcBadgeEl.textContent = "High Focus Needed";
      }
    }
  }

  [calcMidterm, calcCoursework, calcTarget].forEach((el) => {
    if (el) el.addEventListener("input", calculateFinalTarget);
  });
  calculateFinalTarget();

  // ── 14. TOOL: Study Scratchpad ───────────────────────────────────────────────
  const scratchpad = document.getElementById("scratchpad-textarea");
  const scratchpadStatus = document.getElementById("scratchpad-status");
  const scratchpadCopy = document.getElementById("scratchpad-copy-btn");
  const scratchpadClear = document.getElementById("scratchpad-clear-btn");

  if (scratchpad) {
    scratchpad.value = localStorage.getItem("soScratchpadNotes") || "";

    let scratchDebounce = null;
    scratchpad.addEventListener("input", () => {
      if (scratchpadStatus) scratchpadStatus.textContent = "Saving...";
      clearTimeout(scratchDebounce);
      scratchDebounce = setTimeout(() => {
        localStorage.setItem("soScratchpadNotes", scratchpad.value);
        if (scratchpadStatus) scratchpadStatus.textContent = "Auto-saved ✓";
        if (typeof debouncedSyncToFirebase === "function")
          debouncedSyncToFirebase();
      }, 600);
    });

    if (scratchpadCopy) {
      scratchpadCopy.addEventListener("click", () => {
        navigator.clipboard.writeText(scratchpad.value).then(() => {
          showToast(
            "Scratchpad Copied",
            "Notes copied to clipboard.",
            "success",
          );
        });
      });
    }

    if (scratchpadClear) {
      scratchpadClear.addEventListener("click", () => {
        if (confirm("Clear all scratchpad notes?")) {
          scratchpad.value = "";
          localStorage.removeItem("soScratchpadNotes");
          if (scratchpadStatus) scratchpadStatus.textContent = "Cleared";
          showToast("Cleared", "Scratchpad is now empty.");
        }
      });
    }
  }

  // ── 15. TOOL: Custom Bookmarks & Resources Manager ───────────────────────────
  const bmTitleInput = document.getElementById("bm-title");
  const bmUrlInput = document.getElementById("bm-url");
  const bmAddBtn = document.getElementById("bm-add-btn");
  const bmListEl = document.getElementById("bookmarks-list");

  let customBookmarks = [];
  try {
    customBookmarks = JSON.parse(
      localStorage.getItem("soCustomBookmarks") || "[]",
    );
  } catch {
    customBookmarks = [];
  }

  if (customBookmarks.length === 0) {
    customBookmarks = [
      {
        id: 1,
        title: "Faculty Drive & Lecture Files",
        url: "https://drive.google.com",
      },
      {
        id: 2,
        title: "Department WhatsApp Group",
        url: "https://chat.whatsapp.com/BmUhhJti1rWFKQHWGpQSL1?s=cl&p=a&mlu=4",
      },
    ];
  }

  function renderBookmarks() {
    if (!bmListEl) return;
    bmListEl.innerHTML = "";

    if (customBookmarks.length === 0) {
      bmListEl.innerHTML = `<p class="text-xs text-slate-400 py-3 text-center">No custom links saved yet. Add your favorite Drive or video link above.</p>`;
      return;
    }

    customBookmarks.forEach((bm, idx) => {
      const item = document.createElement("div");
      item.className =
        "flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 group";
      item.innerHTML = `
                <a href="${bm.url}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2.5 truncate flex-1 hover:text-sky-500 transition-colors">
                    <span class="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${bm.title}</span>
                    <span class="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">↗ ${bm.url.replace(/^https?:\/\//, "")}</span>
                </a>
                <button type="button" class="bm-delete-btn text-slate-400 hover:text-rose-500 p-1 transition-colors" data-idx="${idx}" title="Delete Bookmark">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
      bmListEl.appendChild(item);
    });

    // Delete buttons
    bmListEl.querySelectorAll(".bm-delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.idx);
        customBookmarks.splice(index, 1);
        localStorage.setItem(
          "soCustomBookmarks",
          JSON.stringify(customBookmarks),
        );
        renderBookmarks();
        if (typeof debouncedSyncToFirebase === "function")
          debouncedSyncToFirebase();
      });
    });
  }

  if (bmAddBtn && bmTitleInput && bmUrlInput) {
    bmAddBtn.addEventListener("click", () => {
      const title = bmTitleInput.value.trim();
      let url = bmUrlInput.value.trim();

      if (!title || !url) {
        showToast(
          "Missing Fields",
          "Please enter a title and URL for the link.",
          "error",
        );
        return;
      }

      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      customBookmarks.unshift({ id: Date.now(), title, url });
      localStorage.setItem(
        "soCustomBookmarks",
        JSON.stringify(customBookmarks),
      );
      bmTitleInput.value = "";
      bmUrlInput.value = "";
      renderBookmarks();
      showToast(
        "Bookmark Added",
        "Saved to your permanent student resources.",
        "success",
      );
      if (typeof debouncedSyncToFirebase === "function")
        debouncedSyncToFirebase();
    });
  }

  renderBookmarks();

  // ── 16. TOOL: Custom Weekly Schedule Builder ────────────────────────────────
  const scheduleBtn = document.getElementById("schedule-generate-btn");
  const scheduleOut = document.getElementById("schedule-output");
  const scheduleBuilderContainer = document.getElementById(
    "schedule-builder-container",
  );

  const sampleSubjectsByDept = {
    Accounting: [
      "Financial Accounting III",
      "Cost & Management Accounting",
      "Auditing & Control",
      "Tax Accounting",
      "Business Law",
    ],
    "Business Administration": [
      "Strategic Management",
      "Marketing Analytics",
      "Operations Research",
      "HR Management",
      "Corporate Finance",
    ],
    Economics: [
      "Macroeconomics Analysis",
      "International Trade",
      "Public Finance",
      "Econometrics",
      "Monetary Policy",
    ],
    Statistics: [
      "Applied Linear Models",
      "Probability Theory II",
      "Statistical Computing",
      "Demography",
      "Sample Survey Design",
    ],
    "Financial & Customs Studies": [
      "Customs Valuation",
      "International Logistics",
      "Financial Markets",
      "Tariff Systems",
      "Trade Finance",
    ],
  };

  function getDefaultScheduleConfig() {
    return [
      {
        dayKey: "sat",
        dayTitle: "Saturday",
        tasks: [{ subject: "Nothing", objective: "Nothing" }],
      },
      {
        dayKey: "sun",
        dayTitle: "Sunday",
        tasks: [{ subject: "Nothing", objective: "Nothing" }],
      },
      {
        dayKey: "mon",
        dayTitle: "Monday",
        tasks: [{ subject: "Nothing", objective: "Nothing" }],
      },
      {
        dayKey: "tue",
        dayTitle: "Tuesday",
        tasks: [{ subject: "Nothing", objective: "Nothing" }],
      },
      {
        dayKey: "wed",
        dayTitle: "Wednesday",
        tasks: [{ subject: "Nothing", objective: "Nothing" }],
      },
      {
        dayKey: "thu",
        dayTitle: "Thursday",
        tasks: [{ subject: "Nothing", objective: "Nothing" }],
      },
      {
        dayKey: "fri",
        dayTitle: "Friday",
        tasks: [{ subject: "Nothing", objective: "Nothing" }],
      },
    ];
  }

  let scheduleConfig = [];
  try {
    scheduleConfig = JSON.parse(
      localStorage.getItem("soWeeklyScheduleConfig") || "[]",
    );
  } catch {
    scheduleConfig = [];
  }

  if (!Array.isArray(scheduleConfig) || scheduleConfig.length === 0) {
    scheduleConfig = getDefaultScheduleConfig();
  }

  const commonGeneralOptions = [
    "Nothing",
    "Revision & Catchup",
    "Question Bank Practice",
    "Mock Quiz & Test Prep",
    "Rest & Weekly Recap",
  ];

  const presetObjectives = [
    "Nothing",
    "2 Lectures & Sheet",
    "1 Lecture & Summary",
    "2 Sections & Practice",
    "Case Study & Review",
    "Weekly Quiz Prep",
    "Review Incomplete Tasks",
    "Light Flashcards Review",
  ];

  function renderScheduleBuilder() {
    if (!scheduleBuilderContainer) return;
    const dept = deptInput ? deptInput.value : currentDept;
    const deptSubjects =
      sampleSubjectsByDept[dept] || sampleSubjectsByDept["Accounting"];
    const allSelectableSubjects = [...deptSubjects, ...commonGeneralOptions];

    scheduleBuilderContainer.innerHTML = "";

    scheduleConfig.forEach((dayObj, dayIdx) => {
      const card = document.createElement("div");
      card.className =
        "p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-3";

      let tasksHtml = "";
      dayObj.tasks.forEach((task, taskIdx) => {
        const isCustomSubj = !allSelectableSubjects.includes(task.subject);
        const isCustomObj = !presetObjectives.includes(task.objective);

        // Build Subject Options
        let subjOptionsHtml = deptSubjects
          .map(
            (s) =>
              `<option value="${s}" ${task.subject === s ? "selected" : ""}>📘 ${s}</option>`,
          )
          .join("");
        subjOptionsHtml += `<optgroup label="General Tasks">`;
        subjOptionsHtml += commonGeneralOptions
          .map(
            (s) =>
              `<option value="${s}" ${task.subject === s ? "selected" : ""}>⚡ ${s}</option>`,
          )
          .join("");
        subjOptionsHtml += `</optgroup>`;
        subjOptionsHtml += `<option value="__CUSTOM__" ${isCustomSubj ? "selected" : ""}>✍️ Custom Subject...</option>`;

        // Build Objective Options
        let objOptionsHtml = presetObjectives
          .map(
            (o) =>
              `<option value="${o}" ${task.objective === o ? "selected" : ""}>🎯 ${o}</option>`,
          )
          .join("");
        objOptionsHtml += `<option value="__CUSTOM__" ${isCustomObj ? "selected" : ""}>✍️ Custom Objective...</option>`;

        tasksHtml += `
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 task-row" data-day="${dayIdx}" data-task="${taskIdx}">
                        <!-- Subject Selector -->
                        <div class="flex-1 space-y-1">
                            <select class="task-subject-select settings-input w-full p-2.5 rounded-xl text-xs font-bold appearance-none cursor-pointer">
                                ${subjOptionsHtml}
                            </select>
                            <input type="text" value="${isCustomSubj ? task.subject : ""}" placeholder="Enter Custom Subject (in English)" class="task-subject-custom settings-input w-full p-2 rounded-xl text-xs font-semibold ${isCustomSubj ? "" : "hidden"}">
                        </div>

                        <!-- Objective Selector -->
                        <div class="flex-1 space-y-1">
                            <select class="task-objective-select settings-input w-full p-2.5 rounded-xl text-xs font-semibold appearance-none cursor-pointer">
                                ${objOptionsHtml}
                            </select>
                            <input type="text" value="${isCustomObj ? task.objective : ""}" placeholder="Enter Custom Objective" class="task-objective-custom settings-input w-full p-2 rounded-xl text-xs font-medium ${isCustomObj ? "" : "hidden"}">
                        </div>

                        ${
                          dayObj.tasks.length > 1
                            ? `
                            <button type="button" class="remove-task-btn p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 transition-colors flex items-center justify-center flex-shrink-0" data-day="${dayIdx}" data-task="${taskIdx}" title="Remove Task">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        `
                            : ""
                        }
                    </div>
                `;
      });

      card.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="font-heading font-bold text-xs text-slate-800 dark:text-slate-200">${dayObj.dayTitle}</span>
                    <button type="button" class="add-task-btn text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1" data-day="${dayIdx}">
                        <span>+ Add Subject to this Day</span>
                    </button>
                </div>
                <div class="space-y-2.5">
                    ${tasksHtml}
                </div>
            `;

      scheduleBuilderContainer.appendChild(card);
    });

    // Add event listeners to toggle custom inputs on dropdown change
    scheduleBuilderContainer
      .querySelectorAll(".task-subject-select")
      .forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const customInput = e.target.parentElement.querySelector(
            ".task-subject-custom",
          );
          if (customInput) {
            if (e.target.value === "__CUSTOM__")
              customInput.classList.remove("hidden");
            else customInput.classList.add("hidden");
          }
        });
      });

    scheduleBuilderContainer
      .querySelectorAll(".task-objective-select")
      .forEach((sel) => {
        sel.addEventListener("change", (e) => {
          const customInput = e.target.parentElement.querySelector(
            ".task-objective-custom",
          );
          if (customInput) {
            if (e.target.value === "__CUSTOM__")
              customInput.classList.remove("hidden");
            else customInput.classList.add("hidden");
          }
        });
      });

    // Event listener for + Add Task button
    scheduleBuilderContainer
      .querySelectorAll(".add-task-btn")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const dayIdx = parseInt(btn.dataset.day);
          const dept = deptInput ? deptInput.value : currentDept;
          const subs =
            sampleSubjectsByDept[dept] || sampleSubjectsByDept["Accounting"];
          const nextSubj =
            subs[scheduleConfig[dayIdx].tasks.length % subs.length] ||
            "Revision & Catchup";
          scheduleConfig[dayIdx].tasks.push({
            subject: nextSubj,
            objective: "1 Lecture & Summary",
          });
          renderScheduleBuilder();
        });
      });

    // Event listener for Remove Task button
    scheduleBuilderContainer
      .querySelectorAll(".remove-task-btn")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const dayIdx = parseInt(btn.dataset.day);
          const taskIdx = parseInt(btn.dataset.task);
          scheduleConfig[dayIdx].tasks.splice(taskIdx, 1);
          renderScheduleBuilder();
        });
      });
  }

  function syncScheduleConfigFromInputs() {
    if (!scheduleBuilderContainer) return;
    scheduleBuilderContainer.querySelectorAll(".task-row").forEach((row) => {
      const dayIdx = parseInt(row.dataset.day);
      const taskIdx = parseInt(row.dataset.task);
      const subjSelect = row.querySelector(".task-subject-select");
      const subjCustom = row.querySelector(".task-subject-custom");
      const objSelect = row.querySelector(".task-objective-select");
      const objCustom = row.querySelector(".task-objective-custom");

      if (scheduleConfig[dayIdx] && scheduleConfig[dayIdx].tasks[taskIdx]) {
        if (subjSelect) {
          if (subjSelect.value === "__CUSTOM__") {
            scheduleConfig[dayIdx].tasks[taskIdx].subject =
              subjCustom && subjCustom.value.trim()
                ? subjCustom.value.trim()
                : "Custom Task";
          } else {
            scheduleConfig[dayIdx].tasks[taskIdx].subject = subjSelect.value;
          }
        }

        if (objSelect) {
          if (objSelect.value === "__CUSTOM__") {
            scheduleConfig[dayIdx].tasks[taskIdx].objective =
              objCustom && objCustom.value.trim()
                ? objCustom.value.trim()
                : "Study Objective";
          } else {
            scheduleConfig[dayIdx].tasks[taskIdx].objective = objSelect.value;
          }
        }
      }
    });
  }

  function renderOutputTimetableTable() {
    if (!scheduleOut) return;
    syncScheduleConfigFromInputs();
    localStorage.setItem(
      "soWeeklyScheduleConfig",
      JSON.stringify(scheduleConfig),
    );

    let completedMap = {};
    try {
      completedMap = JSON.parse(
        localStorage.getItem("soWeeklyScheduleStatus") || "{}",
      );
    } catch {
      completedMap = {};
    }

    let html = `
            <div class="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden text-xs">
                <table class="w-full text-left">
                    <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                        <tr>
                            <th class="p-3">Day</th>
                            <th class="p-3">Assigned Subjects</th>
                            <th class="p-3">Target Objectives</th>
                            <th class="p-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200/60 dark:divide-slate-700/60">
        `;

    scheduleConfig.forEach((dayObj, dIdx) => {
      const subjectsList = dayObj.tasks
        .map(
          (t) =>
            `<span class="px-2 py-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold block mb-1 hover:scale-105 transition-transform inline-block mr-1">${t.subject}</span>`,
        )
        .join("");
      const objectivesList = dayObj.tasks
        .map(
          (t) =>
            `<span class="block mb-1 text-slate-600 dark:text-slate-400">• ${t.objective}</span>`,
        )
        .join("");

      const isDone = !!completedMap[`day_${dIdx}`];

      html += `
                <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="p-3 font-bold text-slate-800 dark:text-slate-200 align-top">${dayObj.dayTitle}</td>
                    <td class="p-3 align-top">${subjectsList}</td>
                    <td class="p-3 align-top">${objectivesList}</td>
                    <td class="p-3 text-center align-top">
                        <input type="checkbox" data-daykey="day_${dIdx}" class="sched-task-checkbox rounded text-indigo-500 focus:ring-indigo-400 cursor-pointer w-4 h-4" ${isDone ? "checked" : ""}>
                    </td>
                </tr>
            `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        `;

    scheduleOut.innerHTML = html;

    // Add checkbox persistence
    scheduleOut.querySelectorAll(".sched-task-checkbox").forEach((chk) => {
      chk.addEventListener("change", (e) => {
        const key = e.target.dataset.daykey;
        completedMap[key] = e.target.checked;
        localStorage.setItem(
          "soWeeklyScheduleStatus",
          JSON.stringify(completedMap),
        );
        if (typeof debouncedSyncToFirebase === "function")
          debouncedSyncToFirebase();
      });
    });
  }

  renderScheduleBuilder();
  renderOutputTimetableTable();

  if (scheduleBtn) {
    scheduleBtn.addEventListener("click", () => {
      renderOutputTimetableTable();
      showToast(
        "Schedule Saved",
        "Custom weekly study timetable generated & saved.",
        "success",
      );
      if (typeof debouncedSyncToFirebase === "function")
        debouncedSyncToFirebase();
    });
  }

  const scheduleClearChecksBtn = document.getElementById(
    "schedule-clear-checks-btn",
  );
  if (scheduleClearChecksBtn) {
    scheduleClearChecksBtn.addEventListener("click", () => {
      localStorage.removeItem("soWeeklyScheduleStatus");
      renderOutputTimetableTable();
      showToast(
        "Checkmarks Reset",
        "All weekly task checkmarks cleared for a new week.",
        "success",
      );
      if (typeof debouncedSyncToFirebase === "function")
        debouncedSyncToFirebase();
    });
  }

  const scheduleResetAllBtn = document.getElementById("schedule-reset-all-btn");
  if (scheduleResetAllBtn) {
    scheduleResetAllBtn.addEventListener("click", () => {
      if (confirm("Reset full schedule back to default empty state?")) {
        localStorage.removeItem("soWeeklyScheduleConfig");
        localStorage.removeItem("soWeeklyScheduleStatus");

        scheduleConfig = getDefaultScheduleConfig();

        renderScheduleBuilder();
        renderOutputTimetableTable();
        showToast(
          "Schedule Reset",
          "Entire timetable reset back to initial state.",
          "success",
        );
        if (typeof debouncedSyncToFirebase === "function")
          debouncedSyncToFirebase();
      }
    });
  }

  // ── 17. TOOL: Quiz & Pack Launchers ──────────────────────────────────────────
  const quizLaunchBtn = document.getElementById("quiz-launch-btn");
  if (quizLaunchBtn) {
    quizLaunchBtn.addEventListener("click", () => {
      const subject = document.getElementById("quiz-launch-subject").value;
      window.location.href = `quizzes.html?subject=${encodeURIComponent(subject)}&mode=rapid`;
    });
  }

  const packOpenBtn = document.getElementById("pack-open-btn");
  if (packOpenBtn) {
    packOpenBtn.addEventListener("click", () => {
      const packTarget = document.getElementById("pack-subject-select").value;
      window.location.href = packTarget;
    });
  }

  // ── 18. Save Profile & All Preferences ───────────────────────────────────────
  function saveProfileChanges() {
    const newName = nameInput.value.trim();
    const newDept = deptInput.value;

    if (!newName) {
      nameInput.focus();
      showToast(
        "Name Required",
        "Please enter your name before saving.",
        "error",
      );
      return;
    }

    // Save Basic Profile
    localStorage.setItem("subjectsOnlineName", newName);
    localStorage.setItem("subjectsOnlineDept", newDept);
    localStorage.setItem("subjectsOnlineAvatarTheme", currentTheme);

    if (currentImage) {
      localStorage.setItem("subjectsOnlineAvatarImage", currentImage);
    } else {
      localStorage.removeItem("subjectsOnlineAvatarImage");
    }

    // Save Preferences
    localStorage.setItem("soSemester", currentSemester);
    localStorage.setItem("soDailyTarget", dailyTarget);
    localStorage.setItem("soPlaybackSpeed", playbackSpeed);
    localStorage.setItem("soVideoQuality", videoQuality);
    localStorage.setItem("soSeekDuration", seekDuration);
    localStorage.setItem("soReadingFontSize", readingFont);
    localStorage.setItem("soPdfOpenMode", pdfMode);

    const selectedLanding =
      landingPageSelect && landingPageSelect.value
        ? landingPageSelect.value
        : localStorage.getItem("soLandingPage") || "dashboard.html";
    localStorage.setItem("soLandingPage", selectedLanding);
    if (selectedLanding !== "dashboard.html") {
      sessionStorage.setItem("soCustomLandingTriggered", "true");
    }
    if (viewDensitySelect)
      localStorage.setItem("soViewDensity", viewDensitySelect.value);
    if (progressStyleSelect)
      localStorage.setItem("soProgressStyle", progressStyleSelect.value);

    localStorage.setItem(
      "soAutoplayNext",
      autoplayToggle ? autoplayToggle.checked.toString() : "true",
    );
    localStorage.setItem(
      "soSoundEffects",
      soundsToggle ? soundsToggle.checked.toString() : "true",
    );
    localStorage.setItem(
      "soAutoSaveNotes",
      autoSaveNotesToggle ? autoSaveNotesToggle.checked.toString() : "true",
    );
    localStorage.setItem(
      "soShortcutsEnabled",
      shortcutsToggle ? shortcutsToggle.checked.toString() : "true",
    );
    localStorage.setItem(
      "soHideCompleted",
      hideCompletedToggle ? hideCompletedToggle.checked.toString() : "false",
    );
    localStorage.setItem(
      "soInstructorPriority",
      instructorToggle ? instructorToggle.checked.toString() : "true",
    );
    localStorage.setItem(
      "soReduceMotion",
      motionToggle ? motionToggle.checked.toString() : "false",
    );

    // Cloud sync trigger
    if (typeof debouncedSyncToFirebase === "function") {
      debouncedSyncToFirebase();
    }

    // Keep Admin User Registry in sync with profile edits
    if (typeof recordUserInRegistry === "function") {
      recordUserInRegistry({
        name: newName,
        dept: newDept,
        photoURL: currentImage || "",
        uid: currentUID,
      });
    }

    showToast(
      "Settings Saved Successfully!",
      `Redirecting to ${selectedLanding.replace(".html", "")}...`,
      "success",
    );

    setTimeout(() => {
      window.location.href = selectedLanding;
    }, 1000);
  }

  if (saveProfileBtn)
    saveProfileBtn.addEventListener("click", saveProfileChanges);
  if (form)
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      saveProfileChanges();
    });

  // ── 19. Toast Notification Helper ───────────────────────────────────────────
  let toastTimeout = null;
  function showToast(title, desc, type = "success") {
    if (!toastEl) return;
    clearTimeout(toastTimeout);

    if (toastTitle) toastTitle.textContent = title;
    if (toastDesc) toastDesc.textContent = desc;

    if (toastIconWrapper) {
      if (type === "error") {
        toastIconWrapper.className =
          "w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center flex-shrink-0";
        toastIconWrapper.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
      } else {
        toastIconWrapper.className =
          "w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center flex-shrink-0";
        toastIconWrapper.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
      }
    }

    toastEl.classList.add("show");
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 3500);
  }

  // ── 20. Sign Out Operation ──────────────────────────────────────────────────
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (typeof signOutUser === "function") {
        signOutUser("index.html");
      } else {
        localStorage.removeItem("subjectsOnlineName");
        localStorage.removeItem("subjectsOnlineDept");
        localStorage.removeItem("subjectsOnlineAvatarTheme");
        localStorage.removeItem("subjectsOnlineAvatarImage");
        localStorage.removeItem("subjectsOnlineUID");
        localStorage.removeItem("subjectsOnlineAuthProvider");
        localStorage.removeItem("subjectsOnlineEmail");
        localStorage.removeItem("subjectsOnlinePhotoURL");
        localStorage.removeItem("soPlannerTasks");
        window.location.href = "index.html";
      }
    });
  }

  // ── 21. Entrance GSAP Animation ─────────────────────────────────────────────
  if (typeof gsap !== "undefined") {
    gsap.fromTo(
      ".settings-card",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: "power3.out" },
    );
  }
});
