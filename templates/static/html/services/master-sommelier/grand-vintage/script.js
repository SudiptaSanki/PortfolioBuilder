/* Grand Vintage — cellar book interactions.
   Sound ruling: this site makes no sound. The stub's hover-triggered
   glass clink failed the programme's sound need-test (a sommelier's
   profession is taste and smell, not audio; hover audio is a
   deal-breaker regardless) and was deleted, not rebuilt. */
(function () {
  "use strict";

  /* Cross-document view transitions abort harmlessly when a second
     navigation interrupts one; swallow only that rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile menu: the book panel ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var panel = document.getElementById("bookPanel");
  if (menuBtn && panel) {
    var open = false;
    function setPanel(toOpen) {
      open = toOpen;
      menuBtn.setAttribute("aria-expanded", String(open));
      if (open) {
        panel.hidden = false;
        document.body.classList.add("locked");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = panel.querySelector("a");
            if (first) first.focus();
          });
        });
      } else {
        panel.hidden = true;
        document.body.classList.remove("locked");
      }
    }
    menuBtn.addEventListener("click", function () { setPanel(!open); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) { setPanel(false); menuBtn.focus(); }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setPanel(false);
    });
  }

  /* ---------- reveal on scroll (opacity only, gated) ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll("[data-reveal]");
    revealEls.forEach(function (el) { el.classList.add("rv"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- the cellar explorer ---------- */
  var BOTTLES = {
    bin04: {
      bin: "Bin 04", name: "Left-bank Bordeaux, 2005", price: "£145 a bottle",
      prov: "Bought in 2023 from the cellar of a Kent collector who bought the wine on release through a London merchant. Invoices seen and copied. One private cellar from new until 2023, then my bonded store.",
      cond: "Fill: base of neck. Capsule clean, lightly scuffed at the rim. The cork has not been drawn — I do not pull corks to inspect, so the level and the capsule are what I stand behind. Label cellar-dusty, one corner lifted.",
      win: "Drink now to 2032 — my judgement. The tannin has resolved and the fruit is still ahead of the tertiary notes; this is the plateau, not the climb.",
      pair: "Roast lamb, or a hard sheep's cheese after. It does not need rich food; it needs quiet food.",
      held: "12 bottles held. Sold singly or by the case."
    },
    bin07: {
      bin: "Bin 07", name: "Right-bank Bordeaux, 2000", price: "£120 a bottle",
      prov: "From a Surrey cellar dispersed in 2024. Bought on release and held at a merchant's bonded warehouse until 2019, then five years in a home cellar with a cooling unit. That gap in professional storage is declared, and it is why the bottle is £120 and not £150.",
      cond: "Fill: into neck — remarkable for the year, and the reason I bought the parcel. Capsule bright. One bottle in six shows light damp-spotting on the label; if yours is one, you will be told before it ships, not after.",
      win: "Drink now to 2028 — my judgement. Fully mature; the pleasure is in the softness now, not in waiting for more.",
      pair: "Duck in almost any form, or mushrooms on toast for a quieter plate.",
      held: "6 bottles held."
    },
    bin11: {
      bin: "Bin 11", name: "Red Burgundy, village appellation, 2010", price: "£95 a bottle",
      prov: "Bought in 2022 at a regional sale from a Beaune négociant's library stock. The levels across the parcel are consistent to within a few millimetres, which is what you want to see — a parcel that has lived one life, together.",
      cond: "Level: 2 cm below the cork — sound for fifteen years in a Burgundy bottle (levels here are measured in centimetres; see the table below). Capsules waxed, two cracked at the crown. Corks not drawn.",
      win: "Drink now to 2027 — my judgement. This rewards the next two winters most; after that the fruit thins faster than the structure.",
      pair: "Roast chicken, guinea fowl, or a mushroom risotto.",
      held: "8 bottles held."
    },
    bin13: {
      bin: "Bin 13", name: "White Burgundy, premier cru, 2014", price: "£68 a bottle",
      prov: "From the same Beaune library parcel as Bin 11, bought in 2022. White Burgundy of this age is the riskiest thing in this book, so the provenance is printed in full and the price carries the risk, not the buyer alone.",
      cond: "Level: 1 cm below the cork. Colour pale gold through the glass, no browning at the shoulder. One bottle in the parcel shows early colour advance; it is listed separately at £40 and described, not hidden inside the parcel.",
      win: "Drink now, and by the end of 2026 — my judgement. Do not cellar this further; its best year is this one.",
      pair: "Grilled fish with brown butter, or scallops.",
      held: "5 bottles held at £68, plus the one advanced bottle at £40."
    },
    bin16: {
      bin: "Bin 16", name: "Northern Rhône Syrah, 2012", price: "£74 a bottle",
      prov: "Bought in 2021 from a Manchester restaurant group reducing its list. Stored in their temperature-controlled cellar from delivery; their cellar records were shown and copied. Restaurant provenance, declared as such.",
      cond: "Fill: into neck. Capsules tight, labels clean — careful restaurant storage shows in the labels, not in the wine. Sediment present and expected; stand the bottle upright for a day before opening.",
      win: "Drink now to 2029 — my judgement. The olive and smoke notes are open; the structure has years left.",
      pair: "Slow-cooked beef, anything with black pepper, or a hard-cooked stew of beans and herbs.",
      held: "7 bottles held."
    },
    bin19: {
      bin: "Bin 19", name: "Vintage Champagne, 2008", price: "£110 a bottle",
      prov: "Bought in 2023 from a London private client who bought two cases on release from a Champagne merchant and drank one. Stored in a purpose-built home cellar; purchase invoice seen.",
      cond: "Fill is not graded for Champagne — the wine sits high in the neck and the punt hides the rest. Foil clean and uncut, capsule sound. The cork has not been drawn, so the pressure in the bottle cannot be inspected without opening it; that unknown is stated here and priced in.",
      win: "Drink now to 2030 — my judgement. 2008 acidity is still carrying it; the toast and citrus are in balance now.",
      pair: "Oysters if you must, but it is better with fried food — gougères, chips, tempura. Salt and fat are what this acidity is for.",
      held: "9 bottles held."
    }
  };

  var sheet = document.getElementById("bottleSheet");
  if (sheet) {
    var fields = {
      bin: document.getElementById("shBin"), name: document.getElementById("shName"),
      price: document.getElementById("shPrice"), prov: document.getElementById("shProv"),
      cond: document.getElementById("shCond"), win: document.getElementById("shWin"),
      pair: document.getElementById("shPair"), held: document.getElementById("shHeld")
    };
    var btns = document.querySelectorAll(".bottle-btn");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var b = BOTTLES[btn.getAttribute("data-bottle")];
        if (!b) return;
        btns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        fields.bin.textContent = b.bin;
        fields.name.textContent = b.name;
        fields.price.textContent = b.price;
        fields.prov.textContent = b.prov;
        fields.cond.textContent = b.cond;
        fields.win.textContent = b.win;
        fields.pair.textContent = b.pair;
        fields.held.textContent = b.held;
      });
    });
  }

  /* ---------- the case-mix calculator ---------- */
  var calcRoot = document.getElementById("caseCalc");
  if (calcRoot) {
    var rows = calcRoot.querySelectorAll(".calc-row");
    var elBottles = document.getElementById("calcBottles");
    var elSubtotal = document.getElementById("calcSubtotal");
    var elDiscount = document.getElementById("calcDiscount");
    var elDelivery = document.getElementById("calcDelivery");
    var elTotal = document.getElementById("calcTotal");
    var elHint = document.getElementById("calcHint");

    function fmt(n) {
      var rounded = Math.round(n * 100) / 100;
      var s = rounded.toFixed(2);
      if (s.slice(-3) === ".00") s = s.slice(0, -3);
      return "£" + s;
    }

    function recalc() {
      var bottles = 0, subtotal = 0;
      rows.forEach(function (row) {
        var price = parseFloat(row.getAttribute("data-price"));
        var qty = parseInt(row.querySelector(".qty").textContent, 10) || 0;
        bottles += qty;
        subtotal += qty * price;
        row.querySelector(".cr-line").textContent = fmt(qty * price);
      });
      var discount = (bottles > 0 && bottles % 6 === 0) ? subtotal * 0.10 : 0;
      var net = subtotal - discount;
      var delivery = bottles === 0 ? 0 : (net >= 300 ? 0 : 18);
      elBottles.textContent = String(bottles);
      elSubtotal.textContent = fmt(subtotal);
      elDiscount.textContent = discount > 0 ? "−" + fmt(discount) : fmt(0);
      elDelivery.textContent = bottles === 0 ? fmt(0) : (delivery === 0 ? "Free" : fmt(delivery));
      elTotal.textContent = fmt(net + delivery);
      if (bottles === 0) {
        elHint.textContent = "Add bottles with the steppers. A full case — 6 or 12 bottles, or any multiple of 6 — takes 10% off the bottle total. Delivery is £18, and free once the order reaches £300 after any discount.";
      } else if (discount > 0) {
        elHint.textContent = "That is a full case of " + bottles + ", so the 10% case discount is applied above. " + (delivery === 0 ? "Delivery is free at this value." : "Delivery is added below the £300 free-delivery line.");
      } else {
        var toCase = 6 - (bottles % 6);
        elHint.textContent = "No case discount yet — add " + toCase + " more bottle" + (toCase === 1 ? "" : "s") + " to complete a case of " + (bottles + toCase) + " and take 10% off the bottle total.";
      }
    }

    rows.forEach(function (row) {
      var qtyEl = row.querySelector(".qty");
      row.querySelectorAll(".stepper button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var step = parseInt(btn.getAttribute("data-step"), 10);
          var qty = (parseInt(qtyEl.textContent, 10) || 0) + step;
          qty = Math.max(0, Math.min(24, qty));
          qtyEl.textContent = String(qty);
          recalc();
        });
      });
    });
    recalc();
  }

  /* ---------- contact form (demonstration — transmits nothing) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var done = document.getElementById("formDone");
    var doneRef = document.getElementById("doneRef");
    var doneSummary = document.getElementById("doneSummary");

    function setErr(input, errEl, bad) {
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      if (errEl) errEl.classList.toggle("show", bad);
      return !bad;
    }
    function validate() {
      var name = document.getElementById("cf-name");
      var email = document.getElementById("cf-email");
      var msg = document.getElementById("cf-msg");
      var ok = true;
      ok = setErr(name, document.getElementById("err-name"), name.value.trim().length < 2) && ok;
      ok = setErr(email, document.getElementById("err-email"), !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = setErr(msg, document.getElementById("err-msg"), msg.value.trim().length < 10) && ok;
      return ok;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var type = document.getElementById("cf-type");
      var ref = "GV-2026-" + Math.floor(100 + Math.random() * 900);
      doneRef.textContent = ref;
      doneSummary.textContent = "Enquiry type: " + type.options[type.selectedIndex].text +
        ". In the real practice this reference is quoted in a reply from the cellar email within two working days.";
      form.hidden = true;
      done.hidden = false;
      done.setAttribute("tabindex", "-1");
      done.focus();
    });
    var again = document.getElementById("sendAnother");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        form.querySelectorAll("[aria-invalid]").forEach(function (i) { i.setAttribute("aria-invalid", "false"); });
        form.querySelectorAll(".err").forEach(function (x) { x.classList.remove("show"); });
        done.hidden = true;
        form.hidden = false;
        document.getElementById("cf-name").focus();
      });
    }

    /* preselect enquiry type from ?type= (e.g. links from the cellar page) */
    var params = new URLSearchParams(window.location.search);
    var t = params.get("type");
    if (t) {
      var sel = document.getElementById("cf-type");
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === t) { sel.selectedIndex = i; break; }
      }
    }
  }
})();
