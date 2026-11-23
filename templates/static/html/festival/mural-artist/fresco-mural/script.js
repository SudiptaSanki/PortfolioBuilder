/* Fresco Mural — interactions
   Silent site. Pigment and lime arithmetic is local. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- fireflies ---------- */

  var canvas = document.getElementById("fireflies");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var flies = [];
    var w = 0, h = 0, dpr = 1;

    function size() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flies = [];
      var count = Math.round(Math.min(40, w / 26));
      for (var i = 0; i < count; i++) {
        flies.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.9 + Math.random() * 1.7,
          phase: Math.random() * Math.PI * 2,
          speed: 0.15 + Math.random() * 0.35,
          drift: 0.3 + Math.random() * 0.7,
          amp: 6 + Math.random() * 18,
          alpha: 0.25 + Math.random() * 0.5
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      flies.forEach(function (f) {
        var x = f.x + Math.sin(t * 0.0004 * f.drift + f.phase) * f.amp;
        var y = f.y + Math.cos(t * 0.0003 * f.drift + f.phase) * f.amp * 0.6;
        var pulse = 0.55 + 0.45 * Math.sin(t * 0.0016 * f.speed + f.phase);
        ctx.beginPath();
        ctx.arc(x, y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(230,196,120," + (f.alpha * pulse).toFixed(3) + ")";
        ctx.fill();
      });
    }

    size();
    if (reduceMotion) {
      draw(1200);
    } else {
      var loop = function (t) {
        draw(t);
        window.requestAnimationFrame(loop);
      };
      window.requestAnimationFrame(loop);
    }

    var timer = 0;
    window.addEventListener("resize", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        size();
        if (reduceMotion) draw(1200);
      }, 200);
    });
  }

  /* ---------- wall planner ---------- */

  var form = document.getElementById("planner-form");
  if (form && document.getElementById("wall-svg")) {
    var widthEl = document.getElementById("width");
    var heightEl = document.getElementById("height");
    var widthOut = document.getElementById("width-out");
    var heightOut = document.getElementById("height-out");
    var surfaceEl = document.getElementById("surface");
    var exposureInputs = form.querySelectorAll('input[name="exposure"]');
    var finishEl = document.getElementById("finish");
    var paletteInputs = form.querySelectorAll('input[name="palette"]');
    var svg = document.getElementById("wall-svg");

    var SURFACES = {
      lime: { label: "old lime plaster", rate: 5200, note: "Old lime plaster is the best surface I can be given: it moves with the fresco instead of fighting it. Test for salts with a damp cloth before you commit." },
      cement: { label: "cement render", rate: 3600, note: "Cement takes fresco well if it is scratched and damped first. It is the cheapest surface I paint and the least forgiving of a bad mix." },
      laterite: { label: "laterite stone", rate: 6200, note: "Laterite drinks lime, so the first coat disappears. Budget a fourth coat and expect the red to come back through the ochre within a season." },
      drywall: { label: "drywall or ply", rate: 2900, note: "A fresco on drywall is really a secco with better manners. It will look right for five years indoors and will not survive a leak." }
    };
    var PALETTES = {
      earth: { name: "ochre, indigo and laterite", colors: ["#c48a2c", "#2b4a6f", "#a04a2e"] },
      monsoon: { name: "indigo, lime and green", colors: ["#2b4a6f", "#e8dfc9", "#4a6741"] },
      clay: { name: "laterite, sand and green", colors: ["#a04a2e", "#e0b56a", "#4a6741"] }
    };
    var EXPOSURE = {
      interior: { label: "interior", factor: 1, note: "Interior lime needs air movement, not a sealer. Leave the wall alone for three weeks and keep the room ventilated." },
      sheltered: { label: "sheltered outside", factor: 1.05, note: "A sheltered outside wall will take a fresco if the rain never hits it directly. Check where the water goes in a July storm, not in January." },
      exterior: { label: "full weather", factor: 1.15, note: "A fresco on a wall that takes the monsoon will not survive June. I paint exteriors between November and April, and I would rather tell you that now." }
    };

    function checked(nodes, fallback) {
      for (var i = 0; i < nodes.length; i++) if (nodes[i].checked) return nodes[i].value;
      return fallback;
    }

    function rupees(n) {
      return "₹" + Math.round(n).toLocaleString("en-IN");
    }

    function compute() {
      var w = Number(widthEl.value);
      var h = Number(heightEl.value);
      var surface = SURFACES[surfaceEl.value];
      var exposure = EXPOSURE[checked(exposureInputs, "interior")];
      var finish = finishEl.value;
      var palette = PALETTES[checked(paletteInputs, "earth")];

      var area = w * h;
      var lime = Math.round(area * 1.8 * (surfaceEl.value === "laterite" ? 1.25 : 1));
      var sand = Math.round(area * 4.2 * (surfaceEl.value === "laterite" ? 1.2 : 1));
      var pigmentTotal = area * (finish === "fresco" ? 18 : 9) * (surfaceEl.value === "laterite" ? 1.15 : 1);
      var pigment = Math.round(pigmentTotal / 3);
      var scaffold = h > 2.6 ? Math.max(1, Math.ceil(area / 28)) : 0;
      var days = Math.max(1, Math.ceil(area / (finish === "fresco" ? 6 : 9))) + (surfaceEl.value === "laterite" ? 1 : 0);
      var cure = surfaceEl.value === "drywall" ? 3 : (finish === "fresco" ? 21 : 14);
      var crew = 1 + Math.ceil(area / 40);
      var rate = surface.rate * (finish === "fresco" ? 1.15 : 1) * exposure.factor;
      var estimate = area * rate + scaffold * 1800;
      var low = Math.round((estimate * 0.9) / 1000) * 1000;
      var high = Math.round((estimate * 1.12) / 1000) * 1000;

      return {
        w: w, h: h, area: area, surface: surface, exposure: exposure, finish: finish,
        palette: palette, lime: lime, sand: sand, pigment: pigment, scaffold: scaffold,
        days: days, cure: cure, crew: crew, low: low, high: high
      };
    }

    function drawWall(r) {
      var W = 640, H = 340;
      var maxW = 430, maxH = 210;
      var scale = Math.min(maxW / r.w, maxH / r.h);
      var wallW = r.w * scale;
      var wallH = r.h * scale;
      var left = 110;
      var top = 250 - wallH;
      var p = [];

      p.push('<rect width="' + W + '" height="' + H + '" fill="#f4efe3"/>');
      p.push('<path d="M30 250h580" stroke="#8a8577" stroke-width="1.4" stroke-dasharray="8 5"/>');

      /* wall */
      p.push('<rect x="' + left + '" y="' + top + '" width="' + wallW + '" height="' + wallH + '" fill="#ece4d3" stroke="#23231e" stroke-width="1.6"/>');

      /* painted register at eye height */
      var bandBottom = top + wallH;
      var paintH = Math.min(wallH * 0.55, 1.6 * scale);
      var paintTop = bandBottom - Math.min(wallH * 0.9, 2.3 * scale);
      var paintBottom = paintTop + paintH;
      p.push('<rect x="' + left + '" y="' + paintTop + '" width="' + wallW + '" height="' + paintH + '" fill="' + r.palette.colors[1] + '"/>');
      p.push('<path d="M' + left + ' ' + paintTop + 'c' + (wallW * 0.12) + ' ' + (paintH * 0.22) + ' ' + (wallW * 0.24) + ' ' + (paintH * 0.22) + ' ' + (wallW * 0.36) + ' 0s' +
        (wallW * 0.24) + ' -' + (paintH * 0.22) + ' ' + (wallW * 0.36) + ' 0 ' + (wallW * 0.24) + ' ' + (paintH * 0.22) + ' ' + (wallW * 0.36) + ' 0 ' + (wallW * 0.24) + ' -' + (paintH * 0.22) + ' ' + (wallW * 0.36) + ' 0" fill="' + r.palette.colors[0] + '" opacity=".92"/>');
      p.push('<circle cx="' + (left + wallW * 0.18) + '" cy="' + (paintTop + paintH * 0.42) + '" r="' + (paintH * 0.22) + '" fill="' + r.palette.colors[2] + '"/>');
      p.push('<circle cx="' + (left + wallW * 0.62) + '" cy="' + (paintTop + paintH * 0.4) + '" r="' + (paintH * 0.16) + '" fill="' + r.palette.colors[2] + '"/>');

      /* scaffold */
      if (r.scaffold > 0) {
        p.push('<g stroke="#6f6c60" stroke-width="1.4" fill="none" opacity=".85">');
        var sx = left + wallW - 24;
        p.push('<path d="M' + sx + ' 250V' + (top - 26) + 'M' + (sx + 26) + ' 250V' + (top - 26) + '"/>');
        for (var y = 250; y > top - 20; y -= 34) {
          p.push('<path d="M' + sx + ' ' + y + 'h26"/>');
        }
        p.push('</g>');
      }

      /* scale figure */
      var personH = 1.7 * scale;
      p.push('<g fill="#23231e" opacity=".78">');
      p.push('<circle cx="' + (left - 26) + '" cy="' + (250 - personH + 5) + '" r="6"/>');
      p.push('<path d="M' + (left - 32) + ' 250v-' + (personH - 12) + 'c0-6 4-9 6-9s6 3 6 9V250Z"/>');
      p.push('</g>');

      /* dimensions */
      p.push('<g stroke="#23231e" stroke-width="1" font-family="Figtree, sans-serif" font-size="11" fill="#23231e">');
      p.push('<path d="M' + (left + wallW + 26) + ' ' + top + 'v' + wallH + '"/>');
      p.push('<path d="M' + (left + wallW + 20) + ' ' + top + 'h12M' + (left + wallW + 20) + ' ' + (top + wallH) + 'h12"/>');
      p.push('<text x="' + (left + wallW + 36) + '" y="' + (top + wallH / 2 + 4) + '">' + r.h.toFixed(1) + ' m</text>');
      p.push('<path d="M' + left + ' 288h' + wallW + '"/>');
      p.push('<path d="M' + left + ' 282v12M' + (left + wallW) + ' 282v12"/>');
      p.push('<text x="' + (left + wallW / 2) + '" y="' + 306 + '" text-anchor="middle">' + r.w.toFixed(1) + ' m</text>');
      p.push('</g>');

      /* legend */
      p.push('<g font-family="Figtree, sans-serif" font-size="11" fill="#4c4a41">');
      p.push('<rect x="30" y="30" width="12" height="12" fill="' + r.palette.colors[0] + '"/><text x="48" y="40">' + (r.palette.colors[0] === "#e8dfc9" ? "lime" : "ochre") + '</text>');
      p.push('<rect x="120" y="30" width="12" height="12" fill="' + r.palette.colors[1] + '"/><text x="138" y="40">' + (r.palette.colors[1] === "#2b4a6f" ? "indigo" : "ground") + '</text>');
      p.push('<rect x="210" y="30" width="12" height="12" fill="' + r.palette.colors[2] + '"/><text x="228" y="40">' + (r.palette.colors[2] === "#a04a2e" ? "laterite" : "accent") + '</text>');
      p.push('<text x="610" y="40" text-anchor="end">' + r.surface.label + "</text>");
      p.push('</g>');

      p.push('<text x="30" y="330" font-family="Figtree, sans-serif" font-size="10" fill="#6f6c60">ELEVATION, TO SCALE · PAINTED BAND AT EYE HEIGHT</text>');

      svg.innerHTML = p.join("");
    }

    function render() {
      var r = compute();
      widthOut.textContent = r.w.toFixed(1) + " m";
      heightOut.textContent = r.h.toFixed(1) + " m";
      drawWall(r);

      document.getElementById("n-area").textContent = r.area.toFixed(1) + " m²";
      document.getElementById("n-lime").textContent = r.lime + " kg";
      document.getElementById("n-sand").textContent = r.sand + " kg";
      document.getElementById("n-pigment").textContent = r.pigment + " g";
      document.getElementById("n-scaffold").textContent = r.scaffold === 0 ? "None, steps" : r.scaffold + (r.scaffold === 1 ? " day" : " days");
      document.getElementById("n-days").textContent = r.days + (r.days === 1 ? " day" : " days");
      document.getElementById("n-cure").textContent = r.cure + " days";
      document.getElementById("n-crew").textContent = String(r.crew);
      document.getElementById("n-cost").textContent = rupees(r.low) + " to " + rupees(r.high);
      document.getElementById("wall-caption").textContent =
        "Wall: " + r.w.toFixed(1) + " by " + r.h.toFixed(1) + " metres, " + r.surface.label + ", " +
        r.exposure.label + ", " + (r.finish === "fresco" ? "fresco" : "secco") + ". The painted band sits at eye height.";
      document.getElementById("wall-note").textContent = r.surface.note + " " + r.exposure.note;
    }

    form.addEventListener("change", render);
    widthEl.addEventListener("input", render);
    heightEl.addEventListener("input", render);
    render();
  }

  /* ---------- contact form ---------- */

  var wallForm = document.getElementById("wall-form");
  if (wallForm) {
    var status = document.getElementById("form-status");
    wallForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!status) return;

      var required = [
        { id: "w-name", label: "your name" },
        { id: "w-email", label: "an email address" },
        { id: "w-venue", label: "the wall or the place" },
        { id: "w-message", label: "roughly how big the wall is" }
      ];
      var missing = [];
      required.forEach(function (field) {
        var el = document.getElementById(field.id);
        if (!el) return;
        var empty = !el.value || !el.value.trim();
        el.setAttribute("aria-invalid", empty ? "true" : "false");
        if (empty) missing.push(field.label);
      });

      var email = document.getElementById("w-email");
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

      var name = document.getElementById("w-name").value.trim();
      var venue = document.getElementById("w-venue").value.trim();
      var size = document.getElementById("w-size");
      var sizeText = size && size.value.trim() ? size.value.trim() + " m²" : "size to measure";
      var surface = document.getElementById("w-surface");
      var surfaceText = surface ? surface.options[surface.selectedIndex].text : "surface to check";
      var note = document.getElementById("w-message").value.trim();

      var body = "Name: " + name + "\nEmail: " + email.value.trim() + "\nWall: " + venue +
        "\nSize: " + sizeText + "\nSurface: " + surfaceText + "\n\n" + note;
      var mailto = "mailto:ira@limeandpigment.in?subject=" +
        encodeURIComponent("Wall: " + venue) + "&body=" + encodeURIComponent(body);

      status.className = "form-status is-ok";
      status.innerHTML = "";
      var strong = document.createElement("strong");
      strong.textContent = "That is enough to start, " + name.split(" ")[0] + ".";
      status.appendChild(strong);
      status.appendChild(document.createTextNode("Your note is ready to send. I answer on Fridays and Mondays, and I will ask for a photograph of the wall with something for scale."));
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
