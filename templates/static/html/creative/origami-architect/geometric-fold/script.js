/* Geometric Fold — interactions
   1. Gallery: photograph / crease-pattern toggle per piece
   2. Lightbox for gallery photographs
   3. Contact form validation + in-page confirmation (demonstration)
   4. Scroll reveal, disabled under reduced motion */

(function () {
  "use strict";

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- gallery view toggle ---------- */
  var toggles = document.querySelectorAll(".view-toggle");
  toggles.forEach(function (group) {
    var card = group.closest(".piece");
    if (!card) return;
    var photoView = card.querySelector(".photo-view");
    var cpView = card.querySelector(".cp-view");
    var buttons = group.querySelectorAll("button");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var showCp = btn.getAttribute("data-view") === "pattern";
        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        if (photoView) photoView.hidden = showCp;
        if (cpView) cpView.hidden = !showCp;
      });
    });
  });

  /* ---------- lightbox ---------- */
  var pieces = Array.prototype.slice.call(document.querySelectorAll(".piece"));
  var lightbox = document.getElementById("lightbox");
  if (lightbox && pieces.length) {
    var lbImg = lightbox.querySelector("img");
    var lbTitle = lightbox.querySelector(".lb-title");
    var lbCaption = lightbox.querySelector(".lb-caption");
    var lbMeta = lightbox.querySelector(".lb-meta");
    var lbCount = lightbox.querySelector(".lb-count");
    var current = 0;
    var lastTrigger = null;

    function dataFor(i) {
      var card = pieces[i];
      var img = card.querySelector(".photo-view img");
      var title = card.querySelector("h3");
      var caption = card.getAttribute("data-caption") || (img ? img.alt : "");
      var meta = card.getAttribute("data-meta") || "";
      return {
        src: img ? img.getAttribute("src") : "",
        alt: img ? img.alt : "",
        title: title ? title.textContent : "",
        caption: caption,
        meta: meta
      };
    }

    function render() {
      var d = dataFor(current);
      lbImg.src = d.src;
      lbImg.alt = d.alt;
      lbTitle.textContent = d.title;
      lbCaption.textContent = d.caption;
      lbMeta.textContent = d.meta;
      lbCount.textContent = (current + 1) + " / " + pieces.length;
    }

    function open(i, trigger) {
      current = i;
      lastTrigger = trigger || null;
      render();
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var closeBtn = lightbox.querySelector(".lb-close");
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastTrigger) lastTrigger.focus();
    }

    function step(delta) {
      current = (current + delta + pieces.length) % pieces.length;
      render();
    }

    pieces.forEach(function (card, i) {
      var img = card.querySelector(".photo-view img");
      if (img) {
        img.addEventListener("click", function () { open(i, img); });
        img.setAttribute("tabindex", "0");
        img.setAttribute("role", "button");
        img.setAttribute("aria-label", "Enlarge photograph: " + img.alt);
        img.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i, img); }
        });
      }
    });

    lightbox.querySelector(".lb-close").addEventListener("click", close);
    lightbox.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
    lightbox.querySelector(".lb-next").addEventListener("click", function () { step(1); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var confirmation = document.getElementById("confirmation");
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setError(field, message) {
      var err = document.getElementById(field.id + "-error");
      if (message) {
        field.setAttribute("aria-invalid", "true");
        if (err) { err.textContent = message; err.hidden = false; }
      } else {
        field.removeAttribute("aria-invalid");
        if (err) { err.textContent = ""; err.hidden = true; }
      }
      return !message;
    }

    function validate() {
      var name = form.elements.name;
      var email = form.elements.email;
      var type = form.elements.type;
      var message = form.elements.message;
      var ok = true;
      ok = setError(name, name.value.trim().length >= 2 ? "" : "Please give your name.") && ok;
      ok = setError(email, emailRe.test(email.value.trim()) ? "" : "Please give a valid email address.") && ok;
      ok = setError(type, type.value ? "" : "Please choose what the enquiry is about.") && ok;
      ok = setError(message, message.value.trim().length >= 20 ? "" : "Please add a little detail — 20 characters or more helps Mara reply usefully.") && ok;
      return ok;
    }

    ["name", "email", "type", "message"].forEach(function (key) {
      var field = form.elements[key];
      if (field) field.addEventListener("blur", function () {
        if (field.getAttribute("aria-invalid") === "true") validate();
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector("[aria-invalid='true']");
        if (firstBad) firstBad.focus();
        return;
      }
      var name = form.elements.name.value.trim();
      var typeText = form.elements.type.options[form.elements.type.selectedIndex].text;
      var ref = "GF-" + new Date().getFullYear() + "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      document.getElementById("conf-name").textContent = name;
      document.getElementById("conf-type").textContent = typeText;
      document.getElementById("conf-ref").textContent = ref;
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.setAttribute("tabindex", "-1");
      confirmation.focus();
    });

    var again = document.getElementById("send-another");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        form.hidden = false;
        confirmation.hidden = true;
        form.elements.name.focus();
      });
    }
  }

  /* ---------- mobile nav: the triangle unfolds ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var foldPanel = document.getElementById("foldPanel");
  var foldScrim = document.getElementById("foldScrim");
  if (navToggle && foldPanel && foldScrim) {
    var foldCloseBtn = foldPanel.querySelector(".fold-close");
    var navOpen = false;
    var closeTimer = null;

    function openNav() {
      if (navOpen) return;
      navOpen = true;
      window.clearTimeout(closeTimer);
      foldPanel.hidden = false;
      foldScrim.hidden = false;
      void foldPanel.offsetWidth; /* reflow, so the unfold transition runs */
      foldPanel.classList.add("open");
      foldScrim.classList.add("open");
      navToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      if (foldCloseBtn) foldCloseBtn.focus();
    }

    function closeNav(instant) {
      if (!navOpen) return;
      navOpen = false;
      foldPanel.classList.remove("open");
      foldScrim.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      var hide = function () { foldPanel.hidden = true; foldScrim.hidden = true; };
      if (instant) hide();
      else closeTimer = window.setTimeout(hide, 320);
      navToggle.focus();
    }

    navToggle.addEventListener("click", function () {
      if (navOpen) closeNav(false); else openNav();
    });
    if (foldCloseBtn) foldCloseBtn.addEventListener("click", function () { closeNav(false); });
    foldScrim.addEventListener("click", function () { closeNav(false); });
    Array.prototype.forEach.call(foldPanel.querySelectorAll("nav a"), function (a) {
      a.addEventListener("click", function () { closeNav(true); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navOpen) closeNav(false);
    });
    window.addEventListener("resize", function () {
      if (navOpen && window.innerWidth > 860) closeNav(true);
    });
  }

  /* ---------- reveal ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }
})();
