/* Fiesta Mesa — interactions
   Silent site. All planning arithmetic is local. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- menu ---------- */

  var menuBtn = document.querySelector(".menu-btn");
  var menu = document.getElementById("menu");
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        menu.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- petals ---------- */

  var canvas = document.getElementById("petals");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var petals = [];
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
      petals = [];
      var count = Math.round(Math.min(46, w / 10));
      for (var i = 0; i < count; i++) {
        petals.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1.6 + Math.random() * 3.2,
          vy: 0.22 + Math.random() * 0.4,
          vx: -0.2 + Math.random() * 0.4,
          rot: Math.random() * Math.PI,
          vr: -0.01 + Math.random() * 0.02,
          a: 0.25 + Math.random() * 0.45,
          tone: Math.random() > 0.45 ? "224,138,30" : "240,176,62"
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      petals.forEach(function (p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.tone + "," + p.a + ")";
        ctx.fill();
        ctx.restore();
      });
    }

    var raf = 0;
    function tick() {
      petals.forEach(function (p) {
        p.y += p.vy;
        p.x += p.vx + Math.sin((p.y + p.r * 30) * 0.01) * 0.16;
        p.rot += p.vr;
        if (p.y > h + 6) { p.y = -6; p.x = Math.random() * w; }
        if (p.x < -6) p.x = w + 6;
        if (p.x > w + 6) p.x = -6;
      });
      draw();
      raf = window.requestAnimationFrame(tick);
    }

    size();
    if (reduceMotion) draw(); else tick();

    var timer = 0;
    window.addEventListener("resize", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        size();
        if (reduceMotion) draw();
      }, 200);
    });
  }

  /* ---------- table planner ---------- */

  var form = document.getElementById("planner-form");
  if (form) {
    var occasionEl = document.getElementById("occasion");
    var seatInputs = form.querySelectorAll('input[name="seats"]');
    var paletteInputs = form.querySelectorAll('input[name="palette"]');
    var tierEl = document.getElementById("tier");
    var svg = document.getElementById("plan-svg");

    var PALETTES = {
      cempasuchil: { name: "cempasúchil", runner: "#a8452c", flower: "#e08a1e", core: "#a8452c", leaf: "#2e5c34" },
      rosa: { name: "rosa mexicano", runner: "#b31f56", flower: "#e8a0b4", core: "#b31f56", leaf: "#2e5c34" },
      jade: { name: "jade", runner: "#1d5c4e", flower: "#b9c46a", core: "#7d8a35", leaf: "#14413a" },
      anil: { name: "azul añil", runner: "#2a4a7a", flower: "#a9c3d9", core: "#2a4a7a", leaf: "#1f3b2e" }
    };
    var TIERS = {
      sencilla: { label: "sencilla", clusters: 2, perSeat: 210 },
      clasica: { label: "clásica", clusters: 3, perSeat: 360 },
      gran: { label: "gran", clusters: 5, perSeat: 580 }
    };
    var OCCASIONS = {
      boda: { name: "wedding", note: "Weddings need six weeks: the linen order and the flower market both close early in May and December." },
      quince: { name: "quinceañera", note: "Quinceañeras need six weeks, and the waltz rehearsal usually decides the table plan, so send me both." },
      ofrenda: { name: "ofrenda", note: "Ofrendas are built on 31 October and taken down on 3 November. Book by the first week of October." },
      bautizo: { name: "baptism", note: "Baptisms need two weeks. Mornings are cheaper because the flowers are already out at the market." },
      cumple: { name: "grown-up birthday", note: "Grown-up birthdays need two weeks. A 12-seat table fits most dining rooms if the chairs can go at the ends." }
    };

    function checked(nodes, fallback) {
      for (var i = 0; i < nodes.length; i++) if (nodes[i].checked) return nodes[i].value;
      return fallback;
    }

    function money(n) {
      return "MXN " + n.toLocaleString("en-US");
    }

    function compute() {
      var seats = Number(checked(seatInputs, "8"));
      var tier = TIERS[tierEl.value];
      var palette = PALETTES[checked(paletteInputs, "cempasuchil")];
      var occ = OCCASIONS[occasionEl.value];

      var perSide = seats / 2;
      var lengthM = perSide * 0.6 + 0.6;
      var widthM = 0.9;
      var runnerM = lengthM + 0.8;
      var bunches = Math.ceil(lengthM * 2);
      var candles = Math.max(4, Math.round(seats * 0.75));
      var strings = Math.max(1, Math.ceil(lengthM / 2.5));
      var cards = seats;
      var clusters = tier.clusters;

      var isOfrenda = occasionEl.value === "ofrenda";
      if (isOfrenda) {
        bunches = Math.ceil(bunches * 1.6);
        candles += 4;
        cards = 0;
        clusters = 3;
      }

      var base = tier.perSeat * seats + bunches * 95 + strings * 260 + candles * 38 + 1800;
      if (isOfrenda) base = Math.round(base * 1.28);
      if (tierEl.value === "gran") base += seats * 60;
      var low = Math.round((base * 0.88) / 100) * 100;
      var high = Math.round((base * 1.12) / 100) * 100;

      return {
        seats: seats, lengthM: lengthM, widthM: widthM, runnerM: runnerM, bunches: bunches,
        candles: candles, strings: strings, cards: cards, clusters: clusters,
        palette: palette, tier: tier, occ: occ, isOfrenda: isOfrenda,
        low: low, high: high
      };
    }

    function drawPlan(r) {
      if (!svg) return;
      var W = 520, H = 300;
      var pxPerM = 90;
      var tw = r.lengthM * pxPerM;
      var th = r.widthM * pxPerM;
      var cx = W / 2, cy = 168;
      var left = cx - tw / 2;
      var top = cy - th / 2;
      var parts = [];

      parts.push('<rect width="' + W + '" height="' + H + '" fill="#fbf4e6"/>');

      /* papel picado strings above the table */
      for (var s = 0; s < Math.min(r.strings, 3); s++) {
        var yy = 40 + s * 18;
        parts.push('<path d="M' + (left - 10) + ' ' + yy + ' Q' + cx + ' ' + (yy + 12) + ' ' + (left + tw + 10) + ' ' + yy + '" fill="none" stroke="#6f6960" stroke-width="1" stroke-opacity=".7"/>');
        for (var f = 0; f < 9; f++) {
          var fx = left + 14 + (f * (tw - 28)) / 8;
          parts.push('<path d="M' + (fx - 6) + ' ' + yy + 'h12v13l-6-4-6 4Z" fill="' + (f % 2 ? r.palette.flower : r.palette.runner) + '" opacity=".9"/>');
        }
      }

      /* ghost of the room */
      parts.push('<rect x="' + (left - 34) + '" y="' + (top - 34) + '" width="' + (tw + 68) + '" height="' + (th + 68) + '" fill="none" stroke="#c9bda8" stroke-dasharray="4 6"/>');

      /* table */
      parts.push('<rect x="' + left + '" y="' + top + '" width="' + tw + '" height="' + th + '" rx="4" fill="#fdf9ef" stroke="#8c8272" stroke-width="1.4"/>');
      /* runner */
      var rh = th * 0.36;
      parts.push('<rect class="runner-band" x="' + left + '" y="' + (cy - rh / 2) + '" width="' + tw + '" height="' + rh + '" fill="' + r.palette.runner + '"/>');
      parts.push('<rect x="' + left + '" y="' + (cy - rh / 2) + '" width="' + tw + '" height="2" fill="#fdf9ef" opacity=".45"/>');
      parts.push('<rect x="' + left + '" y="' + (cy + rh / 2 - 2) + '" width="' + tw + '" height="2" fill="#fdf9ef" opacity=".45"/>');

      /* clusters along the centreline */
      var count = r.clusters;
      for (var c = 0; c < count; c++) {
        var px = count === 1 ? cx : left + 34 + (c * (tw - 68)) / (count - 1);
        parts.push('<circle cx="' + px + '" cy="' + cy + '" r="15" fill="' + r.palette.flower + '"/>');
        for (var k = 0; k < 6; k++) {
          var ang = (k / 6) * Math.PI * 2;
          parts.push('<circle cx="' + (px + Math.cos(ang) * 11) + '" cy="' + (cy + Math.sin(ang) * 11) + '" r="4.6" fill="' + r.palette.flower + '"/>');
        }
        parts.push('<circle cx="' + px + '" cy="' + cy + '" r="5" fill="' + r.palette.core + '"/>');
        if (!r.isOfrenda && c < count - 1) {
          /* candles between clusters */
          var gx = px + ((tw - 68) / (count - 1)) / 2;
          if (count > 1) {
            parts.push('<circle cx="' + gx + '" cy="' + (cy - rh / 2 - 8) + '" r="3.4" fill="#fdf9ef" stroke="#8c8272" stroke-width="1"/>');
            parts.push('<circle cx="' + gx + '" cy="' + (cy + rh / 2 + 8) + '" r="3.4" fill="#fdf9ef" stroke="#8c8272" stroke-width="1"/>');
          }
        }
      }

      /* places */
      var perSide = r.seats / 2;
      for (var p = 0; p < perSide; p++) {
        var pxc = left + 30 + (p * (tw - 60)) / Math.max(1, perSide - 1);
        parts.push('<rect x="' + (pxc - 14) + '" y="' + (top - 22) + '" width="28" height="14" rx="4" fill="#ece0c9" stroke="#8c8272" stroke-width="1"/>');
        parts.push('<rect x="' + (pxc - 14) + '" y="' + (top + th + 8) + '" width="28" height="14" rx="4" fill="#ece0c9" stroke="#8c8272" stroke-width="1"/>');
      }

      /* dimensions */
      var dy = top + th + 44;
      parts.push('<path d="M' + left + ' ' + dy + 'h' + tw + '" stroke="#6f6960" stroke-width="1"/>');
      parts.push('<path d="M' + left + ' ' + (dy - 4) + 'v8M' + (left + tw) + ' ' + (dy - 4) + 'v8" stroke="#6f6960" stroke-width="1"/>');
      var midLabel = r.lengthM.toFixed(1) + " m";
      var labelW = midLabel.length * 8 + 10;
      parts.push('<rect x="' + (cx - labelW / 2) + '" y="' + (dy - 9) + '" width="' + labelW + '" height="18" fill="#fbf4e6"/>');
      parts.push('<text x="' + cx + '" y="' + (dy + 5) + '" text-anchor="middle" font-family="Work Sans, sans-serif" font-size="13" fill="#4b463d">' + midLabel + '</text>');

      var dx = left - 26;
      parts.push('<path d="M' + dx + ' ' + top + 'v' + th + '" stroke="#6f6960" stroke-width="1"/>');
      parts.push('<path d="M' + (dx - 4) + ' ' + top + 'h8M' + (dx - 4) + ' ' + (top + th) + 'h8" stroke="#6f6960" stroke-width="1"/>');
      parts.push('<text x="' + (dx - 8) + '" y="' + cy + '" text-anchor="middle" font-family="Work Sans, sans-serif" font-size="12" fill="#4b4636" transform="rotate(-90 ' + (dx - 8) + ' ' + cy + ')">0.9 m</text>');

      /* key */
      parts.push('<g font-family="Work Sans, sans-serif" font-size="12" fill="#6f6960">');
      parts.push('<circle cx="' + (left + 6) + '" cy="24" r="4" fill="' + r.palette.flower + '"/><text x="' + (left + 16) + '" y="28">Centrepiece</text>');
      parts.push('<rect x="' + (left + 106) + '" y="20" width="16" height="8" rx="2" fill="' + r.palette.runner + '"/><text x="' + (left + 128) + '" y="28">Runner</text>');
      parts.push('<text x="' + (left + tw) + '" y="28" text-anchor="end">' + r.seats + ' places</text>');
      parts.push('</g>');

      svg.innerHTML = parts.join("");
    }

    function render() {
      var r = compute();
      drawPlan(r);
      document.getElementById("n-size").textContent = r.lengthM.toFixed(1) + " × " + r.widthM.toFixed(1) + " m";
      document.getElementById("n-runner").textContent = r.runnerM.toFixed(1) + " m";
      document.getElementById("n-flowers").textContent = r.bunches + (r.bunches === 1 ? " bunch" : " bunches");
      document.getElementById("n-candles").textContent = String(r.candles);
      document.getElementById("n-papel").textContent = r.strings + (r.strings === 1 ? " string of 12" : " strings of 12");
      document.getElementById("n-cards").textContent = r.cards === 0 ? "None, photographs instead" : String(r.cards);
      document.getElementById("n-cost").textContent = money(r.low) + " to " + money(r.high);
      document.getElementById("plan-caption").textContent = "Table for " + r.seats + ", " + r.tier.label + " finish, " + r.palette.name + " palette. Plan is to scale at 60 cm per place.";
      document.getElementById("plan-note").textContent = r.occ.note;
    }

    form.addEventListener("change", render);
    form.addEventListener("input", render);
    render();
  }

  /* ---------- contact form ---------- */

  var contact = document.getElementById("table-form");
  if (contact) {
    var status = document.getElementById("form-status");
    contact.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!status) return;

      var required = [
        { id: "c-name", label: "your name" },
        { id: "c-email", label: "an email address" },
        { id: "c-date", label: "the event date" },
        { id: "c-venue", label: "the venue or city" },
        { id: "c-message", label: "what the table is for" }
      ];
      var missing = [];
      required.forEach(function (field) {
        var el = document.getElementById(field.id);
        if (!el) return;
        var empty = !el.value || !el.value.trim();
        el.setAttribute("aria-invalid", empty ? "true" : "false");
        if (empty) missing.push(field.label);
      });

      var email = document.getElementById("c-email");
      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        email.setAttribute("aria-invalid", "true");
        status.className = "form-status is-error";
        status.textContent = "The email address is missing something. Check it and send again.";
        email.focus();
        return;
      }

      if (missing.length) {
        status.className = "form-status is-error";
        status.textContent = "Still needed: " + missing.join(", ") + ".";
        var firstMissing = required.filter(function (f) { return missing.indexOf(f.label) !== -1; })[0];
        var node = firstMissing && document.getElementById(firstMissing.id);
        if (node) node.focus();
        return;
      }

      var name = document.getElementById("c-name").value.trim();
      var date = document.getElementById("c-date").value;
      var venue = document.getElementById("c-venue").value.trim();
      var occasion = document.getElementById("c-occasion");
      var occasionText = occasion ? occasion.options[occasion.selectedIndex].text : "table to discuss";
      var guests = document.getElementById("c-guests");
      var guestsText = guests ? guests.value.trim() : "";
      var note = document.getElementById("c-message").value.trim();

      var body = "Name: " + name + "\nEmail: " + email.value.trim() +
        "\nEvent date: " + date + "\nOccasion: " + occasionText +
        (guestsText ? "\nGuests: " + guestsText : "") +
        "\nVenue: " + venue + "\n\n" + note;
      var mailto = "mailto:marisol@mesayfiesta.mx?subject=" +
        encodeURIComponent("Table request: " + occasionText + ", " + date) +
        "&body=" + encodeURIComponent(body);

      status.className = "form-status is-ok";
      status.innerHTML = "";
      var strong = document.createElement("strong");
      strong.textContent = "Everything needed is here, " + name.split(" ")[0] + ".";
      status.appendChild(strong);
      status.appendChild(document.createTextNode("Your message is ready to send. Marisol answers on the next working day and holds a date for four days."));
      var link = document.createElement("a");
      link.href = mailto;
      link.textContent = "Open the message in your mail app";
      link.style.display = "inline-block";
      link.style.marginTop = "10px";
      link.style.color = "var(--magenta)";
      link.style.textDecoration = "underline";
      status.appendChild(link);
    });
  }
})();
