/* ===================================================
   SUBJECTS ONLINE — Welcome Page Animations
   GSAP + Lenis Integration
   =================================================== */

gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  initNavbarScroll();
  initHeroAnimations();

  // Wait for Lenis to load async from CDN before setting up ScrollTrigger
  function startScrollAnimations() {
    if (window._lenis) {
      ScrollTrigger.scrollerProxy(document.documentElement, {
        scrollTop(value) {
          return arguments.length
            ? window._lenis.scrollTo(value, { immediate: true })
            : window._lenis.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
      });
      window._lenis.on("scroll", ScrollTrigger.update);
    }
    initFeatureScroll();
    initMouseParallax();
    initPreviewAnimation();
  }

  setTimeout(startScrollAnimations, 700);
});

/* --------------------------------------------------
   Navbar: shrink on scroll
-------------------------------------------------- */
function initNavbarScroll() {
  const header = document.getElementById("site-header");
  if (!header) return;

  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("scrolled", window.scrollY > 40);
    },
    { passive: true },
  );
}

/* --------------------------------------------------
   Hero entrance animation
-------------------------------------------------- */
function initHeroAnimations() {
  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  // Navbar
  tl.fromTo(
    "#site-header",
    { y: -24, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, clearProps: "transform" },
    0.1,
  );

  // Eyebrow
  tl.fromTo(
    "#hero-eyebrow",
    { y: 16, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, clearProps: "transform" },
    0.3,
  );

  // Title words slide up from clipped container
  tl.to(
    ".hero-title-word",
    {
      y: "0%",
      duration: 1.1,
      stagger: 0.13,
      ease: "power4.out",
    },
    0.5,
  );

  // Subtitle
  tl.fromTo(
    "#hero-subtitle",
    { y: 18, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, clearProps: "transform" },
    1.0,
  );

  // CTAs
  tl.fromTo(
    "#hero-actions",
    { y: 14, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.85, clearProps: "transform" },
    1.2,
  );

  // Social proof
  tl.fromTo(
    "#hero-proof",
    { y: 12, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.8, clearProps: "transform" },
    1.4,
  );

  // Hero visual (right column)
  tl.fromTo(
    "#hero-visual",
    { x: 40, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      duration: 1.2,
      ease: "power3.out",
      clearProps: "transform",
    },
    0.55,
  );

  // Scroll hint
  tl.to(
    "#scroll-hint",
    {
      opacity: 1,
      duration: 0.8,
    },
    2.0,
  );
}

/* --------------------------------------------------
   Feature rows ScrollTrigger
-------------------------------------------------- */
function initFeatureScroll() {
  const rows = gsap.utils.toArray(".feature-row");

  rows.forEach((row) => {
    const visual = row.querySelector(".feature-visual");
    const text = row.querySelector(".feature-text");
    const isRev = row.classList.contains("reverse");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: row,
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });

    if (visual) {
      tl.fromTo(
        visual,
        { x: isRev ? 50 : -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.1, ease: "power3.out" },
        0,
      );
    }

    if (text) {
      tl.fromTo(
        Array.from(text.children),
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.09, ease: "power3.out" },
        0.15,
      );
    }
  });

  // Stats strip
  gsap.fromTo(
    ".stat-item",
    { y: 20, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      stagger: 0.1,
      duration: 0.7,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".stats-strip",
        start: "top 88%",
        toggleActions: "play none none reverse",
      },
    },
  );

  // CTA block
  gsap.fromTo(
    ".cta-block",
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 1.1,
      ease: "expo.out",
      scrollTrigger: {
        trigger: ".cta-block",
        start: "top 88%",
        toggleActions: "play none none reverse",
      },
    },
  );
}

