/* Whitaker Timber Cabins — interactions.
   No audio anywhere: this trade fails the sound need-test.
   Every block is guarded so one file serves all four pages. */
(function () {
  "use strict";

  /* ---------- floor-plan viewer ---------- */
  var viewer = document.querySelector("[data-plan-viewer]");
  if (viewer) {
    var plans = {
      spruce:  { name: "The Spruce",  dims: "4.0 × 6.0 m", area: "24 m² · 258 sq ft", sleeps: "2 + loft", roof: "45° shed, standing seam", price: "From $94,000" },
      hemlock: { name: "The Hemlock", dims: "4.5 × 7.1 m", area: "32 m² · 344 sq ft", sleeps: "2–4 · 1 bed + loft", roof: "40° gable, standing seam", price: "From $121,000" },
      cedar:   { name: "The Cedar",   dims: "5.0 × 9.0 m", area: "45 m² · 484 sq ft", sleeps: "4–6 · 2 bed", roof: "38° gable, standing seam", price: "From $158,000" }
    };
    var tabBtns = viewer.querySelectorAll("[data-plan-tab]");
    var figures = viewer.querySelectorAll("figure[data-plan]");
    var readout = viewer.querySelector("[data-plan-readout]");
    function selectPlan(key) {
      tabBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-plan-tab") === key ? "true" : "false"); });
      figures.forEach(function (f) { f.classList.toggle("active", f.getAttribute("data-plan") === key); });
      var p = plans[key];
      if (readout && p) {
        readout.innerHTML =
          cell("Plan", p.name) + cell("Footprint", p.dims) + cell("Floor area", p.area) +
          cell("Sleeps", p.sleeps) + cell("Roof", p.roof) + cell("Price", p.price);
      }
    }
    function cell(k, v) { return '<div><span class="k">' + k + '</span><span class="v">' + v + "</span></div>"; }
    tabBtns.forEach(function (b) { b.addEventListener("click", function () { selectPlan(b.getAttribute("data-plan-tab")); }); });
    document.querySelectorAll("[data-plan-link]").forEach(function (b) {
      b.addEventListener("click", function () {
        selectPlan(b.getAttribute("data-plan-link"));
        viewer.scrollIntoView({ behavior: "smooth", block: "start" });
        var t = viewer.querySelector('[data-plan-tab="' + b.getAttribute("data-plan-link") + '"]');
        if (t) t.focus({ preventScroll: true });
      });
    });
    var stage = viewer.querySelector(".plan-stage");
    viewer.querySelectorAll("[data-layer]").forEach(function (b) {
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", on ? "true" : "false");
        stage.classList.toggle(b.getAttribute("data-layer") === "dims" ? "hide-dims" : "hide-labels", !on);
      });
    });
  }

  /* ---------- solar sizing calculator ---------- */
  var calc = document.querySelector("[data-calc]");
  if (calc) {
    var slider = calc.querySelector("[data-load]");
    var loadOut = calc.querySelector("[data-load-out]");
    var extras = calc.querySelectorAll("[data-extra]");
    var sunSel = calc.querySelector("[data-sun]");
    var days = 2;
    var daysOut = calc.querySelector("[data-days-out]");
    var out = {
      load: calc.querySelector("[data-out-load]"),
      array: calc.querySelector("[data-out-array]"),
      usable: calc.querySelector("[data-out-usable]"),
      nameplate: calc.querySelector("[data-out-nameplate]"),
      inverter: calc.querySelector("[data-out-inverter]"),
      summary: calc.querySelector("[data-out-summary]")
    };
    function fmt(n, d) { return n.toFixed(d === undefined ? 1 : d); }
    function compute() {
      var base = parseFloat(slider.value);
      var extra = 0, pump = false;
      extras.forEach(function (c) {
        if (c.checked) { extra += parseFloat(c.getAttribute("data-extra")); if (c.hasAttribute("data-pump")) pump = true; }
      });
      var total = base + extra;
      if (loadOut) loadOut.textContent = fmt(base) + " kWh/day base";
      var psh = parseFloat(sunSel.value);
      var derate = 0.78; /* inverter, wiring, snow & soiling losses */
      var rawKw = total / (psh * derate);
      var kwp = Math.ceil(rawKw / 0.4) * 0.4; /* 400 W panels */
      var usable = total * days;
      var nameplate = usable / 0.85; /* LiFePO4 usable share */
      var dailyGen = kwp * psh * derate;
      slider.style.setProperty("--fill", ((base - 1.5) / 7.5 * 100) + "%");
      out.load.textContent = fmt(total) + " kWh";
      out.array.textContent = fmt(kwp) + " kWp";
      out.usable.textContent = fmt(usable) + " kWh";
      out.nameplate.textContent = fmt(nameplate) + " kWh";
      out.inverter.textContent = pump ? "5 kW" : "3 kW";
      out.summary.textContent =
        "On an average worst-month day this array makes about " + fmt(dailyGen) + " kWh against a " +
        fmt(total) + " kWh load. " + (dailyGen >= total
          ? "That covers the day and refills the battery in decent weather; a dark, snowy week will still draw the battery down, which is what the generator inlet is for."
          : "That is a shortfall — expect regular generator hours in the worst month, or a bigger array. We would rather show you this number now than after the cabin is built.");
    }
    calc.querySelectorAll("[data-profile]").forEach(function (r) {
      r.addEventListener("change", function () { slider.value = r.value; compute(); });
    });
    slider.addEventListener("input", compute);
    extras.forEach(function (c) { c.addEventListener("change", compute); });
    sunSel.addEventListener("change", compute);
    calc.querySelectorAll("[data-days]").forEach(function (b) {
      b.addEventListener("click", function () {
        days = Math.min(4, Math.max(1, days + parseInt(b.getAttribute("data-days"), 10)));
        daysOut.textContent = days + (days === 1 ? " day" : " days");
        compute();
      });
    });
    compute();
  }

  /* ---------- lightbox ---------- */
  var thumbs = document.querySelectorAll("[data-lightbox]");
  if (thumbs.length) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Build photograph, larger");
    box.innerHTML =
      '<img alt="">' +
      '<p class="lb-cap"></p>' +
      '<div class="lb-row">' +
      '<button type="button" data-lb="prev" aria-label="Previous photograph">← Prev</button>' +
      '<button type="button" data-lb="close">Close ✕</button>' +
      '<button type="button" data-lb="next" aria-label="Next photograph">Next →</button>' +
      "</div>";
    document.body.appendChild(box);
    var img = box.querySelector("img"), cap = box.querySelector(".lb-cap");
    var items = [], idx = 0, lastFocus = null;
    thumbs.forEach(function (t) {
      var im = t.querySelector("img");
      items.push({ src: im.getAttribute("src"), alt: im.getAttribute("alt"), cap: t.getAttribute("data-lightbox") });
      t.addEventListener("click", function () { open(items.length ? Array.prototype.indexOf.call(thumbs, t) : 0); });
    });
    function show() {
      img.setAttribute("src", items[idx].src);
      img.setAttribute("alt", items[idx].alt);
      cap.textContent = items[idx].cap + "  (" + (idx + 1) + " of " + items.length + ")";
    }
    function open(i) { idx = i; lastFocus = document.activeElement; show(); box.classList.add("open"); box.querySelector('[data-lb="close"]').focus(); }
    function close() { box.classList.remove("open"); if (lastFocus) lastFocus.focus(); }
    box.querySelector('[data-lb="close"]').addEventListener("click", close);
    box.querySelector('[data-lb="prev"]').addEventListener("click", function () { idx = (idx - 1 + items.length) % items.length; show(); });
    box.querySelector('[data-lb="next"]').addEventListener("click", function () { idx = (idx + 1) % items.length; show(); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") { idx = (idx - 1 + items.length) % items.length; show(); }
      if (e.key === "ArrowRight") { idx = (idx + 1) % items.length; show(); }
    });
  }

  /* ---------- enquiry form ---------- */
  var form = document.querySelector("[data-enquiry]");
  if (form) {
    var confirm = document.querySelector("[data-confirm]");
    function setErr(input, bad) {
      var field = input.closest(".field");
      if (field) field.classList.toggle("invalid", bad);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      return !bad;
    }
    function validate(input) {
      var v = input.value.trim();
      if (input.required && !v) return setErr(input, true);
      if (input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return setErr(input, true);
      return setErr(input, false);
    }
    form.querySelectorAll("input,select,textarea").forEach(function (input) {
      input.addEventListener("blur", function () { validate(input); });
      input.addEventListener("input", function () { if (input.closest(".field").classList.contains("invalid")) validate(input); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, first = null;
      form.querySelectorAll("input,select,textarea").forEach(function (input) {
        if (!validate(input)) { ok = false; if (!first) first = input; }
      });
      if (!first) { /* all valid */ }
      if (!ok) { first.focus(); return; }
      var ref = "WT-2026-" + Math.floor(100 + Math.random() * 900);
      var name = form.querySelector("[name=name]").value.trim();
      var model = form.querySelector("[name=model]");
      var modelTxt = model.options[model.selectedIndex].text;
      confirm.querySelector("[data-confirm-text]").textContent =
        "Thank you, " + name + ". Your enquiry about " + modelTxt + " is noted with reference " + ref +
        ". We reply within two working days — usually with questions about your plot, not a sales pitch.";
      confirm.querySelector(".ref").textContent = ref;
      form.style.display = "none";
      confirm.classList.add("show");
      confirm.setAttribute("tabindex", "-1");
      confirm.focus();
    });
    var again = document.querySelector("[data-again]");
    if (again) again.addEventListener("click", function () {
      form.reset();
      form.style.display = "";
      confirm.classList.remove("show");
    });
  }

  /* ---------- footer year ---------- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();
})();
