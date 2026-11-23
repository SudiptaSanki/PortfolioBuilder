/* Keycap Vault — shared script.
   Sound ruling: NONE. This file creates no audio of any kind.
   The Build Planner reads every number from the tables printed on the
   page itself, so the tool and the sheet cannot disagree. */
(function () {
  "use strict";

  /* Cross-document view transitions abort harmlessly when a navigation is
     interrupted; swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu (labelled "Index", the shop's own word) ---------- */
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("menu-panel");
  if (btn && panel) {
    function setMenu(open) {
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
    }
    btn.addEventListener("click", function () {
      setMenu(panel.hidden);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        setMenu(false);
        btn.focus();
      }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  /* ---------- Build Planner ---------- */
  var planner = document.getElementById("planner");
  if (!planner) return;

  function money(n) { return "$" + n.toFixed(2); }
  function num(txt) { var m = String(txt).replace(",", "").match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; }

  /* Parse the printed bench table. */
  var switches = [];
  document.querySelectorAll("#bench-table tbody tr").forEach(function (tr) {
    var c = tr.querySelectorAll("td");
    var forceTxt = c[2].textContent;
    var fm = forceTxt.match(/(\d+)\s*g\s*±\s*(\d+)/);
    switches.push({
      name: c[0].textContent.trim(),
      type: c[1].textContent.trim(),
      force: fm ? +fm[1] : NaN,
      tol: fm ? +fm[2] : NaN,
      actPoint: num(c[3].textContent),
      travel: num(c[4].textContent),
      packPrice: num(c[5].textContent),
      state: c[6].textContent.trim(),
      delayed: /delayed/i.test(c[6].textContent)
    });
  });

  /* Parse the printed layout table. */
  var layouts = {};
  document.querySelectorAll("#layout-table tbody tr").forEach(function (tr) {
    var c = tr.querySelectorAll("td");
    layouts[c[0].textContent.trim()] = num(c[1].textContent);
  });

  /* Parse the printed bench rates. */
  var rates = {};
  document.querySelectorAll("#rates-table tbody tr").forEach(function (tr) {
    var c = tr.querySelectorAll("td");
    rates[c[0].textContent.trim()] = num(c[2].textContent);
  });
  var RATE_TUNE = rates["Tuning (lube + film)"];
  var RATE_SPRING = rates["Spring swap"];
  var RATE_BUILD = rates["Full build"];

  var noteEl = document.getElementById("drop06-note");
  var drop06Note = noteEl ? noteEl.textContent.replace(/\s+/g, " ").trim() : "";

  var outSpec = document.getElementById("out-spec");
  var outLines = document.getElementById("out-lines");
  var outTotal = document.getElementById("out-total");
  var delayPanel = document.getElementById("delay-panel");
  var delayBody = document.getElementById("delay-body");
  var altLine = document.getElementById("alt-line");

  function checkedVal(groupName) {
    var el = planner.querySelector('input[name="' + groupName + '"]:checked');
    return el ? el.value : null;
  }
  function serviceOn(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function priceBuild(sw, count, tune, spring, build) {
    var packs = Math.ceil(count / 10);
    var lines = [];
    var swCost = packs * sw.packPrice;
    lines.push({
      label: sw.name + " switches",
      calc: packs + " packs of 10 × " + money(sw.packPrice) + " — " + count + " fitted, " + (packs * 10 - count) + " spare in the bag",
      amt: swCost
    });
    var total = swCost;
    if (tune) {
      var t = count * RATE_TUNE;
      lines.push({ label: "Tuning (lube + film)", calc: count + " switches × " + money(RATE_TUNE) + " — charged on the switches fitted, not the spares", amt: t });
      total += t;
    }
    if (spring) {
      var s = count * RATE_SPRING;
      lines.push({ label: "Spring swap", calc: count + " switches × " + money(RATE_SPRING), amt: s });
      total += s;
    }
    if (build) {
      lines.push({ label: "Full build", calc: "flat per board — assembly, stabilisers, firmware, 24-hour typing test", amt: RATE_BUILD });
      total += RATE_BUILD;
    }
    return { lines: lines, total: total, packs: packs };
  }

  function render() {
    var layoutName = checkedVal("layout");
    var switchName = checkedVal("switch");
    if (!layoutName || !switchName) return;
    var count = layouts[layoutName];
    var sw = null;
    switches.forEach(function (s) { if (s.name === switchName) sw = s; });
    if (!sw || !count) return;
    var tune = serviceOn("svc-tune");
    var spring = serviceOn("svc-spring");
    var build = serviceOn("svc-build");

    outSpec.innerHTML =
      '<div class="ss-name">' + sw.name + " — " + sw.type + "</div>" +
      "<dl>" +
      "<div><dt>Actuation, measured</dt><dd>" + sw.force + " g ±" + sw.tol + " g</dd></div>" +
      "<div><dt>Actuation point</dt><dd>" + sw.actPoint.toFixed(1) + " mm</dd></div>" +
      "<div><dt>Total travel</dt><dd>" + sw.travel.toFixed(1) + " mm</dd></div>" +
      "</dl>" +
      '<p class="small muted" style="margin-top:10px">' + layoutName + " needs " + count +
      " switches (Layout Table L1). Bench figures are the printed means from Bench Table B1.</p>";

    var priced = priceBuild(sw, count, tune, spring, build);
    var html = "";
    priced.lines.forEach(function (l) {
      html += '<div class="line"><div>' + l.label + '<span class="calc">' + l.calc + "</span></div>" +
        '<div class="amt">' + money(l.amt) + "</div></div>";
    });
    outLines.innerHTML = html;
    outTotal.textContent = money(priced.total);

    if (sw.delayed) {
      /* Nearest in-stock switch by measured actuation force — the rule
         printed under Bench Table B1. */
      var alt = null, best = Infinity;
      switches.forEach(function (s) {
        if (s.delayed) return;
        var d = Math.abs(s.force - sw.force);
        if (d < best) { best = d; alt = s; }
      });
      var altPriced = priceBuild(alt, count, tune, spring, build);
      delayBody.textContent = drop06Note;
      altLine.innerHTML =
        "If you wait for " + sw.name + ": <b>" + money(priced.total) + "</b>, dispatch in the revised window above. " +
        "Nearest in-stock switch by measured actuation force: <b>" + alt.name + "</b> (" + alt.force + " g ±" + alt.tol +
        " g against " + sw.force + " g ±" + sw.tol + " g) — same layout and services price to <b>" + money(altPriced.total) +
        "</b>, in stock now.";
      delayPanel.hidden = false;
    } else {
      delayPanel.hidden = true;
    }
  }

  planner.addEventListener("change", render);
  render();
})();

/* ---------- enquiry form (contact page; demonstration, transmits nothing) ---------- */
(function () {
  "use strict";
  var form = document.getElementById("enquiry");
  if (!form) return;
  var conf = document.getElementById("confirmation");
  var confRef = document.getElementById("conf-ref");

  function setErr(input, msg) {
    var err = document.getElementById(input.id + "-err");
    if (err) err.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function validate() {
    var ok = true;
    var name = document.getElementById("f-name");
    var email = document.getElementById("f-email");
    var subject = document.getElementById("f-subject");
    var message = document.getElementById("f-message");
    if (name.value.trim().length < 2) { setErr(name, "Your name — two characters or more."); ok = false; } else setErr(name, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { setErr(email, "An email address we can reply to."); ok = false; } else setErr(email, "");
    if (!subject.value) { setErr(subject, "Pick the closest subject — it routes the message."); ok = false; } else setErr(subject, "");
    if (message.value.trim().length < 20) { setErr(message, "Twenty characters or more — tell us the board, the drop, or the question."); ok = false; } else setErr(message, "");
    return ok;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) {
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var ref = "KV-2026-" + String(Math.floor(1000 + Math.random() * 9000));
    confRef.textContent = ref;
    conf.hidden = false;
    conf.scrollIntoView({ block: "nearest" });
    conf.setAttribute("tabindex", "-1");
    conf.focus({ preventScroll: true });
  });
  ["f-name", "f-email", "f-subject", "f-message"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", function () { setErr(el, ""); });
  });
})();
