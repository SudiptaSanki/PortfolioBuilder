/* Mainspring Atelier — the service book's working parts.
   No audio anywhere: the book is silent by ruling.
   The planner and estimator read their figures from the tables
   printed on the page, so tool and page cannot disagree. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* Cross-document view transitions: when the browser aborts one it
     surfaces an unhandled rejection; the navigation itself completes.
     Swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- the index (mobile menu) ---------- */
  var btn = document.querySelector(".menu-btn");
  var nav = document.querySelector("nav.index-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  }

  /* ---------- stamp-in: the one assigned effect ----------
     A stamp lands as its ledger entry scrolls into view. Only the
     stamp moves; entry text is never hidden. Reduced motion (CSS)
     leaves every stamp simply present. */
  var stamps = document.querySelectorAll(".stamp");
  if (stamps.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("landed");
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.4 });
      stamps.forEach(function (s) { io.observe(s); });
    } else {
      stamps.forEach(function (s) { s.classList.add("landed"); });
    }
  }

  function money(n) {
    return "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function money0(n) {
    return "£" + n.toLocaleString("en-GB");
  }
  function cellNum(cell) {
    if (!cell) return null;
    var v = cell.getAttribute("data-v");
    if (v === null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  /* ---------- the Service Planner ---------- */
  var planner = document.getElementById("planner");
  if (planner) {
    var scopeTable = document.getElementById("scope-rates");
    var partsTable = document.getElementById("wear-parts");
    var expectBox = {
      regulation: document.getElementById("expect-regulation"),
      partial: document.getElementById("expect-partial"),
      full: document.getElementById("expect-full")
    };

    function rateFor(scope, family) {
      var row = scopeTable.querySelector('[data-scope="' + scope + '"]');
      if (!row) return null;
      return cellNum(row.querySelector('[data-fam="' + family + '"]'));
    }
    function partFor(part, family) {
      var row = partsTable.querySelector('[data-part="' + part + '"]');
      if (!row) return null;
      var c = row.querySelector('[data-fam="' + family + '"]') || row.querySelector("[data-all]");
      return cellNum(c);
    }
    /* The scope rule, exactly as printed in Table S2. */
    function scopeFor(family, years) {
      if (years === "u3") return "regulation";
      if (years === "y35") {
        return (family === "hand" || family === "auto") ? "partial" : "full";
      }
      return "full"; /* y57, over7, unknown */
    }
    var scopeNames = {
      regulation: "Regulation & timing check only",
      partial: "Mainspring & seals service",
      full: "Full service"
    };
    var reasonFor = {
      regulation: "Under three years since its last service, with the rate evidence a healthy movement shows, the book does not open a watch to satisfy a calendar. It is timed, regulated, and sent home.",
      partial: "Three to five years is mainspring-and-seals territory for this family: the barrel is opened, the spring and seals are renewed, and the rest of the movement — cleaned at its last full service — is inspected, not stripped.",
      full: "At this interval the lubricants have done their years and the movement is stripped, cleaned, inspected and re-oiled in full. Chronographs and pre-1945 movements go straight to a full service at any interval beyond three years — their work is all-or-nothing, and the rule is printed in Table S2."
    };

    var famEl = planner.querySelectorAll('input[name="family"]');
    var yrsEl = planner.querySelectorAll('input[name="years"]');
    var valEl = document.getElementById("watch-value");
    var out = document.getElementById("planner-result");

    function picked(list) {
      for (var i = 0; i < list.length; i++) if (list[i].checked) return list[i].value;
      return null;
    }

    function runPlanner() {
      var family = picked(famEl);
      var years = picked(yrsEl);
      if (!family || !years) return;
      var scope = scopeFor(family, years);
      var famLabel = planner.querySelector('input[name="family"][value="' + family + '"]').getAttribute("data-label");
      var lines = [];
      var rate = rateFor(scope, family);
      lines.push({ label: scopeNames[scope] + " — " + famLabel, amount: rate });
      var total = rate;
      if (scope !== "regulation") {
        var ms = partFor("mainspring", family);
        lines.push({ label: "Mainspring (Table P1)", amount: ms });
        total += ms;
        var gk = partFor("gaskets", family);
        lines.push({ label: "Gasket & seal set (Table P1)", amount: gk });
        total += gk;
        if (family === "chrono" && scope === "full") {
          var al = partFor("chrono-allowance", family);
          lines.push({ label: "Chronograph wear allowance (Table P1)", amount: al });
          total += al;
        }
      }
      var html = "";
      html += '<p class="scope-line">The book assigns: ' + scopeNames[scope] + "</p>";
      html += '<p class="reason">' + reasonFor[scope] + "</p>";
      html += '<ul class="arithmetic">';
      lines.forEach(function (l) {
        html += "<li><span>" + l.label + '</span><span class="dots"></span><span>' + money0(l.amount) + "</span></li>";
      });
      html += '<li class="total"><span>Total, from the printed tables</span><span class="dots"></span><span>' + money0(total) + "</span></li>";
      html += "</ul>";
      if (scope === "regulation") {
        html += '<div class="less-work"><strong>Less work than a service.</strong> No parts are charged on a regulation visit, and nothing is opened that the timing machine has not accused. If the readings had accused it, this entry would say so — and quote the service instead.</div>';
      }
      var exp = expectBox[scope];
      if (exp) {
        html += '<p class="expect"><span class="from">What the book expects afterwards — Table R1: </span>' + exp.textContent + "</p>";
      }
      var rawVal = valEl.value.trim();
      if (rawVal !== "") {
        var val = parseFloat(rawVal);
        if (!isNaN(val) && total > val) {
          html += '<div class="red-entry"><span class="head">Entered in red — read before booking</span>' +
            "This service comes to " + money0(total) + " against a watch worth about " + money0(val) +
            " — the service costs more than the watch is worth, and the arithmetic is above, line by line. " +
            "Owners service such watches for sentimental reasons every month, and the book records that choice as a good one when it is made with the number known. " +
            "What the book will not do is let the number surprise you afterwards.</div>";
        }
      }
      out.innerHTML = html;
    }
    famEl.forEach(function (el) { el.addEventListener("change", runPlanner); });
    yrsEl.forEach(function (el) { el.addEventListener("change", runPlanner); });
    document.getElementById("planner-go").addEventListener("click", runPlanner);
    valEl.addEventListener("change", runPlanner);
    runPlanner();
  }

  /* ---------- the Booking Estimator ---------- */
  var est = document.getElementById("estimator");
  if (est) {
    var eTable = document.getElementById("estimator-lines");
    function eVal(key) {
      var row = eTable.querySelector('[data-line="' + key + '"]');
      return row ? cellNum(row.querySelector("[data-v]")) : 0;
    }
    var assess = eVal("assessment"), bookFee = eVal("book"), post = eVal("postage"), depPct = eVal("deposit");
    var count = 1;
    var countEl = document.getElementById("est-count");
    var bookEl = document.getElementById("est-book");
    var scopeEl = document.getElementById("est-scope");
    var outE = document.getElementById("estimator-result");
    document.getElementById("est-minus").addEventListener("click", function () {
      if (count > 1) { count--; runEst(); }
    });
    document.getElementById("est-plus").addEventListener("click", function () {
      if (count < 4) { count++; runEst(); }
    });
    bookEl.addEventListener("change", runEst);
    scopeEl.addEventListener("change", runEst);
    function runEst() {
      countEl.textContent = count;
      var a = assess * count;
      var b = bookEl.checked ? bookFee * count : 0;
      var dueToday = a + b;
      var scopePrice = parseFloat(scopeEl.value);
      if (isNaN(scopePrice) || scopePrice < 0) scopePrice = 0;
      var deposit = scopePrice * depPct / 100;
      var ret = post * count;
      var whole = dueToday + scopePrice + ret;
      var html = '<ul class="arithmetic">';
      html += "<li><span>Assessment &amp; timing, " + money0(assess) + " × " + count + ' watch' + (count > 1 ? "es" : "") + '</span><span class="dots"></span><span>' + money(a) + "</span></li>";
      html += "<li><span>New service book, " + money0(bookFee) + " × " + count + (bookEl.checked ? "" : " — not taken") + '</span><span class="dots"></span><span>' + money(b) + "</span></li>";
      html += '<li class="total"><span>Due today</span><span class="dots"></span><span>' + money(dueToday) + "</span></li>";
      html += "<li><span>Deposit when the scope is agreed — " + depPct + "% of " + money(scopePrice) + ' (Table E1)</span><span class="dots"></span><span>' + money(deposit) + "</span></li>";
      html += "<li><span>Insured return postage, " + money0(post) + " × " + count + ' — due on completion</span><span class="dots"></span><span>' + money(ret) + "</span></li>";
      html += '<li class="total"><span>The whole engagement, all-in</span><span class="dots"></span><span>' + money(whole) + "</span></li>";
      html += "</ul>";
      html += '<p class="small">The assessment is credited against a service booked within 60 days — if the service goes ahead, today\'s assessment line comes off the service bill, and the book shows the credit as its own line.</p>';
      outE.innerHTML = html;
    }
    runEst();
  }

  /* ---------- the correspondence form (contact page) ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("f-name");
      var email = document.getElementById("f-email");
      var watch = document.getElementById("f-watch");
      var ok = true;
      function mark(input, errId, bad) {
        var err = document.getElementById(errId);
        if (bad) { err.hidden = false; input.setAttribute("aria-invalid", "true"); ok = false; }
        else { err.hidden = true; input.removeAttribute("aria-invalid"); }
      }
      mark(name, "e-name", name.value.trim().length < 2);
      mark(email, "e-email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
      mark(watch, "e-watch", watch.value.trim().length < 3);
      if (!ok) return;
      var ref = "E-2026-" + Math.floor(100 + Math.random() * 900);
      document.getElementById("confirm-ref").textContent = ref;
      document.getElementById("confirm-name").textContent = name.value.trim();
      form.hidden = true;
      var conf = document.getElementById("confirmation");
      conf.hidden = false;
      conf.setAttribute("tabindex", "-1");
      conf.focus();
    });
  }
})();
