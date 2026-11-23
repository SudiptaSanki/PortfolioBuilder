/* HYPHA — shared script.
   No audio anywhere (the sound need-test fails for this trade: the work is
   silent). No hover-triggered anything. All instruments run on the figures
   printed on the page. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Cross-document view transitions abort noisily in some browsers; the
     navigation itself always completes, so swallow only that rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- specimen-tray mobile menu ---------- */
  var trayBtn = document.getElementById("trayBtn");
  var trayPanel = document.getElementById("trayPanel");
  if (trayBtn && trayPanel) {
    var closeTray = function () {
      trayPanel.classList.remove("open");
      trayBtn.setAttribute("aria-expanded", "false");
    };
    trayBtn.addEventListener("click", function () {
      var open = trayPanel.classList.toggle("open");
      trayBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        requestAnimationFrame(function () {
          var first = trayPanel.querySelector("a");
          if (first) first.focus();
        });
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && trayPanel.classList.contains("open")) {
        closeTray();
        trayBtn.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (trayPanel.classList.contains("open") &&
          !trayPanel.contains(e.target) && e.target !== trayBtn && !trayBtn.contains(e.target)) {
        closeTray();
      }
    });
  }

  /* ---------- reveal on scroll (job: reading order) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- growth planner (index only) ----------
     Printed figures: nominal rate 2.5 mm/day, variation ±20% (2.0–3.0),
     drying 4 days, press & finish 2 days. Growth counted in whole days,
     rounded up. */
  var planVal = document.getElementById("planVal");
  if (planVal) {
    var RATE_NOM = 2.5, RATE_FAST = 3.0, RATE_SLOW = 2.0, DRY = 4, FINISH = 2;
    var thickness = 25;
    var fmtDays = function (t, rate) {
      var exact = t / rate;
      var days = Math.ceil(exact);
      return t + " ÷ " + rate.toFixed(1) + " = " + exact.toFixed(1) + " → " + days + (days === 1 ? " day" : " days");
    };
    var renderPlan = function () {
      planVal.textContent = thickness;
      var gN = Math.ceil(thickness / RATE_NOM);
      var gF = Math.ceil(thickness / RATE_FAST);
      var gS = Math.ceil(thickness / RATE_SLOW);
      document.getElementById("prGrowNom").textContent = fmtDays(thickness, RATE_NOM);
      document.getElementById("prGrowFast").textContent = fmtDays(thickness, RATE_FAST);
      document.getElementById("prGrowSlow").textContent = fmtDays(thickness, RATE_SLOW);
      document.getElementById("prTotal").textContent = (gN + DRY + FINISH) + " days";
      document.getElementById("prRange").textContent = (gF + DRY + FINISH) + "–" + (gS + DRY + FINISH) + " days";
    };
    document.getElementById("planMinus").addEventListener("click", function () {
      thickness = Math.max(10, thickness - 5); renderPlan();
    });
    document.getElementById("planPlus").addEventListener("click", function () {
      thickness = Math.min(60, thickness + 5); renderPlan();
    });
    renderPlan();
  }

  /* ---------- programme estimator (index only) ----------
     Printed rates: designer €680/day, technician €420/day,
     batch €240, test set €350. */
  var estTotal = document.getElementById("estTotal");
  if (estTotal) {
    var RATES = { estDesigner: 680, estTech: 420, estBatch: 240, estTest: 350 };
    var UNITS = { estDesigner: "days", estTech: "days", estBatch: "batches", estTest: "sets" };
    var counts = { estDesigner: 6, estTech: 10, estBatch: 4, estTest: 2 };
    var money = function (n) { return "€" + n.toLocaleString("en-GB"); };
    var renderEst = function () {
      var total = 0;
      Object.keys(RATES).forEach(function (key) {
        var amount = counts[key] * RATES[key];
        total += amount;
        document.getElementById(key + "Val").textContent = counts[key];
        var calcEl = document.getElementById("amt" + key.slice(3) + "Calc");
        var amtEl = document.getElementById("amt" + key.slice(3));
        if (calcEl) calcEl.textContent = counts[key] + " " + UNITS[key] + " × " + money(RATES[key]);
        if (amtEl) amtEl.textContent = money(amount);
      });
      estTotal.textContent = money(total);
    };
    document.querySelectorAll("[data-for]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-for");
        var dir = parseInt(btn.getAttribute("data-dir"), 10);
        counts[key] = Math.max(0, Math.min(60, counts[key] + dir));
        renderEst();
      });
    });
    renderEst();
  }

  /* ---------- growth drawing (index only) ----------
     A quiet garnish with a job: it shows how a mould colonises — hyphae
     branching outward from the inoculation points until the tray is full.
     Reduced motion (or no canvas support) renders the finished pattern. */
  var canvas = document.getElementById("growthCanvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#0a140d";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(39,64,46,.9)";
    ctx.lineWidth = 1;
    for (var g = 1; g < 6; g++) {
      ctx.beginPath(); ctx.moveTo((W / 6) * g, 0); ctx.lineTo((W / 6) * g, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (H / 6) * g); ctx.lineTo(W, (H / 6) * g); ctx.stroke();
    }
    var tips = [];
    var seeds = [[W * .3, H * .55], [W * .68, H * .38], [W * .52, H * .78]];
    seeds.forEach(function (s) {
      for (var i = 0; i < 5; i++) {
        tips.push({ x: s[0], y: s[1], a: (Math.PI * 2 * i) / 5 + s[0] % 1, life: 46 });
      }
      ctx.fillStyle = "#d9a441";
      ctx.beginPath(); ctx.arc(s[0], s[1], 3.5, 0, Math.PI * 2); ctx.fill();
    });
    var step = function () {
      var alive = false;
      var next = [];
      tips.forEach(function (t) {
        if (t.life <= 0) return;
        alive = true;
        var nx = t.x + Math.cos(t.a) * 7;
        var ny = t.y + Math.sin(t.a) * 7;
        ctx.strokeStyle = "rgba(143,227,160,.75)";
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(nx, ny); ctx.stroke();
        t.x = nx; t.y = ny; t.life -= 1;
        t.a += (Math.sin(t.life * 12.9898) * .5) * .55;
        next.push(t);
        if (t.life % 9 === 0) {
          next.push({ x: t.x, y: t.y, a: t.a + .8, life: Math.min(t.life, 22) });
        }
      });
      tips = next;
      if (alive && !reduced) requestAnimationFrame(step);
    };
    if (reduced) { for (var k = 0; k < 60; k++) step(); }
    else requestAnimationFrame(step);
  }

  /* ---------- enquiry form (contact only) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName").value.trim();
      var email = document.getElementById("fEmail").value.trim();
      var type = document.getElementById("fType").value;
      var msg = document.getElementById("fMsg").value.trim();
      var ok = true;
      var setErr = function (id, bad) {
        document.getElementById(id).hidden = !bad;
        if (bad) ok = false;
      };
      setErr("errName", name.length < 2);
      setErr("errEmail", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email));
      setErr("errMsg", msg.length < 10);
      if (!ok) {
        var firstErr = form.querySelector(".err:not([hidden])");
        if (firstErr) firstErr.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
        return;
      }
      var initials = name.split(/\s+/).map(function (w) { return w.charAt(0).toUpperCase(); }).join("").slice(0, 3);
      var sum = 0;
      var seedStr = name + email;
      for (var i = 0; i < seedStr.length; i++) sum += seedStr.charCodeAt(i);
      var ref = "ENQ-" + initials + "-" + (1000 + (sum % 9000));
      document.getElementById("confRef").textContent = ref;
      document.getElementById("confSummary").textContent =
        name + " · " + type + " · reply to " + email;
      form.hidden = true;
      var conf = document.getElementById("confirmation");
      conf.hidden = false;
      conf.focus();
      conf.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    });
  }
})();
