/* The Wren Bench — shared script.
   No audio anywhere: this site is silent by ruling.
   All planner/estimator figures are computed from the tables
   printed on the page itself — the two cannot disagree. */
(function () {
  "use strict";

  /* Cross-document view transitions: Chrome surfaces an aborted
     transition as an unhandled rejection. The navigation itself
     always completes, so swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- contents (mobile menu) ---------- */
  var btn = document.querySelector(".menu-button");
  var panel = document.getElementById("contents-panel");
  if (btn && panel) {
    function closePanel() {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", function () {
      var open = panel.hidden;
      if (open) {
        panel.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        requestAnimationFrame(function () {
          var first = panel.querySelector("a");
          if (first) first.focus();
        });
      } else {
        closePanel();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        closePanel();
        btn.focus();
      }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) closePanel();
    });
  }

  function money(n) {
    return "£" + n.toLocaleString("en-GB");
  }
  function li(text, cls) {
    var el = document.createElement("li");
    if (cls) el.className = cls;
    el.textContent = text;
    return el;
  }

  /* ---------- the commission planner (index) ---------- */
  var plannerForm = document.getElementById("planner");
  if (plannerForm) {
    var GRINDS = {
      needlepoint: { name: "Needlepoint", light: 0.15, full: 0.30, thin: 0.15 },
      fine:        { name: "Fine",        light: 0.25, full: 0.45, thin: 0.20 },
      medium:      { name: "Medium",      light: 0.40, full: 0.70, thin: 0.30 },
      broad:       { name: "Broad",       light: 0.60, full: 1.00, thin: 0.45 },
      italic:      { name: "Cursive italic", light: 0.50, full: 0.65, thin: 0.20 },
      architect:   { name: "Architect",   light: 0.85, full: 1.05, thin: 0.80 }
    };
    var GRIND_ORDER = ["needlepoint", "fine", "italic", "medium", "broad", "architect"];
    var PRESSURES = {
      feather: { name: "feather", factor: 0.20 },
      light:   { name: "light",   factor: 0.45 },
      firm:    { name: "firm",    factor: 0.75 },
      full:    { name: "full flex", factor: 1.00 }
    };
    var ANGLES = {
      standard: "Standard hold, 40–50°: the polish is centred, and the sweet spot sits where most hands live.",
      low: "Low hold, 25–35°: an oblique foot is ground so the whole edge meets the page — for a right hand at this angle, a left-oblique foot.",
      steep: "Steep hold, 55–65°: the tipping is polished near-round and the sweet spot is small, so the bench asks for two pages of writing, not one."
    };
    var CLASSES = {
      stock:   { name: "Tuned stock pen", plural: "tuned stock pens", ahead: 4, rhythm: 1, making: 2 },
      bespoke: { name: "Bespoke commission", plural: "bespoke commissions", ahead: 6, rhythm: 2, making: 5 },
      full:    { name: "Full commission", plural: "full commissions", ahead: 3, rhythm: 4, making: 9 }
    };
    var MATERIALS = {
      ebonite:   { name: "ebonite", add: 0 },
      resin:     { name: "cast resin", add: 0 },
      celluloid: { name: "celluloid (old stock)", add: 1 },
      urushi:    { name: "urushi over ebonite", add: 6 }
    };
    var out = document.getElementById("planner-out");
    var lines = document.getElementById("planner-lines");
    var verdict = document.getElementById("planner-verdict");

    plannerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var g = GRINDS[plannerForm.grind.value];
      var p = PRESSURES[plannerForm.pressure.value];
      var c = CLASSES[plannerForm.cclass.value];
      var m = MATERIALS[plannerForm.material.value];
      var asked = plannerForm.hairline.value;

      lines.textContent = "";
      var width = g.light + p.factor * (g.full - g.light);
      lines.appendChild(li(
        "Your line: a " + g.name.toLowerCase() + " grind at a " + p.name + " hand lays " +
        g.light.toFixed(2) + " + " + p.factor.toFixed(2) + " × (" + g.full.toFixed(2) + " − " +
        g.light.toFixed(2) + ") = " + width.toFixed(2) + " mm."
      ));

      if (asked !== "none") {
        var want = parseFloat(asked);
        if (g.thin > want) {
          var refusal = li(
            "The honest answer: a " + g.name.toLowerCase() + " grind will not give you a " +
            want.toFixed(2) + " mm hairline at any pressure. Its thinnest printed stroke is " +
            g.thin.toFixed(2) + " mm — the edge is ground too wide to close down further.",
            "refusal"
          );
          lines.appendChild(refusal);
          var best = null;
          GRIND_ORDER.forEach(function (key) {
            var cand = GRINDS[key];
            if (cand.thin <= want && (!best || cand.thin > best.thin)) best = cand;
          });
          if (best) {
            lines.appendChild(li(
              "The grind that will: " + best.name + " — its thinnest stroke is " +
              best.thin.toFixed(2) + " mm. Choose it above and the planner will run again.",
              "remedy"
            ));
          }
        } else {
          lines.appendChild(li(
            "The hairline: this grind's thinnest stroke is " + g.thin.toFixed(2) +
            " mm, within the " + want.toFixed(2) + " mm you asked for."
          ));
        }
      } else {
        lines.appendChild(li(
          "The hairline: none asked for. This grind's thinnest stroke, for the record, is " +
          g.thin.toFixed(2) + " mm."
        ));
      }

      lines.appendChild(li(ANGLES[plannerForm.angle.value]));

      var start = c.ahead * c.rhythm;
      var making = c.making + m.add;
      lines.appendChild(li(
        "The book: " + c.ahead + " " + c.plural + " ahead of you × " + c.rhythm +
        (c.rhythm === 1 ? " week" : " weeks") + " each = " + start +
        " weeks before your pen reaches the bench."
      ));
      lines.appendChild(li(
        "The making: " + c.making + " weeks at the bench + " + m.add +
        (m.add === 1 ? " week" : " weeks") + " for " + m.name + " = " + making + " weeks."
      ));
      lines.appendChild(li(
        "Earliest completion: week " + (start + making) + " from the deposit.",
        "total"
      ));
      verdict.textContent = "The bench has read your hand — on paper";
      out.hidden = false;
      out.scrollIntoView({ block: "nearest", behavior: "auto" });
    });
  }

  /* ---------- the reckoning (estimator, index) ---------- */
  var estForm = document.getElementById("estimator");
  if (estForm) {
    var SERVICES = {
      stock:   { name: "Tuned stock pen", base: 385, pen: true },
      bespoke: { name: "Bespoke commission", base: 1450, pen: true },
      full:    { name: "Full commission", base: 2900, pen: true },
      tune:    { name: "Nib grind & tune — your own pen", base: 85, pen: false }
    };
    var METALS = {
      k14:    { name: "14k gold nib", delta: 0 },
      k18:    { name: "18k gold nib", delta: 160 },
      plated: { name: "Gold-plated steel nib — steel, plated, and named as plated", delta: -210 }
    };
    var GRINDFEES = {
      standard:   { name: "Standard grind", delta: 0 },
      specialist: { name: "Specialist grind — architect or needlepoint", delta: 40 }
    };
    var MATFEES = {
      ebonite:   { name: "Ebonite body", delta: 0 },
      resin:     { name: "Cast resin body", delta: 0 },
      celluloid: { name: "Celluloid body — old stock, turned slowly", delta: 120 },
      urushi:    { name: "Urushi over ebonite — weeks of curing", delta: 650 }
    };
    var estOut = document.getElementById("estimator-out");
    var estLines = document.getElementById("estimator-lines");
    var penOnly = estForm.querySelectorAll(".pen-only");

    function syncPenOnly() {
      var isPen = SERVICES[estForm.service.value].pen;
      penOnly.forEach(function (el) { el.hidden = !isPen; });
    }
    estForm.service.addEventListener("change", syncPenOnly);
    syncPenOnly();

    estForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var s = SERVICES[estForm.service.value];
      estLines.textContent = "";
      var total = s.base;
      estLines.appendChild(li(s.name + " — " + money(s.base)));
      var gf = GRINDFEES[estForm.grindfee.value];
      if (gf.delta !== 0) {
        total += gf.delta;
        estLines.appendChild(li(gf.name + " — +" + money(gf.delta)));
      } else {
        estLines.appendChild(li(gf.name + " — included"));
      }
      if (s.pen) {
        var mt = METALS[estForm.metal.value];
        total += mt.delta;
        estLines.appendChild(li(
          mt.name + " — " + (mt.delta === 0 ? "included" : (mt.delta > 0 ? "+" : "−") + money(Math.abs(mt.delta)))
        ));
        var mf = MATFEES[estForm.matfee.value];
        total += mf.delta;
        estLines.appendChild(li(
          mf.name + " — " + (mf.delta === 0 ? "included" : "+" + money(mf.delta))
        ));
        if (estForm.vintage.checked) {
          total += 240;
          estLines.appendChild(li("Vintage nib fitting — seating, hand-cut feed, tune — +£240"));
          estLines.appendChild(li("The vintage nib itself is charged at its receipted purchase cost, shown to you before you commit."));
        }
      } else {
        total += 12;
        estLines.appendChild(li("Insured return post — +£12"));
      }
      estLines.appendChild(li("The reckoning: " + money(total), "total"));
      if (s.pen) {
        estLines.appendChild(li("Deposit to enter the book (40%): " + money(Math.round(total * 0.4)) + ". The balance is due on delivery, not before."));
      } else {
        estLines.appendChild(li("Tuning is paid on return of the pen, never in advance."));
      }
      estOut.hidden = false;
      estOut.scrollIntoView({ block: "nearest", behavior: "auto" });
    });
  }

  /* ---------- the enquiry form (contact) ---------- */
  var form = document.getElementById("enquiry");
  if (form) {
    var confirm = document.getElementById("confirmation");
    var errors = document.getElementById("form-errors");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();
      var problems = [];
      if (name.length < 2) problems.push("Your name — the book needs a name to enter.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push("Your email — check the address; the reply goes there.");
      if (message.length < 10) problems.push("A few words about the pen or the nib — ten characters at least, so the bench knows where to start.");
      if (problems.length) {
        errors.innerHTML = "";
        problems.forEach(function (p) {
          var el = document.createElement("p");
          el.textContent = p;
          errors.appendChild(el);
        });
        errors.hidden = false;
        errors.scrollIntoView({ block: "nearest", behavior: "auto" });
        return;
      }
      errors.hidden = true;
      var seed = 0;
      var seedStr = name + email;
      for (var i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);
      var entryNo = 214 + (seed % 60) + 1;
      document.getElementById("entry-no").textContent = "Book entry № W-2026-" + entryNo;
      document.getElementById("entry-summary").textContent =
        name + " — " + form.interest.options[form.interest.selectedIndex].text +
        ", writing with the " + form.hand.value + " hand. The bench replies within three working days; " +
        "if a pen is to be tuned to your hand, the reply will ask for a page of your ordinary writing — not your careful writing.";
      form.hidden = true;
      confirm.hidden = false;
      confirm.scrollIntoView({ block: "nearest", behavior: "auto" });
    });
  }
})();
