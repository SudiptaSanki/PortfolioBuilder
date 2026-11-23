/* Whitaker Watch Workshop — interaction layer.
   Three jobs only: the symptom guide, a restrained scroll reveal,
   and honest form validation. No audio, no canvas, no decoration. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

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

  /* ---------- symptom guide ---------- */
  var SYMPTOMS = {
    stopped: {
      title: "It has stopped altogether",
      cause: "Most often a broken mainspring, lubricants dried to the point the train can no longer move, or a knock that has stopped the balance or displaced a hand so it fouls the dial.",
      first: "The watch is timed (it will not run, and that itself is information), opened and inspected under the microscope. You get a written estimate before anything is done.",
      cost: "<strong>Assessment £45</strong>, deducted in full from a service. A full service runs from £260 (manual) or £320 (automatic); a mainspring, if it has gone, is £45 fitted during the service."
    },
    fast: {
      title: "It suddenly runs fast",
      cause: "A rate that changes overnight is magnetism until proven otherwise: the hairspring’s coils stick together and the watch gains minutes a day. Phones and tablet cases with magnetic clasps, speakers and handbag fasteners are the usual sources.",
      first: "A ten-second pass through the demagnetiser, then a timing check in five positions. If the rate settles — and it usually does — the watch needs nothing else.",
      cost: "<strong>Timing check &amp; demagnetise £30.</strong> If the rate will not settle afterwards, the watch was due a service anyway, and the £30 is the start of finding out."
    },
    drift: {
      title: "It gains or loses a few minutes a week",
      cause: "Gradual drift is a movement at the end of its service interval: thickening oils, a mainspring losing strength, amplitude falling. Regulation alone can mask it briefly, but the figures come back within months.",
      first: "Timing check in five positions with the amplitude read carefully. Low amplitude with a wandering rate means a service; a healthy amplitude means a simple regulation may honestly do.",
      cost: "<strong>Timing check £30</strong> to find out which. Regulation, if that is all it needs, is included in the check; a service is from £260."
    },
    moisture: {
      title: "There is moisture under the glass",
      cause: "A failed seal — caseback, crown or crystal gasket — has let water in. This is the one urgent entry on this page: rust begins on steel parts within days.",
      first: "Keep the watch dry and unworn. Do not put it on a radiator or in rice and hope; the water is already inside the movement. Get it to a bench within days so the case can be opened, the movement dried and the damage assessed.",
      cost: "<strong>Assessment £45</strong> as fast as the bench can take it. Caught early, it is a service and a gasket set (from £260 + £35). Caught late, rust decides the bill — which is why the assessment comes first."
    },
    crown: {
      title: "The crown feels gritty or won’t screw down",
      cause: "Dirt and dried grease in the threads, or a worn crown tube — common on watches that are wound daily. Forcing a cross-threaded crown turns a small job into a case repair.",
      first: "Stop forcing it and leave the crown as it is. At the bench the crown and tube are cleaned and inspected; if the tube threads are worn, the crown and tube are replaced as a pair, then the case is resealed.",
      cost: "<strong>Crown and tube from £60</strong>, including a reseal and pressure test. If the watch is due a service anyway, the labour folds into it."
    },
    loose: {
      title: "Something rattles, or a hand has come loose",
      cause: "A hand worked loose on its post, a movement clamp screw adrift, or — on an automatic — a rotor screw. Small parts moving freely inside a case can scratch a dial or jam the train.",
      first: "Stop wearing it and keep it dial-up and still, so the loose part stays where it fell. At the bench the case is opened, the part recovered, and the cause checked before anything is refitted.",
      cost: "<strong>From £40</strong> to open, recover and refit. If the loose part has marked the dial or stopped the movement, the assessment will say so before you spend more."
    }
  };

  var panel = document.getElementById("triage-panel");
  var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-symptom]"));

  function showSymptom(key) {
    var s = SYMPTOMS[key];
    if (!s || !panel) return;
    panel.innerHTML =
      "<h3>" + s.title + "</h3>" +
      "<dl>" +
      "<dt>Likely cause</dt><dd>" + s.cause + "</dd>" +
      "<dt>First step</dt><dd>" + s.first + "</dd>" +
      "<dt>What it costs</dt><dd>" + s.cost + "</dd>" +
      "</dl>" +
      '<p style="margin-top:16px"><a class="btn quiet" href="contact.html">Book this in</a></p>';
    buttons.forEach(function (b) {
      b.setAttribute("aria-expanded", b.getAttribute("data-symptom") === key ? "true" : "false");
    });
  }

  if (panel && buttons.length) {
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { showSymptom(b.getAttribute("data-symptom")); });
    });
    showSymptom("stopped");
  }

  /* ---------- mobile nav: crown button, sheet from the right ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  var navScrim = document.getElementById("nav-scrim");
  if (navToggle && mobileNav && navScrim) {
    var navLinks = mobileNav.querySelectorAll("a");
    function openNav() {
      mobileNav.hidden = false;
      navScrim.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          mobileNav.classList.add("open");
          navScrim.classList.add("show");
          /* Focus only once .open has made the sheet visible: while it
             still has visibility:hidden (until this frame), focus() on a
             link inside it is a no-op and focus stays on the toggle. */
          if (navLinks.length) navLinks[0].focus();
        });
      });
      navToggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function closeNav(restoreFocus) {
      mobileNav.classList.remove("open");
      navScrim.classList.remove("show");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      window.setTimeout(function () {
        if (!mobileNav.classList.contains("open")) {
          mobileNav.hidden = true;
          navScrim.hidden = true;
        }
      }, 320);
      if (restoreFocus !== false) navToggle.focus();
    }
    navToggle.addEventListener("click", function () {
      if (mobileNav.classList.contains("open")) closeNav();
      else openNav();
    });
    navScrim.addEventListener("click", function () { closeNav(); });
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () { closeNav(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("open")) closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 700 && mobileNav.classList.contains("open")) closeNav(false);
    });
  }

  /* ---------- scroll reveal (restrained, reduced-motion safe) ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (revealEls.length && "IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- booking form ---------- */
  var form = document.getElementById("book-form");
  if (form) {
    var confirmation = document.getElementById("confirmation");
    var fields = {
      name: { input: document.getElementById("f-name"), error: document.getElementById("e-name"),
              test: function (v) { return v.trim().length >= 2; } },
      email: { input: document.getElementById("f-email"), error: document.getElementById("e-email"),
               test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      watch: { input: document.getElementById("f-watch"), error: document.getElementById("e-watch"),
               test: function (v) { return v.trim().length >= 3; } },
      message: { input: document.getElementById("f-msg"), error: document.getElementById("e-msg"),
                 test: function (v) { return v.trim().length >= 10; } }
    };

    function validate(key) {
      var f = fields[key];
      var ok = f.test(f.input.value);
      f.input.setAttribute("aria-invalid", ok ? "false" : "true");
      if (f.error) f.error.hidden = ok;
      return ok;
    }

    Object.keys(fields).forEach(function (key) {
      fields[key].input.addEventListener("blur", function () { validate(key); });
      fields[key].input.addEventListener("input", function () {
        if (fields[key].input.getAttribute("aria-invalid") === "true") validate(key);
      });
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var keys = Object.keys(fields);
      var results = keys.map(validate);
      if (results.indexOf(false) !== -1) {
        fields[keys[results.indexOf(false)]].input.focus();
        return;
      }
      document.getElementById("c-name").textContent = fields.name.input.value.trim().split(" ")[0];
      document.getElementById("c-watch").textContent = fields.watch.input.value.trim();
      document.getElementById("c-service").textContent = document.getElementById("f-service").value;
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.focus();
    });

    document.getElementById("again").addEventListener("click", function () {
      form.reset();
      Object.keys(fields).forEach(function (key) {
        fields[key].input.setAttribute("aria-invalid", "false");
        if (fields[key].error) fields[key].error.hidden = true;
      });
      confirmation.hidden = true;
      form.hidden = false;
      fields.name.input.focus();
    });
  }
})();
