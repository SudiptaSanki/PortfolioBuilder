/* Tomas Berg — site behaviour.
   Sound ruling: none. This profession is not sound and no
   interaction here teaches through audio. No <audio>, no Web
   Audio, anywhere — by decision, recorded in CREDITS.md. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* Cross-document view transitions abort in some engines and
     surface as an unhandled rejection; the navigation itself
     always completes. Swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var btn = document.getElementById("menuBtn");
  var panel = document.getElementById("mobilePanel");
  if (btn && panel) {
    var setOpen = function (open) {
      panel.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
      if (open) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = panel.querySelector("a");
            if (first) first.focus();
          });
        });
      }
    };
    btn.addEventListener("click", function () {
      setOpen(!panel.classList.contains("open"));
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  /* ---------- reveal on scroll (opacity only, JS-gated) ---------- */
  var rv = document.querySelectorAll(".rv");
  if (rv.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- lifecycle explorer ---------- */
  var PHASES = [
    {
      no: "Phase 01", title: "Specification", when: "Days 1–4 · before any code",
      deliverable: "A written specification, agreed before code: the state the contract holds, every function and who may call it, the invariants it must never break, and the threats we are designing against.",
      catches: "The unwritten assumption. On this engagement the client assumed only the treasurer could pause distributions; nothing in their draft said so. Writing it down turned an argument into a line in a table.",
      artefact: "The SPEC document — versioned, signed off by both sides — with a threat list: one line per threat, and the design answer to each."
    },
    {
      no: "Phase 02", title: "Implementation", when: "Days 5–12 · written to the spec",
      deliverable: "The contracts, written to the spec and to standard patterns: checks-effects-interactions on every value-moving function, pull over push for payouts, and no cleverness a reviewer would have to admire before understanding.",
      catches: "The ordering bug written at speed — an external call made before the balance was updated. Standard patterns exist because this exact mistake has cost other people real money.",
      artefact: "Source code with a line-by-line mapping back to the spec, so a reviewer can check intent, not just syntax."
    },
    {
      no: "Phase 03", title: "Testing", when: "Days 10–16 · overlaps implementation",
      deliverable: "Unit tests for every function, property tests for every invariant in the spec, and fuzz runs against the vesting maths. This practice does not ship in-scope contracts below 95% line coverage; this engagement closed at 98.2%.",
      catches: "The boundary condition. Fuzzing found that at the exact cliff block, vesting released one period a block early — invisible to every hand-written test, because nobody writes a test for the block they assume is fine.",
      artefact: "The test report: coverage figures, the invariant list with pass/fail, and the failing tests that were fixed — kept in the report, not deleted from it."
    },
    {
      no: "Phase 04", title: "Independent review", when: "Days 17–24 · second pair of eyes",
      deliverable: "A line-by-line security review. For code I wrote myself, the reviewer is not me: I commission a peer reviewer, pay for it out of my fee, and tell the client who it is. My own code is never the only code I have checked.",
      catches: "The access-control gap — the class in Case file 01: a configuration setter checked the admin role, but the function it configured did not. Two functions, one assumption; the kind of flaw scanners do not flag.",
      artefact: "The findings report: every finding severity-rated with impact and likelihood stated separately, a recommended fix, and a written response to each finding."
    },
    {
      no: "Phase 05", title: "Deployment & handover", when: "Days 25–28 · rehearsed, then live",
      deliverable: "Deployment rehearsed on a public testnet and against a fork of live chain state, then executed with the rehearsed script — never a hand-typed one. Deployed bytecode is verified against the reviewed source before anyone calls it done.",
      catches: "The stale argument. The rehearsal diff caught a constructor value left over from test configuration. On an immutable deployment that is not a typo; it is a redeploy and a very bad week.",
      artefact: "The deployment record and handover pack: addresses, the verified source, an admin-key checklist signed by the client, and a one-page \u201Cwhat to watch\u201D note."
    }
  ];

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".phase-tab"));
  var sheet = document.getElementById("phaseSheet");
  if (tabs.length && sheet) {
    var el = {
      no: sheet.querySelector("[data-p='no']"),
      title: sheet.querySelector("[data-p='title']"),
      when: sheet.querySelector("[data-p='when']"),
      deliverable: sheet.querySelector("[data-p='deliverable']"),
      catches: sheet.querySelector("[data-p='catches']"),
      artefact: sheet.querySelector("[data-p='artefact']"),
      count: document.getElementById("phaseCount"),
      prev: document.getElementById("phasePrev"),
      next: document.getElementById("phaseNext")
    };
    var current = 0;
    var render = function (i) {
      current = Math.max(0, Math.min(PHASES.length - 1, i));
      var p = PHASES[current];
      el.no.textContent = p.no;
      el.title.textContent = p.title;
      el.when.textContent = p.when;
      el.deliverable.textContent = p.deliverable;
      el.catches.textContent = p.catches;
      el.artefact.textContent = p.artefact;
      el.count.textContent = "Phase " + (current + 1) + " of " + PHASES.length;
      el.prev.disabled = current === 0;
      el.next.disabled = current === PHASES.length - 1;
      tabs.forEach(function (t, ti) {
        t.setAttribute("aria-selected", ti === current ? "true" : "false");
        t.tabIndex = ti === current ? 0 : -1;
      });
    };
    tabs.forEach(function (t, ti) {
      t.addEventListener("click", function () { render(ti); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { render(Math.min(PHASES.length - 1, current + 1)); tabs[current].focus(); }
        if (e.key === "ArrowLeft") { render(Math.max(0, current - 1)); tabs[current].focus(); }
      });
    });
    el.prev.addEventListener("click", function () { render(current - 1); });
    el.next.addEventListener("click", function () { render(current + 1); });
    render(0);
  }

  /* ---------- gas estimator ---------- */
  var OPS = {
    transfer: { gas: 21000, label: "Native transfer" },
    token:    { gas: 52000, label: "Token transfer (ERC-20 class)" },
    mint:     { gas: 121000, label: "Mint-class (NFT mint)" },
    swap:     { gas: 148000, label: "Swap-class (DEX trade)" }
  };
  var BANDS = {
    quiet:     { gwei: 8,   label: "Quiet" },
    typical:   { gwei: 25,  label: "Typical" },
    busy:      { gwei: 60,  label: "Busy" },
    congested:{ gwei: 140, label: "Congested" }
  };
  var gasOut = document.getElementById("gasOut");
  if (gasOut) {
    var state = { op: "swap", band: "typical" };
    var fmt = function (n) { return n.toLocaleString("en-GB"); };
    var paint = function () {
      var op = OPS[state.op], band = BANDS[state.band];
      var totalGwei = op.gas * band.gwei;
      var eth = totalGwei / 1e9;
      gasOut.querySelector("[data-g='big']").innerHTML =
        eth.toFixed(6) + " <small>ETH</small>";
      gasOut.querySelector("[data-g='formula']").textContent =
        fmt(op.gas) + " gas × " + band.gwei + " gwei = " + fmt(totalGwei) +
        " gwei = " + eth.toFixed(6) + " ETH";
      gasOut.querySelector("[data-g='what']").textContent =
        op.label + " at a " + band.label.toLowerCase() + " gas price.";
      document.querySelectorAll("[data-op]").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-op") === state.op ? "true" : "false");
      });
      document.querySelectorAll("[data-band]").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-band") === state.band ? "true" : "false");
      });
    };
    document.querySelectorAll("[data-op]").forEach(function (b) {
      b.addEventListener("click", function () { state.op = b.getAttribute("data-op"); paint(); });
    });
    document.querySelectorAll("[data-band]").forEach(function (b) {
      b.addEventListener("click", function () { state.band = b.getAttribute("data-band"); paint(); });
    });
    paint();
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var typeSel = form.querySelector("#f-type");
    var wanted = params.get("type");
    if (typeSel && wanted) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
      }
    }
    var mark = function (input, bad) {
      var field = input.closest(".field");
      if (field) field.classList.toggle("invalid", bad);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      return !bad;
    };
    ["f-name", "f-email", "f-type", "f-msg"].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.addEventListener("input", function () { mark(input, false); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("f-name");
      var email = document.getElementById("f-email");
      var type = document.getElementById("f-type");
      var msg = document.getElementById("f-msg");
      var ok = true;
      ok = mark(name, !name.value.trim()) && ok;
      ok = mark(email, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
      ok = mark(type, !type.value) && ok;
      ok = mark(msg, msg.value.trim().length < 20) && ok;
      if (!ok) {
        var firstBad = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (firstBad) firstBad.focus();
        return;
      }
      var seed = (name.value + email.value).split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
      var ref = "TB-2026-" + (100 + (seed % 900));
      document.getElementById("confirmRef").textContent = ref;
      document.getElementById("confirmName").textContent = name.value.trim();
      form.style.display = "none";
      var conf = document.getElementById("confirmBox");
      conf.classList.add("show");
      conf.setAttribute("tabindex", "-1");
      conf.focus();
    });
    var again = document.getElementById("sendAnother");
    if (again) {
      again.addEventListener("click", function () {
        document.getElementById("confirmBox").classList.remove("show");
        form.reset();
        form.style.display = "";
        document.getElementById("f-name").focus();
      });
    }
  }
})();
