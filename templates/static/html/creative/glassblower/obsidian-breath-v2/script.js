/* Obsidian Breath — quiet machinery.
   The planner and estimator read the tables printed on the page itself,
   so the tool and the page can never disagree. No audio, anywhere. */
(function () {
  "use strict";

  /* Cross-document view transitions abort noisily when interrupted;
     swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var menuPanel = document.getElementById("menu-panel");
  if (menuBtn && menuPanel) {
    var firstLink = menuPanel.querySelector("a");
    function closeMenu(returnFocus) {
      menuPanel.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      if (returnFocus) menuBtn.focus();
    }
    menuBtn.addEventListener("click", function () {
      var open = menuPanel.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuPanel.classList.contains("open")) closeMenu(true);
    });
    menuPanel.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu(false);
    });
  }

  /* ---------- helpers ---------- */
  function num(text) {
    var n = parseFloat(String(text).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? null : n;
  }
  function money(n) { return "$" + n.toLocaleString("en-US"); }
  function parseDateUTC(iso) {
    var p = iso.split("-");
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  }
  function fmtDate(d) {
    return d.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
    });
  }
  function addDays(d, n) {
    var c = new Date(d.getTime());
    c.setUTCDate(c.getUTCDate() + n);
    return c;
  }
  function rowsOf(table) {
    var out = [];
    if (!table) return out;
    var trs = table.querySelectorAll("tbody tr");
    for (var i = 0; i < trs.length; i++) {
      var cells = [];
      var tds = trs[i].querySelectorAll("td");
      for (var j = 0; j < tds.length; j++) cells.push(tds[j].textContent.trim());
      out.push(cells);
    }
    return out;
  }
  function line(label, value) {
    return '<div class="line"><span>' + label + '</span><span>' + value + '</span></div>';
  }

  /* Segmented choice groups: buttons with aria-pressed inside
     .choices[data-scope][data-key]. Returns a state reader. */
  function bindChoices(scopeEl, onChange) {
    var state = {};
    if (!scopeEl) return state;
    var groups = scopeEl.querySelectorAll(".choices[data-key]");
    groups.forEach(function (g) {
      var key = g.getAttribute("data-key");
      var pressed = g.querySelector('button[aria-pressed="true"]');
      if (pressed) state[key] = { value: pressed.getAttribute("data-value"), label: pressed.textContent.trim() };
      g.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        g.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        state[key] = { value: btn.getAttribute("data-value"), label: btn.textContent.trim() };
        onChange();
      });
    });
    return state;
  }

  /* ---------- Commission Planner (index) ---------- */
  var plannerEl = document.getElementById("planner");
  if (plannerEl) {
    var sched = {};   /* sched[classValue][sizeValue] = {making, hours, cycles, perCycle} */
    rowsOf(document.getElementById("sched-table")).forEach(function (c) {
      var cls = c[0], size = c[1];
      if (!sched[cls]) sched[cls] = {};
      sched[cls][size] = { making: num(c[2]), hours: num(c[3]), cycles: num(c[4]), perCycle: num(c[5]) };
    });
    var finishDays = {};
    rowsOf(document.getElementById("finish-table")).forEach(function (c) {
      finishDays[c[0]] = num(c[1]);
    });
    var startEl = document.getElementById("bench-start");
    var benchStart = parseDateUTC(startEl.getAttribute("datetime"));
    var dateInput = document.getElementById("p-date");
    var linesEl = document.getElementById("planner-lines");
    var verdictEl = document.getElementById("planner-verdict");

    var pState = bindChoices(plannerEl, renderPlanner);

    function renderPlanner() {
      var cls = pState.pclass, size = pState.psize, fin = pState.pfinish;
      if (!cls || !size || !fin) return;
      var row = sched[cls.label] && sched[cls.label][size.label];
      if (!row) return;
      var fDays = finishDays[fin.label] || 0;
      var annealDays = row.cycles * row.perCycle;
      var total = row.making + annealDays + fDays;
      var earliest = addDays(benchStart, total);
      var html = "";
      html += line("Making — " + cls.label.toLowerCase() + ", " + size.label.toLowerCase(), row.making + (row.making === 1 ? " day" : " days"));
      html += line("Hot-work hours at the bench and kiln", row.hours + " hours");
      html += line("Annealing — " + row.cycles + (row.cycles === 1 ? " cycle" : " cycles") + " × " + row.perCycle + (row.perCycle === 1 ? " day" : " days"), annealDays + (annealDays === 1 ? " day" : " days"));
      html += line("Finish — " + fin.label.toLowerCase(), fDays + (fDays === 1 ? " day" : " days"));
      html += '<div class="line total"><span>Total from bench start, ' + fmtDate(benchStart) + '</span><span>' + total + ' days</span></div>';
      html += line("Earliest honest completion", fmtDate(earliest));
      linesEl.innerHTML = html;

      var req = dateInput.value ? parseDateUTC(dateInput.value) : null;
      if (!req) {
        verdictEl.className = "verdict";
        verdictEl.textContent = "Glass cannot be hurried past its anneal. Give the planner a date and it will tell you plainly whether the date can be met.";
      } else if (req.getTime() < earliest.getTime()) {
        verdictEl.className = "verdict no";
        verdictEl.textContent = "This piece cannot be annealed and finished by " + fmtDate(req) +
          " — the earliest honest date is " + fmtDate(earliest) +
          ". A shorter promise would be made by skipping anneal time, and skipped anneal time is how glass breaks later, in your house instead of my kiln.";
      } else {
        verdictEl.className = "verdict";
        verdictEl.textContent = "That date can be met. Earliest honest completion is " + fmtDate(earliest) +
          ", which leaves " + Math.round((req.getTime() - earliest.getTime()) / 86400000) +
          " days of slack before " + fmtDate(req) + " — slack the piece may need if a cast fails and has to be remade.";
      }
    }
    dateInput.addEventListener("change", renderPlanner);
    dateInput.addEventListener("input", renderPlanner);
    renderPlanner();
  }

  /* ---------- Booking estimator (index) ---------- */
  var estEl = document.getElementById("estimator");
  if (estEl) {
    var pieceFee = {};  /* pieceFee[class][size] */
    rowsOf(document.getElementById("fee-piece-table")).forEach(function (c) {
      pieceFee[c[0]] = { "Small": num(c[1]), "Medium": num(c[2]), "Large": num(c[3]) };
    });
    var finishFee = {};
    rowsOf(document.getElementById("fee-finish-table")).forEach(function (c) {
      finishFee[c[0]] = num(c[1]);
    });
    var extras = {};    /* extras[label] = fee or null when quoted */
    rowsOf(document.getElementById("fee-extra-table")).forEach(function (c) {
      extras[c[0]] = num(c[1]);
    });
    var eLines = document.getElementById("estimator-lines");
    var eState = bindChoices(estEl, renderEstimator);

    function renderEstimator() {
      var cls = eState.eclass, size = eState.esize, fin = eState.efinish, del = eState.edelivery;
      if (!cls || !size || !fin || !del) return;
      var piece = pieceFee[cls.label] && pieceFee[cls.label][size.label];
      if (piece == null) return;
      var fFee = finishFee[fin.label] || 0;
      var crateLabel = Object.keys(extras).filter(function (k) { return /crate/i.test(k); })[0];
      var crate = extras[crateLabel] || 0;
      var html = "";
      html += line("Piece — " + cls.label.toLowerCase() + ", " + size.label.toLowerCase(), money(piece));
      html += line("Finish — " + fin.label.toLowerCase(), fFee ? money(fFee) : "Included");
      html += line("Crating — custom crate, always charged, never folded into the piece price", money(crate));
      var total = piece + fFee + crate;
      if (del.value === "international") {
        html += line("Delivery — international carriage", "Quoted after crating");
        html += '<div class="line total"><span>Total before international carriage</span><span>' + money(total) + '</span></div>';
        html += '<p class="table-note" style="margin-top:.8rem">International carriage for glass is quoted once the crate exists and can be weighed and measured. Estimating it here would be inventing a number.</p>';
      } else {
        var dFee = extras[del.label] || 0;
        html += line("Delivery — " + del.label.toLowerCase(), dFee ? money(dFee) : "Free");
        total += dFee;
        html += '<div class="line total"><span>Total</span><span>' + money(total) + '</span></div>';
      }
      eLines.innerHTML = html;
    }
    renderEstimator();
  }

  /* ---------- Enquiry form (contact) ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var conf = document.getElementById("confirmation");
    function setInvalid(id, bad) {
      var f = document.getElementById(id);
      var wrap = f.closest(".field");
      if (wrap) wrap.classList.toggle("invalid", bad);
      f.setAttribute("aria-invalid", bad ? "true" : "false");
      return !bad;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("f-name");
      var email = document.getElementById("f-email");
      var msg = document.getElementById("f-message");
      var ok = true;
      ok = setInvalid("f-name", name.value.trim().length < 2) && ok;
      ok = setInvalid("f-email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
      ok = setInvalid("f-message", msg.value.trim().length < 10) && ok;
      if (!ok) {
        var firstBad = form.querySelector('.field.invalid input, .field.invalid textarea, .field.invalid select');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = "OB-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("conf-ref").textContent = ref;
      document.getElementById("conf-name").textContent = name.value.trim();
      form.hidden = true;
      conf.hidden = false;
      conf.setAttribute("tabindex", "-1");
      conf.focus();
    });
    ["f-name", "f-email", "f-message"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener("input", function () { setInvalid(id, false); });
    });
  }
})();
