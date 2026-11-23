/* Marquetry Veneer — gallery species filter, lightbox, enquiry form.
   No audio, no trackers, no motion that loops. */

(function () {
  "use strict";

  /* ---------- species filter (index) ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-filter]"));
  var pieces = Array.prototype.slice.call(document.querySelectorAll(".piece[data-species]"));
  var status = document.getElementById("filterStatus");

  function speciesName(key) {
    return key.replace(/-/g, " ");
  }

  function applyFilter(key) {
    chips.forEach(function (chip) {
      chip.setAttribute("aria-pressed", chip.getAttribute("data-filter") === key ? "true" : "false");
    });
    var shown = 0;
    pieces.forEach(function (piece) {
      var list = (piece.getAttribute("data-species") || "").split(" ");
      var match = key === "all" || list.indexOf(key) !== -1;
      piece.hidden = !match;
      if (match) shown += 1;
    });
    if (status) {
      status.textContent = key === "all"
        ? "Showing all " + pieces.length + " pieces."
        : "Showing " + shown + " of " + pieces.length + " pieces that use " + speciesName(key) + ".";
    }
    buildLightboxList();
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      applyFilter(chip.getAttribute("data-filter"));
    });
  });

  /* ---------- lightbox (index) ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbTitle = document.getElementById("lbTitle");
  var lbMeta = document.getElementById("lbMeta");
  var lbCount = document.getElementById("lbCount");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var lbItems = [];
  var lbIndex = 0;
  var lastFocus = null;

  function buildLightboxList() {
    lbItems = Array.prototype.slice
      .call(document.querySelectorAll(".piece:not([hidden]) .lb-open"))
      .map(function (btn) {
        var img = btn.querySelector("img");
        return {
          src: btn.getAttribute("data-full"),
          title: btn.getAttribute("data-title"),
          meta: btn.getAttribute("data-meta"),
          alt: img ? img.getAttribute("alt") : ""
        };
      });
  }

  function renderLb() {
    var item = lbItems[lbIndex];
    if (!item) return;
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbTitle.textContent = item.title;
    lbMeta.textContent = item.meta;
    lbCount.textContent = (lbIndex + 1) + " / " + lbItems.length;
  }

  function openLb(btn) {
    buildLightboxList();
    var src = btn.getAttribute("data-full");
    lbIndex = 0;
    lbItems.forEach(function (item, i) { if (item.src === src) lbIndex = i; });
    lastFocus = document.activeElement;
    lightbox.hidden = false;
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    renderLb();
    lbClose.focus();
  }

  function closeLb() {
    lightbox.classList.remove("open");
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function stepLb(dir) {
    if (!lbItems.length) return;
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    renderLb();
  }

  if (lightbox) {
    document.querySelectorAll(".lb-open").forEach(function (btn) {
      btn.addEventListener("click", function () { openLb(btn); });
    });
    lbClose.addEventListener("click", closeLb);
    lbPrev.addEventListener("click", function () { stepLb(-1); });
    lbNext.addEventListener("click", function () { stepLb(1); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") stepLb(-1);
      if (e.key === "ArrowRight") stepLb(1);
    });
    buildLightboxList();
  }

  /* ---------- mobile nav: slide-down panel ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var mnav = document.getElementById("mnav");
  if (menuBtn && mnav) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mnavClose = mnav.querySelector(".mnav-close");
    var hideTimer = null;

    function openMenu() {
      window.clearTimeout(hideTimer);
      mnav.hidden = false;
      document.body.style.overflow = "hidden";
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "Close menu");
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { mnav.classList.add("open"); });
      });
      if (mnavClose) mnavClose.focus();
    }

    function closeMenu(restoreFocus) {
      if (mnav.hidden) return;
      mnav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open menu");
      document.body.style.overflow = "";
      hideTimer = window.setTimeout(function () { mnav.hidden = true; }, reduceMotion ? 0 : 420);
      if (restoreFocus !== false) menuBtn.focus();
    }

    menuBtn.addEventListener("click", function () {
      if (mnav.hidden) openMenu(); else closeMenu();
    });
    if (mnavClose) mnavClose.addEventListener("click", function () { closeMenu(); });
    mnav.querySelectorAll(".mnav-nav a").forEach(function (link) {
      link.addEventListener("click", function () { closeMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMenu(false);
    });
  }

  /* ---------- enquiry form (contact) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var confirmation = document.getElementById("confirmation");
    var confRef = document.getElementById("confRef");
    var againBtn = document.getElementById("againBtn");

    function setValidity(fieldId, ok) {
      var field = document.getElementById(fieldId);
      if (field) field.classList.toggle("invalid", !ok);
      return ok;
    }

    function validate() {
      var name = document.getElementById("name").value.trim();
      var email = document.getElementById("email").value.trim();
      var message = document.getElementById("message").value.trim();
      var ok = true;
      ok = setValidity("f-name", name.length > 1) && ok;
      ok = setValidity("f-email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) && ok;
      ok = setValidity("f-message", message.length >= 10) && ok;
      return ok;
    }

    ["name", "email", "message"].forEach(function (id) {
      var input = document.getElementById(id);
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field) field.classList.remove("invalid");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstInvalid = form.querySelector(".field.invalid input, .field.invalid textarea");
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      var ref = "MV-" + new Date().getFullYear() + "-" +
        Math.random().toString(36).slice(2, 6).toUpperCase();
      confRef.textContent = ref;
      form.style.display = "none";
      confirmation.classList.add("show");
      confirmation.focus();
    });

    againBtn.addEventListener("click", function () {
      confirmation.classList.remove("show");
      form.reset();
      form.style.display = "";
      document.getElementById("name").focus();
    });
  }
})();