/* --------------------------------------------------
   Animated Preview Mockup Loop
-------------------------------------------------- */
function initPreviewAnimation() {
  // 1. Initial progress bars for screen 1
  const fills = document.querySelectorAll(".subject-progress-fill");
  fills.forEach((f) => (f.style.width = "0"));

  // Only start if elements exist
  const cursor = document.getElementById("fake-cursor");
  const ripple = document.getElementById("cursor-ripple");
  if (!cursor) return;

  // Master Timeline, repeats infinitely
  const tl = gsap.timeline({
    repeat: -1,
    repeatDelay: 2, // Wait 2s before looping
    scrollTrigger: {
      trigger: "#hero-visual",
      start: "top 80%",
    },
  });

  // Reset initial states at start of loop
  tl.set("#screen-subjects", { x: "0%" })
    .set("#screen-detail", { x: "100%" })
    .set("#mini-progress-fill", { width: "0%" })
    .set("#mini-time", { textContent: "00:00" })
    .set(cursor, { opacity: 0, x: 30, y: 40 })
    .set(ripple, { scale: 0, opacity: 0 })
    // Animate subject bars initially
    .to(
      fills,
      {
        width: (i, target) => (target.dataset.pct || 50) + "%",
        duration: 1,
        ease: "power3.out",
        stagger: 0.1,
      },
      0.2,
    );

  // --- Sequence Starts ---

  // 1. Cursor enters and moves to subject 1
  tl.to(cursor, { opacity: 1, duration: 0.3 }, 1.5).to(
    cursor,
    {
      x: 180,
      y: 85, // Approx coordinates of first subject card
      duration: 1.2,
      ease: "power2.inOut",
    },
    "<",
  );

  // 2. Cursor clicks subject 1
  tl.to(cursor, { scale: 0.9, duration: 0.1 }, "+=0.2")
    .to(
      ripple,
      {
        scale: 3,
        opacity: 1,
        duration: 0.3,
        onStart: () =>
          gsap.to(ripple, { opacity: 0, delay: 0.2, duration: 0.2 }),
      },
      "<",
    )
    .to(cursor, { scale: 1, duration: 0.1 });

  // 3. Screen transition (Slide 1 out, Slide 2 in)
  tl.to(
    "#screen-subjects",
    { x: "-100%", duration: 0.7, ease: "power3.inOut" },
    "+=0.2",
  )
    .to("#screen-detail", { x: "0%", duration: 0.7, ease: "power3.inOut" }, "<")
    .to(
      "#topbar-title",
      {
        opacity: 0,
        duration: 0.3,
        onComplete: () =>
          (document.getElementById("topbar-title").innerText =
            "Business Administration"),
      },
      "<",
    )
    .to("#topbar-title", { opacity: 1, duration: 0.3 }, "+=0.1");

  // 4. Cursor moves to "Play" button on Chapter 2
  tl.to(
    cursor,
    {
      x: 45,
      y: 145, // Approx coordinates of chapter 2 play button
      duration: 1,
      ease: "power2.inOut",
    },
    "+=0.5",
  );

  // 5. Cursor clicks Play
  tl.to(cursor, { scale: 0.9, duration: 0.1 }, "+=0.2")
    .to(
      ripple,
      {
        scale: 3,
        opacity: 1,
        duration: 0.3,
        onStart: () =>
          gsap.to(ripple, { opacity: 0, delay: 0.2, duration: 0.2 }),
      },
      "<",
    )
    .to(cursor, { scale: 1, duration: 0.1 });

  // 6. Cursor moves out of the way
  tl.to(
    cursor,
    {
      x: 220,
      y: 240,
      duration: 1.2,
      ease: "power2.inOut",
    },
    "+=0.2",
  );

  // 7. Video Progress bar fills up (simulating playback)
  tl.to(
    "#mini-progress-fill",
    {
      width: "100%",
      duration: 4,
      ease: "none",
    },
    "<",
  ).to(
    "#mini-time",
    {
      textContent: "45:00",
      duration: 4,
      ease: "none",
      snap: { textContent: 1 },
      onUpdate: function () {
        // Format time nicely
        const val = Math.round(this.targets()[0].textContent);
        const m = Math.floor(val);
        const s = Math.floor((this.progress() * 45 * 60) % 60);
        this.targets()[0].textContent = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
      },
    },
    "<",
  );

  // 8. Cursor moves to "Back" button
  tl.to(
    cursor,
    {
      x: 30,
      y: 25, // Approx coordinates of back button
      duration: 0.8,
      ease: "power2.inOut",
    },
    "+=0.5",
  );

  // 9. Cursor clicks Back
  tl.to(cursor, { scale: 0.9, duration: 0.1 }, "+=0.2")
    .to(
      ripple,
      {
        scale: 3,
        opacity: 1,
        duration: 0.3,
        onStart: () =>
          gsap.to(ripple, { opacity: 0, delay: 0.2, duration: 0.2 }),
      },
      "<",
    )
    .to(cursor, { scale: 1, duration: 0.1 });

  // 10. Screen transition (Slide 2 out, Slide 1 in)
  tl.to(
    "#screen-detail",
    { x: "100%", duration: 0.7, ease: "power3.inOut" },
    "+=0.2",
  )
    .to(
      "#screen-subjects",
      { x: "0%", duration: 0.7, ease: "power3.inOut" },
      "<",
    )
    .to(
      "#topbar-title",
      {
        opacity: 0,
        duration: 0.3,
        onComplete: () =>
          (document.getElementById("topbar-title").innerText =
            "My Subjects — Spring 2026"),
      },
      "<",
    )
    .to("#topbar-title", { opacity: 1, duration: 0.3 }, "+=0.1");

  // 11. Cursor fades out before loop restarts
  tl.to(cursor, { opacity: 0, duration: 0.4 }, "+=0.5");
}

/* --------------------------------------------------
   Mouse Parallax — desktop only
-------------------------------------------------- */
function initMouseParallax() {
  const floatElems = document.querySelectorAll(".float-elem");
  if (window.innerWidth < 900) return;

  let mouseX = 0,
    mouseY = 0,
    rafId = null;

  document.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!rafId) rafId = requestAnimationFrame(applyParallax);
  });

  function applyParallax() {
    rafId = null;
    floatElems.forEach((el) => {
      const s = parseFloat(el.getAttribute("data-speed")) || 1;
      gsap.to(el, {
        x: mouseX * 22 * s,
        y: mouseY * 22 * s,
        duration: 2.2,
        ease: "power2.out",
      });
    });
  }
}
