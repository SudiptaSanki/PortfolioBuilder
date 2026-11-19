/*
 * Ohm's law & power calculator.
 *
 * solveOhms() is a pure function (no DOM) so it can be unit-tested in Node:
 *   const { solveOhms } = require('./calculator.js');
 *   solveOhms({ I: 10, R: 23 })  ->  { ok: true, values: { V: 230, I: 10, R: 23, P: 2300 } }
 *
 * Rules: give any two of V, I, R, P as positive numbers. If more than two are
 * given they must agree with each other, otherwise a polite error is returned.
 */
(function () {
  "use strict";

  var KEYS = ["V", "I", "R", "P"];

  function isKnown(n) {
    return typeof n === "number" && isFinite(n) && n > 0;
  }

  // Solve the full set from one known pair.
  function fromPair(a, b, input) {
    var V, I, R, P;
    if (a === "V" && b === "I") { V = input.V; I = input.I; R = V / I; P = V * I; }
    else if (a === "V" && b === "R") { V = input.V; R = input.R; I = V / R; P = (V * V) / R; }
    else if (a === "V" && b === "P") { V = input.V; P = input.P; I = P / V; R = (V * V) / P; }
    else if (a === "I" && b === "R") { I = input.I; R = input.R; V = I * R; P = I * I * R; }
    else if (a === "I" && b === "P") { I = input.I; P = input.P; V = P / I; R = P / (I * I); }
    else if (a === "R" && b === "P") { R = input.R; P = input.P; V = Math.sqrt(P * R); I = Math.sqrt(P / R); }
    return { V: V, I: I, R: R, P: P };
  }

  function solveOhms(input) {
    input = input || {};
    var known = KEYS.filter(function (k) { return isKnown(input[k]); });

    if (known.length < 2) {
      return {
        ok: false,
        message: "Please enter at least two values — any two of voltage, current, resistance or power — and I will work out the rest."
      };
    }

    var values = fromPair(known[0], known[1], input);

    // If the visitor gave more than two values, check they agree.
    for (var j = 0; j < KEYS.length; j++) {
      var k = KEYS[j];
      if (isKnown(input[k])) {
        var given = input[k], solved = values[k];
        if (Math.abs(given - solved) > Math.max(0.01, solved * 0.005)) {
          return {
            ok: false,
            message: "Those values do not agree with each other — in a simple circuit, V = I \u00D7 R and P = V \u00D7 I. Please check the entries and try again."
          };
        }
      }
    }

    return { ok: true, values: values, solvedFrom: [known[0], known[1]] };
  }

  function format(n) {
    if (!isFinite(n)) return "\u2014";
    var rounded = Math.abs(n) >= 1000 ? Math.round(n) : Math.round(n * 100) / 100;
    return String(rounded);
  }

  /* ---------------- DOM wiring (browser only) ---------------- */

  function initCalculator() {
    var form = document.getElementById("calc-form");
    if (!form) return;

    var inputs = {
      V: document.getElementById("in-v"),
      I: document.getElementById("in-i"),
      R: document.getElementById("in-r"),
      P: document.getElementById("in-p")
    };
    var outputs = {
      V: document.getElementById("out-v"),
      I: document.getElementById("out-i"),
      R: document.getElementById("out-r"),
      P: document.getElementById("out-p")
    };
    var msg = document.getElementById("calc-msg");
    var clearBtn = document.getElementById("calc-clear");
    var UNITS = { V: " V", I: " A", R: " \u03A9", P: " W" };
    var NAMES = { V: "voltage", I: "current", R: "resistance", P: "power" };

    function resetComputed() {
      KEYS.forEach(function (k) { inputs[k].classList.remove("computed"); });
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var input = {};
      KEYS.forEach(function (k) {
        var raw = inputs[k].value.trim();
        input[k] = raw === "" ? NaN : parseFloat(raw);
      });

      var result = solveOhms(input);
      resetComputed();

      if (!result.ok) {
        msg.textContent = result.message;
        msg.classList.add("error");
        KEYS.forEach(function (k) { outputs[k].textContent = "\u2014"; });
        return;
      }

      msg.classList.remove("error");
      KEYS.forEach(function (k) {
        outputs[k].textContent = format(result.values[k]) + UNITS[k];
        if (!isKnown(input[k])) {
          inputs[k].value = format(result.values[k]);
          inputs[k].classList.add("computed");
        }
      });
      msg.textContent =
        "Solved from " + NAMES[result.solvedFrom[0]] + " and " + NAMES[result.solvedFrom[1]] +
        ": V = " + format(result.values.V) + " V, I = " + format(result.values.I) +
        " A, R = " + format(result.values.R) + " \u03A9, P = " + format(result.values.P) + " W.";
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        KEYS.forEach(function (k) {
          inputs[k].value = "";
          outputs[k].textContent = "\u2014";
        });
        resetComputed();
        msg.classList.remove("error");
        msg.textContent = "Enter any two values to solve the circuit.";
        inputs.V.focus();
      });
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initCalculator);
    } else {
      initCalculator();
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { solveOhms: solveOhms, format: format };
  }
})();
