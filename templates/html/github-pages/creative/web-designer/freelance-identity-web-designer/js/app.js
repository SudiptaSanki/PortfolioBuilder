/* Identity & Web Studio — interaction layer (vanilla, no build step) */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- sticky header ---------------- */
  var hdr = document.getElementById("hdr");
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle("is-compact", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- desktop dropdown ---------------- */
  var dd = document.querySelector("[data-dd]");
  if (dd) {
    var ddBtn = dd.querySelector(".dd-btn");
    var ddPanel = ddBtn && document.getElementById(ddBtn.getAttribute("aria-controls"));
    var closeDD = function () {
      dd.classList.remove("open");
      if (hdr) hdr.classList.remove("dd-open");
      if (ddBtn) ddBtn.setAttribute("aria-expanded", "false");
      if (ddPanel) ddPanel.inert = true;
    };
    var openDD = function () {
      dd.classList.add("open");
      if (hdr) hdr.classList.add("dd-open");
      if (ddBtn) ddBtn.setAttribute("aria-expanded", "true");
      if (ddPanel) ddPanel.inert = false;
    };
    if (ddBtn) {
      ddBtn.addEventListener("click", function () {
        dd.classList.contains("open") ? closeDD() : openDD();
      });
      dd.addEventListener("mouseenter", function () { if (window.matchMedia("(hover:hover)").matches) openDD(); });
      dd.addEventListener("mouseleave", function () { if (window.matchMedia("(hover:hover)").matches) closeDD(); });
    }
    document.addEventListener("pointerdown", function (e) { if (dd.classList.contains("open") && !dd.contains(e.target)) closeDD(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDD(); });
  }

  /* ---------------- mobile drawer ---------------- */
  var mnav = document.getElementById("mnav");
  var menuBtn = document.querySelector(".menu-btn");
  if (mnav && menuBtn) {
    var setMenu = function (open) {
      mnav.classList.toggle("open", open);
      doc.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      var lbl = menuBtn.querySelector(".lbl span") || menuBtn;
      var text = open ? menuBtn.dataset.lClose : menuBtn.dataset.lOpen;
      if (text) { lbl.textContent = text; menuBtn.setAttribute("aria-label", text); }
      document.body.style.overflow = open ? "hidden" : "";
    };
    menuBtn.addEventListener("click", function () { setMenu(!mnav.classList.contains("open")); });
    mnav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  /* ---------------- dark mode ---------------- */
  document.querySelectorAll('.tsw[role="switch"]').forEach(function (sw) {
    sw.addEventListener("click", function () {
      var dark = !doc.classList.contains("dark");
      doc.classList.toggle("dark", dark);
      if (dark) doc.setAttribute("data-theme", "dark");
      else doc.removeAttribute("data-theme");
      document.querySelectorAll('.tsw[role="switch"]').forEach(function (s) {
        s.setAttribute("aria-checked", dark ? "true" : "false");
      });
      try { localStorage.setItem("mv-theme", dark ? "dark" : "light"); } catch (e) {}
    });
  });
  try {
    if (localStorage.getItem("mv-theme") === "dark") {
      doc.classList.add("dark");
      doc.setAttribute("data-theme", "dark");
      document.querySelectorAll('.tsw[role="switch"]').forEach(function (s) { s.setAttribute("aria-checked", "true"); });
    }
  } catch (e) {}

  /* ---------------- contact dialog ---------------- */
  var dialog = document.getElementById("contact");
  var openDialog = function () {
    if (!dialog) return;
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute("open", "");
  };
  document.querySelectorAll("[data-contact]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); openDialog(); });
  });
  if (dialog) {
    dialog.querySelectorAll("[data-close], .cd-close, #close").forEach(function (b) {
      b.addEventListener("click", function () { dialog.close ? dialog.close() : dialog.removeAttribute("open"); });
    });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close ? dialog.close() : dialog.removeAttribute("open");
    });
    dialog.addEventListener("cancel", function () {});
    dialog.querySelectorAll("form").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = f.querySelector(".ok") || f.querySelector("[role=status]");
        if (note) note.textContent = "Thanks — your message is on its way.";
        f.reset();
      });
    });
  }

  /* ---------------- work filters ---------------- */
  var chips = document.querySelectorAll(".chip[data-f]");
  var cards = document.querySelectorAll("[data-cat]");
  var status = document.getElementById("filter-status");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.dataset.f;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      var shown = 0;
      cards.forEach(function (card) {
        var cats = (card.dataset.cat || "").split(/\s+/);
        var show = f === "all" || cats.indexOf(f) > -1;
        card.classList.toggle("is-hidden", !show);
        card.style.display = show ? "" : "none";
        if (show) shown++;
      });
      if (status) status.textContent = shown + " / " + cards.length;
      var counter = document.querySelector("[data-count]");
      if (counter) counter.textContent = shown + " / " + cards.length;
    });
  });

  /* ---------------- accordions (services, faq, extra lists) ---------------- */
  document.querySelectorAll("[aria-controls][aria-expanded]").forEach(function (btn) {
    if (btn.classList.contains("dd-btn") || btn.classList.contains("menu-btn") || btn.classList.contains("tgl")) return;
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;
    var host = btn.closest("li") || btn.closest(".si") || btn.parentElement;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (host) host.classList.toggle("open", open);
      panel.hidden = !open;
      if (btn.closest(".si")) {
        document.querySelectorAll(".si.open").forEach(function (other) {
          if (other === host) return;
          other.classList.remove("open");
          var ob = other.querySelector("[aria-expanded]");
          if (ob) ob.setAttribute("aria-expanded", "false");
          var op = ob && document.getElementById(ob.getAttribute("aria-controls"));
          if (op) op.hidden = true;
        });
      }
    });
  });
  document.querySelectorAll(".si").forEach(function (si) {
    var btn = si.querySelector("[aria-expanded]");
    if (btn && btn.getAttribute("aria-expanded") === "true") si.classList.add("open");
  });

  /* show-more toggle (reviews deck) */
  document.querySelectorAll("[data-tgl]").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    var label = btn.querySelector(".lbl span") || btn;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (panel) panel.classList.toggle("open", open);
      var host = btn.closest("ol") || panel || btn.parentElement;
      if (host) host.classList.toggle("open", open);
      var text = open ? btn.dataset.less : btn.dataset.more;
      if (text) label.textContent = text;
      if (panel) panel.hidden = false;
    });
  });

  /* FAQ rows */
  document.querySelectorAll(".q").forEach(function (q) {
    var head = q.querySelector("[role=button], summary, .q-h, button");
    if (!head) return;
    head.addEventListener("click", function () {
      var open = !q.classList.contains("open");
      q.classList.toggle("open", open);
      head.setAttribute("aria-expanded", open ? "true" : "false");
      var body = q.querySelector(".q-b, .a");
      if (body) body.hidden = !open;
    });
  });

  /* featured review tabs */
  document.querySelectorAll('[aria-pressed][data-k]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      var group = btn.parentElement;
      group.querySelectorAll('[aria-pressed][data-k]').forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      var target = btn.dataset.k;
      document.querySelectorAll("[data-review]").forEach(function (r) {
        r.classList.toggle("on", r.dataset.review === target);
      });
    });
  });

  /* ---------------- reveal on scroll ---------------- */
  var revealEls = [].slice.call(document.querySelectorAll("[data-rv], [data-split], [data-sig], [data-fan]"));
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: [0, 0.12] });
    revealEls.forEach(function (el) { io.observe(el); });
    document.querySelectorAll("[data-split][data-load]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------- marquee speed on scroll ---------------- */
  var tracks = document.querySelectorAll(".mq .track");
  var lastY = window.scrollY, speed = 1;
  if (tracks.length && !reduce) {
    var tick = function () {
      var y = window.scrollY, d = y - lastY;
      lastY = y;
      var target = d ? 1 + Math.min(Math.abs(d) / 20, 3) : 1;
      speed += (target - speed) * 0.12;
      tracks.forEach(function (t) { t.style.animationDuration = ""; t.style.animationPlayState = ""; t.getAnimations().forEach(function (a) { a.playbackRate = speed; }); });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- pause motion ---------------- */
  document.querySelectorAll("[data-motion]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var paused = doc.classList.toggle("no-motion");
      btn.setAttribute("aria-label", paused ? btn.dataset.lPlay || "Play all motion" : btn.dataset.lPause || "Pause all motion");
      document.querySelectorAll(".mq .track").forEach(function (t) {
        t.getAnimations().forEach(function (a) { paused ? a.pause() : a.play(); });
      });
    });
  });

  /* ---------------- custom cursor ---------------- */
  var cur = document.getElementById("cur");
  if (cur && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    doc.classList.add("has-cur");
    var cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    document.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      var host = e.target.closest ? e.target.closest("[data-cursor]") : null;
      cur.textContent = host ? host.getAttribute("data-cursor") || "" : "";
      cur.classList.toggle("on", !!host);
    }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- tilt cards ---------------- */
  if (!reduce) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
        el.style.transform = "perspective(900px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------------- copy email ---------------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var val = btn.getAttribute("data-copy");
      var done = function () {
        var s = document.getElementById("copy-status");
        if (s) { s.textContent = "Copied"; setTimeout(function () { s.textContent = ""; }, 1600); }
      };
      if (navigator.clipboard) navigator.clipboard.writeText(val).then(done, done);
      else done();
    });
  });

  /* ---------------- smooth anchor scrolling ---------------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
})();
