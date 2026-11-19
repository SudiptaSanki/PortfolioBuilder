/*
 * Main site behaviour: native scrolling, scroll-triggered reveals,
 * hero parallax, one-time schematic draw and stat count-ups (GSAP ScrollTrigger).
 *
 * Safety rules (see README "Motion rules"):
 *  - Nothing is hidden by CSS. Elements are only set to their "from" state by
 *    this script, after the animation libraries have loaded successfully.
 *    No JS / missing libraries / reduced motion => everything simply visible.
 *  - prefers-reduced-motion disables smoothing and all animation.
 */
(function () {
  "use strict";

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var hasST = hasGsap && typeof window.ScrollTrigger !== "undefined";

  var header = document.getElementById("site-header");
  var headerH = header ? header.offsetHeight : 68;

  /* ---------- plain fallback: native anchors + reveal-on-scroll ---------- */

  function fallbackReveals() {
    var els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) return; // content is visible by default
    els.forEach(function (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(18px)";
      el.style.transition = "opacity .55s ease-out, transform .55s ease-out";
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.style.opacity = "1";
          e.target.style.transform = "none";
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  if (reduced || !hasGsap || !hasST) {
    if (!reduced) fallbackReveals();
    return; // static, fully readable page
  }

  /* ---------- full experience: GSAP on native scroll ---------- */

  gsap.registerPlugin(ScrollTrigger);

  // Lenis was removed on 2026-11-18: its easing replayed stale wheel input
  // as delayed self-scrolling. Scrolling is native and instant; GSAP's lag
  // smoothing stays at its defaults so a dropped frame never becomes a jump.
  gsap.ticker.lagSmoothing(500, 33);

  // Anchor navigation with sticky-header offset.
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      var y = target.getBoundingClientRect().top + window.scrollY - (headerH + 8);
      window.scrollTo({ top: y, behavior: "instant" });
      history.replaceState(null, "", id);
    });
  });

  // Header shadow once scrolled.
  ScrollTrigger.create({
    start: 40,
    onUpdate: function () {},
    onToggle: function (self) {
      if (header) header.classList.toggle("scrolled", self.isActive);
    }
  });

  // Reveals: gentle fade + small rise, light stagger inside each parent group.
  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    gsap.fromTo(el,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, duration: 0.55, ease: "power2.out",
        delay: Math.min((Array.prototype.indexOf.call(el.parentNode.children, el) % 4) * 0.06, 0.18),
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
  });

  // Hero parallax: a few percent of travel, subject stays framed.
  var heroImg = document.querySelector(".hero-parallax img");
  if (heroImg) {
    gsap.fromTo(heroImg, { yPercent: -3.5 }, {
      yPercent: 3.5, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  // Schematic: draw each stroke once on entry, then it stays still.
  var paths = document.querySelectorAll(".draw-path");
  paths.forEach(function (p) {
    var len = 300;
    try { len = p.getTotalLength(); } catch (e) { /* keep default */ }
    p.style.strokeDasharray = String(len);
    p.style.strokeDashoffset = String(len);
  });
  if (paths.length) {
    gsap.to(paths, {
      strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", stagger: 0.07,
      scrollTrigger: { trigger: ".schematic", start: "top 85%", once: true }
    });
  }

  // Stats: count up once on entry (final values are already in the HTML).
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var end = parseFloat(el.getAttribute("data-count"));
    if (!isFinite(end) || end === 0) return;
    var obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.2, ease: "power2.out",
      onUpdate: function () { el.textContent = String(Math.round(obj.v)); },
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });
})();
