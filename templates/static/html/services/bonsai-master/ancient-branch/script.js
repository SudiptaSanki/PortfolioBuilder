/* Ancient Branch — interactions.
   Three jobs: the seasonal calendar tabs, the register lightbox,
   and the enquiry form. No sound, no animation for its own sake. */
(function () {
  "use strict";

  /* ---------- seasonal calendar tabs ---------- */
  var tablist = document.querySelector(".season-tabs");
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role=tab]"));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    });

    function selectTab(index, moveFocus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (moveFocus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { selectTab(i, false); });
    });

    tablist.addEventListener("keydown", function (e) {
      var current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      var next = null;
      if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
      if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next !== null) { e.preventDefault(); selectTab(next, true); }
    });
  }

  /* ---------- register lightbox ---------- */
  var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var lb = document.getElementById("lightbox");
  if (triggers.length && lb) {
    var lbImg = lb.querySelector("img");
    var lbName = lb.querySelector(".lb-name");
    var lbMeta = lb.querySelector(".lb-meta");
    var lbCap = lb.querySelector(".lb-cap");
    var lbCount = lb.querySelector(".lb-count");
    var btnClose = lb.querySelector(".lb-close");
    var btnPrev = lb.querySelector(".lb-prev");
    var btnNext = lb.querySelector(".lb-next");
    var current = 0;
    var lastTrigger = null;

    function syncCapWidth() {
      var cap = lb.querySelector("figcaption");
      if (cap && lbImg.clientWidth) cap.style.width = lbImg.clientWidth + "px";
    }
    lbImg.addEventListener("load", syncCapWidth);

    function render() {
      var t = triggers[current];
      lbImg.src = t.getAttribute("data-full");
      lbImg.alt = t.querySelector("img").alt;
      lbName.textContent = t.getAttribute("data-name");
      lbMeta.textContent = t.getAttribute("data-meta");
      lbCap.textContent = t.getAttribute("data-caption");
      lbCount.textContent = (current + 1) + " of " + triggers.length;
      if (lbImg.complete && lbImg.naturalWidth) syncCapWidth();
    }
    function openLb(index, trigger) {
      current = index;
      lastTrigger = trigger;
      render();
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      btnClose.focus();
    }
    function closeLb() {
      lb.hidden = true;
      document.body.style.overflow = "";
      lbImg.src = "";
      if (lastTrigger) lastTrigger.focus();
    }
    function step(d) {
      current = (current + d + triggers.length) % triggers.length;
      render();
    }

    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () { openLb(i, t); });
    });
    btnClose.addEventListener("click", closeLb);
    btnPrev.addEventListener("click", function () { step(-1); });
    btnNext.addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var confirmation = document.getElementById("confirmation");
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setInvalid(input, bad) {
      var field = input.closest(".field");
      if (field) field.classList.toggle("invalid", bad);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      return !bad;
    }
    function validate(input) {
      var v = input.value.trim();
      if (input.required && !v) return setInvalid(input, true);
      if (input.type === "email" && v && !emailRe.test(v)) return setInvalid(input, true);
      return setInvalid(input, false);
    }

    var fields = Array.prototype.slice.call(form.querySelectorAll("input, select, textarea"));
    fields.forEach(function (input) {
      input.addEventListener("blur", function () { validate(input); });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("invalid")) validate(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (input) {
        if (!validate(input) && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }

      var name = document.getElementById("f-name").value.trim().split(" ")[0];
      var typeSel = document.getElementById("f-type");
      var type = typeSel.options[typeSel.selectedIndex].text;
      document.getElementById("conf-name").textContent = name;
      document.getElementById("conf-type").textContent = type.charAt(0).toLowerCase() + type.slice(1);
      document.getElementById("conf-ref").textContent =
        "AB-" + new Date().getFullYear() + "-" + String(Math.floor(100 + Math.random() * 900));
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.setAttribute("tabindex", "-1");
      confirmation.focus();
    });

    var again = document.getElementById("send-another");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        fields.forEach(function (input) { setInvalid(input, false); });
        confirmation.hidden = true;
        form.hidden = false;
        document.getElementById("f-name").focus();
      });
    }
  }
})();

/* ---------- mobile nav: a quiet MENU, a panel that grows ----------
   The panel grows from the top of the header when motion is allowed
   (CSS scaleY), and simply appears under reduced motion. Focus goes
   to the first link on open and back to the button on close; Esc
   closes; the body is scroll-locked while the panel is open. */
(function () {
  "use strict";
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("mobile-panel");
  if (!toggle || !panel) return;
  var closeTimer = null;

  function open() {
    window.clearTimeout(closeTimer);
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-locked");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { panel.classList.add("open"); });
    });
    var first = panel.querySelector("a");
    if (first) first.focus();
  }
  function close(returnFocus) {
    toggle.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
    panel.classList.remove("open");
    document.body.classList.remove("nav-locked");
    closeTimer = window.setTimeout(function () { panel.hidden = true; }, 320);
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener("click", function () {
    if (toggle.getAttribute("aria-expanded") === "true") close(false);
    else open();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") close(true);
  });
  Array.prototype.forEach.call(panel.querySelectorAll("a"), function (a) {
    a.addEventListener("click", function () { close(false); });
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 760 && toggle.getAttribute("aria-expanded") === "true") {
      window.clearTimeout(closeTimer);
      panel.hidden = true;
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-locked");
    }
  });
})();
