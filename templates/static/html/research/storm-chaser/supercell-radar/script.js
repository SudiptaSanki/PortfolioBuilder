/* Supercell Radar — one data source per instrument.
   The Reflectivity Reader and the EF explorer render from the same
   tables the pages print, so the readout can never drift from the
   printed scale. No audio anywhere: thunder is not a user interface. */
"use strict";

/* View-transition abort guard: when Chrome aborts a cross-document
   view transition, the rejection surfaces as an unhandled promise
   rejection although the navigation completed. Swallow only that. */
window.addEventListener("unhandledrejection", function (e) {
  var r = e.reason;
  if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
    e.preventDefault();
  }
});

/* ---------- reflectivity bands (as printed on the page) ---------- */
var BANDS = [
  { lo: null, hi: 15, name: "Very light", note: "Drizzle or light snow — and clear-air returns: insects, birds and dust. The scope sees more than rain." },
  { lo: 15, hi: 25, name: "Light rain", note: "Steady light rain. Roads wet; no flooding concern." },
  { lo: 25, hi: 35, name: "Light to moderate rain", note: "Rain heavy enough to matter to an outdoor crowd; ponding water on low roads." },
  { lo: 35, hi: 45, name: "Moderate to heavy rain", note: "Downpour rates. Small hail possible inside the strongest cores." },
  { lo: 45, hi: 55, name: "Heavy rain — hail likely", note: "The core is working hard. Expect hail reports; flash flooding becomes a concern where drainage is poor." },
  { lo: 55, hi: 65, name: "Intense core", note: "Large hail likely; damaging wind possible. This is warning-decision territory." },
  { lo: 65, hi: null, name: "Extreme core", note: "Very large hail likely. Reflectivity this high is read as hail until proven otherwise." }
];
function bandFor(dbz) {
  for (var i = 0; i < BANDS.length; i++) {
    var b = BANDS[i];
    if ((b.lo === null || dbz >= b.lo) && (b.hi === null || dbz < b.hi)) return b;
  }
  return BANDS[BANDS.length - 1];
}

/* ---------- radar scenarios ---------- */
var SCENARIOS = [
  {
    id: "stratus", label: "Morning stratus deck", peak: 12,
    motion: "Drifting east at 10 kt",
    ground: "Grey, damp and harmless. Most of this return is drizzle and clear-air echo — the radar reporting a quiet sky, correctly.",
    move: "Log it and move on. No client's plan changes for 12 dBZ."
  },
  {
    id: "rainshield", label: "Stratiform rain shield", peak: 31,
    motion: "Moving northeast at 20 kt",
    ground: "A wet afternoon: several hours of steady rain, roughly 5–10 mm, ponding on low roads. Uncomfortable, not dangerous.",
    move: "Advise on timing, not safety. Tell the event client which hours are wettest and recheck the scope in an hour."
  },
  {
    id: "supercell", label: "Mature supercell — hook forming", peak: 57,
    motion: "Moving northeast at 35 kt",
    ground: "Large hail and a rotating updraft. Anyone under this cell needs a substantial building — not a car, not a tent, not a grandstand.",
    move: "Make the call. This is the warning conversation: the polygon, the lead time, the shelter locations, in that order."
  },
  {
    id: "hailcore", label: "Hail core — rural county", peak: 68,
    motion: "Nearly stationary, pulsing",
    ground: "Hail of 5 cm and larger is likely reaching the ground. Roofs, glass, vehicles and standing crops take damage.",
    move: "Put the survey team on standby. Tomorrow, this cell is a damage track to walk, photograph and grade."
  }
];

