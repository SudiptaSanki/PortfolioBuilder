/* Madhubani Dawn — menu, stamp reveals, commission planner, enquiry form. */
(function () {
  "use strict";

  /* View-transition aborts surface as unhandled rejections; swallow only those. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("mnav");
  if (btn && panel) {
    var closeMenu = function () {
      panel.classList.remove("open");
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      if (open) {
        panel.hidden = false;
        requestAnimationFrame(function () {
          var first = panel.querySelector("a");
          if (first) first.focus();
        });
      } else {
        panel.hidden = true;
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) {
        closeMenu();
        btn.focus();
      }
    });
  }

  /* ---------- stamp reveals ---------- */
  var stamps = Array.prototype.slice.call(document.querySelectorAll(".stamp"));
  if (stamps.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      stamps.forEach(function (s) { s.classList.add("on"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("on");
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.05 });
      stamps.forEach(function (s, i) {
        s.style.transitionDelay = ((i % 8) * 45) + "ms";
        io.observe(s);
      });
    }
  }

  /* ---------- commission planner ----------
     These figures are the rate card printed on projects.html.
     If the card changes, change both. */
  var RATES = {
    sizeLabel: {
      small: "Small — 11 × 15 in (wall: 24 sq ft)",
      medium: "Medium — 15 × 22 in (wall: 40 sq ft)",
      large: "Large — 22 × 30 in (wall: 60 sq ft)"
    },
    fee: { /* painting fee, by style -> surface -> size */
      bharni: { paper: { small: 2800, medium: 5600, large: 10500 },
                cloth: { small: 3200, medium: 6400, large: 12000 },
                wall:  { small: 21600, medium: 36000, large: 54000 } },
      kachni: { paper: { small: 3400, medium: 6800, large: 12600 },
                cloth: { small: 3900, medium: 7800, large: 14400 },
                wall:  { small: 26400, medium: 44000, large: 66000 } }
    },
    materials: { /* pigment + surface preparation, by surface -> size */
      paper: { small: 350, medium: 700, large: 1300 },
      cloth: { small: 520, medium: 1050, large: 1950 },
      wall:  { small: 2400, medium: 4000, large: 6000 }
    },
    days: { /* painting days, by style -> surface -> size */
      bharni: { paper: { small: 3, medium: 5, large: 9 },
                cloth: { small: 4, medium: 6, large: 10 },
                wall:  { small: 6, medium: 10, large: 15 } },
      kachni: { paper: { small: 4, medium: 7, large: 12 },
                cloth: { small: 5, medium: 8, large: 13 },
                wall:  { small: 8, medium: 13, large: 19 } }
    },
    drying: 2,        /* drying & finishing days, printed on the card */
    dispatch: 600     /* framed dispatch for paper & cloth; walls are painted in place */
  };

  var planner = document.getElementById("planner");
  if (planner) {
    var sizeEl = document.getElementById("p-size");
    var styleEl = document.getElementById("p-style");
    var surfaceEl = document.getElementById("p-surface");
    var dateEl = document.getElementById("p-date");
    var out = {
      fee: document.getElementById("r-fee"),
      materials: document.getElementById("r-materials"),
      dispatch: document.getElementById("r-dispatch"),
      total: document.getElementById("r-total"),
      days: document.getElementById("r-days"),
      verdict: document.getElementById("r-verdict")
    };
    var inr = function (n) { return "₹" + n.toLocaleString("en-IN"); };

    var compute = function () {
      var size = sizeEl.value, style = styleEl.value, surface = surfaceEl.value;
      var fee = RATES.fee[style][surface][size];
      var materials = RATES.materials[surface][size];
      var dispatch = surface === "wall" ? 0 : RATES.dispatch;
      var total = fee + materials + dispatch;
      var days = RATES.days[style][surface][size] + RATES.drying;

      out.fee.textContent = inr(fee);
      out.materials.textContent = inr(materials);
      out.dispatch.textContent = surface === "wall" ? "Painted in place — no dispatch" : inr(dispatch);
      out.total.textContent = inr(total);
      out.days.textContent = days + " days from the day I start";

      var msg, warn = false;
      if (dateEl.value) {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var need = new Date(dateEl.value + "T00:00:00");
        var diff = Math.round((need - today) / 86400000);
        if (diff < days) {
          warn = true;
          msg = "That date is inside the painting time — this piece needs " + days +
            " days and your date is " + (diff < 0 ? "already past" : diff + " days away") +
            ". The ready piece that fits: “Two Fish, One River” — bharni on handmade paper, 15 × 22 in, ₹6,300, framed and hanging in the studio now. It can leave this week.";
        } else {
          msg = "That date works. The piece needs " + days + " days; I would start it " +
            (diff - days) + " days before your date at the latest, and I write the start date on the order card before any advance is taken.";
        }
      } else {
        msg = "No date set. Painting and drying together take " + days +
          " days once I start; my current queue is on the contact page.";
      }
      out.verdict.textContent = msg;
      out.verdict.classList.toggle("warn", warn);
    };
    [sizeEl, styleEl, surfaceEl, dateEl].forEach(function (el) {
      el.addEventListener("change", compute);
      el.addEventListener("input", compute);
    });
    compute();
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById("enquiry");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("f-name").value.trim();
      var kind = document.getElementById("f-kind");
      var kindText = kind.options[kind.selectedIndex].text;
      var ref = "MD-2026-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      var box = document.getElementById("confirmation");
      document.getElementById("c-ref").textContent = ref;
      document.getElementById("c-line").textContent =
        "Thank you, " + (name || "friend") + ". Your enquiry about “" + kindText +
        "” is written in the order book under this reference. I reply within two working days — sooner in wedding season, when the wall cannot wait.";
      form.hidden = true;
      box.hidden = false;
      box.setAttribute("tabindex", "-1");
      box.focus();
    });
  }
})();
