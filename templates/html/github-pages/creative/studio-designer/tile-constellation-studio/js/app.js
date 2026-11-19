/* ==========================================================================
   Tile Constellation Visual Studio Studio — interaction layer
   Lenis smooth scroll + GSAP ScrollTrigger choreography for the wall story,
   typed headlines, work reveals, services ramp, custom cursor, film grain.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = typeof window.ScrollTrigger !== "undefined";
  if (hasGSAP && hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------------- typed marks */
  function typedSplit(el) {
    var text = el.getAttribute("data-typed") || el.textContent;
    el.textContent = "";
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.style.setProperty("--i", i);
      s.textContent = text[i] === " " ? "\u00A0" : text[i];
      frag.appendChild(s);
    }
    el.appendChild(frag);
  }
  document.querySelectorAll("[data-typed]").forEach(typedSplit);

  /* ---------------------------------------------------------------- lenis */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1 });
    if (hasGSAP && hasST) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* anchor links go through lenis when present */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------------------------------------------------------------- nav reveal + scroll hint */
  var nav = document.querySelector("[data-nav]");
  var hint = document.querySelector("[data-scroll-hint]");
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("is-shown", y > window.innerHeight * 0.9);
    if (hint) hint.classList.toggle("is-gone", y > 120);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------- story timeline */
  var story = document.querySelector("[data-story]");
  var stage = document.querySelector(".stage");
  var tiles = Array.prototype.slice.call(document.querySelectorAll("[data-tile]"));
  var headA = document.querySelector("[data-head-a]");
  var headB = document.querySelector("[data-head-b]");
  var about = document.querySelector("[data-about]");
  var portrait = document.querySelector("[data-portrait]");
  var tagline = document.querySelector("[data-tagline]");

  function prepLine(el) {
    var text = el.getAttribute("data-type") || "";
    el.textContent = "";
    var spans = [];
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.textContent = text[i];
      el.appendChild(s);
      spans.push(s);
    }
    return spans;
  }

  var aSpans = headA ? prepLine(headA.querySelector("[data-type]")) : [];
  var bSpans = [];
  if (headB) {
    headB.querySelectorAll("[data-type]").forEach(function (el) {
      bSpans = bSpans.concat(prepLine(el));
    });
  }
  var aboutOpenSpans = [];
  about.querySelectorAll("[data-type]").forEach(function (el) {
    aboutOpenSpans = aboutOpenSpans.concat(prepLine(el));
  });

  function stageBox() {
    var r = stage.getBoundingClientRect();
    return { w: r.width, h: r.height, left: r.left, top: r.top };
  }

  /* base centre of a tile inside the stage, taken from layout so that
     transforms applied by the timeline never feed back into the maths */
  function tileCentre(tile) {
    return {
      x: tile.offsetLeft + tile.offsetWidth / 2,
      y: tile.offsetTop + tile.offsetHeight / 2
    };
  }

  function scatterTarget(i, tile) {
    /* a loose 4-column constellation of blocks filling the right of the stage */
    var box = stageBox();
    var c = tileCentre(tile);
    var cols = 5;
    var col = i % cols;
    var row = Math.floor(i / cols);
    var rows = Math.ceil(tiles.length / cols);
    var x0 = box.w * 0.46, x1 = box.w * 0.96;
    var y0 = box.h * 0.05, y1 = box.h * 0.64;
    var tx = x0 + (x1 - x0) * (cols === 1 ? 0.5 : col / (cols - 1)) + ((i * 37) % 13 - 6);
    var ty = y0 + (y1 - y0) * (rows === 1 ? 0.5 : row / (rows - 1)) + ((i * 53) % 15 - 7);
    return {
      x: tx - c.x,
      y: ty - c.y,
      rotation: ((i * 47) % 40) - 20,
      scale: 0.33 + ((i * 17) % 10) / 100
    };
  }

  function ribbonTarget(i, tile) {
    var box = stageBox();
    var c = tileCentre(tile);
    var n = tiles.length;
    var x0 = box.w * 0.10, x1 = box.w * 0.90;
    var tx = x0 + (x1 - x0) * (n === 1 ? 0.5 : i / (n - 1));
    var arc = Math.sin((i / (n - 1)) * Math.PI) * box.h * 0.05;
    return {
      x: tx - c.x,
      y: box.h * 0.80 - arc - c.y,
      rotation: i % 2 === 0 ? -2.5 : 2.5,
      scale: 0.34
    };
  }

  function buildStory() {
    if (!hasGSAP || !hasST || !stage || reduceMotion) return;

    var aboutParas = about.querySelectorAll(".about__p");
    var aboutHead = about.querySelector(".about__head");

    var tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: story,
        start: "top top",
        end: "+=330%",
        scrub: 1,
        pin: stage,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    /* ---- phase 0: the wall holds, the tagline steps aside ---- */
    tl.to(tagline, { opacity: 0, y: 16, duration: 0.5 }, 0.15);

    /* ---- phase 1: blocks drift into a constellation, headline A types ---- */
    tl.set(headA, { visibility: "visible" }, 0.45)
      .to(headA, { opacity: 1, duration: 0.35 }, 0.45)
      .call(function () { headA.classList.add("is-typing"); }, null, 0.45);
    if (aSpans.length) {
      tl.to(aSpans, { opacity: 1, duration: 0.05, stagger: 1.55 / aSpans.length, ease: "none" }, 0.6);
    }

    tiles.forEach(function (tile, i) {
      tl.to(tile, {
        x: function () { return scatterTarget(i, tile).x; },
        y: function () { return scatterTarget(i, tile).y; },
        rotation: function () { return scatterTarget(i, tile).rotation; },
        scale: function () { return scatterTarget(i, tile).scale; },
        duration: 1.6
      }, 0.75 + i * 0.03);
      tl.to(tile.querySelector(".tile__letter"), { opacity: 0, duration: 0.4 }, 0.9 + i * 0.03);
    });

    /* ---- phase 2: A leaves, blocks settle into a low ribbon, B types ---- */
    tl.to(headA, { opacity: 0, y: -42, duration: 0.45 }, 2.55)
      .call(function () { headA.classList.remove("is-typing"); }, null, 2.75)
      .set(headB, { visibility: "visible" }, 2.9)
      .to(headB, { opacity: 1, duration: 0.35 }, 2.9)
      .call(function () { headB.classList.add("is-typing"); }, null, 3.0);

    tiles.forEach(function (tile, i) {
      tl.to(tile, {
        x: function () { return ribbonTarget(i, tile).x; },
        y: function () { return ribbonTarget(i, tile).y; },
        rotation: function () { return ribbonTarget(i, tile).rotation; },
        scale: function () { return ribbonTarget(i, tile).scale; },
        duration: 1.3
      }, 2.85 + i * 0.025);
    });

    if (bSpans.length) {
      tl.to(bSpans, { opacity: 1, duration: 0.05, stagger: 1.35 / bSpans.length, ease: "none" }, 3.25);
    }

    /* ---- phase 3: blocks dissolve, the portrait takes their place ---- */
    tiles.forEach(function (tile, i) {
      tl.to(tile, { opacity: 0, duration: 0.4 }, 4.15 + i * 0.015);
    });
    tl.set(portrait, { visibility: "visible" }, 4.4)
      .fromTo(portrait, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.65 }, 4.4);

    /* ---- phase 4: the about copy types in next to it ---- */
    tl.set(about, { visibility: "visible" }, 4.75)
      .to(about, { opacity: 1, duration: 0.45 }, 4.75);
    if (aboutOpenSpans.length) {
      tl.to(aboutOpenSpans, { opacity: 1, duration: 0.05, stagger: 0.85 / Math.max(aboutOpenSpans.length, 1), ease: "none" }, 4.9);
    }
    tl.to(aboutParas, { opacity: 1, duration: 0.35, stagger: 0.3 }, 5.6)
      .to(aboutHead, { opacity: 1, duration: 0.5 }, 6.3);

    /* ---- phase 5: hold the finished composition until the pin releases ---- */
    tl.to({}, { duration: 0.5 }, 7.0);

    return tl;
  }

  if (hasGSAP && hasST) {
    /* desktop / tablet-with-height gets the pinned story, small screens just stack */
    gsap.matchMedia().add("(min-width: 901px) and (min-height: 520px)", function () {
      var tl = buildStory();
      return function () {
        if (tl) { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); }
      };
    });
    gsap.matchMedia().add("(max-width: 900px)", function () {
      /* no pin on small screens: the story is an ordinary stack, so reveal the
         typed lines and paragraphs straight away */
      gsap.utils.toArray(".typeline span").forEach(function (s) { s.style.opacity = 1; });
      gsap.utils.toArray(".about__p").forEach(function (s) { s.style.opacity = 1; });
      return function () {};
    });
  } else {
    /* no animation library: show everything */
    [headA, headB, about, portrait].filter(Boolean).forEach(function (el) {
      el.style.opacity = 1;
      el.style.visibility = "visible";
    });
    document.querySelectorAll(".typeline span").forEach(function (s) { s.style.opacity = 1; });
  }

  /* ---------------------------------------------------------------- reveals */
  function reveal(el, opts) {
    if (!hasGSAP || !hasST || reduceMotion) {
      el.style.opacity = 1;
      el.style.transform = "none";
      return;
    }
    gsap.fromTo(el,
      { opacity: 0, y: 34 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      }
    );
  }
  document.querySelectorAll("[data-reveal]").forEach(function (el) { reveal(el); });

  /* services: each line slides in, opacity ramps down the list */
  var services = hasGSAP && hasST && !reduceMotion ? document.querySelectorAll("[data-service]") : [];
  if (services.length) {
    services.forEach(function (li, i) {
      gsap.to(li, {
        opacity: Math.max(1 - i * 0.15, 0.12),
        x: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: li, start: "top 92%", once: true }
      });
    });
  }

  /* ---------------------------------------------------------------- about modal */
  var modal = document.querySelector("[data-about-modal]");
  var openBtn = document.querySelector("[data-about-open]");
  var closeBtn = document.querySelector("[data-about-close]");
  if (modal && typeof modal.showModal === "function") {
    if (openBtn) {
      openBtn.addEventListener("click", function (e) {
        e.preventDefault();
        modal.showModal();
        if (lenis) lenis.stop();
      });
    }
    var close = function () {
      modal.close();
      if (lenis) lenis.start();
    };
    if (closeBtn) closeBtn.addEventListener("click", close);
    modal.addEventListener("cancel", function (e) { e.preventDefault(); close(); });
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
  }

  /* ---------------------------------------------------------------- copy email */
  var copyBtn = document.querySelector("[data-copy-email]");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email");
      var label = copyBtn.querySelector("[data-email-label]");
      var done = function () {
        if (!label) return;
        var original = label.textContent;
        label.textContent = "copied!";
        setTimeout(function () { label.textContent = original; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = email;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (err) {}
        document.body.removeChild(ta);
        done();
      }
    });
  }

  /* ---------------------------------------------------------------- custom cursor */
  var cursor = document.querySelector("[data-cursor]");
  var cursorText = document.querySelector("[data-cursor-text]");
  if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy, visible = false;

    document.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      var labelEl = e.target.closest ? e.target.closest("[data-cursor-label]") : null;
      if (labelEl) {
        cursorText.textContent = labelEl.getAttribute("data-cursor-label");
        cursor.classList.add("is-on");
      } else if (visible) {
        cursor.classList.remove("is-on");
      }
      visible = true;
    }, { passive: true });

    var loop = function () {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------------- film grain */
  var grain = document.querySelector("[data-grain]");
  if (grain && !reduceMotion) {
    var ctx = grain.getContext("2d");
    var size = 160;
    var canvasBuf = document.createElement("canvas");
    canvasBuf.width = canvasBuf.height = size;
    var bufCtx = canvasBuf.getContext("2d");

    var paint = function () {
      var w = grain.clientWidth, h = grain.clientHeight;
      if (grain.width !== w || grain.height !== h) { grain.width = w; grain.height = h; }
      var img = bufCtx.createImageData(size, size);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = 120 + Math.random() * 135;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      bufCtx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);
      var pat = ctx.createPattern(canvasBuf, "repeat");
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, w, h);
    };
    paint();
    setInterval(paint, 90);
  }
})();
