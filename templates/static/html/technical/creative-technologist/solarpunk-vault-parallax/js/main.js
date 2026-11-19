/* ============================================================
   SOLARPUNK SUMMIT 2027 — interactions
   GSAP + ScrollTrigger parallax, wheel, horn, dialog, stars
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------------------------------------------------------
     smooth scroll for in-page links (works without CSS support)
     --------------------------------------------------------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      closeMenu();
    });
  });

  /* ---------------------------------------------------------
     logo menu
     --------------------------------------------------------- */
  const logoBtn = $("#logoBtn");
  const logoMenu = $("#logoMenu");
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    logoMenu.classList.add("is-open");
    logoBtn.setAttribute("aria-expanded", "true");
    if (hasGSAP && !reduceMotion) {
      gsap.fromTo(
        $$(".menu-link", logoMenu),
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.045, ease: "power3.out", overwrite: true }
      );
    }
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    logoMenu.classList.remove("is-open");
    logoBtn.setAttribute("aria-expanded", "false");
  }
  logoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menuOpen ? closeMenu() : openMenu();
  });
  document.addEventListener("click", (e) => {
    if (menuOpen && !logoMenu.contains(e.target) && !logoBtn.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------------------------------------------------------
     apply dialog
     --------------------------------------------------------- */
  const dialog = $("#applyDialog");
  let lastFocus = null;

  function openDialog() {
    lastFocus = document.activeElement;
    dialog.hidden = false;
    requestAnimationFrame(() => dialog.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    closeMenu();
    $("#dialogClose").focus({ preventScroll: true });
  }
  function closeDialog() {
    dialog.classList.remove("is-open");
    document.body.style.overflow = "";
    window.setTimeout(() => {
      dialog.hidden = true;
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }, 280);
  }
  ["#applyHero", "#applyTop", "#applyFaq", "#menuApply"].forEach((sel) => {
    const el = $(sel);
    if (el) el.addEventListener("click", (e) => {
      e.preventDefault();
      openDialog();
    });
  });
  $("#dialogClose").addEventListener("click", closeDialog);
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeDialog();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) closeDialog();
  });

  /* ---------------------------------------------------------
     hero intro
     --------------------------------------------------------- */
  if (hasGSAP && !reduceMotion) {
    const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro
      .from(".sky", { scale: 1.12, opacity: 0, duration: 1.6 })
      .from(".layer-skyline", { opacity: 0, y: 30, duration: 1.2 }, 0.1)
      .from(".layer-tower-a", { y: 90, opacity: 0, duration: 1.3 }, 0.15)
      .from(".layer-tower-dome", { y: 90, opacity: 0, duration: 1.3 }, 0.22)
      .from(".layer-dish", { y: 60, opacity: 0, duration: 1.2 }, 0.35)
      .from(".fg-rock", { scale: 1.06, opacity: 0, duration: 1.4 }, 0.2)
      .from(".mascot", { y: 60, scale: 0.82, opacity: 0, duration: 1.15, ease: "back.out(1.6)" }, 0.5)
      .from(".pill", { scale: 0.6, opacity: 0, duration: 0.6, ease: "back.out(2.2)" }, 1.05)
      .from(".wordmark", { opacity: 0, y: 24, letterSpacing: "0.8em", duration: 1.4 }, 0.8)
      .from(".hero-sub", { opacity: 0, y: 14, duration: 0.9 }, 1.15)
      .from("#dateRock", { yPercent: 62, opacity: 0, duration: 1.3, ease: "power3.out" }, 0.9)
      .from(".date-rock-copy > *", { opacity: 0, y: 18, duration: 0.8, stagger: 0.1 }, 1.35)
      .from(".scroll-cue", { opacity: 0, duration: 0.8 }, 1.6);
  }

  /* ---------------------------------------------------------
     scroll parallax
     --------------------------------------------------------- */
  if (hasST && !reduceMotion) {
    $$("[data-speed]").forEach((el) => {
      const speed = parseFloat(el.dataset.speed) || 0.2;
      const scene = el.closest(".scene") || el;
      gsap.fromTo(
        el,
        { y: () => -speed * 110 },
        {
          y: () => speed * 150,
          ease: "none",
          scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: 1 },
        }
      );
    });

    // ---- pinned cave: the sealed door splits like a closet, then we fly through ----
    const DOOR_TRAVEL = 232; // svg units: just past the door radius clears the aperture
    const vaultTL = gsap.timeline({
      scrollTrigger: {
        trigger: "#cave",
        start: "top top",
        end: "+=320%",
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        onUpdate: (self) => {
          const hint = $(".vault-hint");
          if (hint) hint.style.opacity = String(clamp(1.4 - self.progress * 5, 0, 1));
        },
      },
    });

    vaultTL
      // the copy steps aside before the camera starts moving
      .to("#vaultCopy", { opacity: 0, y: -34, ease: "none", duration: 1.0 }, 0)
      // slow push toward the sealed door
      .fromTo("#portal", { scale: 1 }, { scale: 1.16, ease: "none", duration: 2.4 }, 0)
      // the city inside the aperture hangs back a little (depth)
      .fromTo("#cityPlate", { scale: 1.14, transformOrigin: "50% 50%" }, { scale: 0.95, ease: "none", duration: 6.4 }, 0.6)
      .to("#doorLabel", { opacity: 0, ease: "none", duration: 1.2 }, 1.6)
      // the seal breaks: the halves slide apart like pocket doors
      .to("#doorL", { x: -DOOR_TRAVEL, ease: "power2.inOut", duration: 4.0 }, 2.5)
      .to("#doorR", { x: DOOR_TRAVEL, ease: "power2.inOut", duration: 4.0 }, 2.5)
      // the falls part to either side of the widening gap
      .to("#veilL", { x: -72, opacity: 0.16, ease: "power1.out", duration: 3.2 }, 2.8)
      .to("#veilR", { x: 72, opacity: 0.16, ease: "power1.out", duration: 3.2 }, 2.8)
      // keep drifting in while the gap widens
      .to("#portal", { scale: 1.72, ease: "none", duration: 3.8 }, 2.4)
      // then push straight through the rock arch into the sunlit city
      .to("#portal", { scale: 3.0, ease: "power2.in", duration: 3.0 }, 6.4)
      .to(".cave-bg img", { scale: 1.16, ease: "none", duration: 5.0 }, 4.0)
      .fromTo("#cityZoom", { opacity: 0 }, { opacity: 1, ease: "none", duration: 1.5 }, 8.0)
      .fromTo("#cityZoom .city-plate", { scale: 1.0 }, { scale: 1.06, ease: "none", duration: 2.6 }, 8.0)
      .to("#portal", { opacity: 0, ease: "none", duration: 1.0 }, 8.9)
      .to({}, { duration: 0.5 }); // settle before the pin releases into the city

    // hero exit: the date rock rises over the ground, mascot floats up
    gsap.to("#dateRock", {
      yPercent: -46,
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1 },
    });
    gsap.to(".mascot", {
      yPercent: -58,
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1 },
    });
    gsap.to(".hero-copy", {
      yPercent: 40, opacity: 0,
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "55% top", scrub: 1 },
    });

    // hologram beam breathes with the scroll
    gsap.fromTo(".beam", { opacity: 0.25 }, {
      opacity: 0.75,
      ease: "none",
      scrollTrigger: { trigger: "#about", start: "top bottom", end: "center center", scrub: 1 },
    });
  }

  /* ---------------------------------------------------------
     reveals
     --------------------------------------------------------- */
  if (hasGSAP && !reduceMotion) {
    $$(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%", once: true },
      });
    });
  } else {
    $$(".reveal").forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
  }

  /* ---------------------------------------------------------
     pointer parallax in the hero (desktop only)
     --------------------------------------------------------- */
  if (hasGSAP && !reduceMotion && window.matchMedia("(pointer:fine)").matches) {
    const hero = $("#hero");
    const targets = [
      [".sky", 10],
      [".layer-skyline", 16],
      [".layer-tower-a", 24],
      [".layer-tower-dome", 26],
      [".layer-dish", 34],
      [".mascot", 14],
      [".fg-rock--l", 44],
      [".fg-rock--r", 40],
    ].map(([sel, depth]) => {
      const el = $(sel);
      return el ? { el, depth, setX: gsap.quickTo(el, "x", { duration: 0.8, ease: "power2.out" }) } : null;
    }).filter(Boolean);

    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      targets.forEach((t) => t.setX(nx * -t.depth));
    });
    hero.addEventListener("pointerleave", () => targets.forEach((t) => t.setX(0)));
  }

  /* ---------------------------------------------------------
     car horn (Web Audio) + bounce
     --------------------------------------------------------- */
  const car = $("#car");
  const honkLines = $("#honkLines");
  let audioCtx = null;

  function horn() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const now = audioCtx.currentTime;
      const master = audioCtx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
      master.gain.setValueAtTime(0.22, now + 0.33);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
      master.connect(audioCtx.destination);

      // a slightly detuned two-tone horn
      const pairs = [
        [415, 523.25],
        [466.16, 587.33],
      ];
      pairs.forEach(([a, b], i) => {
        const g = audioCtx.createGain();
        g.gain.value = i === 0 ? 1 : 0.55;
        g.connect(master);
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2100;
        filter.Q.value = 0.8;
        filter.connect(g);
        [a, b].forEach((freq) => {
          const osc = audioCtx.createOscillator();
          osc.type = "square";
          osc.frequency.value = freq;
          osc.detune.value = i === 0 ? -4 : 5;
          osc.connect(filter);
          osc.start(now);
          osc.stop(now + 0.58);
        });
      });
    } catch (err) {
      /* audio is a bonus, never a blocker */
    }
  }

  if (car) {
    car.addEventListener("click", () => {
      car.classList.remove("is-honking");
      void car.offsetWidth;
      car.classList.add("is-honking");
      horn();
      const ring = document.createElement("i");
      honkLines.appendChild(ring);
      window.setTimeout(() => ring.remove(), 1100);
    });
  }

  /* ---------------------------------------------------------
     emitter pulse
     --------------------------------------------------------- */
  const emitter = $("#emitter");
  const holoPanel = $(".holo-panel");
  if (emitter) {
    emitter.addEventListener("click", () => {
      holoPanel.classList.remove("is-flicker");
      void holoPanel.offsetWidth;
      holoPanel.classList.add("is-flicker");
    });
  }

  /* ---------------------------------------------------------
     billboard play
     --------------------------------------------------------- */
  const screen = $("#screen");
  const playBtn = $("#playBtn");
  const recBadge = $("#recBadge");
  const reel = $("#reel");
  if (playBtn && screen) {
    let playing = false;
    const setPlaying = (on) => {
      playing = on;
      screen.classList.toggle("is-playing", on);
      recBadge.classList.toggle("is-playing", on);
      recBadge.textContent = on ? "● NOW PLAYING" : "● RECAP '26";
      playBtn.setAttribute("aria-label", on ? "Pause the recap" : "Play the Solarpunk Summit 2026 recap");
      reel.style.opacity = on ? "0.92" : "1";
    };
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setPlaying(!playing);
    });
    screen.addEventListener("click", () => {
      if (playing) setPlaying(false);
    });
  }

  /* ---------------------------------------------------------
     stat counters
     --------------------------------------------------------- */
  function animateNumber(el) {
    const numEl = $(".stat-num", el);
    const target = parseFloat(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
    if (reduceMotion || !hasGSAP) {
      numEl.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        numEl.textContent = prefix + Math.round(obj.v).toLocaleString("en-US") + suffix;
      },
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  }
  $$(".stat").forEach((el) => {
    // prefix for the $1M+ badge
    if ($(".stat-num", el).textContent.includes("$")) el.dataset.prefix = "$";
    animateNumber(el);
  });

  /* ---------------------------------------------------------
     tracks wheel
     --------------------------------------------------------- */
  const TRACKS = [
    {
      name: "AI",
      desc: "Build systems that reason, generate and act. Language models, agents, multimodal tools, and the strange new products that only exist because a machine can think in sentences.",
      tags: ["LLMs", "Agents", "Multimodal"],
      hue: "#2fd1d6",
    },
    {
      name: "Cloud AI",
      desc: "Scale it. Training runs, inference fleets, data pipelines and the unglamorous infrastructure that makes a model usable by ten thousand people at once.",
      tags: ["Distributed", "Serving", "Infra"],
      hue: "#3bb9d8",
    },
    {
      name: "Edge AI",
      desc: "Put intelligence where the data is born: phones, drones, robots, sensors. Quantization, tiny models and latency budgets measured in milliseconds.",
      tags: ["On-device", "Robotics", "TinyML"],
      hue: "#57c9a8",
    },
    {
      name: "Education",
      desc: "Change how people learn. Tutors that adapt, tools for teachers, and interfaces that make hard ideas feel obvious for someone seeing them for the first time.",
      tags: ["Learning", "Access", "Tutors"],
      hue: "#9bd45a",
    },
    {
      name: "Healthcare",
      desc: "Software and hardware that make care better. Diagnostics, patient tools, bio-signals, and anything that gives a clinician ten minutes back.",
      tags: ["Diagnostics", "Bio", "Care"],
      hue: "#5fd0c2",
    },
    {
      name: "Flourishing",
      desc: "Technology for a life well lived — community, creativity, mental health, and the systems that help people actually thrive instead of just stay online.",
      tags: ["Wellbeing", "Community", "Craft"],
      hue: "#a9d95f",
    },
    {
      name: "Inference",
      desc: "Squeeze latency, cost and energy out of models. Kernels, quantization, caching, speculative decoding — the millisecond work that decides whether an idea ships.",
      tags: ["Kernels", "Optimization", "GPU"],
      hue: "#46c8e0",
    },
    {
      name: "Sustainability",
      desc: "Build for the planet. Energy, climate data, circular hardware and tools that make the sustainable choice the easy one for people and companies.",
      tags: ["Climate", "Energy", "Hardware"],
      hue: "#7cc845",
    },
  ];

  const wheel = $("#wheel");
  const SVG_NS = "http://www.w3.org/2000/svg";
  let wheelRotate = null;
  let activeIndex = 0;
  let hoverLockUntil = 0;
  const wheelLabels = [];
  const wheelState = { r: 0 };

  function polar(cx, cy, r, angleDeg) {
    const a = (angleDeg - 90) * (Math.PI / 180);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function slicePath(cx, cy, r0, r1, a0, a1) {
    const [x0, y0] = polar(cx, cy, r1, a0);
    const [x1, y1] = polar(cx, cy, r1, a1);
    const [x2, y2] = polar(cx, cy, r0, a1);
    const [x3, y3] = polar(cx, cy, r0, a0);
    const large = a1 - a0 > 180 ? 1 : 0;
    return [
      `M${x0.toFixed(2)},${y0.toFixed(2)}`,
      `A${r1},${r1} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`,
      `L${x2.toFixed(2)},${y2.toFixed(2)}`,
      `A${r0},${r0} 0 ${large} 0 ${x3.toFixed(2)},${y3.toFixed(2)}`,
      "Z",
    ].join(" ");
  }

  function buildWheel() {
    if (!wheel) return;
    const C = 320;
    const r0 = 118;
    const r1 = 288;
    const gap = 1.4;

    const defs = document.createElementNS(SVG_NS, "defs");
    defs.innerHTML = `
      <radialGradient id="w-base" cx="50%" cy="50%" r="50%">
        <stop offset="55%" stop-color="#08323d"/>
        <stop offset="100%" stop-color="#0c4c58"/>
      </radialGradient>
      <linearGradient id="w-active" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#c9f96a"/>
        <stop offset="55%" stop-color="#8ff2e6"/>
        <stop offset="100%" stop-color="#4fd7dd"/>
      </linearGradient>
      <radialGradient id="w-ring" cx="50%" cy="50%" r="50%">
        <stop offset="82%" stop-color="rgba(127,240,242,0)"/>
        <stop offset="88%" stop-color="rgba(127,240,242,.28)"/>
        <stop offset="100%" stop-color="rgba(127,240,242,0)"/>
      </radialGradient>`;
    wheel.appendChild(defs);

    wheelRotate = document.createElementNS(SVG_NS, "g");
    wheelRotate.setAttribute("id", "wheelRotate");
    wheel.appendChild(wheelRotate);

    const step = 360 / TRACKS.length;
    TRACKS.forEach((t, i) => {
      const a0 = i * step + gap / 2;
      const a1 = (i + 1) * step - gap / 2;
      const mid = i * step + step / 2;

      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "slice");
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", `${t.name} track`);
      g.dataset.index = i;

      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", slicePath(C, C, r0, r1, a0, a1));
      p.setAttribute("class", "base");
      p.setAttribute("fill", "url(#w-base)");
      p.setAttribute("stroke", "rgba(160,255,252,.22)");
      p.setAttribute("stroke-width", "1");
      p.setAttribute("opacity", i === 0 ? "1" : ".82");
      g.appendChild(p);

      // subtle inner highlight for every slice
      const hi = document.createElementNS(SVG_NS, "path");
      hi.setAttribute("d", slicePath(C, C, r1 - 34, r1 - 4, a0 + 1.2, a1 - 1.2));
      hi.setAttribute("class", "hi");
      hi.setAttribute("fill", t.hue);
      hi.setAttribute("opacity", ".1");
      g.appendChild(hi);

      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("text-anchor", "middle");
      const [tx, ty] = polar(C, C, (r0 + r1) / 2, mid);
      text.setAttribute("x", tx.toFixed(1));
      text.setAttribute("y", ty.toFixed(1));
      text.setAttribute("dominant-baseline", "middle");
      text.textContent = t.name.toUpperCase();
      g.appendChild(text);
      wheelLabels.push({ el: text, tx: tx.toFixed(1), ty: ty.toFixed(1) });

      // small tick + dot
      const [dx, dy] = polar(C, C, r0 - 18, mid);
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", dx.toFixed(1));
      dot.setAttribute("cy", dy.toFixed(1));
      dot.setAttribute("r", "3");
      dot.setAttribute("fill", t.hue);
      dot.setAttribute("opacity", ".85");
      g.appendChild(dot);

      const activate = () => {
        if (Date.now() < hoverLockUntil) return;
        selectTrack(i, false);
      };
      const lock = () => selectTrack(i, true);

      g.addEventListener("mouseenter", activate);
      g.addEventListener("focus", activate);
      g.addEventListener("click", lock);
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          lock();
        }
      });

      wheelRotate.appendChild(g);
    });

    // decorative rings
    const ring = document.createElementNS(SVG_NS, "circle");
    ring.setAttribute("cx", C);
    ring.setAttribute("cy", C);
    ring.setAttribute("r", (r1 + 22).toFixed(0));
    ring.setAttribute("fill", "url(#w-ring)");
    ring.setAttribute("pointer-events", "none");
    wheel.appendChild(ring);

    applyWheelRotation(0);
    selectTrack(0, true, true);
  }

  const trackIndexEl = $("#trackIndex");
  const trackNameEl = $("#trackName");
  const trackDescEl = $("#trackDesc");
  const trackTagsEl = $("#trackTags");

  function applyWheelRotation(deg) {
    if (!wheelRotate) return;
    const r = deg.toFixed(3);
    wheelRotate.setAttribute("transform", `rotate(${r} 320 320)`);
    wheelLabels.forEach(({ el, tx, ty }) => {
      el.setAttribute("transform", `rotate(${(-deg).toFixed(3)} ${tx} ${ty})`);
    });
  }

  function renderTrack(i) {
    const t = TRACKS[i];
    if (!t) return;
    if (trackIndexEl) trackIndexEl.textContent = String(i + 1).padStart(2, "0") + " / 08";
    if (trackNameEl) trackNameEl.textContent = t.name;
    if (trackDescEl) trackDescEl.textContent = t.desc;
    if (trackTagsEl) trackTagsEl.innerHTML = t.tags.map((tag) => `<span>${tag}</span>`).join("");
  }

  function selectTrack(i, lock, immediate) {
    if (!TRACKS[i]) return;
    activeIndex = i;
    $$(".slice", wheel).forEach((g, idx) => {
      const p = g.querySelector("path");
      const isActive = idx === i;
      g.classList.toggle("is-active", isActive);
      p.setAttribute("fill", isActive ? "url(#w-active)" : "url(#w-base)");
      p.setAttribute("opacity", isActive ? "1" : ".78");
    });

    if (lock && wheelRotate) {
      hoverLockUntil = Date.now() + 850;
      const step = 360 / TRACKS.length;
      const mid = i * step + step / 2;
      let target = -mid;
      while (target - wheelState.r > 180) target -= 360;
      while (target - wheelState.r < -180) target += 360;
      if (reduceMotion || !hasGSAP) {
        wheelState.r = target;
        applyWheelRotation(target);
      } else {
        gsap.to(wheelState, {
          r: target,
          duration: 0.9,
          ease: "power3.inOut",
          overwrite: true,
          onUpdate: () => applyWheelRotation(wheelState.r),
        });
      }
    }

    if (immediate || reduceMotion || !hasGSAP) {
      renderTrack(i);
      return;
    }
    const panel = $(".track-panel");
    gsap.fromTo(
      [trackNameEl, trackDescEl, trackTagsEl],
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: "power2.out", overwrite: true }
    );
    renderTrack(i);
    if (panel) {
      gsap.fromTo(panel, { borderColor: "rgba(200,255,150,.55)" }, { borderColor: "rgba(140,255,250,.2)", duration: 1 });
    }
  }

  buildWheel();

  /* ---------------------------------------------------------
     FAQ accordion
     --------------------------------------------------------- */
  const faqItems = $$(".faq-item");
  faqItems.forEach((item) => {
    const btn = $(".faq-q", item);
    const panel = $(".faq-a", item);
    const setOpen = (open) => {
      item.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      if (hasGSAP && !reduceMotion) {
        gsap.to(panel, {
          height: open ? "auto" : 0,
          duration: 0.5,
          ease: open ? "power3.out" : "power2.inOut",
          onComplete: () => hasST && ScrollTrigger.refresh(),
        });
      } else {
        panel.style.height = open ? "auto" : "0px";
      }
    };
    setOpen(item.classList.contains("is-open"));
    btn.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) {
          other.classList.remove("is-open");
          $(".faq-q", other).setAttribute("aria-expanded", "false");
          $(".faq-a", other).setAttribute("aria-hidden", "true");
          const p = $(".faq-a", other);
          if (hasGSAP && !reduceMotion) gsap.to(p, { height: 0, duration: 0.4, ease: "power2.inOut" });
          else p.style.height = "0px";
        }
      });
      setOpen(willOpen);
    });
  });

  /* ---------------------------------------------------------
     dot rail
     --------------------------------------------------------- */
  const sections = ["hero", "about", "showcase", "cave", "tracks", "faq", "footer"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          $$(".dot").forEach((d) => d.classList.toggle("is-active", d.dataset.dot === id));
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
  }

  /* ---------------------------------------------------------
     stars
     --------------------------------------------------------- */
  const canvas = $("#stars");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let raf = null;
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let visible = false;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      const count = clamp(Math.round((rect.width * rect.height) / 9000), 90, 380);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.82,
        r: (Math.random() * 1.5 + 0.4) * dpr,
        base: Math.random() * 0.5 + 0.25,
        speed: Math.random() * 1.6 + 0.4,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    let shoot = null;
    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = t / 1000;
      stars.forEach((s) => {
        const tw = reduceMotion ? s.base : s.base + Math.sin(time * s.speed + s.phase) * 0.28;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,255,252,${clamp(tw, 0.05, 0.95).toFixed(3)})`;
        ctx.fill();
        if (s.r > 1.5 * dpr) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(140,240,240,${(tw * 0.07).toFixed(3)})`;
          ctx.fill();
        }
      });

      if (!reduceMotion) {
        if (!shoot && Math.random() < 0.004) {
          shoot = {
            x: canvas.width * (0.15 + Math.random() * 0.6),
            y: canvas.height * (0.05 + Math.random() * 0.3),
            vx: (3 + Math.random() * 3) * dpr,
            vy: (1.2 + Math.random() * 1.4) * dpr,
            life: 1,
          };
        }
        if (shoot) {
          shoot.x += shoot.vx;
          shoot.y += shoot.vy;
          shoot.life -= 0.012;
          const grad = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 14, shoot.y - shoot.vy * 14);
          grad.addColorStop(0, `rgba(220,255,250,${clamp(shoot.life, 0, 1)})`);
          grad.addColorStop(1, "rgba(140,240,240,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6 * dpr;
          ctx.beginPath();
          ctx.moveTo(shoot.x, shoot.y);
          ctx.lineTo(shoot.x - shoot.vx * 14, shoot.y - shoot.vy * 14);
          ctx.stroke();
          if (shoot.life <= 0) shoot = null;
        }
      }
      if (visible) raf = requestAnimationFrame(draw);
    }

    function start() {
      if (raf) return;
      raf = requestAnimationFrame(draw);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    resize();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            visible = e.isIntersecting;
            if (visible) start();
            else stop();
          });
        },
        { threshold: 0.05 }
      ).observe(canvas);
    } else {
      visible = true;
      start();
    }
    window.addEventListener("resize", () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      resize();
    });
  }

  /* ---------------------------------------------------------
     keep ScrollTrigger honest after fonts/images settle
     --------------------------------------------------------- */
  window.addEventListener("load", () => {
    if (hasST) ScrollTrigger.refresh();
  });
  if (hasST && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
