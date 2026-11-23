/* Prismatic Light — interactions.
   1. Restoration before/after slider (index)
   2. Gallery lightbox (index)
   3. Enquiry form validation + in-page confirmation (contact)
   No audio anywhere: stained glass is not a sound profession. */
(function () {
  "use strict";

  /* ---------- 1. Before / after slider ---------- */
  var baWrap = document.getElementById("baWrap");
  var baRange = document.getElementById("baRange");
  if (baWrap && baRange) {
    var setPos = function (v) {
      var clamped = Math.max(0, Math.min(100, v));
      baWrap.style.setProperty("--pos", clamped + "%");
    };
    setPos(baRange.value);
    baRange.addEventListener("input", function () { setPos(baRange.value); });
    /* Dragging anywhere on the frame moves the divider too. */
    var dragging = false;
    var fromPointer = function (e) {
      var r = baWrap.getBoundingClientRect();
      var pct = ((e.clientX - r.left) / r.width) * 100;
      baRange.value = Math.round(Math.max(0, Math.min(100, pct)));
      setPos(baRange.value);
    };
    baWrap.addEventListener("pointerdown", function (e) {
      dragging = true;
      baWrap.setPointerCapture(e.pointerId);
      fromPointer(e);
    });
    baWrap.addEventListener("pointermove", function (e) { if (dragging) fromPointer(e); });
    baWrap.addEventListener("pointerup", function () { dragging = false; });
    baWrap.addEventListener("pointercancel", function () { dragging = false; });
  }

  /* ---------- 2. Lightbox ---------- */
  var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var lb = document.getElementById("lightbox");
  if (triggers.length && lb) {
    var lbImg = lb.querySelector("img");
    var lbTitle = lb.querySelector(".lb-title");
    var lbText = lb.querySelector(".lb-text");
    var lbCount = lb.querySelector(".lb-count");
    var btnClose = lb.querySelector(".lb-close");
    var btnPrev = lb.querySelector(".lb-prev");
    var btnNext = lb.querySelector(".lb-next");
    var current = 0;
    var lastFocus = null;

    var show = function (i) {
      current = (i + triggers.length) % triggers.length;
      var t = triggers[current];
      lbImg.src = t.getAttribute("data-full");
      lbImg.alt = t.querySelector("img") ? t.querySelector("img").alt : "";
      lbTitle.textContent = t.getAttribute("data-title") || "";
      lbText.textContent = t.getAttribute("data-text") || "";
      lbCount.textContent = (current + 1) + " / " + triggers.length;
    };
    var open = function (i, el) {
      lastFocus = el;
      show(i);
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      btnClose.focus();
    };
    var close = function () {
      lb.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };
    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () { open(i, t); });
    });
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { show(current - 1); });
    btnNext.addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- 3. Enquiry form ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var confirmation = document.getElementById("confirmation");
    var fields = {
      name: { input: document.getElementById("fName"), error: document.getElementById("eName"),
              test: function (v) { return v.trim().length > 1; } },
      email: { input: document.getElementById("fEmail"), error: document.getElementById("eEmail"),
               test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      type: { input: document.getElementById("fType"), error: document.getElementById("eType"),
              test: function (v) { return v !== ""; } },
      message: { input: document.getElementById("fMessage"), error: document.getElementById("eMessage"),
                 test: function (v) { return v.trim().length >= 10; } }
    };
    var mark = function (f) {
      var ok = f.test(f.input.value);
      f.input.setAttribute("aria-invalid", ok ? "false" : "true");
      f.error.classList.toggle("show", !ok);
      return ok;
    };
    Object.keys(fields).forEach(function (k) {
      fields[k].input.addEventListener("blur", function () { mark(fields[k]); });
      fields[k].input.addEventListener("input", function () {
        if (fields[k].error.classList.contains("show")) mark(fields[k]);
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (k) {
        if (!mark(fields[k]) && !firstBad) firstBad = fields[k].input;
      });
      if (firstBad) { firstBad.focus(); return; }
      document.getElementById("cName").textContent = fields.name.input.value.trim().split(" ")[0];
      document.getElementById("cType").textContent = fields.type.input.value.toLowerCase() + " enquiry";
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.focus();
    });
    var again = document.getElementById("sendAnother");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        Object.keys(fields).forEach(function (k) {
          fields[k].input.setAttribute("aria-invalid", "false");
          fields[k].error.classList.remove("show");
        });
        confirmation.hidden = true;
        form.hidden = false;
        fields.name.input.focus();
      });
    }
  }

  /* ---------- 4. Mobile nav: three-panes button, leaded panel ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mnav = document.getElementById("mobilePanel");
  var navScrim = document.getElementById("navScrim");
  if (navToggle && mnav && navScrim) {
    var navCloseBtn = mnav.querySelector(".mnav-close");
    var navOpen = false;
    var closeTimer = null;

    var openNav = function () {
      if (navOpen) return;
      navOpen = true;
      window.clearTimeout(closeTimer);
      mnav.hidden = false;
      navScrim.hidden = false;
      void mnav.offsetWidth; /* reflow, so the slide-in transition runs */
      mnav.classList.add("open");
      navScrim.classList.add("open");
      navToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      if (navCloseBtn) navCloseBtn.focus();
    };

    var closeNav = function (instant) {
      if (!navOpen) return;
      navOpen = false;
      mnav.classList.remove("open");
      navScrim.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      var hide = function () { mnav.hidden = true; navScrim.hidden = true; };
      if (instant) hide();
      else closeTimer = window.setTimeout(hide, 300);
      navToggle.focus();
    };

    navToggle.addEventListener("click", function () {
      if (navOpen) closeNav(false); else openNav();
    });
    if (navCloseBtn) navCloseBtn.addEventListener("click", function () { closeNav(false); });
    navScrim.addEventListener("click", function () { closeNav(false); });
    Array.prototype.forEach.call(mnav.querySelectorAll("nav a"), function (a) {
      a.addEventListener("click", function () { closeNav(true); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navOpen) closeNav(false);
    });
    window.addEventListener("resize", function () {
      if (navOpen && window.innerWidth > 860) closeNav(true);
    });
  }

  /* ---------- 5. Hero glass: the light shifts as the window passes ----------
     A whisper of hue-rotate on the hero photograph, driven by rAF-throttled
     scroll and bounded to the hero image only. Motion-safe only; with
     reduced motion (or no JS) the photograph simply sits still. */
  var heroGlass = document.querySelector(".hero-window img");
  if (heroGlass && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
    var hueTicking = false;
    var updateHue = function () {
      hueTicking = false;
      var r = heroGlass.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      if (r.bottom <= 0 || r.top >= vh) return;
      var p = 1 - (r.top + r.height / 2) / (vh + r.height);
      p = Math.max(0, Math.min(1, p));
      heroGlass.style.filter = "hue-rotate(" + (-6 + p * 12).toFixed(2) + "deg)";
    };
    window.addEventListener("scroll", function () {
      if (!hueTicking) {
        hueTicking = true;
        window.requestAnimationFrame(updateHue);
      }
    }, { passive: true });
    updateHue();
  }
})();
