/* Veena Twilight — shared script: mobile menu, concert planner, contact form. */
(function () {
  "use strict";

  /* Swallow only the known view-transition abort rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById("menu-btn");
  var panel = document.getElementById("menu-panel");
  if (menuBtn && panel) {
    var closeBtn = panel.querySelector(".menu-close");
    function openMenu() {
      panel.classList.add("open");
      menuBtn.setAttribute("aria-expanded", "true");
      requestAnimationFrame(function () {
        var first = panel.querySelector("nav a");
        if (first) first.focus();
      });
    }
    function closeMenu() {
      panel.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.focus();
    }
    menuBtn.addEventListener("click", openMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closeMenu();
    });
  }

  /* ---------- concert planner ---------- */
  var plannerForm = document.getElementById("planner-form");
  if (plannerForm) {
    var FEES = {
      baithak:  { label: "Baithak",      base: 45000, included: 75,  min: 45, max: 105, shares: { alap: 40, jor: 20, jhala: 10, gat: 30 } },
      concert:  { label: "Full concert", base: 85000, included: 120, min: 75, max: 120, shares: { alap: 40, jor: 20, jhala: 10, gat: 30 } },
      festival: { label: "Festival set", base: 60000, included: 45,  min: 30, max: 45,  shares: { alap: 25, jor: 15, jhala: 10, gat: 50 } }
    };
    var ACC = {
      both:    { label: "Tabla and tanpura", fee: 16000 },
      tabla:   { label: "Tabla only — your side provides a tanpura player", fee: 12000 },
      tanpura: { label: "Tanpura only — an alap-led evening, no tabla", fee: 6000 }
    };
    var EXTRA_PER_15 = 6000;
    var NOTICE_DAYS = 21;
    /* Closed riyaz-retreat weeks, every year: 16–29 June, 21–27 December. */
    var RETREATS = [
      { sm: 5,  sd: 16, em: 5,  ed: 29, label: "16–29 June" },
      { sm: 11, sd: 21, em: 11, ed: 27, label: "21–27 December" }
    ];
    var result = document.getElementById("p-result");

    function inr(n) { return "₹" + n.toLocaleString("en-IN"); }
    function fmtDate(d) {
      return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    function note(html) {
      result.hidden = false;
      result.innerHTML = '<p class="p-note">' + html + "</p>";
    }

    plannerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var formatKey = plannerForm.querySelector('input[name="format"]:checked').value;
      var accKey = plannerForm.querySelector('input[name="acc"]:checked').value;
      var duration = parseInt(document.getElementById("p-duration").value, 10);
      var city = document.getElementById("p-city").value;
      var dateStr = document.getElementById("p-date").value;
      var f = FEES[formatKey];

      if (!dateStr) {
        note("<strong>Choose a date first.</strong> The planner checks your date against the notice rule and the closed retreat weeks before it costs anything.");
        return;
      }
      var parts = dateStr.split("-");
      var date = new Date(+parts[0], +parts[1] - 1, +parts[2]);

      if (duration < f.min || duration > f.max) {
        note("<strong>That length does not fit a " + f.label.toLowerCase() + ".</strong> A " +
          f.label.toLowerCase() + " runs " + f.min + "–" + f.max + " minutes. " +
          (formatKey === "festival"
            ? "For a longer evening, choose the full concert — a festival set is a fixed, tight format by design."
            : "Adjust the duration, or choose the format that matches the evening you are planning."));
        return;
      }

      var today = new Date(); today.setHours(0, 0, 0, 0);
      var earliest = new Date(today.getTime() + NOTICE_DAYS * 86400000);
      if (date < earliest) {
        note("<strong>Too soon.</strong> Concerts are booked at least " + NOTICE_DAYS +
          " days ahead — the programme is built around the date, not dropped into it. The earliest date that can be planned from today is <strong>" +
          fmtDate(earliest) + "</strong>.");
        return;
      }

      for (var i = 0; i < RETREATS.length; i++) {
        var w = RETREATS[i];
        var start = new Date(date.getFullYear(), w.sm, w.sd);
        var end = new Date(date.getFullYear(), w.em, w.ed);
        if (date >= start && date <= end) {
          var open = new Date(end.getTime() + 86400000);
          note("<strong>That date falls in a closed week.</strong> " + fmtDate(date) +
            " sits inside the riyaz retreat of <strong>" + w.label + "</strong> — no concerts, no exceptions; those weeks are when the year's playing is rebuilt. The first open date after the retreat is <strong>" +
            fmtDate(open) + "</strong>.");
          return;
        }
      }

      var s = f.shares;
      var alap = Math.round(duration * s.alap / 100);
      var jor = Math.round(duration * s.jor / 100);
      var jhala = Math.round(duration * s.jhala / 100);
      var gat = duration - alap - jor - jhala;

      var extraMin = Math.max(0, duration - f.included);
      var extraFee = (extraMin / 15) * EXTRA_PER_15;
      var acc = ACC[accKey];
      var total = f.base + extraFee + acc.fee;

      var rows =
        "<tr><td>Alap — the raga unfolded, unmetered</td><td>" + alap + " min</td></tr>" +
        "<tr><td>Jor — pulse enters, still no drum</td><td>" + jor + " min</td></tr>" +
        "<tr><td>Jhala — the fast, bright close of the alap</td><td>" + jhala + " min</td></tr>" +
        "<tr><td>Gat — composition in tala, with tabla</td><td>" + gat + " min</td></tr>";
      var feeRows =
        "<tr><td>" + f.label + " fee (includes " + f.included + " minutes)</td><td>" + inr(f.base) + "</td></tr>" +
        (extraFee > 0 ? "<tr><td>Extra time — " + extraMin + " minutes beyond the included length</td><td>" + inr(extraFee) + "</td></tr>" : "") +
        "<tr><td>" + acc.label + "</td><td>" + inr(acc.fee) + "</td></tr>";

      result.hidden = false;
      result.innerHTML =
        "<h4>" + f.label + " · " + duration + " minutes · " + fmtDate(date) + "</h4>" +
        "<table>" + rows + "</table>" +
        "<table>" + feeRows + "</table>" +
        '<p class="total">Total ' + inr(total) + "</p>" +
        (city === "outside"
          ? '<p class="p-note">Outside Kolkata, travel and instrument carriage are charged at cost, and Arjun travels the day before — the date above is the concert date, and it already allows for that.</p>'
          : '<p class="p-note">In Kolkata there is no travel charge. A sound check of forty minutes, in the hall, on the day, is part of every booking.</p>');
    });
  }

  /* ---------- contact form ---------- */
  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("c-name").value.trim();
      var chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
      var code = "";
      for (var i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      var ref = "VT-" + new Date().getFullYear() + "-" + code;
      var confirm = document.getElementById("confirm");
      document.getElementById("confirm-name").textContent = name ? name.split(" ")[0] : "Thank you";
      document.getElementById("confirm-ref").textContent = ref;
      confirm.hidden = false;
      confirm.scrollIntoView({ block: "nearest" });
    });
  }
})();
