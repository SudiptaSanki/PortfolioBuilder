/* Anvil Forge — interactions
   Mobile nav, job-book lightbox, temper-colour scale, enquiry form.
   No audio, no tracking, nothing leaves the page. */
(function () {
  "use strict";

  /* ---------- view transitions: keep skipped transitions silent ----------
     Cross-document transitions are opted into in CSS (@view-transition).
     When the browser decides to skip one — the viewport changes size
     mid-capture (the phone rotates), or its internal opt-in check loses
     a race — the navigation still completes; only the animation is
     dropped. Chrome, however, lets the transition's internal promise
     reject unhandled, which surfaces as an uncaught InvalidStateError
     ("Transition was aborted…"). The pageswap/pagereveal objects do not
     expose that promise on the opt-in path, so the rejection can only
     be handled here: swallow exactly those abort notices, nothing else. */
  function handleTransition(t) {
    if (!t) return;
    if (t.ready && t.ready.catch) t.ready.catch(function () {});
    if (t.updateCallbackDone && t.updateCallbackDone.catch) t.updateCallbackDone.catch(function () {});
    if (t.finished && t.finished.catch) t.finished.catch(function () {});
  }
  window.addEventListener("pageswap", function (e) { handleTransition(e.viewTransition); });
  window.addEventListener("pagereveal", function (e) { handleTransition(e.viewTransition); });
  window.addEventListener("unhandledrejection", function (e) {
    var msg = e.reason && e.reason.message ? e.reason.message : "";
    if (msg.indexOf("Transition was aborted") !== -1) e.preventDefault();
  });

  /* ---------- footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    var navOpen = false;
    function setNav(open, moveFocus) {
      navOpen = open;
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-locked", open);
      if (moveFocus === false) return;
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      } else {
        toggle.focus();
      }
    }
    toggle.addEventListener("click", function () { setNav(!navOpen); });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNav(false, false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navOpen) setNav(false);
    });
    window.addEventListener("resize", function () {
      if (navOpen && window.innerWidth > 760) setNav(false, false);
    });
  }

  /* ---------- lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  if (lightbox && triggers.length) {
    var lbImg = lightbox.querySelector("img");
    var lbTitle = lightbox.querySelector(".lb-title");
    var lbText = lightbox.querySelector(".lb-text");
    var lbCount = lightbox.querySelector(".lb-count");
    var btnClose = lightbox.querySelector(".lb-close");
    var btnPrev = lightbox.querySelector(".lb-prev");
    var btnNext = lightbox.querySelector(".lb-next");
    var current = 0;
    var lastFocus = null;

    function render() {
      var t = triggers[current];
      lbImg.src = t.getAttribute("data-full");
      lbImg.alt = t.querySelector("img") ? t.querySelector("img").alt : "";
      lbTitle.textContent = t.getAttribute("data-title") || "";
      lbText.textContent = t.getAttribute("data-caption") || "";
      lbCount.textContent = (current + 1) + " of " + triggers.length;
    }
    function open(i) {
      current = i;
      lastFocus = document.activeElement;
      render();
      lightbox.hidden = false;
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
      btnClose.focus();
    }
    function close() {
      lightbox.classList.remove("open");
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    function step(d) {
      current = (current + d + triggers.length) % triggers.length;
      render();
    }
    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () { open(i); });
    });
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { step(-1); });
    btnNext.addEventListener("click", function () { step(1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------- temper scale ---------- */
  var TEMPER = {
    "220": {
      name: "Light straw",
      text: "As hard as the steel gets in service. Gravers, scrapers and razors are tempered here — edges that must stay keen and are never struck. The price is brittleness: drop a light-straw edge on stone and it chips, not bends."
    },
    "240": {
      name: "Straw",
      text: "The blade temper. Hard enough to hold a keen edge through a day's work, tough enough not to chip on a bone or a knot. Every knife that leaves this forge is tempered here, at straw — about 60 HRC for the chef's knife in Job 209."
    },
    "260": {
      name: "Brown",
      text: "The axe temper. An edge that meets knots, grit and the odd fence staple needs give as much as hardness, so axes and adzes are taken a step further, to brown. It will dull a little sooner and survive a lot longer."
    },
    "280": {
      name: "Purple",
      text: "Where edges start handing over to springs. Saws, sickles and the harder springs are tempered at purple — the steel now bends noticeably before it breaks, and an edge at this heat is for cutting soft material only."
    },
    "300": {
      name: "Blue",
      text: "The spring temper. Clock springs, lock springs, gate springs and saw blades live here: the steel is resilient, meant to flex ten thousand times and come back true. The forge tempers its own gate springs at blue."
    },
    "320": {
      name: "Dark blue",
      text: "Toughness over hardness. Screwdrivers, wrenches, cold chisels for soft stone and the working ends of hammers are tempered at dark blue — tools that are hit for a living and must mushroom slowly rather than shatter."
    },
    "340": {
      name: "Grey",
      text: "The colours are nearly done. At grey the steel is soft enough to file and is used where a part must bend rather than break — catches, clips and the bodies of tools whose working ends were tempered separately, lower down the scale."
    }
  };
  var stops = Array.prototype.slice.call(document.querySelectorAll(".temper-stop"));
  var tdTemp = document.getElementById("td-temp");
  var tdName = document.getElementById("td-name");
  var tdText = document.getElementById("td-text");
  if (stops.length && tdTemp && tdName && tdText) {
    function select(stop) {
      stops.forEach(function (s) { s.setAttribute("aria-pressed", "false"); });
      stop.setAttribute("aria-pressed", "true");
      var d = TEMPER[stop.getAttribute("data-temper")];
      if (!d) return;
      tdTemp.textContent = stop.getAttribute("data-temper") + "°C";
      tdName.textContent = d.name;
      tdText.textContent = d.text;
    }
    stops.forEach(function (stop, i) {
      stop.addEventListener("click", function () { select(stop); });
      stop.addEventListener("keydown", function (e) {
        var j = null;
        if (e.key === "ArrowRight") j = (i + 1) % stops.length;
        if (e.key === "ArrowLeft") j = (i - 1 + stops.length) % stops.length;
        if (j !== null) {
          e.preventDefault();
          stops[j].focus();
          select(stops[j]);
        }
      });
    });
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var confirmation = document.getElementById("confirmation");
    var fields = {
      name: document.getElementById("f-name"),
      email: document.getElementById("f-email"),
      type: document.getElementById("f-type"),
      message: document.getElementById("f-message")
    };
    var errors = {
      name: document.getElementById("e-name"),
      email: document.getElementById("e-email"),
      type: document.getElementById("e-type"),
      message: document.getElementById("e-message")
    };
    function setError(key, bad) {
      fields[key].setAttribute("aria-invalid", bad ? "true" : "false");
      errors[key].classList.toggle("show", bad);
      return !bad;
    }
    function validate() {
      var ok = true;
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.value.trim());
      ok = setError("name", fields.name.value.trim().length < 2) && ok;
      ok = setError("email", !emailOk) && ok;
      ok = setError("type", !fields.type.value) && ok;
      ok = setError("message", fields.message.value.trim().length < 10) && ok;
      return ok;
    }
    Object.keys(fields).forEach(function (key) {
      fields[key].addEventListener("input", function () { setError(key, false); });
      fields[key].addEventListener("change", function () { setError(key, false); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var first = fields.name.value.trim().split(" ")[0];
      document.getElementById("conf-name").textContent = fields.name.value.trim();
      document.getElementById("conf-email").textContent = fields.email.value.trim();
      document.getElementById("conf-type").textContent = fields.type.value;
      document.getElementById("conf-no").textContent =
        "E-" + (1000 + Math.floor(Math.random() * 9000));
      document.getElementById("conf-intro").textContent =
        "Thank you, " + first + " — your enquiry has been checked and written up as it would be entered in the forge's enquiry book.";
      form.style.display = "none";
      confirmation.classList.add("show");
      confirmation.focus();
    });
    var again = document.getElementById("conf-again");
    if (again) {
      again.addEventListener("click", function () {
        confirmation.classList.remove("show");
        form.reset();
        form.style.display = "";
        fields.name.focus();
      });
    }
  }
})();
