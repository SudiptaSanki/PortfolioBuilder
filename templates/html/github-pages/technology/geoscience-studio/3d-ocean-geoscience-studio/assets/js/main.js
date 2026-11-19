/* 3D Ocean & Geoscience Studio — page behaviour */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --------------------------------------------------------------- loader */
  var loader = $("#loader");
  var num = $("#loaderNum");
  var label = $("#loaderLabel");
  var cue = $("#loaderCue");
  var progress = $("#dialProgress");
  var CIRC = 2 * Math.PI * 150;

  // tick ring
  var ticks = $("#dialTicks");
  if (ticks) {
    var html = "";
    for (var i = 0; i < 120; i++) {
      var a = (i / 120) * Math.PI * 2;
      var x1 = 200 + Math.cos(a) * 170, y1 = 200 + Math.sin(a) * 170;
      var x2 = 200 + Math.cos(a) * (i % 10 === 0 ? 158 : 164), y2 = 200 + Math.sin(a) * (i % 10 === 0 ? 158 : 164);
      html += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"' + (i % 10 === 0 ? ' class="major"' : "") + "/>";
    }
    ticks.innerHTML = html;
    if (progress) progress.style.strokeDasharray = CIRC;
  }

  var pct = 0, loaded = false;
  function setPct(v) {
    pct = Math.max(pct, Math.min(100, v));
    if (num) num.textContent = String(Math.round(pct)).padStart(2, "0");
    if (progress) progress.style.strokeDashoffset = (CIRC * (1 - pct / 100)).toFixed(1);
  }
  function ready() {
    if (loaded) return;
    loaded = true;
    setPct(100);
    if (label) label.textContent = "Coordinates loaded";
    setTimeout(function () {
      loader.classList.add("is-done");
      document.body.classList.remove("is-loading");
      var ruler = $(".ruler");
      if (ruler) ruler.classList.add("is-on");
      var title = $(".hero__title");
      if (title) title.classList.add("is-in");
      window.scrollTo(0, 0);
    }, reduced ? 150 : 620);
  }

  var fake = 0;
  var faketimer = setInterval(function () {
    fake += Math.random() * 9 + 3;
    if (fake > 92) fake = 92;
    setPct(fake);
    if (label && fake > 30 && fake < 60) label.textContent = "Loading coordinates";
    if (label && fake >= 60) label.textContent = "Preparing the water";
  }, 170);

  function assetsReady() {
    clearInterval(faketimer);
    setPct(100);
    if (cue) cue.classList.add("is-on");
    setTimeout(ready, reduced ? 100 : 900);
  }
  window.addEventListener("load", function () { setTimeout(assetsReady, reduced ? 80 : 420); });
  setTimeout(assetsReady, 4200); // safety for slow media

  /* ----------------------------------------------------------------- menu */
  var menu = $("#menu");
  var menuBtn = $("#menuBtn");
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (menuBtn) menuBtn.addEventListener("click", function () {
    setMenu(!menu.classList.contains("is-open"));
  });
  if (menu) {
    $$("[data-menu-link]").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    menu.addEventListener("click", function (e) {
      if (e.target === menu) setMenu(false);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });

  /* ---------------------------------------------------------------- depth */
  var track = $("#rulerTrack");
  var depthValue = $("#depthValue");
  if (track) {
    var rows = "";
    for (var d = 1000; d >= -7000; d -= 100) {
      var major = d % 500 === 0;
      var lab = (d > 0 ? d : d === 0 ? 0 : "−" + Math.abs(d));
      rows += '<div class="ruler__tick' + (major ? " is-major" : "") + '"><b>' + lab + '</b><i></i></div>';
    }
    track.innerHTML = rows;
    var step = 26; // tick height in px, must match css
    var total = 81; // ticks
    var trackH = total * step;

    var lastDepth = 0;
    (function tickDepth() {
      requestAnimationFrame(tickDepth);
      var d2 = window.__abyssalDepth || 0;
      if (depthValue && d2 !== lastDepth) {
        depthValue.textContent = String(Math.abs(d2)).padStart(4, "0");
        lastDepth = d2;
      }
      if (track) {
        var scale = track.parentElement.clientHeight;
        var offset = (d2 / 7000) * (trackH - scale);
        track.style.transform = "translateY(" + (-offset).toFixed(1) + "px)";
      }
    })();
  }

  /* ---------------------------------------------------------------- header */
  var header = $("#siteHeader");
  var lastY = 0;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (header) {
      if (y > 180 && y > lastY + 6) header.classList.add("is-hidden");
      else if (y < lastY - 6 || y < 140) header.classList.remove("is-hidden");
    }
    lastY = y;
  }, { passive: true });

  /* --------------------------------------------------------------- reveals */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    $$("[data-reveal]").forEach(function (el) { io.observe(el); });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ------------------------------------------------------------ split title */
  var title = $("[data-split]");
  if (title) {
    var parts = title.innerHTML.split(/(<br\s*\/?>)/i);
    var out = "";
    parts.forEach(function (piece) {
      if (/^<br/i.test(piece)) { out += piece; return; }
      piece.split("").forEach(function (ch) {
        if (ch === " ") { out += " "; return; }
        out += '<span class="ch">' + ch + "</span>";
      });
    });
    title.innerHTML = out;
    $$(".ch", title).forEach(function (ch, i) {
      ch.style.transitionDelay = (0.25 + i * 0.018) + "s";
    });
  }

  /* -------------------------------------------------------------- carousel */
  var slides = $$(".slide");
  var titles = $$(".svc-title");
  var descs = [
    "Integrated geophysical and geotechnical site investigation, tailored to water depth, sea state and the seabed conditions of each project.",
    "Coastal and nearshore characterisation where land meets water — shallow water, tidal ranges and sensitive habitats handled with the same discipline.",
    "Ground investigation for onshore infrastructure, from boreholes and in-situ testing to ground models that stand up to review.",
    "Advanced soil and rock testing in accredited laboratories, with traceable results that feed directly into design."
  ];
  var descEl = $("#svcDesc"), numEl = $("#svcNum");
  var active = 0;

  function showSlide(i) {
    i = (i + slides.length) % slides.length;
    active = i;
    slides.forEach(function (s, k) {
      s.classList.toggle("is-active", k === i);
      var v = s.querySelector("video");
      if (v) {
        if (k === i) { v.play().catch(function () {}); }
        else v.pause();
      }
    });
    titles.forEach(function (b, k) { b.classList.toggle("is-active", k === i); });
    if (descEl) descEl.textContent = descs[i];
    if (numEl) numEl.textContent = "0" + (i + 1);
  }
  titles.forEach(function (b) { b.addEventListener("click", function () { showSlide(+b.dataset.slide); }); });
  var prev = $("#svcPrev"), next = $("#svcNext");
  if (prev) prev.addEventListener("click", function () { showSlide(active - 1); });
  if (next) next.addEventListener("click", function () { showSlide(active + 1); });

  // play the first video once it is on screen
  if (slides.length && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target.querySelector("video");
        if (!v) return;
        if (en.isIntersecting && en.target.classList.contains("is-active")) v.play().catch(function () {});
        else v.pause();
      });
    }, { threshold: 0.3 });
    slides.forEach(function (s) { vio.observe(s); });
  }

  /* ----------------------------------------------------------------- globe */
  var globeCanvas = $("#globe");
  if (globeCanvas) {
    var gctx = globeCanvas.getContext("2d");
    var pts = [];
    var N = 1400;
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var radius = Math.sqrt(Math.max(0, 1 - y * y));
      var theta = i * 2.399963;
      pts.push({ x: Math.cos(theta) * radius, y: y, z: Math.sin(theta) * radius });
    }
    var offices = [
      { lat: 57.15, lon: -2.09 },
      { lat: 51.92, lon: 4.48 },
      { lat: 1.35, lon: 103.82 },
      { lat: 29.76, lon: -95.37 }
    ].map(function (o) {
      var phi = (90 - o.lat) * Math.PI / 180;
      var th = (o.lon + 180) * Math.PI / 180;
      return { x: -Math.sin(phi) * Math.cos(th), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(th) };
    });

    var gsize = 0, gdpr = 1;
    function gresize() {
      var r = globeCanvas.getBoundingClientRect();
      if (!r.width) return;
      gdpr = Math.min(2, window.devicePixelRatio || 1);
      gsize = r.width;
      globeCanvas.width = Math.round(r.width * gdpr);
      globeCanvas.height = Math.round(r.height * gdpr);
      gctx.setTransform(gdpr, 0, 0, gdpr, 0, 0);
    }
    gresize();
    window.addEventListener("resize", gresize);

    var rot = 0;
    (function gdraw() {
      requestAnimationFrame(gdraw);
      if (!gsize) { gresize(); return; }
      var r = globeCanvas.getBoundingClientRect();
      if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
      var w = gsize, cx = w / 2, cy = w / 2, R = w * 0.42;
      gctx.clearRect(0, 0, w, w);
      if (!reduced) rot += 0.0022;

      // halo
      var halo = gctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.25);
      halo.addColorStop(0, "rgba(70,150,200,.18)");
      halo.addColorStop(1, "rgba(70,150,200,0)");
      gctx.fillStyle = halo;
      gctx.beginPath(); gctx.arc(cx, cy, R * 1.25, 0, 6.283); gctx.fill();

      // sphere rim
      gctx.strokeStyle = "rgba(255,255,255,.16)";
      gctx.lineWidth = 1;
      gctx.beginPath(); gctx.arc(cx, cy, R, 0, 6.283); gctx.stroke();

      var cosA = Math.cos(rot), sinA = Math.sin(rot);
      var tilt = -0.32, cosT = Math.cos(tilt), sinT = Math.sin(tilt);

      function project(p) {
        var x = p.x * cosA - p.z * sinA;
        var z = p.x * sinA + p.z * cosA;
        var y = p.y * cosT - z * sinT;
        var z2 = p.y * sinT + z * cosT;
        return { X: cx + x * R, Y: cy - y * R, depth: z2, vis: z2 < 0.55 };
      }

      for (var i2 = 0; i2 < pts.length; i2++) {
        var pr = project(pts[i2]);
        if (!pr.vis) continue;
        var a = 0.10 + (1 - (pr.depth + 1) / 2) * 0.35;
        gctx.fillStyle = "rgba(190,225,245," + a.toFixed(3) + ")";
        gctx.fillRect(pr.X, pr.Y, 1.2, 1.2);
      }
      for (var o = 0; o < offices.length; o++) {
        var po = project(offices[o]);
        if (!po.vis) continue;
        gctx.fillStyle = "rgba(242,110,78,.95)";
        gctx.beginPath(); gctx.arc(po.X, po.Y, 2.6, 0, 6.283); gctx.fill();
        gctx.fillStyle = "rgba(242,110,78,.22)";
        gctx.beginPath(); gctx.arc(po.X, po.Y, 9, 0, 6.283); gctx.fill();
      }
    })();
  }

  /* --------------------------------------------------------------- anchors */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.scrollY - 10;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  });

  document.body.classList.add("is-loading");
})();