/* ---------- Enhanced Fujita scale (as printed on the page) ---------- */
var EF = [
  { rating: "EF0", wind: "65–85 mph",
    damage: "Light damage. Branches broken off trees; shallow-rooted trees pushed over; sign boards and chimneys damaged.",
    survey: "Surveyors log the tree-fall pattern first: scattered, shallow-rooted failures with no structural damage keeps the rating here." },
  { rating: "EF1", wind: "86–110 mph",
    damage: "Moderate damage. Roof surfaces stripped; mobile homes overturned or badly damaged; moving cars pushed off the road; garage doors fail inward.",
    survey: "Look for roof-deck loss and failed garage doors — the classic EF1 indicators — and separate wind damage from what debris did afterwards." },
  { rating: "EF2", wind: "111–135 mph",
    damage: "Considerable damage. Roofs torn off well-built houses; mobile homes demolished; large trees snapped or uprooted; light objects become missiles.",
    survey: "Map the tree line: trunks snapped at mid-height inside a convergent debris pattern separate a tornado's damage from straight-line wind." },
  { rating: "EF3", wind: "136–165 mph",
    damage: "Severe damage. Whole storeys of well-built houses destroyed; heavy cars lifted and thrown; trains overturned; most trees in the path debarked.",
    survey: "Interior-wall survival becomes the measure. If only interior rooms stand, the survey is in EF3 territory — and construction quality is documented, never assumed." },
  { rating: "EF4", wind: "166–200 mph",
    damage: "Devastating damage. Well-built houses levelled; structures with weak foundations blown some distance; cars thrown and large missiles generated.",
    survey: "Work from aerial imagery first — ground access is slow and unsafe — and grade the foundations: a levelled house on a weak foundation is not automatically EF4." },
  { rating: "EF5", wind: "Over 200 mph",
    damage: "Incredible damage. Strong frame houses lifted off their foundations and carried considerable distances; automobile-sized missiles fly through the air; trees completely debarked.",
    survey: "EF5 is a finding of last resort. Engineers walk the site alongside meteorologists, and the rating rests on the best-built structures in the path." }
];

/* Exposed for verification: probes read the same data the page renders. */
window.__RADAR = { bands: BANDS, scenarios: SCENARIOS, ef: EF, bandFor: bandFor };

/* ---------- reflectivity reader ---------- */
(function () {
  var list = document.getElementById("cellList");
  var out = document.getElementById("readout");
  if (!list || !out) return;

  function render(s) {
    var band = bandFor(s.peak);
    list.querySelectorAll(".cell-btn").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.id === s.id ? "true" : "false");
    });
    document.querySelectorAll(".scene").forEach(function (g) {
      g.style.display = g.id === "scene-" + s.id ? "" : "none";
    });
    out.innerHTML =
      '<div class="r-row"><span class="rk">Peak reflectivity</span><span class="rv big">' + s.peak + ' dBZ</span></div>' +
      '<div class="r-row"><span class="rk">Band</span><span class="rv"><span class="band-name">' + band.name + '</span> — ' + band.note + '</span></div>' +
      '<div class="r-row"><span class="rk">Cell motion</span><span class="rv">' + s.motion + '</span></div>' +
      '<div class="r-row"><span class="rk">On the ground</span><span class="rv">' + s.ground + '</span></div>' +
      '<div class="r-row"><span class="rk">Forecaster\u2019s move</span><span class="rv">' + s.move + '</span></div>';
  }

  SCENARIOS.forEach(function (s) {
    var band = bandFor(s.peak);
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cell-btn";
    b.dataset.id = s.id;
    b.setAttribute("aria-pressed", "false");
    b.innerHTML =
      '<span class="dot" style="background:' + bandColor(s.peak) + '" aria-hidden="true"></span>' +
      '<span>' + s.label + '</span>' +
      '<span class="peak">' + s.peak + ' dBZ · ' + band.name + '</span>';
    b.addEventListener("click", function () { render(s); });
    list.appendChild(b);
  });

  function bandColor(dbz) {
    if (dbz < 15) return "#7fae7a";
    if (dbz < 25) return "#3db54a";
    if (dbz < 35) return "#2e9e4f";
    if (dbz < 45) return "#f2d13c";
    if (dbz < 55) return "#f08c1e";
    if (dbz < 65) return "#d92323";
    return "#e35bb5";
  }

  render(SCENARIOS[2]); /* the supercell is the default picture */
})();

