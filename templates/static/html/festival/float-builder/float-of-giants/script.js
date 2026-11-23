/* Float of Giants — interactions
   Silent site. All load arithmetic is local and deterministic. */

(function () {
  "use strict";

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- drawing part highlight ---------- */

  var parts = {
    chassis: document.querySelector(".part-chassis"),
    truss: document.querySelector(".part-truss"),
    figure: document.querySelector(".part-figure"),
    skirt: document.querySelector(".part-skirt")
  };

  function heat(name, on) {
    var el = parts[name];
    if (el) el.classList.toggle("is-hot", on);
    document.querySelectorAll('[data-highlight="' + name + '"]').forEach(function (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  document.querySelectorAll("[data-highlight]").forEach(function (btn) {
    var name = btn.getAttribute("data-highlight");
    btn.addEventListener("mouseenter", function () { heat(name, true); });
    btn.addEventListener("mouseleave", function () { heat(name, false); });
    btn.addEventListener("focus", function () { heat(name, true); });
    btn.addEventListener("blur", function () { heat(name, false); });
    btn.addEventListener("click", function () {
      var on = btn.getAttribute("aria-pressed") !== "true";
      Object.keys(parts).forEach(function (k) { heat(k, false); });
      heat(name, on);
    });
  });

  /* ---------- load and rig calculator ---------- */

  var form = document.getElementById("calc-form");
  if (form && document.getElementById("rig-svg")) {
    var chassisEl = document.getElementById("chassis");
    var figureInputs = form.querySelectorAll('input[name="figures"]');
    var heightEl = document.getElementById("height");
    var heightOut = document.getElementById("height-out");
    var mechEl = document.getElementById("mechanism");
    var skinEl = document.getElementById("skin");
    var svg = document.getElementById("rig-svg");

    var CHASSIS = {
      mini: { label: "Mini, 3.5 t", kg: 1800, baseLength: 5.6, growth: 0.8, width: 2.2, axles: 2, weeks: 3, cost: 14000, ballast: 600 },
      standard: { label: "Standard, 7.5 t", kg: 3400, baseLength: 7.2, growth: 1.0, width: 2.4, axles: 2, weeks: 4, cost: 26000, ballast: 1200 },
      mega: { label: "Mega, 12 t", kg: 5600, baseLength: 8.6, growth: 1.1, width: 2.5, axles: 3, weeks: 5, cost: 44000, ballast: 1600 }
    };
    var MECH = {
      manual: { label: "manual, two handlers", kg: 120, kW: 0, crew: 1, cost: 800 },
      pivot: { label: "pivot rig, four handles", kg: 260, kW: 0, crew: 1, cost: 2500 },
      steerable: { label: "steerable motor, joystick", kg: 420, kW: 2.2, crew: 2, cost: 6000 }
    };
    var SKIN = {
      silk: { label: "painted silk", kgm2: 0.22, costm2: 90, name: "Silk" },
      stretch: { label: "stretch lycra", kgm2: 0.28, costm2: 70, name: "Lycra" },
      foam: { label: "carved foam shell", kgm2: 0.5, costm2: 140, name: "Foam" }
    };

    function checked(nodes, fallback) {
      for (var i = 0; i < nodes.length; i++) if (nodes[i].checked) return Number(nodes[i].value);
      return Number(fallback);
    }

    function m(value, digits) {
      return value.toFixed(digits === undefined ? 1 : digits) + " m";
    }

    function compute() {
      var ch = CHASSIS[chassisEl.value];
      var n = checked(figureInputs, 2);
      var h = Number(heightEl.value);
      var mech = MECH[mechEl.value];
      var skin = SKIN[skinEl.value];

      var length = ch.baseLength + n * ch.growth;
      var deckAreaM2 = length * ch.width;
      var skinAreaM2 = Math.round(2.64 * h * n + length * 1.2);
      var figureKg = (200 + h * 20) * n;
      var trussKg = 480 * n;

      var grossKg = ch.kg + 110 * length + 350 + trussKg + figureKg + mech.kg +
        ch.ballast + 380 + 300 + skinAreaM2 * skin.kgm2;
      var grossT = grossKg / 1000;
      var axleT = grossT / ch.axles;

      var crew = 2 + n * 2 + mech.crew + 1;
      var power = 1.2 + n * 0.45 + mech.kW + 0.3;
      var permit = h > 8 || ch.width > 2.4 ? "Class C, special" : (h > 6 ? "Class B" : "Class A");
      var weeks = Math.round(ch.weeks + n * 2.4 + (h - 3.5) * 0.6);
      var cost = ch.cost + n * (2800 + h * 700) + skinAreaM2 * skin.costm2 + mech.cost;
      var low = Math.round((cost * 0.88) / 1000) * 1000;
      var high = Math.round((cost * 1.12) / 1000) * 1000;

      return {
        ch: ch, n: n, h: h, mech: mech, skin: skin,
        length: length, width: ch.width, skinAreaM2: skinAreaM2,
        grossT: grossT, axleT: axleT, crew: crew, power: power,
        permit: permit, weeks: weeks, low: low, high: high
      };
    }

    function drawRig(r) {
      var W = 620, H = 400, groundY = 344;
      var scaleY = 250 / 9;
      var scaleX = Math.min(42, 470 / r.length);
      var Lpx = r.length * scaleX;
      var left = (W - Lpx) / 2;
      var deckY = groundY - 40;
      var figureH = Math.max(40, r.h * scaleY - 40);
      var partsOut = [];

      partsOut.push('<rect width="' + W + '" height="' + H + '" fill="#f7f3e8"/>');
      partsOut.push('<g stroke="#ddd5c4" stroke-width="1"><path d="M20 40V' + groundY + 'M20 ' + groundY + 'h580"/><path d="M20 80h-5M20 140h-5M20 200h-5M20 260h-5M20 320h-5"/></g>');
      partsOut.push('<path d="M20 ' + groundY + 'h580" stroke="#8d8779" stroke-width="1.4" stroke-dasharray="9 6"/>');

      /* truss towers */
      for (var i = 0; i < r.n; i++) {
        var cx = r.n === 1 ? left + Lpx / 2 : left + 70 + (i * (Lpx - 140)) / (r.n - 1);
        var towerTop = deckY - figureH * 0.94;
        partsOut.push('<g stroke="#5d6167" stroke-width="2" fill="none">');
        partsOut.push('<path d="M' + (cx - 34) + ' ' + deckY + 'V' + towerTop + 'M' + (cx + 34) + ' ' + deckY + 'V' + towerTop + '"/>');
        for (var k = 0; k < 5; k++) {
          var y1 = towerTop + (k * (deckY - towerTop)) / 5;
          var y2 = towerTop + ((k + 1) * (deckY - towerTop)) / 5;
          partsOut.push('<path d="M' + (cx - 34) + ' ' + y1 + 'h68M' + (cx - 34) + ' ' + y1 + 'L' + (cx + 34) + ' ' + y2 + '"/>');
        }
        partsOut.push('</g>');
      }

      /* chassis + wheels */
      partsOut.push('<rect x="' + left + '" y="' + (groundY - 30) + '" width="' + Lpx + '" height="26" fill="#1c1e21"/>');
      partsOut.push('<rect x="' + left + '" y="' + (groundY - 30) + '" width="' + Lpx + '" height="4" fill="#4a4d52"/>');
      var wheelXs = [left + 52, left + Lpx - 52];
      if (r.length > 9.5) wheelXs.push(left + Lpx / 2);
      wheelXs.forEach(function (wx) {
        partsOut.push('<circle cx="' + wx + '" cy="' + (groundY - 12) + '" r="18" fill="#2a2c30" stroke="#0f1012" stroke-width="2"/>');
        partsOut.push('<circle cx="' + wx + '" cy="' + (groundY - 12) + '" r="7" fill="#5d6167"/>');
      });

      /* deck */
      partsOut.push('<rect x="' + (left - 8) + '" y="' + (deckY - 2) + '" width="' + (Lpx + 16) + '" height="8" fill="#c8971f"/>');

      /* skirt */
      partsOut.push('<path d="M' + left + ' ' + (deckY + 6) + 'c-6 16 -6 28 0 40h' + Lpx + 'c6-12 6-24 0-40Z" fill="#b8431a"/>');
      partsOut.push('<path d="M' + left + ' ' + (deckY + 46) + 'h' + Lpx + '" stroke="#8d2f10" stroke-width="2"/>');

      /* figures */
      var colors = ["#c8971f", "#2f6b62", "#c8971f", "#2f6b62"];
      for (var f = 0; f < r.n; f++) {
        var fx = r.n === 1 ? left + Lpx / 2 : left + 70 + (f * (Lpx - 140)) / (r.n - 1);
        var headR = Math.max(10, figureH * 0.13);
        var bodyTop = deckY - figureH + headR * 2;
        var fill = colors[f % colors.length];
        partsOut.push('<g>');
        partsOut.push('<path d="M' + (fx - 26) + ' ' + deckY + 'c0-' + (figureH * 0.42) + ' 10-' + (figureH * 0.5) + ' 26-' + (figureH * 0.5) + 's26 ' + (figureH * 0.08) + ' 26 ' + (figureH * 0.5) + 'Z" fill="' + fill + '"/>');
        partsOut.push('<circle cx="' + fx + '" cy="' + (bodyTop - headR) + '" r="' + headR + '" fill="' + fill + '"/>');
        partsOut.push('<path d="M' + (fx - 26) + ' ' + (deckY - figureH * 0.32) + 'c-16-4-24-12-26-24m78 24c16-4 24-12 26-24" stroke="' + fill + '" stroke-width="' + Math.max(5, headR * 0.45) + '" fill="none" stroke-linecap="round"/>');
        partsOut.push('</g>');
      }

      /* dimensions */
      partsOut.push('<g stroke="#1c1e21" stroke-width="1" font-family="IBM Plex Mono, monospace" font-size="11" fill="#1c1e21">');
      var dimX = left + Lpx + 28;
      var topY = deckY - figureH;
      partsOut.push('<path d="M' + dimX + ' ' + topY + 'v' + (groundY - topY) + '"/>');
      partsOut.push('<path d="M' + (dimX - 5) + ' ' + topY + 'h10M' + (dimX - 5) + ' ' + groundY + 'h10"/>');
      partsOut.push('<text x="' + (dimX + 6) + '" y="' + (topY + (groundY - topY) / 2) + '" font-size="10">' + r.h.toFixed(1) + ' m</text>');
      partsOut.push('<path d="M' + left + ' ' + (groundY + 22) + 'h' + Lpx + '"/>');
      partsOut.push('<path d="M' + left + ' ' + (groundY + 16) + 'v12M' + (left + Lpx) + ' ' + (groundY + 16) + 'v12"/>');
      partsOut.push('<rect x="' + (left + Lpx / 2 - 30) + '" y="' + (groundY + 14) + '" width="60" height="16" fill="#f7f3e8"/>');
      partsOut.push('<text x="' + (left + Lpx / 2) + '" y="' + (groundY + 26) + '" text-anchor="middle" font-size="11">' + r.length.toFixed(1) + ' m</text>');
      partsOut.push('</g>');

      partsOut.push('<text x="24" y="30" font-family="IBM Plex Mono, monospace" font-size="10" fill="#6d7075">ELEVATION, CALCULATED LOAD</text>');
      partsOut.push('<text x="' + (W - 24) + '" y="30" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="10" fill="#6d7075">' + r.permit.toUpperCase() + '</text>');

      svg.innerHTML = partsOut.join("");
    }

    function render() {
      var r = compute();
      heightOut.textContent = r.h.toFixed(1) + " m";
      drawRig(r);

      document.getElementById("n-foot").textContent = r.length.toFixed(1) + " × " + r.width.toFixed(1) + " m";
      document.getElementById("n-weight").textContent = r.grossT.toFixed(1) + " t";
      document.getElementById("n-axle").textContent = r.axleT.toFixed(1) + " t per axle";
      document.getElementById("n-crew").textContent = String(r.crew);
      document.getElementById("n-silk").textContent = r.skinAreaM2 + " m²";
      document.getElementById("n-power").textContent = r.power.toFixed(1) + " kW";
      document.getElementById("n-permit").textContent = r.permit;
      document.getElementById("n-weeks").textContent = r.weeks + " weeks";
      document.getElementById("n-cost").textContent =
        "€" + r.low.toLocaleString("en-IE") + " to €" + r.high.toLocaleString("en-IE");
      document.getElementById("rig-caption").textContent =
        r.ch.label + ", " + r.n + (r.n === 1 ? " giant" : " giants") + ", " + r.h.toFixed(1) +
        " m overall, " + r.mech.label + ", " + r.skin.label + ".";
      document.getElementById("calc-note").textContent = r.n === 0
        ? "A float with no giants still needs ballast: the deck is lighter than it looks, and a light float is a float that tips."
        : (r.mech === MECH.pivot
          ? "Pivot rigs need 1.2 m of clear deck behind each figure. Tell the fire brigade before you tell the sponsor."
          : (r.mech === MECH.steerable
            ? "Steerable heads add a motor, a joystick and a second handler, and the motor needs its own fuse on the light circuit."
            : "Manual rigs are the cheapest and the hardest on the operators: two handlers per figure, and a rest every twenty minutes."));
    }

    form.addEventListener("change", render);
    heightEl.addEventListener("input", render);
    render();
  }

  /* ---------- brief form ---------- */

  var brief = document.getElementById("brief-form");
  if (brief) {
    var status = document.getElementById("form-status");
    brief.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!status) return;

      var required = [
        { id: "b-name", label: "your name" },
        { id: "b-email", label: "an email address" },
        { id: "b-date", label: "the parade date" },
        { id: "b-city", label: "the city" },
        { id: "b-message", label: "what you want built" }
      ];
      var missing = [];
      required.forEach(function (field) {
        var el = document.getElementById(field.id);
        if (!el) return;
        var empty = !el.value || !el.value.trim();
        el.setAttribute("aria-invalid", empty ? "true" : "false");
        if (empty) missing.push(field.label);
      });

      var email = document.getElementById("b-email");
      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        email.setAttribute("aria-invalid", "true");
        status.className = "form-status is-error";
        status.textContent = "That email address is missing something. Check it and send again.";
        email.focus();
        return;
      }

      if (missing.length) {
        status.className = "form-status is-error";
        status.textContent = "Still needed: " + missing.join(", ") + ".";
        var first = required.filter(function (f) { return missing.indexOf(f.label) !== -1; })[0];
        var node = first && document.getElementById(first.id);
        if (node) node.focus();
        return;
      }

      var name = document.getElementById("b-name").value.trim();
      var date = document.getElementById("b-date").value;
      var city = document.getElementById("b-city").value.trim();
      var scale = document.getElementById("b-scale");
      var scaleText = scale ? scale.options[scale.selectedIndex].text : "scale to discuss";
      var note = document.getElementById("b-message").value.trim();

      var body = "Name: " + name + "\nEmail: " + email.value.trim() + "\nParade date: " + date +
        "\nCity: " + city + "\nScale: " + scaleText + "\n\n" + note;
      var mailto = "mailto:rui@floatworks.com.br?subject=" +
        encodeURIComponent("Float brief: " + city + ", " + date) + "&body=" + encodeURIComponent(body);

      status.className = "form-status is-ok";
      status.innerHTML = "";
      var strong = document.createElement("strong");
      strong.textContent = "The brief is complete, " + name.split(" ")[0] + ".";
      status.appendChild(strong);
      status.appendChild(document.createTextNode("Your message is ready to send. Rui replies within three working days; February dates close in November."));
      var link = document.createElement("a");
      link.href = mailto;
      link.textContent = "Open the message in your mail app";
      link.className = "link-quiet";
      link.style.display = "inline-block";
      link.style.marginTop = "10px";
      status.appendChild(link);
    });
  }
})();
