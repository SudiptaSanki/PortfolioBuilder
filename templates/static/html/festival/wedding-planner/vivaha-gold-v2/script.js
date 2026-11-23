/* Vivaha Gold — site script. Nav panel, budget planner, enquiry form. */
(function () {
  "use strict";

  /* View-transition aborts surface as unhandled rejections; swallow only those. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- mobile nav panel ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.getElementById("navPanel");
  var scrim = document.getElementById("navScrim");
  var closeBtn = panel ? panel.querySelector(".panel-close") : null;
  function openPanel() {
    if (!panel) return;
    panel.classList.add("open");
    if (scrim) scrim.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    requestAnimationFrame(function () {
      var first = panel.querySelector("nav a");
      if (first) first.focus();
    });
  }
  function closePanel() {
    if (!panel) return;
    panel.classList.remove("open");
    if (scrim) scrim.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  }
  if (toggle && panel) {
    toggle.addEventListener("click", openPanel);
    if (closeBtn) closeBtn.addEventListener("click", closePanel);
    if (scrim) scrim.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });
  }

  /* ---------- footer year ---------- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- budget planner ---------- */
  var planner = document.getElementById("planner");
  if (planner) {
    var RATES = {
      garden:   { label: "Garden lawn",       venue: 180000, plate: 1450, decor: 95000  },
      ballroom: { label: "Hotel ballroom",    venue: 320000, plate: 1950, decor: 140000 },
      heritage: { label: "Heritage property", venue: 450000, plate: 2400, decor: 175000 }
    };
    var PHOTO_BASE = 160000, PHOTO_EXTRA = 65000;
    var FEE_RATE = 0.08, FEE_MIN = 150000, CONT_RATE = 0.05;
    var BOOKED = {
      "2026-11-21": "the weekend of 21–22 November 2026",
      "2026-11-22": "the weekend of 21–22 November 2026",
      "2026-12-12": "the weekend of 12–13 December 2026",
      "2026-12-13": "the weekend of 12–13 December 2026",
      "2027-01-23": "the weekend of 23–24 January 2027",
      "2027-01-24": "the weekend of 23–24 January 2027"
    };
    var state = { guests: 400, days: 3, tier: "ballroom" };

    var gVal = document.getElementById("gVal");
    var dVal = document.getElementById("dVal");
    var dateIn = document.getElementById("wDate");
    var diary = document.getElementById("diaryNote");
    var inr = function (n) { return "₹" + Math.round(n).toLocaleString("en-IN"); };

    function setOut(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }

    function compute() {
      var r = RATES[state.tier];
      var venue = r.venue * state.days;
      var extraCovers = Math.round(state.guests * 0.6) * (state.days - 1);
      var covers = state.guests + extraCovers;
      var catering = covers * r.plate;
      var decor = r.decor * state.days;
      var photo = PHOTO_BASE + PHOTO_EXTRA * (state.days - 1);
      var subtotal = venue + catering + decor + photo;
      var feeRaw = subtotal * FEE_RATE;
      var fee = Math.max(feeRaw, FEE_MIN);
      var contingency = subtotal * CONT_RATE;
      var total = subtotal + fee + contingency;

      gVal.textContent = state.guests.toLocaleString("en-IN");
      dVal.textContent = state.days;
      setOut("oVenue", inr(venue));
      setOut("oCovers", covers.toLocaleString("en-IN") + " plates — wedding day " +
        state.guests.toLocaleString("en-IN") + ", other days at 60%");
      setOut("oCatering", inr(catering));
      setOut("oDecor", inr(decor));
      setOut("oPhoto", inr(photo));
      setOut("oSubtotal", inr(subtotal));
      setOut("oFee", inr(fee));
      setOut("feeNote", feeRaw < FEE_MIN
        ? "8% of the subtotal is " + inr(feeRaw) + " — the minimum fee of ₹1,50,000 applies."
        : "8% of the managed subtotal, as printed in the rate card.");
      setOut("oContingency", inr(contingency));
      setOut("oTotal", inr(total));

      var v = dateIn.value;
      if (!v) {
        diary.className = "diary-note";
        diary.innerHTML = "Pick your wedding date and I will check it against my diary before you fall in love with the number.";
      } else if (BOOKED[v]) {
        diary.className = "diary-note booked";
        diary.innerHTML = "<strong>That date is already booked.</strong> Your date falls on " +
          BOOKED[v] + ", one of my three full weekends this season (21–22 November 2026, " +
          "12–13 December 2026, 23–24 January 2027). I do not double-book. The honest options: " +
          "my senior associate plans your wedding end to end at the same fee shape — she has run " +
          "sixty weddings beside me, I review the final run-sheet, and I am on the phone through " +
          "your muhurat — or we look at the Friday or the Monday either side, which I hold open " +
          "until the season fills. The budget above is the same either way.";
      } else {
        diary.className = "diary-note";
        diary.innerHTML = "That date is open in my diary today. Peak muhurat weekends go first — " +
          "a date is held for fourteen days from our first conversation, in writing, at no charge.";
      }
    }

    function bindStepper(minusId, plusId, key, step, min, max) {
      var minus = document.getElementById(minusId), plus = document.getElementById(plusId);
      if (!minus || !plus) return;
      minus.addEventListener("click", function () {
        state[key] = Math.max(min, state[key] - step); compute();
      });
      plus.addEventListener("click", function () {
        state[key] = Math.min(max, state[key] + step); compute();
      });
    }
    bindStepper("gMinus", "gPlus", "guests", 25, 50, 2000);
    bindStepper("dMinus", "dPlus", "days", 1, 1, 4);

    var tierBtns = planner.querySelectorAll(".tier-btn");
    tierBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        tierBtns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        state.tier = b.getAttribute("data-tier");
        compute();
      });
    });
    dateIn.addEventListener("input", compute);
    dateIn.addEventListener("change", compute);
    compute();
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName").value.trim();
      var contact = document.getElementById("fContact").value.trim();
      var date = document.getElementById("fDate").value;
      var msg = document.getElementById("formMsg");
      if (!name || !contact || !date) {
        msg.hidden = false;
        msg.textContent = "Three things I cannot plan without: your names, a phone number or email, and the wedding date — or the month, if the muhurat is not fixed yet.";
        return;
      }
      msg.hidden = true;
      var ref = "VG-" + Math.floor(10000 + Math.random() * 90000);
      var box = document.getElementById("confirmBox");
      document.getElementById("confirmRef").textContent = ref;
      document.getElementById("confirmText").textContent =
        "Thank you, " + name.split(" ")[0] + ". Your enquiry is with me — I reply within two working " +
        "days, and in season by the next morning. If your date is one of my booked weekends " +
        "(21–22 Nov, 12–13 Dec 2026, 23–24 Jan 2027), my reply will say so plainly and offer the " +
        "associate option. Quote this reference if you write again.";
      box.hidden = false;
      box.scrollIntoView({ behavior: "smooth", block: "center" });
      form.reset();
    });
  }
})();