/* ---------- EF explorer ---------- */
(function () {
  var btns = document.getElementById("efBtns");
  var panel = document.getElementById("efPanel");
  if (!btns || !panel) return;

  function render(e) {
    btns.querySelectorAll(".ef-btn").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.rating === e.rating ? "true" : "false");
    });
    panel.innerHTML =
      '<div class="ef-grid">' +
      '<div><div class="fk">' + e.rating + ' — estimated gusts</div><div class="fv wind">' + e.wind + '</div></div>' +
      '<div><div class="fk">Damage it explains</div><div class="fv">' + e.damage + '</div></div>' +
      '<div><div class="fk">What the survey looks for</div><div class="fv">' + e.survey + '</div></div>' +
      '</div>';
  }

  EF.forEach(function (e) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ef-btn";
    b.dataset.rating = e.rating;
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = e.rating + '<small>' + e.wind + '</small>';
    b.addEventListener("click", function () { render(e); });
    btns.appendChild(b);
  });

  render(EF[2]); /* EF2 — the rating surveys argue about most */
})();

/* ---------- mobile menu ---------- */
(function () {
  var btn = document.getElementById("menuBtn");
  var panel = document.getElementById("menuPanel");
  if (!btn || !panel) return;

  function setOpen(open) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      var first = panel.querySelector("a");
      if (first) requestAnimationFrame(function () { first.focus({ preventScroll: true }); });
    }
  }
  btn.addEventListener("click", function () {
    setOpen(btn.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      btn.focus();
    }
  });
  panel.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setOpen(false); });
  });
})();

/* ---------- reveal on scroll (opacity only, reduced-motion safe) ---------- */
(function () {
  var els = document.querySelectorAll(".rv");
  if (!els.length) return;
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("rv-on"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("rv-on"); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- enquiry form ---------- */
(function () {
  var form = document.getElementById("enquiryForm");
  if (!form) return;
  var confirmation = document.getElementById("confirmation");

  function setError(id, msg) {
    var input = document.getElementById(id);
    var err = document.getElementById(id + "Error");
    if (!input || !err) return;
    if (msg) {
      input.setAttribute("aria-invalid", "true");
      err.textContent = msg;
      err.classList.add("show");
    } else {
      input.removeAttribute("aria-invalid");
      err.textContent = "";
      err.classList.remove("show");
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("fName");
    var email = document.getElementById("fEmail");
    var type = document.getElementById("fType");
    var msg = document.getElementById("fMessage");
    var ok = true, firstBad = null;

    if (!name.value.trim()) { setError("fName", "Your name is needed — briefings are addressed to a person, not a company."); ok = false; firstBad = firstBad || name; }
    else setError("fName", "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError("fEmail", "Enter an email address that can receive the written briefing."); ok = false; firstBad = firstBad || email; }
    else setError("fEmail", "");
    if (!type.value) { setError("fType", "Choose the closest kind of enquiry."); ok = false; firstBad = firstBad || type; }
    else setError("fType", "");
    if (msg.value.trim().length < 12) { setError("fMessage", "A line or two: the place, the date or window, and what is at stake."); ok = false; firstBad = firstBad || msg; }
    else setError("fMessage", "");

    if (!ok) { if (firstBad) firstBad.focus(); return; }

    var ref = "SR-2026-" + String(100 + Math.floor(Math.random() * 900));
    document.getElementById("confRef").textContent = "Enquiry reference " + ref;
    document.getElementById("confSummary").textContent =
      "Thank you, " + name.value.trim() + ". Your " + type.options[type.selectedIndex].text.toLowerCase() +
      " enquiry is logged. In season (March–October) the reply comes within one working day; a storm-day enquiry marked urgent is answered the same day.";
    form.style.display = "none";
    confirmation.classList.add("show");
    confirmation.setAttribute("tabindex", "-1");
    confirmation.focus({ preventScroll: false });
  });

  var again = document.getElementById("sendAnother");
  if (again) {
    again.addEventListener("click", function () {
      form.reset();
      form.style.display = "";
      confirmation.classList.remove("show");
      document.getElementById("fName").focus();
    });
  }
})();
