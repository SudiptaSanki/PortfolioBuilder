/* Rosewood Tone — interactions.
   Lightbox for the instrument register, the tonewood pairing explorer,
   enquiry-form validation, and a quiet reveal on scroll.
   There is deliberately no audio on this site: the instruments are
   described, not impersonated. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveal on scroll (instrument cards only — one authored
       moment, not an identical entrance on every section) ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll(".inst[data-reveal]");
    if (revealEls.length) {
      revealEls.forEach(function (el) { el.classList.add("reveal-init"); });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- lightbox ---------- */
  var lb = document.querySelector(".lightbox");
  var photoBtns = Array.prototype.slice.call(document.querySelectorAll(".photo-btn"));
  if (lb && photoBtns.length) {
    var lbImg = lb.querySelector("img");
    var lbTitle = lb.querySelector(".lb-title");
    var lbText = lb.querySelector(".lb-text");
    var lbCount = lb.querySelector(".lb-count");
    var btnClose = lb.querySelector(".lb-close");
    var btnPrev = lb.querySelector(".lb-prev");
    var btnNext = lb.querySelector(".lb-next");
    var current = 0;
    var lastFocus = null;

    function render() {
      var btn = photoBtns[current];
      var img = btn.querySelector("img");
      lbImg.src = btn.getAttribute("data-full") || img.src;
      lbImg.alt = img.alt;
      lbTitle.textContent = btn.getAttribute("data-title") || "";
      lbText.textContent = btn.getAttribute("data-text") || "";
      lbCount.textContent = (current + 1) + " / " + photoBtns.length;
    }
    function open(idx, trigger) {
      current = idx;
      lastFocus = trigger || document.activeElement;
      render();
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      btnClose.focus();
    }
    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function step(delta) {
      current = (current + delta + photoBtns.length) % photoBtns.length;
      render();
    }
    photoBtns.forEach(function (btn, i) {
      btn.addEventListener("click", function () { open(i, btn); });
    });
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { step(-1); });
    btnNext.addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  /* ---------- tonewood pairing explorer ---------- */
  var explorer = document.querySelector("[data-explorer]");
  if (explorer) {
    var TOPS = {
      sitka: {
        name: "Sitka spruce",
        text: "The workhorse top. Stiff for its weight, with headroom to spare — it stays clear when driven hard with a flatpick and still answers a light touch. Most bluegrass and hard-strummed guitars start here."
      },
      engelmann: {
        name: "Engelmann spruce",
        text: "Lighter and softer than Sitka, Engelmann opens up quickly and rewards fingerstyle: warm, complex, with a little less headroom before the sound compresses."
      },
      cedar: {
        name: "Western red cedar",
        text: "Warm from the first day — rich overtones and a quick response at low volume. Cedar suits fingerstyle and recording, and asks to be played rather than attacked."
      },
      adirondack: {
        name: "Adirondack spruce",
        text: "Red spruce, the pre-war dreadnought top. Very stiff, very loud, slow to break in and worth the wait — the choice when projection is the whole brief."
      }
    };
    var BACKS = {
      rosewood: {
        name: "Indian rosewood",
        text: "Deep bass, glassy trebles, long sustain — a reflective back that adds shimmer and complexity to whatever top sits over it."
      },
      mahogany: {
        name: "Honduran mahogany",
        text: "Light, dry and woody. Mahogany emphasises the fundamental note and keeps overtones in check — clarity over richness."
      },
      walnut: {
        name: "Black walnut",
        text: "Grown across the eastern US and still underused: warm like mahogany with some of rosewood's depth, and it keeps the low end defined."
      },
      maple: {
        name: "Big-leaf maple",
        text: "Hard and reflective in a different way — bright, focused, fast-decaying. Maple projects and cuts; it does not bloom."
      }
    };
    var PAIRINGS = {
      "sitka|rosewood": "The classic dreadnought recipe: Sitka's headroom over rosewood's depth and shimmer. Loud, dark at the edges, built to hold its own in a band mix.",
      "sitka|mahogany": "Dry, woody and forward. Mahogany trims the overtones and leaves the fundamental — a recording-friendly, honest sound.",
      "sitka|walnut": "Between mahogany and rosewood: walnut keeps Sitka's clarity and adds a low-mid warmth without rosewood's metallic edge.",
      "sitka|maple": "Bright and immediate, with a fast decay. Maple under Sitka makes a guitar that cuts on stage and sits forward in a mix.",
      "engelmann|rosewood": "A fingerstyle pairing: Engelmann's quick warmth over rosewood's long sustain. Complex at low volume, forgiving under the fingers.",
      "engelmann|mahogany": "Soft-spoken and dry. The two woods keep each other honest — a small-room, close-miked sound with very little gloss.",
      "engelmann|walnut": "Warm and rounded, with walnut's clarity keeping the low end tidy. A natural fit for the OM body.",
      "engelmann|maple": "Maple's focus reins in Engelmann's softness: articulate, bright-edged, quick to settle — a good pairing for alternate tunings.",
      "cedar|rosewood": "The recording OM recipe behind No. 41: cedar's instant warmth over rosewood depth, the top voiced thin for a dry, close sound.",
      "cedar|mahogany": "All warmth, no glare. Cedar over mahogany is intimate and woody — a songwriter's guitar for small rooms.",
      "cedar|walnut": "Cedar's overtones with walnut's dry centre. Balanced and open, especially in the smaller parlor body.",
      "cedar|maple": "An unusual pairing that works: maple's fast decay keeps cedar's richness from blurring. Clear, short, vocal.",
      "adirondack|rosewood": "The bluegrass specification: red spruce over rosewood with forward-shifted bracing, built to be heard at the back of the hall.",
      "adirondack|mahogany": "The pre-war slope-shoulder recipe. Punchy, dry and loud, with a midrange that flatpicks beautifully.",
      "adirondack|walnut": "Power with a warmer centre than rosewood gives. Walnut under Adirondack suits a heavy right hand in open tunings.",
      "adirondack|maple": "Maximum projection and cut. A stage guitar first — bright, loud and quick, with little interest in being subtle."
    };
    var state = { top: "sitka", back: "rosewood" };
    var topName = explorer.querySelector("[data-out='top-name']");
    var topText = explorer.querySelector("[data-out='top-text']");
    var backName = explorer.querySelector("[data-out='back-name']");
    var backText = explorer.querySelector("[data-out='back-text']");
    var pairText = explorer.querySelector("[data-out='pair-text']");

    function renderWood() {
      topName.textContent = TOPS[state.top].name + " — the top";
      topText.textContent = TOPS[state.top].text;
      backName.textContent = BACKS[state.back].name + " — back & sides";
      backText.textContent = BACKS[state.back].text;
      pairText.textContent = PAIRINGS[state.top + "|" + state.back];
    }
    function wire(groupName, key) {
      var btns = explorer.querySelectorAll("[data-group='" + groupName + "'] .wood-btn");
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          btns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          btn.setAttribute("aria-pressed", "true");
          state[key] = btn.getAttribute("data-value");
          renderWood();
        });
      });
    }
    wire("tops", "top");
    wire("backs", "back");
    renderWood();
  }

  /* ---------- mobile nav: the case lid ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  if (navToggle && mobileNav) {
    var navLinks = mobileNav.querySelectorAll("a");
    var navOpen = false;
    function setNav(open, refocus) {
      navOpen = open;
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
      mobileNav.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        if (navLinks.length) navLinks[0].focus();
      } else if (refocus) {
        navToggle.focus();
      }
    }
    navToggle.addEventListener("click", function () { setNav(!navOpen, true); });
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () { setNav(false, false); });
    });
    document.addEventListener("keydown", function (e) {
      if (navOpen && e.key === "Escape") setNav(false, true);
    });
    var navMq = window.matchMedia("(max-width: 820px)");
    function navMqChange(e) { if (!e.matches && navOpen) setNav(false, false); }
    if (navMq.addEventListener) navMq.addEventListener("change", navMqChange);
    else if (navMq.addListener) navMq.addListener(navMqChange);
  }

  /* ---------- enquiry form ---------- */
  var form = document.querySelector("[data-enquiry-form]");
  if (form) {
    var confirmation = document.querySelector(".confirmation");
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setError(input, message) {
      var err = form.querySelector("[data-error-for='" + input.id + "']");
      if (message) {
        input.setAttribute("aria-invalid", "true");
        if (err) { err.textContent = message; err.classList.add("show"); }
      } else {
        input.removeAttribute("aria-invalid");
        if (err) { err.textContent = ""; err.classList.remove("show"); }
      }
      return !message;
    }
    function validate() {
      var ok = true;
      var name = form.querySelector("#f-name");
      var email = form.querySelector("#f-email");
      var type = form.querySelector("#f-type");
      var details = form.querySelector("#f-details");
      if (!setError(name, name.value.trim().length >= 2 ? "" : "Please give your name.")) ok = false;
      if (!setError(email, emailRe.test(email.value.trim()) ? "" : "Please give a valid email address.")) ok = false;
      if (!setError(type, type.value ? "" : "Please choose what the enquiry is about.")) ok = false;
      if (!setError(details, details.value.trim().length >= 20 ? "" : "A little more detail helps — at least a sentence or two (20 characters).")) ok = false;
      return ok;
    }
    ["f-name", "f-email", "f-type", "f-details"].forEach(function (id) {
      var input = form.querySelector("#" + id);
      if (input) {
        input.addEventListener("input", function () { setError(input, ""); });
        input.addEventListener("change", function () { setError(input, ""); });
      }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector("[aria-invalid='true']");
        if (firstBad) firstBad.focus();
        return;
      }
      var name = form.querySelector("#f-name").value.trim().split(" ")[0];
      var typeSel = form.querySelector("#f-type");
      var typeLabel = typeSel.options[typeSel.selectedIndex].text;
      var cName = confirmation.querySelector("[data-confirm='name']");
      var cType = confirmation.querySelector("[data-confirm='type']");
      if (cName) cName.textContent = name;
      if (cType) cType.textContent = typeLabel;
      form.style.display = "none";
      confirmation.classList.add("show");
      confirmation.setAttribute("tabindex", "-1");
      confirmation.focus();
      confirmation.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  }
})();
