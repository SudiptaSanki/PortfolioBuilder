/* Scroll-Morphing Particle Portfolio Studio — portfolio interactions */
(function () {
  "use strict";

  var docEl = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------- loader */
  function hideLoader() {
    var loader = $(".loader");
    if (!loader) return;
    setTimeout(function () {
      loader.classList.add("is-done");
      document.body.classList.add("is-loaded");
    }, reduced ? 120 : 1500);
  }
  window.addEventListener("load", hideLoader);
  setTimeout(hideLoader, 3600); // safety

  /* --------------------------------------------------------------- clock */
  function berlinTime() {
    try {
      return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    } catch (e) {
      var d = new Date();
      return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    }
  }
  var clock = $("[data-clock]");
  if (clock) {
    clock.textContent = berlinTime();
    setInterval(function () { clock.textContent = berlinTime(); }, 20000);
  }

  /* ----------------------------------------------------------------- nav */
  var nav = $(".nav");
  var lastY = 0;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (nav) {
      if (y > 160 && y > lastY + 4) nav.setAttribute("data-hidden", "true");
      else if (y < lastY - 4 || y < 120) nav.setAttribute("data-hidden", "false");
    }
    lastY = y;
  }, { passive: true });

  /* --------------------------------------------------------------- theme */
  var themeBtns = $$("[data-theme-toggle]");
  function setTheme(mode) {
    if (mode === "dark") docEl.dataset.theme = "dark";
    else docEl.removeAttribute("data-theme");
    themeBtns.forEach(function (b) {
      if (b.classList.contains("toggle")) b.setAttribute("aria-checked", mode === "dark" ? "true" : "false");
    });
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "dark" ? "#121211" : "#F1F0EC");
    document.dispatchEvent(new CustomEvent("theme:change"));
    try { localStorage.setItem("sv-theme", mode); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem("sv-theme"); } catch (e) {}
  if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) setTheme("dark");
  themeBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      setTheme(docEl.dataset.theme === "dark" ? "light" : "dark");
    });
  });

  /* --------------------------------------------------------------- sound */
  var AC = null;
  function audio() {
    if (!AC) { var Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) AC = new Ctx(); }
    return AC;
  }
  var soundOn = false;
  function setSound(on) {
    soundOn = on;
    $$("[data-sound]").forEach(function (b) {
      if (b.classList.contains("toggle")) b.setAttribute("aria-checked", on ? "true" : "false");
      var i = b.querySelector("i");
      if (i) i.classList.toggle("on", on);
    });
  }
  function blip(freq, dur) {
    if (!soundOn) return;
    var ctx = audio();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq || 640;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (dur || 0.16));
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + (dur || 0.16) + 0.02);
  }
  $$("[data-sound]").forEach(function (b) {
    b.addEventListener("click", function () {
      setSound(!soundOn);
      if (soundOn) blip(760, 0.18);
    });
  });
  document.addEventListener("pointerdown", function (e) {
    if (!soundOn) return;
    if (e.target.closest && e.target.closest("a, button")) blip(520, 0.08);
  }, { passive: true });

  /* -------------------------------------------------------------- motion */
  var motionOff = false;
  $$("[data-motion]").forEach(function (b) {
    var i = b.querySelector("i");
    if (i) i.classList.add("on");
    b.addEventListener("click", function () {
      motionOff = !motionOff;
      docEl.dataset.motion = motionOff ? "off" : "on";
      if (i) i.classList.toggle("on", !motionOff);
      document.dispatchEvent(new CustomEvent("motion:change", { detail: { off: motionOff } }));
    });
  });

  /* ------------------------------------------------------- magnetic buttons */
  var magnets = $$("[data-magnetic]");
  magnets.forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      if (motionOff || reduced) return;
      var r = el.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.transform = "translate(" + (dx * 8).toFixed(2) + "px," + (dy * 6).toFixed(2) + "px)";
    });
    el.addEventListener("pointerleave", function () { el.style.transform = ""; });
  });

  /* ---------------------------------------------------------------- cursor */
  var cursor = $(".cursor");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (cursor && fine) {
    document.addEventListener("pointermove", function (e) {
      cursor.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
      cursor.classList.add("is-on");
    }, { passive: true });
    $$(".sw__stage").forEach(function (stage) {
      stage.addEventListener("pointerenter", function () { document.body.classList.add("cursor-view"); });
      stage.addEventListener("pointerleave", function () { document.body.classList.remove("cursor-view"); });
    });
  }

  /* --------------------------------------------------------------- reveals */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in-view");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.2 });
    $$(".reveal, [data-rise-words]").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal, [data-rise-words]").forEach(function (el) { el.classList.add("in-view"); });
  }

  /* split words for the statement + philosophy */
  $$("[data-rise-words]").forEach(function (el) {
    var html = el.innerHTML;
    var frag = document.createElement("span");
    frag.innerHTML = html;
    var out = "";
    var walk = function (node) {
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) {
          out += n.textContent.split(/(\s+)/).map(function (w) {
            if (!w.trim()) return w;
            return '<span class="w"><span>' + w + "</span></span>";
          }).join("");
        } else if (n.nodeType === 1) {
          var tag = n.tagName.toLowerCase();
          if (tag === "em") { out += "<em>" + n.textContent + "</em>"; }
          else { out += n.outerHTML; }
        }
      });
    };
    walk(frag);
    el.innerHTML = out;
  });

  /* ---------------------------------------------------------------- menu */
  var menu = $(".menu");
  var menuBtn = $("[data-menu-toggle]");
  if (menu && menuBtn) {
    menuBtn.addEventListener("click", function () {
      var open = menu.hasAttribute("hidden");
      if (open) menu.removeAttribute("hidden");
      else menu.setAttribute("hidden", "");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () { menu.setAttribute("hidden", ""); });
    });
  }

  /* ------------------------------------------------------------ work data */
  var WORK = [
    { d: "Online business services for small businesses, freelancers and startups in the USA — making numbers feel light.", c: "FinTech · Brand book · Website", t: "Figma · Illustrator · Photoshop" },
    { d: "A companion bank website for business and private clients — solid as a stone, smart as a gem.", c: "FinTech · Website · Gold", t: "Figma · Design system · Build" },
    { d: "A fintech platform for businesses worldwide — global payments, crypto trading and financial solutions, all in one place.", c: "FinTech · Payments · Brand identity", t: "Figma · Illustrator · Webflow" },
    { d: "A UX/UI concept for the Trulia real estate app — discover a home and a neighbourhood you’ll love to live in.", c: "Real estate · Mobile app", t: "Figma · Prototyping · Motion" }
  ];
  var listItems = $$(".sw__list li");
  var desc = $(".sw__desc");
  var cat = $(".sw__cat");
  var slides = $$(".sw__slide");

  function setWork(i) {
    i = Math.max(0, Math.min(3, i));
    listItems.forEach(function (li, k) { li.classList.toggle("is-active", k === i); });
    slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
    if (desc && WORK[i]) desc.textContent = WORK[i].d;
    if (cat && WORK[i]) {
      cat.innerHTML = '<span class="tag">' + WORK[i].c + '</span><span class="tag__secondary">Tools</span> ' + WORK[i].t;
    }
  }
  document.addEventListener("workchange", function (e) {
    setWork(e.detail.index);
    if (window.gsap && !reduced) {
      var left = $(".sw__info");
      if (left) {
        gsap.fromTo(left, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
      }
    }
  });
  setWork(0);

  /* mobile rail counter */
  var rail = $(".sw__rail");
  var mcount = $(".sw__mcount");
  if (rail && mcount) {
    rail.addEventListener("scroll", function () {
      var cards = $$(".sw__card", rail);
      var center = rail.scrollLeft + rail.clientWidth / 2;
      var best = 0, bd = 1e9;
      cards.forEach(function (c, i) {
        var cx = c.offsetLeft + c.offsetWidth / 2;
        if (Math.abs(cx - center) < bd) { bd = Math.abs(cx - center); best = i; }
      });
      mcount.textContent = "0" + (best + 1) + " / 04";
    }, { passive: true });
  }

  /* ------------------------------------------------- services glyph art */
  var CH = "#+=-:.*/%";
  function drawGlyphNumber(el) {
    var text = el.dataset.glyphNumber;
    var canvas = document.createElement("canvas");
    el.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var W = 88, H = 78;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = "100%"; canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var s = document.createElement("canvas");
    s.width = W; s.height = H;
    var sc = s.getContext("2d");
    sc.fillStyle = "#fff";
    sc.textAlign = "center";
    sc.textBaseline = "middle";
    sc.font = '400 62px "SV Serif", Georgia, serif';
    sc.fillText(text, W / 2, H / 2 + 2);
    var data = sc.getImageData(0, 0, W, H).data;
    var cells = [];
    var step = 6;
    for (var y = 0; y < H; y += step) {
      for (var x = 0; x < W; x += step) {
        var a = data[(((y + 3) | 0) * W + ((x + 3) | 0)) * 4 + 3];
        if (a > 110) cells.push({ x: x + 3, y: y + 3, ch: CH[(Math.random() * CH.length) | 0], a: 0.35 + (a / 255) * 0.65 });
      }
    }
    function frame(scramble) {
      ctx.clearRect(0, 0, W, H);
      ctx.font = '500 7px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e8461a";
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        ctx.globalAlpha = c.a;
        ctx.fillText(scramble ? CH[(Math.random() * CH.length) | 0] : c.ch, c.x, c.y);
      }
      ctx.globalAlpha = 1;
    }
    frame(false);
    var timer = null;
    el.addEventListener("pointerenter", function () {
      if (motionOff) return;
      var n = 0;
      clearInterval(timer);
      timer = setInterval(function () {
        frame(n < 9);
        if (++n > 12) {
          clearInterval(timer);
          frame(false);
          cells.forEach(function (c) { c.ch = CH[(Math.random() * CH.length) | 0]; });
          frame(false);
        }
      }, 60);
    });
  }
  $$("[data-glyph-number]").forEach(drawGlyphNumber);

  /* ------------------------------------------------------------ parallax */
  var parallaxEls = $$("[data-parallax]");
  if (parallaxEls.length && !reduced) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        parallaxEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var vh = window.innerHeight;
          if (r.top > vh || r.bottom < 0) return;
          var p = (r.top + r.height / 2 - vh / 2) / vh;
          $$(".svc-ill__l", el).forEach(function (img, i) {
            img.style.marginTop = (p * (14 + i * 5)).toFixed(1) + "px";
          });
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------ holo card */
  var holo = $("[data-holo]");
  if (holo && fine) {
    var card = $(".holo__card", holo);
    holo.addEventListener("pointermove", function (e) {
      var r = holo.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      holo.style.setProperty("--rx", ((0.5 - y) * 10).toFixed(2) + "deg");
      holo.style.setProperty("--ry", ((x - 0.5) * 12).toFixed(2) + "deg");
      holo.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
      holo.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
      holo.style.setProperty("--on", "1");
    });
    holo.addEventListener("pointerleave", function () {
      holo.style.setProperty("--rx", "0deg");
      holo.style.setProperty("--ry", "0deg");
      holo.style.setProperty("--on", "0");
    });
  }

  /* --------------------------------------------------------------- cookie */
  var cookie = $(".cookie");
  var consent = null;
  try { consent = localStorage.getItem("sv-consent"); } catch (e) {}
  if (cookie && !consent) {
    setTimeout(function () { cookie.removeAttribute("hidden"); }, 2600);
  }
  $$("[data-cookie-accept], [data-cookie-reject]").forEach(function (b) {
    b.addEventListener("click", function () {
      try { localStorage.setItem("sv-consent", b.hasAttribute("data-cookie-accept") ? "yes" : "no"); } catch (e) {}
      if (cookie) cookie.setAttribute("hidden", "");
    });
  });
  var cookieBtn = $("[data-cookie]");
  if (cookieBtn && cookie) cookieBtn.addEventListener("click", function () { cookie.removeAttribute("hidden"); });

  /* -------------------------------------------------------- anchor scroll */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 56;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  });
})();
