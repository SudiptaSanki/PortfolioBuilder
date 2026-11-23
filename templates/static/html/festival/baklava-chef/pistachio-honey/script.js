/* Forty Layers — bakery ledger interactions.
   Sound ruling: this site makes no sound. A baklava kitchen is not a
   sound profession and no interaction here teaches through audio, so
   the programme's sound need-test fails — no audio anywhere. The
   stub's GSAP drift/parallax/magnetic chrome was decoration without
   a job and was deleted, not rebuilt. */
(function () {
  "use strict";

  /* Cross-document view transitions abort harmlessly when a second
     navigation interrupts one; swallow only that rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile menu: the order sheet ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var panel = document.getElementById("orderSheet");
  if (menuBtn && panel) {
    var open = false;
    function setPanel(toOpen) {
      open = toOpen;
      menuBtn.setAttribute("aria-expanded", String(open));
      if (open) {
        panel.hidden = false;
        document.body.classList.add("locked");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = panel.querySelector("a");
            if (first) first.focus();
          });
        });
      } else {
        panel.hidden = true;
        document.body.classList.remove("locked");
      }
    }
    menuBtn.addEventListener("click", function () { setPanel(!open); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) { setPanel(false); menuBtn.focus(); }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setPanel(false);
    });
  }

  /* ---------- reveal on scroll (opacity only, JS-gated) ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll("[data-reveal]");
    revealEls.forEach(function (el) { el.classList.add("rv"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- footer year ---------- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());

  function fmt(n) { return n.toLocaleString("en-GB"); }
  function money(n) {
    return "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function money0(n) { return "£" + fmt(Math.round(n)); }

  /* ==================================================================
     HARVEST & TRAY EXPLORER
     One data model, shared with the printed harvest table and rate
     card on the same page. The probe asserts the sheet against both.
     ================================================================== */
  var LINES = {
    classic: {
      name: "Classic Pistachio Baklava",
      unit: "Tray of 24 pieces · about 1.2 kg",
      seasons: [
        { id: "heavy", label: "Heavy year" },
        { id: "light", label: "Light year" }
      ],
      current: "light",
      data: {
        heavy: {
          story: "The orchard's on-year. The trees rested last season and carried a full crop; kernels came in at the top of the range and the tray price sits at the bottom of its band.",
          bake: "<b>40 filo sheets</b>, brushed with butter · <b>300 g pistachio filling</b> per tray · syrup of <b>120 g honey</b> + 180 g sugar · baked at 170°C for about 45 minutes",
          harvest: "Orchard kernels <b>1,080–1,440 kg</b> (120 trees at 18–24 kg in-shell, kernels about half) — enough for <b>3,600–4,800 trays</b> at 300 g a tray.",
          keeping: "14 days in the tin at room temperature. Do not refrigerate — the filo softens and the syrup turns grainy.",
          price: 38, pieces: 24
        },
        light: {
          story: "The orchard's off-year — alternate bearing, the trees' own rhythm, not a failure. The crop came in at roughly half, the kernel price rose, and the tray price was printed up before the order book opened. The filling did not get thinner.",
          bake: "<b>40 filo sheets</b>, brushed with butter · <b>300 g pistachio filling</b> per tray — the same weight as a heavy year · syrup of <b>120 g honey</b> + 180 g sugar · baked at 170°C for about 45 minutes",
          harvest: "Orchard kernels <b>420–660 kg</b> (120 trees at 7–11 kg in-shell, kernels about half) — enough for <b>1,400–2,200 trays</b> at 300 g a tray.",
          keeping: "14 days in the tin at room temperature. Do not refrigerate — the filo softens and the syrup turns grainy.",
          price: 44, pieces: 24
        }
      }
    },
    walnut: {
      name: "Honey & Walnut Baklava",
      unit: "Tray of 24 pieces · about 1.2 kg",
      seasons: [
        { id: "good", label: "Good flow" },
        { id: "poor", label: "Poor flow" }
      ],
      current: "good",
      data: {
        good: {
          story: "A kind spring and a long summer flow. The apiary's supers filled early, the honey came off the frames at under 20% moisture, and this tray is priced at the bottom of its band.",
          bake: "<b>36 filo sheets</b>, brushed with butter · <b>280 g walnut filling</b> per tray · syrup of <b>200 g honey</b> + 150 g sugar — the honey leads this one · baked at 170°C for about 45 minutes",
          harvest: "Apiary honey <b>800–1,200 kg</b> (40 hives at 20–30 kg a hive) — enough for <b>4,000–6,000 trays</b> at 200 g of honey a tray.",
          keeping: "10 days in the tin at room temperature. The walnut filling softens sooner than pistachio; this tray is baked for the week, not the month.",
          price: 30, pieces: 24
        },
        poor: {
          story: "A wet June and a short flow. The bees were fed back some of their own honey rather than pushed, the take was small, and the tray price carries the difference — printed before the book opened, as always.",
          bake: "<b>36 filo sheets</b>, brushed with butter · <b>280 g walnut filling</b> per tray · syrup of <b>200 g honey</b> + 150 g sugar — the honey weight does not drop in a poor year · baked at 170°C for about 45 minutes",
          harvest: "Apiary honey <b>320–560 kg</b> (40 hives at 8–14 kg a hive) — enough for <b>1,600–2,800 trays</b> at 200 g of honey a tray.",
          keeping: "10 days in the tin at room temperature. The walnut filling softens sooner than pistachio; this tray is baked for the week, not the month.",
          price: 34, pieces: 24
        }
      }
    },
    box: {
      name: "Pistachio–Honey Celebration Box",
      unit: "Box of 12 pieces · 6 pistachio + 6 walnut",
      seasons: [
        { id: "heavy", label: "Heavy year" },
        { id: "light", label: "Light year" }
      ],
      current: "light",
      data: {
        heavy: {
          story: "Both harvests kind at once: a heavy pistachio year behind the green half of the box, and honey enough that the walnut half is syruped generously.",
          bake: "Pieces cut from both bakes — <b>150 g pistachio kernels</b> and <b>90 g honey</b> in every box, counted across its 12 pieces · boxed the day it is baked",
          harvest: "Draws on both ledgers: kernels from the heavy-year crop of <b>1,080–1,440 kg</b> and honey from a good flow of <b>800–1,200 kg</b>.",
          keeping: "10 days in its gift tin at room temperature. The box is packed for giving, not for keeping — eat the walnut pieces first.",
          price: 26, pieces: 12
        },
        light: {
          story: "A light pistachio year. The box draws on the same short kernel crop as the classic tray, so the box book is the first to close when the crop runs down — and the price says so in print.",
          bake: "Pieces cut from both bakes — <b>150 g pistachio kernels</b> and <b>90 g honey</b> in every box, counted across its 12 pieces · boxed the day it is baked",
          harvest: "Draws on both ledgers: kernels from the light-year crop of <b>420–660 kg</b>, shared with the classic tray, and honey from this season's flow of <b>800–1,200 kg</b>.",
          keeping: "10 days in its gift tin at room temperature. The box is packed for giving, not for keeping — eat the walnut pieces first.",
          price: 29, pieces: 12
        }
      }
    }
  };

  var expRoot = document.getElementById("explorer");
  if (expRoot) {
    var tabs = Array.prototype.slice.call(expRoot.querySelectorAll(".exp-tab"));
    var seasonRow = document.getElementById("seasonRow");
    var curLine = "classic";
    var curSeason = LINES.classic.current;

    function renderExplorer() {
      var line = LINES[curLine];
      var d = line.data[curSeason];
      tabs.forEach(function (t) {
        t.setAttribute("aria-pressed", String(t.getAttribute("data-line") === curLine));
      });
      /* season buttons rebuilt per line — labels differ by harvest */
      seasonRow.innerHTML = "";
      var lab = document.createElement("span");
      lab.className = "lab";
      lab.textContent = "Harvest state";
      seasonRow.appendChild(lab);
      line.seasons.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "season-btn";
        b.textContent = s.label;
        b.setAttribute("data-season", s.id);
        b.setAttribute("aria-pressed", String(s.id === curSeason));
        b.addEventListener("click", function () {
          curSeason = s.id;
          renderExplorer();
        });
        seasonRow.appendChild(b);
      });
      if (curSeason === line.current) {
        var c = document.createElement("span");
        c.className = "cur";
        c.textContent = "← this season";
        seasonRow.appendChild(c);
      }
      document.getElementById("shStory").innerHTML = d.story;
      document.getElementById("shBake").innerHTML = d.bake;
      document.getElementById("shHarvest").innerHTML = d.harvest;
      document.getElementById("shKeeping").textContent = d.keeping;
      document.getElementById("shPrice").textContent = money0(d.price);
      document.getElementById("shPer").textContent =
        "= " + money(d.price / d.pieces) + " a piece across " + d.pieces + " pieces (" +
        money0(d.price) + " ÷ " + d.pieces + ") — the tray is the unit; pieces are shown for comparison";
      /* highlight the matching rate-card row + harvest-table row */
      document.querySelectorAll("#rateCard tbody tr").forEach(function (tr) {
        tr.classList.toggle("hl", tr.getAttribute("data-line") === curLine);
      });
      document.querySelectorAll("#harvestTable tbody tr").forEach(function (tr) {
        var src = tr.getAttribute("data-source");
        var on = (curLine === "classic" && src === "orchard") ||
                 (curLine === "walnut" && src === "apiary") ||
                 (curLine === "box");
        tr.classList.toggle("hl", on);
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        curLine = t.getAttribute("data-line");
        curSeason = LINES[curLine].current;
        renderExplorer();
      });
    });
    renderExplorer();
  }

  /* ==================================================================
     LEDGER CALCULATOR — harvest estimate + order total
     ================================================================== */
  var HARVEST = {
    orchard: {
      unitLabel: "Trees in the orchard",
      def: 120,
      seasons: {
        heavy: { label: "Heavy year", lo: 18, hi: 24, unit: "kg in-shell per tree" },
        light: { label: "Light year", lo: 7, hi: 11, unit: "kg in-shell per tree" }
      },
      seasonIds: ["heavy", "light"]
    },
    apiary: {
      unitLabel: "Hives in the apiary",
      def: 40,
      seasons: {
        good: { label: "Good flow", lo: 20, hi: 30, unit: "kg honey per hive" },
        poor: { label: "Poor flow", lo: 8, hi: 14, unit: "kg honey per hive" }
      },
      seasonIds: ["good", "poor"]
    }
  };

  var srcSel = document.getElementById("calcSource");
  var seaSel = document.getElementById("calcSeason");
  var cntIn = document.getElementById("calcCount");
  var cntLab = document.getElementById("calcCountLabel");
  var harvOut = document.getElementById("harvestOut");
  if (srcSel && seaSel && cntIn && harvOut) {
    function syncSeasons() {
      var src = HARVEST[srcSel.value];
      seaSel.innerHTML = "";
      src.seasonIds.forEach(function (id) {
        var o = document.createElement("option");
        o.value = id;
        o.textContent = src.seasons[id].label;
        seaSel.appendChild(o);
      });
      cntLab.textContent = src.unitLabel;
      cntIn.value = src.def;
    }
    function renderHarvest() {
      var src = HARVEST[srcSel.value];
      var s = src.seasons[seaSel.value];
      var n = parseInt(cntIn.value, 10);
      if (isNaN(n) || n < 0) n = 0;
      if (n > 100000) n = 100000;
      var lo = n * s.lo, hi = n * s.hi;
      var lines = [
        n + " × " + s.lo + "–" + s.hi + " " + s.unit + " =",
        "<span class=\"range\">" + fmt(lo) + "–" + fmt(hi) + " kg</span>"
      ];
      if (srcSel.value === "orchard") {
        lines.push("kernels at about half of in-shell weight:");
        lines.push("<span class=\"range\">" + fmt(Math.round(lo / 2)) + "–" + fmt(Math.round(hi / 2)) + " kg of kernels</span>");
        lines.push("a range, not a promise — the trees decide in September.");
      } else {
        lines.push("before the bees' winter share is left on the hive.");
        lines.push("a range, not a promise — the flow decides in August.");
      }
      harvOut.innerHTML = lines.join("<br>");
    }
    srcSel.addEventListener("change", function () { syncSeasons(); renderHarvest(); });
    seaSel.addEventListener("change", renderHarvest);
    cntIn.addEventListener("input", renderHarvest);
    syncSeasons();
    renderHarvest();
  }

  /* order total — this season's printed prices */
  var PRICES = { classic: 44, walnut: 30, box: 29 };
  var orderOut = document.getElementById("orderOut");
  var qtyIn = {
    classic: document.getElementById("qClassic"),
    walnut: document.getElementById("qWalnut"),
    box: document.getElementById("qBox")
  };
  if (orderOut && qtyIn.classic) {
    function renderOrder() {
      var total = 0, rows = [];
      ["classic", "walnut", "box"].forEach(function (k) {
        var q = parseInt(qtyIn[k].value, 10);
        if (isNaN(q) || q < 0) q = 0;
        if (q > 999) q = 999;
        var lt = q * PRICES[k];
        total += lt;
        rows.push(q + " × " + money0(PRICES[k]) + " = " + money(lt));
      });
      rows.push("<span class=\"total\">Total " + money(total) + "</span>");
      rows.push("Festival-book deposit at 25% = " + money(total * 0.25) + " · balance on collection");
      orderOut.innerHTML = rows.join("<br>");
    }
    ["classic", "walnut", "box"].forEach(function (k) {
      qtyIn[k].addEventListener("input", renderOrder);
    });
    renderOrder();
  }

  /* ==================================================================
     CONTACT FORM — demonstration, honestly labelled
     ================================================================== */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById("fType");
    var wanted = params.get("type");
    if (typeSel && wanted) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
      }
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = [];
      ["fName", "fEmail", "fMsg"].forEach(function (id) {
        var input = document.getElementById(id);
        var field = input.closest(".field");
        var ok = input.value.trim().length > 0;
        if (id === "fEmail") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
        field.classList.toggle("invalid", !ok);
        input.setAttribute("aria-invalid", String(!ok));
        if (!ok) bad.push(input);
      });
      if (bad.length) { bad[0].focus(); return; }
      var ref = "YH-2026-" + String(Math.floor(100 + Math.random() * 900));
      document.getElementById("confRef").textContent = ref;
      document.getElementById("confirmation").hidden = false;
      form.hidden = true;
      document.getElementById("confirmation").scrollIntoView({ block: "center" });
    });
    var again = document.getElementById("sendAnother");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        form.querySelectorAll(".field.invalid").forEach(function (f) { f.classList.remove("invalid"); });
        document.getElementById("confirmation").hidden = true;
        form.hidden = false;
        document.getElementById("fName").focus();
      });
    }
  }
})();
