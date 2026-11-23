/* ILVES DISCHARGE LAB — tools read the tables printed on the page,
   so the tool and the page can never disagree. No audio anywhere. */
(function () {
  "use strict";

  /* Cross-document view transitions abort as unhandled rejections in
     some engines; swallow only that specific abort. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("menu-panel");
  if (btn && panel) {
    function closeMenu() {
      panel.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", function () {
      var open = panel.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector("a");
          if (first) first.focus();
        });
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) {
        closeMenu();
        btn.focus();
      }
    });
  }

  /* ---------- helpers ---------- */
  function fmt(n) { return n.toLocaleString("en-US"); }
  function segValue(container) {
    var b = container.querySelector('button[aria-pressed="true"]');
    return b ? b.getAttribute("data-value") : null;
  }
  function wireSeg(container, onChange) {
    if (!container) return;
    container.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      container.querySelectorAll("button").forEach(function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      onChange();
    });
  }
  function wireStepper(minusId, plusId, valId, min, max, step, onChange) {
    var minus = document.getElementById(minusId);
    var plus = document.getElementById(plusId);
    var val = document.getElementById(valId);
    if (!minus || !plus || !val) return function () { return 0; };
    function get() { return parseInt(val.getAttribute("data-value"), 10); }
    function set(v) {
      v = Math.max(min, Math.min(max, v));
      val.setAttribute("data-value", String(v));
      val.textContent = v;
      onChange();
    }
    minus.addEventListener("click", function () { set(get() - step); });
    plus.addEventListener("click", function () { set(get() + step); });
    return get;
  }

  /* ---------- Recipe & Load Planner (index) ---------- */
  var planner = document.getElementById("planner");
  if (planner) {
    /* Read the printed tables. */
    var gases = {};   /* key -> {factor, wpm, colours[], name} */
    document.querySelectorAll("#gas-table tbody tr").forEach(function (tr) {
      gases[tr.getAttribute("data-gas")] = {
        name: tr.getAttribute("data-name"),
        factor: parseFloat(tr.getAttribute("data-factor")),
        wpm: parseFloat(tr.getAttribute("data-wpm")),
        colours: (tr.getAttribute("data-colours") || "").split("|")
      };
    });
    var baseByDia = {};  /* diameter -> metres per transformer */
    document.querySelectorAll("#load-table tbody tr").forEach(function (tr) {
      baseByDia[tr.getAttribute("data-dia")] = parseFloat(tr.getAttribute("data-base"));
    });
    var colourSource = {
      "Signal red": "that red is neon in clear glass — no other fill in this lab makes it",
      "Discharge blue": "that blue is argon with a mercury drop",
      "Lavender": "lavender comes from argon–mercury in phosphor glass, or from xenon run soft",
      "Green-white": "green-white is krypton's own colour",
      "Warm yellow": "warm yellow is helium in clear glass",
      "Blue-white": "blue-white is xenon's own colour"
    };

    var getMetres = wireStepper("p-metres-minus", "p-metres-plus", "p-metres-val", 2, 60, 2, runPlanner);
    var diaSeg = document.getElementById("p-dia");
    var gasSeg = document.getElementById("p-gas");
    var colourSel = document.getElementById("p-colour");
    wireSeg(diaSeg, runPlanner);
    wireSeg(gasSeg, runPlanner);
    colourSel.addEventListener("change", runPlanner);

    function runPlanner() {
      var metres = getMetres();
      var dia = segValue(diaSeg);
      var gasKey = segValue(gasSeg);
      var gas = gases[gasKey];
      var base = baseByDia[dia];
      var eff = Math.max(1, Math.floor(base * gas.factor));
      var transformers = Math.ceil(metres / eff);
      var load = Math.round(metres * gas.wpm);
      var burnIn = 48 + 12 * (transformers - 1);
      var colour = colourSel.value;

      document.getElementById("pl-transformers").textContent = transformers;
      document.getElementById("pl-load").textContent = fmt(load) + " W";
      document.getElementById("pl-burnin").textContent = burnIn + " h";

      var lines = [
        ["Tube on the bench", metres + " m of " + dia + " mm, " + gas.name],
        ["Printed loading (Table T)", base + " m per transformer at " + dia + " mm"],
        ["Gas derating (Table G)", "× " + gas.factor + " → " + eff + " m per transformer"],
        ["Transformers", "ceil(" + metres + " ÷ " + eff + ") = " + transformers + " × 30 mA"],
        ["Load", metres + " m × " + gas.wpm + " W/m = " + fmt(load) + " W"],
        ["Burn-in", "48 h first circuit + 12 h × " + (transformers - 1) + " = " + burnIn + " h"]
      ];
      document.getElementById("pl-workings").innerHTML = lines.map(function (l) {
        return '<div class="w-line"><span>' + l[0] + "</span><span class=\"amt\">" + l[1] + "</span></div>";
      }).join("");

      var verdict = document.getElementById("pl-verdict");
      if (gas.colours.indexOf(colour) !== -1) {
        verdict.className = "verdict ok";
        verdict.innerHTML = "<strong>The recipe holds.</strong> " + gas.name +
          " gives " + colour.toLowerCase() + " honestly — it is printed in Table G, and the bench will sign for it.";
      } else {
        verdict.className = "verdict no";
        verdict.innerHTML = "<strong>" + gas.name + " cannot give you " + colour.toLowerCase() + "</strong> — " +
          (colourSource[colour] || "that colour belongs to another fill") +
          ". The recipe changes, or the colour does. The lab will not write one gas on the plate and fill another.";
      }
    }
    runPlanner();
  }

  /* ---------- Booking estimator (index) ---------- */
  var estimator = document.getElementById("estimator");
  if (estimator) {
    var rates = {};
    document.querySelectorAll("#fee-table [data-rate]").forEach(function (el) {
      rates[el.getAttribute("data-gas")] = parseFloat(el.getAttribute("data-rate"));
    });
    var bendPerM = parseFloat(document.querySelector("#fee-table [data-bending]").getAttribute("data-bending"));
    var elecFlat = parseFloat(document.querySelector("#fee-table [data-electronics]").getAttribute("data-electronics"));
    var installDay = parseFloat(document.querySelector("#fee-table [data-install]").getAttribute("data-install"));

    var getEMetres = wireStepper("e-metres-minus", "e-metres-plus", "e-metres-val", 2, 40, 2, runEstimator);
    var getEDays = wireStepper("e-days-minus", "e-days-plus", "e-days-val", 0, 5, 1, runEstimator);
    var eGasSeg = document.getElementById("e-gas");
    var eBendSeg = document.getElementById("e-bend");
    wireSeg(eGasSeg, runEstimator);
    wireSeg(eBendSeg, runEstimator);

    function runEstimator() {
      var metres = getEMetres();
      var days = getEDays();
      var gasKey = segValue(eGasSeg);
      var rate = rates[gasKey];
      var commissioned = segValue(eBendSeg) === "commissioned";
      var art = metres * rate;
      var bend = commissioned ? metres * bendPerM : 0;
      var install = days * installDay;
      var total = art + bend + elecFlat + install;

      var lines = [
        ["Art rate", metres + " m × €" + fmt(rate) + " = €" + fmt(art)],
        ["Bending", commissioned ? metres + " m × €" + fmt(bendPerM) + " (master bender, passed through) = €" + fmt(bend) : "Self-bent in the studio — €0"],
        ["Electronics & certification pack", "€" + fmt(elecFlat) + " flat"],
        ["Installation", days + " day" + (days === 1 ? "" : "s") + " × €" + fmt(installDay) + " = €" + fmt(install)]
      ];
      document.getElementById("est-workings").innerHTML = lines.map(function (l) {
        return '<div class="w-line"><span>' + l[0] + "</span><span class=\"amt\">" + l[1] + "</span></div>";
      }).join("");
      document.getElementById("est-total").textContent = "€" + fmt(total);
    }
    runEstimator();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    function setError(id, on) {
      var input = document.getElementById(id);
      var err = document.getElementById(id + "-error");
      if (input) input.setAttribute("aria-invalid", on ? "true" : "false");
      if (err) err.classList.toggle("show", !!on);
      return !on;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("f-name");
      var email = document.getElementById("f-email");
      var msg = document.getElementById("f-message");
      var ok = true;
      ok = setError("f-name", name.value.trim().length < 2) && ok;
      ok = setError("f-email", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = setError("f-message", msg.value.trim().length < 20) && ok;
      if (!ok) return;
      var ref = "XD-2026-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("conf-ref").textContent = ref;
      document.getElementById("conf-summary").textContent =
        "For " + name.value.trim() + " — " + document.getElementById("f-type").value +
        ". The studio answers within three working days.";
      var conf = document.getElementById("confirmation");
      conf.classList.add("show");
      conf.setAttribute("tabindex", "-1");
      conf.focus();
      form.reset();
    });
    ["f-name", "f-email", "f-message"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", function () { setError(id, false); });
    });
  }
})();
