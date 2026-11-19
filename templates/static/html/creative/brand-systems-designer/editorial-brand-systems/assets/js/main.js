/* =========================================================
   BRAND STUDIO — interaction layer
   GSAP 3 + ScrollTrigger + ScrollToPlugin (vendored locally)
   ========================================================= */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var hasGSAP = typeof window.gsap !== "undefined";
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  if (hasGSAP && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }
  if (hasGSAP && window.ScrollToPlugin) {
    gsap.registerPlugin(window.ScrollToPlugin);
  }

  /* ---------------------------------------------------------
     header state
     --------------------------------------------------------- */
  var header = doc.getElementById("siteHeader");

  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------------------------------------------------------
     mobile menu
     --------------------------------------------------------- */
  var menuToggle = doc.getElementById("menuToggle");
  var mobileMenu = doc.getElementById("mobileMenu");

  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    body.classList.toggle("is-locked", open);
    if (menuToggle) menuToggle.setAttribute("aria-expanded", String(open));
    if (menuToggle) menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (mobileMenu) mobileMenu.setAttribute("aria-hidden", String(!open));
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      setMenu(!body.classList.contains("menu-open"));
    });
  }
  if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ---------------------------------------------------------
     smooth anchor scrolling
     --------------------------------------------------------- */
  var headerHeight = function () {
    return header ? header.getBoundingClientRect().height : 0;
  };

  function scrollToTarget(target) {
    if (!target) return;
    var top = target === doc.body ? 0 : target.getBoundingClientRect().top + window.scrollY;
    var offset = target.id === "home" ? 0 : headerHeight() - 6;
    var y = Math.max(0, top - offset);

    if (hasGSAP && window.ScrollToPlugin && !reduceMotion) {
      gsap.to(window, { duration: 1.05, scrollTo: { y: y, autoKill: true }, ease: "power2.inOut" });
    } else {
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  doc.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var hash = link.getAttribute("href");
      if (!hash || hash === "#") {
        e.preventDefault();
        return;
      }
      var target = doc.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target);
      history.replaceState(null, "", hash);
    });
  });

  /* ---------------------------------------------------------
     contact modal
     --------------------------------------------------------- */
  var modal = doc.getElementById("contactModal");
  var formState = doc.getElementById("modalFormState");
  var successState = doc.getElementById("modalSuccessState");
  var contactForm = doc.getElementById("contactForm");
  var lastFocused = null;

  function openModal() {
    if (!modal) return;
    lastFocused = doc.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("is-locked");
    if (successState) successState.hidden = true;
    if (formState) formState.hidden = false;
    window.setTimeout(function () {
      var first = modal.querySelector("#cf-name");
      if (first) first.focus();
    }, 220);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    body.classList.remove("is-locked");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  doc.querySelectorAll("[data-open-contact]").forEach(function (btn) {
    btn.addEventListener("click", openModal);
  });
  doc.querySelectorAll("[data-close-contact]").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal && modal.classList.contains("is-open")) closeModal();
      if (body.classList.contains("menu-open")) setMenu(false);
    }
  });

  /* form validation + success state */
  function setError(input, message) {
    var field = input.closest(".field");
    var slot = doc.querySelector('[data-error-for="' + input.id + '"]');
    if (field) field.classList.toggle("has-error", Boolean(message));
    if (slot) slot.textContent = message || "";
  }

  if (contactForm) {
    contactForm.querySelectorAll("input, textarea").forEach(function (input) {
      input.addEventListener("input", function () { setError(input, ""); });
    });

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = doc.getElementById("cf-name");
      var email = doc.getElementById("cf-email");
      var message = doc.getElementById("cf-message");
      var valid = true;

      if (!name.value.trim()) { setError(name, "Please add your name."); valid = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        setError(email, "Please add a valid email address."); valid = false;
      }
      if (message.value.trim().length < 8) { setError(message, "Tell me a little more about the project."); valid = false; }

      if (!valid) {
        var firstError = contactForm.querySelector(".has-error input, .has-error textarea");
        if (firstError) firstError.focus();
        return;
      }

      if (formState) formState.hidden = true;
      if (successState) successState.hidden = false;
      contactForm.reset();
      if (hasGSAP && !reduceMotion && successState) {
        gsap.fromTo(successState, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" });
      }
    });
  }

  /* ---------------------------------------------------------
     reveal on scroll
     --------------------------------------------------------- */
  function initReveals() {
    if (!hasGSAP || !ScrollTrigger || reduceMotion) return;

    var items = gsap.utils.toArray(".reveal-up");
    items.forEach(function (el) {
      gsap.set(el, { autoAlpha: 0, y: 42 });
    });

    ScrollTrigger.batch(".reveal-up", {
      start: "top 88%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          overwrite: true
        });
      }
    });
  }

  /* ---------------------------------------------------------
     hero
     --------------------------------------------------------- */
  function initHero() {
    if (!hasGSAP || reduceMotion) return;

    var lines = gsap.utils.toArray('[data-hero="line"]');
    var tag = doc.querySelector('[data-hero="tag"]');
    var portrait = doc.querySelector('[data-hero="portrait"]');
    var name = doc.querySelector('[data-hero="name"]');
    var badge = doc.querySelector(".hero-badge");

    gsap.set(tag, { autoAlpha: 0, y: 14 });
    gsap.set(lines, { yPercent: 112 });
    gsap.set(portrait, { autoAlpha: 0, scale: 1.05, y: 26 });
    gsap.set(name, { autoAlpha: 0, yPercent: 26 });
    gsap.set(badge, { autoAlpha: 0, scale: 0.55 });

    var tl = gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } });

    tl.to(tag, { autoAlpha: 1, y: 0, duration: 0.7 })
      .to(lines, { yPercent: 0, duration: 1.05, stagger: 0.09 }, "-=0.35")
      .to(portrait, { autoAlpha: 1, scale: 1, y: 0, duration: 1.3, ease: "power2.out" }, "-=0.85")
      .to(name, { autoAlpha: 1, yPercent: 0, duration: 1.2, ease: "power3.out" }, "-=0.95")
      .to(badge, { autoAlpha: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" }, "-=0.55");

    /* slow ambient float on the badge */
    if (badge) {
      gsap.to(badge, {
        y: -8,
        duration: 3.4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 2.2
      });
    }

    /* scroll parallax */
    if (portrait) {
      gsap.to(portrait, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
    if (name) {
      gsap.to(name, {
        yPercent: -9,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
    var copy = doc.querySelector(".hero-copy");
    if (copy) {
      gsap.to(copy, {
        yPercent: -8,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
  }

  /* ---------------------------------------------------------
     statement — word-by-word tone shift
     --------------------------------------------------------- */
  function splitStatement() {
    var statement = doc.getElementById("statement");
    if (!statement) return [];

    var walker = doc.createTreeWalker(statement, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode);
    }

    textNodes.forEach(function (node) {
      var frag = doc.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) return;
        if (/^\s+$/.test(chunk)) {
          frag.appendChild(doc.createTextNode(" "));
        } else {
          var span = doc.createElement("span");
          span.className = "word";
          span.textContent = chunk;
          frag.appendChild(span);
        }
      });
      node.parentNode.replaceChild(frag, node);
    });

    if (!gsap) return [];
    return gsap.utils.toArray("#statement .word").filter(function (w) {
      return !w.closest(".statement__lead");
    });
  }

  function initStatement() {
    var words = splitStatement();
    if (!words.length || !hasGSAP || !ScrollTrigger || reduceMotion) return;

    gsap.fromTo(words, { color: "#dedede" }, {
      color: "#b7b7b7",
      ease: "none",
      stagger: 0.6,
      scrollTrigger: {
        trigger: "#statement",
        start: "top 82%",
        end: "bottom 45%",
        scrub: 0.8
      }
    });
  }

  /* ---------------------------------------------------------
     showreel — horizontal expansion on scroll
     --------------------------------------------------------- */
  function initReel() {
    var card = doc.getElementById("reelCard");
    if (!card || !hasGSAP || !ScrollTrigger) return;

    var play = card.querySelector(".reel-play");
    if (play) {
      play.addEventListener("click", function () {
        var el = card;
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(function () {
            el.classList.toggle("is-expanded");
          });
        } else {
          el.classList.toggle("is-expanded");
        }
        if (hasGSAP) {
          gsap.fromTo(el, { scale: 0.98 }, { scale: 1, duration: 0.6, ease: "power3.out" });
        }
      });
    }

    if (reduceMotion) return;

    var mm = gsap.matchMedia();
    mm.add("(min-width: 761px)", function () {
      gsap.fromTo(card, { width: "27%" }, {
        width: "58%",
        ease: "none",
        scrollTrigger: {
          trigger: ".reel",
          start: "top 78%",
          end: "bottom 45%",
          scrub: 0.6
        }
      });
    });
  }

  /* ---------------------------------------------------------
     process — line draw + steps
     --------------------------------------------------------- */
  function initProcess() {
    if (!hasGSAP || !ScrollTrigger || reduceMotion) return;

    var fill = doc.getElementById("processFill");
    if (fill) {
      gsap.to(fill, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".process-body",
          start: "top 72%",
          end: "bottom 68%",
          scrub: 0.5
        }
      });
    }

    gsap.utils.toArray(".step").forEach(function (step, i) {
      gsap.fromTo(step, { autoAlpha: 0, y: 46 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: (i % 2) * 0.08,
        scrollTrigger: { trigger: step, start: "top 86%", once: true }
      });
    });
  }

  /* ---------------------------------------------------------
     marquee
     --------------------------------------------------------- */
  function initMarquee() {
    var marquee = doc.getElementById("marquee");
    var track = doc.getElementById("marqueeTrack");
    if (!marquee || !track) return;

    track.innerHTML += track.innerHTML;
    track.setAttribute("aria-hidden", "false");

    if (!hasGSAP || reduceMotion) {
      marquee.style.overflowX = "auto";
      return;
    }

    var loop = gsap.to(track, {
      x: function () { return -track.scrollWidth / 2; },
      duration: 46,
      ease: "none",
      repeat: -1
    });

    marquee.addEventListener("mouseenter", function () {
      gsap.to(loop, { timeScale: 0.12, duration: 0.6, ease: "power2.out" });
    });
    marquee.addEventListener("mouseleave", function () {
      gsap.to(loop, { timeScale: 1, duration: 0.6, ease: "power2.out" });
    });

    /* nudge speed with scroll direction */
    if (ScrollTrigger) {
      var lastY = window.scrollY;
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: function (self) {
          var dy = self.scroll() - lastY;
          lastY = self.scroll();
          var speed = 1 + Math.min(Math.abs(dy) * 0.05, 3);
          gsap.to(loop, { timeScale: speed, duration: 0.3, overwrite: true });
          window.clearTimeout(self._settle);
          self._settle = window.setTimeout(function () {
            gsap.to(loop, { timeScale: 1, duration: 0.8 });
          }, 220);
        }
      });
    }
  }

  /* ---------------------------------------------------------
     big CTA
     --------------------------------------------------------- */
  function initBigCta() {
    if (!hasGSAP || !ScrollTrigger || reduceMotion) return;
    var title = doc.querySelector("[data-cta-title]");
    if (!title) return;

    gsap.fromTo(title, { yPercent: 18, scale: 0.96 }, {
      yPercent: -6,
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".big-cta",
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6
      }
    });
  }

  /* ---------------------------------------------------------
     FAQ accordion
     --------------------------------------------------------- */
  function initFaq() {
    var list = doc.getElementById("faqList");
    if (!list) return;

    var items = Array.prototype.slice.call(list.querySelectorAll(".faq-item"));

    items.forEach(function (item) {
      var btn = item.querySelector(".faq-q");
      var panel = item.querySelector(".faq-a");
      if (!btn || !panel) return;

      var isOpen = item.classList.contains("is-open");
      if (isOpen) {
        if (hasGSAP) gsap.set(panel, { height: "auto" });
        else panel.style.height = "auto";
      }

      btn.addEventListener("click", function () {
        var open = item.classList.contains("is-open");

        items.forEach(function (other) {
          if (other === item) return;
          if (!other.classList.contains("is-open")) return;
          var otherPanel = other.querySelector(".faq-a");
          var otherBtn = other.querySelector(".faq-q");
          other.classList.remove("is-open");
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
          if (hasGSAP) gsap.to(otherPanel, { height: 0, duration: 0.4, ease: "power2.inOut" });
          else otherPanel.style.height = "0px";
        });

        if (open) {
          item.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
          if (hasGSAP) gsap.to(panel, { height: 0, duration: 0.42, ease: "power2.inOut" });
          else panel.style.height = "0px";
        } else {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
          if (hasGSAP) {
            gsap.set(panel, { height: "auto" });
            var h = panel.offsetHeight;
            gsap.fromTo(panel, { height: 0 }, { height: h, duration: 0.5, ease: "power2.out", onComplete: function () { panel.style.height = "auto"; } });
          } else {
            panel.style.height = "auto";
          }
        }
      });
    });
  }

  /* ---------------------------------------------------------
     custom cursor (pointer devices only)
     --------------------------------------------------------- */
  function initCursor() {
    if (reduceMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches || !hasGSAP) return;

    var ring = doc.createElement("div");
    ring.className = "cursor-ring";
    ring.setAttribute("aria-hidden", "true");
    body.appendChild(ring);

    var xTo = gsap.quickTo(ring, "x", { duration: 0.42, ease: "power3.out" });
    var yTo = gsap.quickTo(ring, "y", { duration: 0.42, ease: "power3.out" });

    window.addEventListener("mousemove", function (e) {
      ring.classList.add("is-visible");
      xTo(e.clientX - ring.offsetWidth / 2);
      yTo(e.clientY - ring.offsetHeight / 2);
    }, { passive: true });

    doc.addEventListener("mouseleave", function () { ring.classList.remove("is-visible"); });

    doc.addEventListener("mouseover", function (e) {
      if (e.target.closest("a, button, .work-card, .faq-q, input, textarea, select")) {
        ring.classList.add("is-active");
      } else {
        ring.classList.remove("is-active");
      }
    });
  }

  /* ---------------------------------------------------------
     boot
     --------------------------------------------------------- */
  function boot() {
    initReveals();
    initHero();
    initStatement();
    initReel();
    initProcess();
    initMarquee();
    initBigCta();
    initFaq();
    initCursor();

    if (hasGSAP && ScrollTrigger) {
      window.addEventListener("load", function () { ScrollTrigger.refresh(); });
      /* late media (fonts) can shift layout */
      if (doc.fonts && doc.fonts.ready) {
        doc.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      }
    }
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
