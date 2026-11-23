/* Gingerbread Manor — interactions
   Silent site. The manor is CSS 3D; all dough arithmetic is local. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- turn the manor ---------- */

  var stage = document.getElementById("stage3d");
  var house = document.getElementById("house");
  if (stage && house) {
    var ry = -34;
    var dragging = false;
    var startX = 0;
    var startRy = 0;

    function setRy(value) {
      ry = value;
      house.style.setProperty("--ry", ry.toFixed(1) + "deg");
    }

    stage.addEventListener("pointerdown", function (event) {
      dragging = true;
      startX = event.clientX;
      startRy = ry;
      house.classList.add("is-dragging");
      if (stage.setPointerCapture) {
        try { stage.setPointerCapture(event.pointerId); } catch (e) { /* ignore */ }
      }
      event.preventDefault();
    });

    stage.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      setRy(startRy + (event.clientX - startX) * 0.55);
    });

    function endDrag() {
      dragging = false;
      house.classList.remove("is-dragging");
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", function () { if (dragging) endDrag(); });

    stage.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { setRy(ry - 8); event.preventDefault(); }
      else if (event.key === "ArrowRight") { setRy(ry + 8); event.preventDefault(); }
      else if (event.key === "Home") { setRy(-34); event.preventDefault(); }
    });

    setRy(ry);
  }

  /* ---------- icing sugar snow ---------- */

  var canvas = document.getElementById("snow");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var specks = [];
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
      specks = [];
      var count = Math.round(Math.min(60, w / 14));
      for (var i = 0; i < count; i++) {
        specks.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.8 + Math.random() * 1.8,
          vy: 0.12 + Math.random() * 0.3,
          vx: -0.15 + Math.random() * 0.3,
          a: 0.25 + Math.random() * 0.5,
          tone: Math.random() > 0.5 ? "255,253,248" : "214,198,170"
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      specks.forEach(function (s) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + s.tone + "," + s.a + ")";
        ctx.fill();
      });
    }

    function tick() {
      specks.forEach(function (s) {
        s.y += s.vy;
        s.x += s.vx;
        if (s.y > h + 3) { s.y = -3; s.x = Math.random() * w; }
        if (s.x < -3) s.x = w + 3;
        if (s.x > w + 3) s.x = -3;
      });
      draw();
      window.requestAnimationFrame(tick);
    }

    size();
    if (reduceMotion) draw(); else tick();

    var timer = 0;
    window.addEventListener("resize", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { size(); if (reduceMotion) draw(); }, 200);
    });
  }

  /* ---------- structure and dough ---------- */

  var form = document.getElementById("calc-form");
  if (form && document.getElementById("cut-svg")) {
    var lengthEl = document.getElementById("length");
    var widthEl = document.getElementById("width");
    var heightEl = document.getElementById("height");
    var lengthOut = document.getElementById("length-out");
    var widthOut = document.getElementById("width-out");
    var heightOut = document.getElementById("height-out");
    var thicknessEl = document.getElementById("thickness");
    var styleEl = document.getElementById("style");
    var finishEl = document.getElementById("finish");
    var svg = document.getElementById("cut-svg");

    var STYLES = {
      gable: { label: "simple gable", riseRatio: 0.6, name: "gable" },
      steep: { label: "steep gable", riseRatio: 0.85, name: "steep gable" },
      hip: { label: "hip roof", riseRatio: 0.45, name: "hip" }
    };
    var FINISHES = {
      plain: { label: "icing trim only", candy: 0, decorHours: 2 },
      candy: { label: "candy and isomalt windows", candy: 140, decorHours: 4 },
      sculpted: { label: "sculpted figures and trees", candy: 260, decorHours: 7 }
    };

    function round(n, step) {
      return Math.round(n / step) * step;
    }

    function compute() {
      var L = Number(lengthEl.value);
      var W = Number(widthEl.value);
      var H = Number(heightEl.value);
      var t = Number(thicknessEl.value) / 10; /* cm */
      var style = STYLES[styleEl.value];
      var finish = FINISHES[finishEl.value];
      var rise = W * style.riseRatio;
      var slope = Math.sqrt(Math.pow(W / 2, 2) + Math.pow(rise, 2));

      var panels = [];
      panels.push({ name: "Front", w: L, h: H + rise, shape: "gable", rise: rise });
      panels.push({ name: "Back", w: L, h: H + rise, shape: "gable", rise: rise });
      panels.push({ name: "Side, left", w: W, h: H });
      panels.push({ name: "Side, right", w: W, h: H });
      if (style.name === "hip") {
        panels.push({ name: "Roof, front", w: L, h: W * 0.62 });
        panels.push({ name: "Roof, back", w: L, h: W * 0.62 });
        panels.push({ name: "Roof, left", w: W, h: W * 0.42, shape: "tri" });
        panels.push({ name: "Roof, right", w: W, h: W * 0.42, shape: "tri" });
      } else {
        panels.push({ name: "Roof, front", w: L + 2, h: slope });
        panels.push({ name: "Roof, back", w: L + 2, h: slope });
      }
      if (W > 30) panels.push({ name: "Interior wall", w: W, h: H });

      var area = panels.reduce(function (sum, p) {
        if (p.shape === "gable") return sum + p.w * H + 0.5 * p.w * p.rise;
        if (p.shape === "tri") return sum + 0.5 * p.w * p.h;
        return sum + p.w * p.h;
      }, 0);
      area = Math.round(area);

      var volume = area * t;
      var doughG = volume * 0.62;
      var doughKg = doughG / 1000;
      var trays = Math.max(1, packTrays(panels, 40, 30));
      var hours = Math.round(panels.length * 0.7 + area / 240 * 0.5 + finish.decorHours + 3 + (trays - 1) * 0.5);

      return {
        L: L, W: W, H: H, t: t, style: style, finish: finish, rise: rise, slope: slope,
        panels: panels, area: area, volume: volume, doughG: doughG, doughKg: doughKg,
        flour: doughG * 0.42, butter: doughG * 0.17, sugar: doughG * 0.15,
        treacle: doughG * 0.16, icing: doughG * 0.65, trays: trays, hours: hours
      };
    }

    function packTrays(panels, trayW, trayH) {
      var trays = [];
      var current = null;
      var sorted = panels.slice().sort(function (a, b) { return (b.w * b.h) - (a.w * a.h); });

      function startTray() {
        current = { shelves: [], usedH: 0 };
        trays.push(current);
      }

      sorted.forEach(function (p) {
        if (!current) startTray();
        var placed = false;
        for (var i = 0; i < current.shelves.length && !placed; i++) {
          var shelf = current.shelves[i];
          if (shelf.usedW + p.w + 0.5 <= trayW && p.h <= shelf.h + 0.01) {
            shelf.usedW += p.w + 0.5;
            placed = true;
          }
        }
        if (!placed && current.usedH + p.h <= trayH) {
          current.shelves.push({ h: p.h, usedW: p.w + 0.5 });
          current.usedH += p.h + 0.5;
          placed = true;
        }
        if (!placed) {
          startTray();
          current.shelves.push({ h: p.h, usedW: p.w + 0.5 });
          current.usedH += p.h + 0.5;
        }
      });
      return trays.length;
    }

    function drawCuts(r) {
      var W = 560, H = 380;
      var boardW = 512, boardH = 286;
      var scale = 8;
      var layout = null;

      function shelf(items, sc) {
        var rows = [];
        var row = { items: [], w: 0, h: 0, y: 0 };
        var y = 0;
        items.forEach(function (p) {
          var pw = p.w * sc;
          var ph = p.h * sc;
          if (row.items.length && row.w + pw > boardW) {
            y += row.h + 10;
            rows.push(row);
            row = { items: [], w: 0, h: 0, y: y };
          }
          row.items.push({ p: p, x: row.w, y: row.y, w: pw, h: ph });
          row.w += pw + 10;
          row.h = Math.max(row.h, ph);
        });
        if (row.items.length) rows.push(row);
        return { rows: rows, height: y + row.h };
      }

      var ordered = r.panels.slice().sort(function (a, b) { return b.h - a.h; });
      for (var attempt = 0; attempt < 8; attempt++) {
        layout = shelf(ordered, scale);
        if (layout.height <= boardH) break;
        scale *= 0.88;
      }

      var p = [];
      p.push('<rect width="' + W + '" height="' + H + '" fill="#f7f1e6"/>');
      p.push('<text x="24" y="30" font-family="Nunito Sans, sans-serif" font-size="10" fill="#7c6959">CUT LIST · ALL PANELS, DRAWN TO FIT</text>');

      var offsetY = 46;
      layout.rows.forEach(function (row) {
        row.items.forEach(function (item) {
          var x = 24 + item.x;
          var y = offsetY + item.y;
          p.push('<rect x="' + x + '" y="' + y + '" width="' + item.w + '" height="' + item.h + '" fill="#c07a45" stroke="#fffdf8" stroke-width="2.2"/>');
          p.push('<rect x="' + x + '" y="' + y + '" width="' + item.w + '" height="' + item.h + '" fill="none" stroke="#8d4f28" stroke-width=".8"/>');
          if (item.w > 54 && item.h > 26) {
            p.push('<text x="' + (x + item.w / 2) + '" y="' + (y + item.h / 2 - 2) + '" text-anchor="middle" font-family="Nunito Sans, sans-serif" font-size="8.5" fill="#fff8ee">' + item.p.name + '</text>');
            p.push('<text x="' + (x + item.w / 2) + '" y="' + (y + item.h / 2 + 9) + '" text-anchor="middle" font-family="Nunito Sans, sans-serif" font-size="7.5" fill="#ffe9d2">' + Math.round(item.p.w) + ' × ' + Math.round(item.p.h) + '</text>');
          } else if (item.h > 30) {
            p.push('<text x="' + (x + item.w / 2) + '" y="' + (y + item.h / 2 + 3) + '" text-anchor="middle" font-family="Nunito Sans, sans-serif" font-size="7.5" fill="#fff8ee" transform="rotate(-90 ' + (x + item.w / 2) + ' ' + (y + item.h / 2 + 3) + ')">' + item.p.name + '</text>');
          }
        });
      });

      /* scale reference: one 40 × 30 tray */
      var trayW = 40 * scale * 0.42;
      var trayH = 30 * scale * 0.42;
      var tx = W - trayW - 24;
      var ty = H - trayH - 26;
      p.push('<rect x="' + tx + '" y="' + ty + '" width="' + trayW + '" height="' + trayH + '" fill="none" stroke="#8c7a66" stroke-width="1" stroke-dasharray="4 3"/>');
      p.push('<text x="' + (tx + trayW / 2) + '" y="' + (ty + trayH / 2 + 3) + '" text-anchor="middle" font-family="Nunito Sans, sans-serif" font-size="8" fill="#7c6959">40 × 30 cm tray</text>');
      p.push('<text x="24" y="' + (H - 14) + '" font-family="Nunito Sans, sans-serif" font-size="10" fill="#7c6959">' + r.panels.length + ' panels · ' + r.area.toLocaleString("en-GB") + ' cm² · ' + r.trays + ' tray' + (r.trays === 1 ? "" : "s") + ' to bake</text>');

      svg.innerHTML = p.join("");
    }

    function render() {
      var r = compute();
      lengthOut.textContent = r.L + " cm";
      widthOut.textContent = r.W + " cm";
      heightOut.textContent = r.H + " cm";
      drawCuts(r);

      document.getElementById("n-panels").textContent = r.panels.length + " pieces";
      document.getElementById("n-area").textContent = r.area.toLocaleString("en-GB") + " cm²";
      document.getElementById("n-dough").textContent = (r.doughG / 1000).toFixed(1) + " kg";
      document.getElementById("n-flour").textContent = Math.round(r.flour / 10) * 10 + " g";
      document.getElementById("n-butter").textContent = Math.round(r.butter / 10) * 10 + " g";
      document.getElementById("n-treacle").textContent = Math.round(r.treacle / 10) * 10 + " g";
      document.getElementById("n-icing").textContent = (r.icing / 1000).toFixed(1) + " kg";
      document.getElementById("n-trays").textContent = String(r.trays);
      document.getElementById("n-hours").textContent = r.hours + " hours";
      document.getElementById("n-candy").textContent = r.finish.candy === 0 ? "None" : r.finish.candy + " g";
      document.getElementById("cut-caption").textContent =
        "Panels for a " + r.L + " × " + r.W + " × " + r.H + " cm manor, " + (r.t * 10) + " mm thick, " + r.style.label + ". Laid out on 40 × 30 cm trays.";
      document.getElementById("cut-note").textContent = r.W > 30
        ? "A full interior wall is included because the manor is over 30 cm wide. It is the cheapest insurance in the build."
        : "At this width the walls are self-supporting with corner gussets. If you go over 30 cm wide, the interior wall is added automatically.";
    }

    form.addEventListener("change", render);
    lengthEl.addEventListener("input", render);
    widthEl.addEventListener("input", render);
    heightEl.addEventListener("input", render);
    render();
  }

  /* ---------- commission form ---------- */

  var commission = document.getElementById("commission-form");
  if (commission) {
    var status = document.getElementById("form-status");
    commission.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!status) return;

      var required = [
        { id: "g-name", label: "your name" },
        { id: "g-email", label: "an email address" },
        { id: "g-date", label: "the date it is needed" },
        { id: "g-venue", label: "where it will stand" },
        { id: "g-message", label: "what you want built" }
      ];
      var missing = [];
      required.forEach(function (field) {
        var el = document.getElementById(field.id);
        if (!el) return;
        var empty = !el.value || !el.value.trim();
        el.setAttribute("aria-invalid", empty ? "true" : "false");
        if (empty) missing.push(field.label);
      });

      var email = document.getElementById("g-email");
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

      var name = document.getElementById("g-name").value.trim();
      var date = document.getElementById("g-date").value;
      var venue = document.getElementById("g-venue").value.trim();
      var size = document.getElementById("g-size");
      var sizeText = size && size.value.trim() ? size.value.trim() + " cm tall" : "size to discuss";
      var note = document.getElementById("g-message").value.trim();

      var body = "Name: " + name + "\nEmail: " + email.value.trim() + "\nNeeded by: " + date +
        "\nVenue: " + venue + "\nHeight: " + sizeText + "\n\n" + note;
      var mailto = "mailto:hanne@pepperkakehus.no?subject=" +
        encodeURIComponent("Gingerbread commission: " + venue) + "&body=" + encodeURIComponent(body);

      status.className = "form-status is-ok";
      status.innerHTML = "";
      var strong = document.createElement("strong");
      strong.textContent = "That is a workable brief, " + name.split(" ")[0] + ".";
      status.appendChild(strong);
      status.appendChild(document.createTextNode("Your message is ready to send. Hanne answers within two days and will send a cut list before a price."));
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
