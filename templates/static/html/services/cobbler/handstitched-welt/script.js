/* Aldous — Bespoke Shoemaker. Interactions: reading-order reveal,
   the mobile nav, the construction explorer tabs, the order-book
   lightbox, and the appointment form. No audio: shoemaking fails
   the sound need-test. */
(function () {
  "use strict";
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveal ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && !prefersReduced && "IntersectionObserver" in window) {
    document.documentElement.classList.add("rv");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("seen"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- mobile nav ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  if (navToggle && mobileNav) {
    var navLinks = mobileNav.querySelectorAll("a");
    function openNav() {
      mobileNav.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { mobileNav.classList.add("open"); });
      });
      navToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      if (navLinks.length) navLinks[0].focus();
    }
    function closeNav(restoreFocus) {
      mobileNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        if (!mobileNav.classList.contains("open")) mobileNav.hidden = true;
      }, 280);
      if (restoreFocus !== false) navToggle.focus();
    }
    navToggle.addEventListener("click", function () {
      if (mobileNav.classList.contains("open")) closeNav();
      else openNav();
    });
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () { closeNav(false); });
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && mobileNav.classList.contains("open")) closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 760 && mobileNav.classList.contains("open")) closeNav(false);
    });
  }

  /* ---------- construction explorer tabs ---------- */
  var tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        t.setAttribute("aria-selected", j === i ? "true" : "false");
        t.tabIndex = j === i ? 0 : -1;
        if (panels[j]) panels[j].hidden = j !== i;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false); });
      t.addEventListener("keydown", function (ev) {
        var n = null;
        if (ev.key === "ArrowRight") n = (i + 1) % tabs.length;
        if (ev.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        if (ev.key === "Home") n = 0;
        if (ev.key === "End") n = tabs.length - 1;
        if (n !== null) { ev.preventDefault(); select(n, true); }
      });
    });
    select(0, false);
  }

  /* ---------- lightbox ---------- */
  var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var lb = document.getElementById("lightbox");
  if (triggers.length && lb) {
    var img = lb.querySelector("img");
    var titleEl = lb.querySelector(".lb-title");
    var textEl = lb.querySelector(".lb-text");
    var countEl = lb.querySelector(".lb-count");
    var closeBtn = lb.querySelector(".lb-close");
    var prevBtn = lb.querySelector(".lb-prev");
    var nextBtn = lb.querySelector(".lb-next");
    var current = 0, lastTrigger = null;

    function show(i) {
      current = (i + triggers.length) % triggers.length;
      var t = triggers[current];
      img.src = t.getAttribute("data-full");
      img.alt = t.getAttribute("data-alt") || "";
      titleEl.textContent = t.getAttribute("data-title") || "";
      textEl.textContent = t.getAttribute("data-text") || "";
      countEl.textContent = (current + 1) + " / " + triggers.length;
    }
    function open(i, trigger) {
      lastTrigger = trigger;
      show(i);
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }
    function close() {
      lb.hidden = true;
      document.body.style.overflow = "";
      if (lastTrigger) lastTrigger.focus();
    }
    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () { open(i, t); });
    });
    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { show(current - 1); });
    nextBtn.addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (ev) { if (ev.target === lb) close(); });
    document.addEventListener("keydown", function (ev) {
      if (lb.hidden) return;
      if (ev.key === "Escape") close();
      if (ev.key === "ArrowLeft") show(current - 1);
      if (ev.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- appointment form (demonstration — sends nothing) ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var confirmation = document.getElementById("confirmation");
    var fields = {
      name: form.querySelector("#f-name"),
      email: form.querySelector("#f-email"),
      type: form.querySelector("#f-type"),
      message: form.querySelector("#f-message")
    };
    function setInvalid(input, bad) {
      var wrap = input.closest(".field");
      if (wrap) wrap.classList.toggle("invalid", bad);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      return !bad;
    }
    function validate() {
      var ok = true, firstBad = null;
      var nameOk = setInvalid(fields.name, fields.name.value.trim().length < 2);
      if (!nameOk) { ok = false; firstBad = firstBad || fields.name; }
      var emailOk = setInvalid(fields.email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.value.trim()));
      if (!emailOk) { ok = false; firstBad = firstBad || fields.email; }
      var typeOk = setInvalid(fields.type, !fields.type.value);
      if (!typeOk) { ok = false; firstBad = firstBad || fields.type; }
      var msgOk = setInvalid(fields.message, fields.message.value.trim().length < 10);
      if (!msgOk) { ok = false; firstBad = firstBad || fields.message; }
      if (firstBad) firstBad.focus();
      return ok;
    }
    ["name", "email", "type", "message"].forEach(function (k) {
      fields[k].addEventListener("input", function () { setInvalid(fields[k], false); });
      fields[k].addEventListener("change", function () { setInvalid(fields[k], false); });
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!validate()) return;
      var ref = "AL-2026-" + String(Math.floor(100 + Math.random() * 900));
      document.getElementById("c-name").textContent = fields.name.value.trim().split(" ")[0];
      document.getElementById("c-type").textContent = fields.type.options[fields.type.selectedIndex].text;
      document.getElementById("c-ref").textContent = ref;
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.setAttribute("tabindex", "-1");
      confirmation.focus();
      confirmation.scrollIntoView({ block: "center", behavior: prefersReduced ? "auto" : "smooth" });
    });
    var again = document.getElementById("send-another");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        confirmation.hidden = true;
        form.hidden = false;
        fields.name.focus();
      });
    }
  }
})();
