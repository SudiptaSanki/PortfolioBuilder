/* Charred Oak — interactions
   1. Char & toast selector (the fire is the specification)
   2. Photograph lightbox
   3. Enquiry form validation (demonstration — transmits nothing)
   4. Mobile nav (individuality pass) */
(function () {
  "use strict";

  /* ---------- 1. Char & toast selector ---------- */
  var CHAR = {
    "light-toast": {
      name: "Light toast",
      surface: "No char at all. The inside is warmed slowly over a low fire until the oak turns golden and the surface stays smooth to the hand.",
      time: "45–60 minutes of gentle heat",
      gives: "Fresh oak sweetness — coconut, light vanilla, a whisper of toast — with the tannin kept soft and the wood firmly in the background.",
      use: "White wines, cider, and delicate spirits that want oak as a frame, not a flavour.",
      cost: "A light toast will not stand up to a big, loud new-make spirit. It will simply be out-shouted.",
      blocks: 0,
      depth: "No char layer"
    },
    "medium-toast": {
      name: "Medium toast",
      surface: "Toasted through to a deep, even brown. Still no char layer — the wood's sugars have caramelised, not burned.",
      time: "About an hour, heat raised in stages",
      gives: "Vanilla and caramel in balance, baking spice, a rounded sweetness that reads as richness rather than smoke.",
      use: "Red wine barriques, rum, and malt whisky that wants oak flavour without charcoal filtration.",
      cost: "No charcoal means no filtration. A rough spirit stays rough — just sweeter.",
      blocks: 0,
      depth: "No char layer"
    },
    "medium-plus": {
      name: "Medium-plus toast",
      surface: "Brown verging on black at the ridges of the grain, with the first real hint of smoke in the wood.",
      time: "60–75 minutes, finished hotter",
      gives: "Everything a medium toast gives, pushed darker: coffee, cocoa, toasted nuts, and a trace of smoke at the back.",
      use: "Full-bodied reds, sherry-style malts, and spirits with enough weight to carry a dark toast.",
      cost: "Push toast this far under a delicate wine and the oak becomes the flavour instead of the frame.",
      blocks: 1,
      depth: "Scorched surface only"
    },
    "char-1": {
      name: "Char #1",
      surface: "The inside is set alight and the surface blackens, just beginning to crack into a thin, tight char.",
      time: "About 15 seconds of open flame",
      gives: "Fast colour, light vanilla and a gentle smoke note, with mild filtration of the spirit's rough edges.",
      use: "Younger bourbons and ryes, and distillers who want some of char's benefit without its full weight.",
      cost: "Fifteen seconds is a light touch: less charcoal, less filtering. A harsh spirit keeps more of its harshness.",
      blocks: 3,
      depth: "about 1–2 mm"
    },
    "char-2": {
      name: "Char #2",
      surface: "The cracks open wider and the char layer thickens into a clear, even black.",
      time: "About 30 seconds of open flame",
      gives: "Deeper colour, caramel and spice, with the smoke stepping forward and filtration doing real work.",
      use: "Bourbon in the classic range, aged rum, and spirits resting two to six years.",
      cost: "The middle of the road is still a choice: spirits that wanted delicacy will find this fire opinionated.",
      blocks: 5,
      depth: "about 2–3 mm"
    },
    "char-3": {
      name: "Char #3",
      surface: "Deep cracking across the whole surface — the alligator pattern forming in earnest.",
      time: "About 40 seconds of open flame",
      gives: "Strong filtration, dark caramel, pronounced smoke and spice, and colour that arrives early and stays.",
      use: "High-rye bourbon, robust malts, and anything planning a long rest in a warm warehouse.",
      cost: "Approaching alligator char: a delicate distillate's own character starts to be planed away.",
      blocks: 7,
      depth: "about 3–4 mm"
    },
    "char-4": {
      name: "Char #4 — Alligator",
      surface: "The inside is set fully alight until the surface cracks into the deep, scaled pattern coopers call alligator char.",
      time: "About 55 seconds",
      gives: "The fastest colour and the strongest filtration of the seven fires: deep vanilla, dark caramel, smoke at the edges, and the rough edges of new-make spirit pulled through the charcoal.",
      use: "Bourbon and rye that will rest four years or more, and any spirit that arrives at the cask loud and needs calming down.",
      cost: "A heavy char can bully a delicate spirit. If your new-make is light, this fire will bury it.",
      blocks: 9,
      depth: "about 4–5 mm"
    }
  };

  var charButtons = Array.prototype.slice.call(document.querySelectorAll("[data-char]"));
  if (charButtons.length) {
    var el = {
      name: document.getElementById("charName"),
      surface: document.getElementById("charSurface"),
      time: document.getElementById("charTime"),
      gives: document.getElementById("charGives"),
      use: document.getElementById("charUse"),
      cost: document.getElementById("charCost"),
      depthValue: document.getElementById("depthValue"),
      blocks: Array.prototype.slice.call(document.querySelectorAll("#depthBlocks span"))
    };
    function setChar(key) {
      var d = CHAR[key];
      if (!d) return;
      charButtons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-char") === key ? "true" : "false");
      });
      el.name.textContent = d.name;
      el.surface.textContent = d.surface;
      el.time.textContent = d.time;
      el.gives.textContent = d.gives;
      el.use.textContent = d.use;
      el.cost.textContent = d.cost;
      el.depthValue.textContent = d.depth;
      el.blocks.forEach(function (s, i) {
        s.classList.toggle("on", i < d.blocks);
      });
    }
    charButtons.forEach(function (b) {
      b.addEventListener("click", function () { setChar(b.getAttribute("data-char")); });
    });
    setChar("char-4");
  }

  /* ---------- 2. Lightbox ---------- */
  var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var lb = document.getElementById("lightbox");
  if (triggers.length && lb) {
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector(".lb-caption");
    var lbCount = lb.querySelector(".count");
    var btnClose = lb.querySelector(".lb-close");
    var btnPrev = lb.querySelector(".lb-prev");
    var btnNext = lb.querySelector(".lb-next");
    var current = 0;
    var lastFocus = null;

    function show(i) {
      current = (i + triggers.length) % triggers.length;
      var t = triggers[current];
      var inner = t.querySelector("img");
      lbImg.src = t.getAttribute("data-full");
      lbImg.alt = inner ? inner.alt : "";
      lbCap.textContent = t.getAttribute("data-caption") || "";
      lbCount.textContent = (current + 1) + " / " + triggers.length;
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.hidden = false;
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      btnClose.focus();
    }
    function close() {
      lb.classList.remove("open");
      lb.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    triggers.forEach(function (t, i) {
      t.addEventListener("click", function () { open(i); });
    });
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { show(current - 1); });
    btnNext.addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.classList.contains("open")) {
        if (e.key === "Escape") close();
        if (e.key === "ArrowLeft") show(current - 1);
        if (e.key === "ArrowRight") show(current + 1);
      }
    });
  }

  /* ---------- 3. Enquiry form ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var summary = document.getElementById("formSummary");
    var confirmation = document.getElementById("confirmation");
    var fields = {
      name: {
        input: document.getElementById("fName"),
        err: document.getElementById("eName"),
        valid: function (v) { return v.trim().length >= 2; }
      },
      email: {
        input: document.getElementById("fEmail"),
        err: document.getElementById("eEmail"),
        valid: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
      },
      type: {
        input: document.getElementById("fType"),
        err: document.getElementById("eType"),
        valid: function (v) { return v !== ""; }
      },
      qty: {
        input: document.getElementById("fQty"),
        err: document.getElementById("eQty"),
        valid: function (v) {
          if (v.trim() === "") return true;
          var n = Number(v);
          return Number.isInteger(n) && n >= 1 && n <= 500;
        }
      },
      msg: {
        input: document.getElementById("fMsg"),
        err: document.getElementById("eMsg"),
        valid: function (v) { return v.trim().length >= 10; }
      }
    };

    function checkField(f) {
      var ok = f.valid(f.input.value);
      f.input.setAttribute("aria-invalid", ok ? "false" : "true");
      f.err.classList.toggle("show", !ok);
      return ok;
    }
    Object.keys(fields).forEach(function (k) {
      var f = fields[k];
      f.input.addEventListener("input", function () {
        if (f.input.getAttribute("aria-invalid") === "true") checkField(f);
      });
      f.input.addEventListener("change", function () {
        if (f.input.getAttribute("aria-invalid") === "true") checkField(f);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = [];
      Object.keys(fields).forEach(function (k) {
        if (!checkField(fields[k])) bad.push(fields[k]);
      });
      if (bad.length) {
        summary.textContent = bad.length === 1
          ? "One thing needs attention before this can be sent — it is marked below."
          : bad.length + " things need attention before this can be sent — they are marked below.";
        summary.classList.add("show");
        summary.focus();
        return;
      }
      summary.classList.remove("show");
      var ref = "CO-2026-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("refNumber").textContent = "Reference: " + ref;
      form.style.display = "none";
      confirmation.classList.add("show");
      confirmation.focus();
    });

    document.getElementById("againBtn").addEventListener("click", function () {
      form.reset();
      Object.keys(fields).forEach(function (k) {
        fields[k].input.removeAttribute("aria-invalid");
        fields[k].err.classList.remove("show");
      });
      confirmation.classList.remove("show");
      form.style.display = "";
      document.getElementById("fName").focus();
    });
  }

  /* ---------- 4. Mobile nav ---------- */
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
      }, 260);
      if (restoreFocus !== false) navToggle.focus();
    }
    navToggle.addEventListener("click", function () {
      if (mobileNav.classList.contains("open")) closeNav();
      else openNav();
    });
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () { closeNav(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("open")) closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 640 && mobileNav.classList.contains("open")) closeNav(false);
    });
  }
})();
