/* Ellery Puppet Theatre — shared script.
   No audio anywhere: puppetry's product is the show, not sound,
   so the sound need-test fails by design (see CREDITS.md). */
(function () {
  "use strict";

  /* Cross-document view transitions abort as unhandled rejections in
     some browsers when the destination races; the navigation itself
     always completes. Filter only that exact abort. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile running-order panel ---------- */
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("run-panel");
  if (btn && panel) {
    var stateEl = btn.querySelector(".state");
    function setPanel(open) {
      panel.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (stateEl) stateEl.textContent = open ? "Close" : "Open";
      if (open) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = panel.querySelector("a");
            if (first) first.focus();
          });
        });
      }
    }
    btn.addEventListener("click", function () {
      setPanel(!panel.classList.contains("open"));
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setPanel(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) {
        setPanel(false);
        btn.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 720 && panel.classList.contains("open")) setPanel(false);
    });
  }

  /* ---------- reveal on scroll ---------- */
  var rvEls = document.querySelectorAll(".rv");
  if (rvEls.length && "IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- show spec explorer (index) ---------- */
  var SHOWS = {
    "salt-road": {
      title: "The Salt Road",
      form: "Tabletop & rod · Family show",
      running: "55 min",
      interval: "None",
      puppets: "9 puppets",
      performers: "3 performers",
      footprint: "5.0 × 3.5 m",
      height: "2.6 m clear",
      getin: "3 hrs",
      getout: "1 hr",
      crew: "Company: 3 performers + stage manager · Venue: 1 technician",
      ages: "7+",
      blackout: "Full blackout required",
      sound: "Company playback laptop; venue PA over 150 seats, company PA included under",
      capacity: "Up to 250 seats",
      status: "Touring — Spring 2027",
      plan: "table",
      pw: 5.0, pd: 3.5,
      note: "Built for studio theatres of 120–250 seats. The set is three stacking crates that are also the transport boxes, which is how the get-in stays at three hours with a company of four."
    },
    "night-market": {
      title: "Bramble & the Night Market",
      form: "Shadow theatre · Family show",
      running: "45 min",
      interval: "None",
      puppets: "26 shadow figures",
      performers: "2 performers",
      footprint: "4.0 × 2.5 m",
      height: "2.4 m clear",
      getin: "2 hrs",
      getout: "45 min",
      crew: "Company: 2 performers + stage manager · Venue: 1 technician",
      ages: "5+",
      blackout: "Absolute blackout — shadow screen",
      sound: "Live narration + company playback; venue PA or company PA included",
      capacity: "Up to 180 seats",
      status: "Touring — Spring 2027",
      plan: "screen",
      pw: 4.0, pd: 2.5,
      note: "Twenty-six hand-cut figures played against a 3.2 m screen. The screen and lamp travel with the company; the venue only has to give us darkness — every other shadow in the show is ours."
    },
    "clockmaker": {
      title: "The Clockmaker's Daughter",
      form: "Marionette (string) · Evening show",
      running: "70 min",
      interval: "20 min interval",
      puppets: "12 marionettes",
      performers: "4 performers",
      footprint: "6.0 × 4.0 m",
      height: "3.4 m clear (bridge at 3.0 m)",
      getin: "4.5 hrs",
      getout: "1.5 hrs",
      crew: "Company: 4 performers + stage manager · Venue: 2 technicians",
      ages: "8+",
      blackout: "Full blackout required",
      sound: "Recorded score, company playback; venue PA required",
      capacity: "Up to 400 seats",
      status: "Bookable — Autumn 2027",
      plan: "bridge",
      pw: 6.0, pd: 4.0,
      note: "The company's flagship string show. The bridge travels in six sections and bolts together at 3.0 m; if your grid or ceiling cannot give us 3.4 m clear, talk to us before booking — there is a reduced-height version, and we would rather rebuild than surprise you."
    },
    "paper-boats": {
      title: "Paper Boats",
      form: "Tabletop & object theatre · Schools show",
      running: "40 min",
      interval: "None · +20 min workshop if booked",
      puppets: "14 paper & object puppets",
      performers: "2 performers",
      footprint: "3.5 × 2.5 m",
      height: "2.2 m clear",
      getin: "45 min",
      getout: "30 min",
      crew: "Company: 2 performers · Venue (school): no technician needed",
      ages: "4–7 (EYFS & KS1)",
      blackout: "Not required — plays in daylight halls",
      sound: "Company battery PA included; nothing needed from the school",
      capacity: "Up to 120 children per show, floor seating",
      status: "Touring — Schools, all year",
      plan: "booth",
      pw: 3.5, pd: 2.5,
      note: "Designed for school halls with windows, radiators and a lunch trolley in the corner. Everything arrives in one estate car and one booth; the 45-minute get-in includes laying the floor cloth and the seating mats we bring."
    }
  };

  var explorer = document.querySelector(".explorer");
  if (explorer) {
    var buttons = explorer.querySelectorAll(".show-btn");
    var el = {
      title: document.getElementById("spec-title"),
      sub: document.getElementById("spec-sub"),
      running: document.getElementById("spec-running"),
      interval: document.getElementById("spec-interval"),
      puppets: document.getElementById("spec-puppets"),
      performers: document.getElementById("spec-performers"),
      footprint: document.getElementById("spec-footprint"),
      height: document.getElementById("spec-height"),
      getin: document.getElementById("spec-getin"),
      getout: document.getElementById("spec-getout"),
      crew: document.getElementById("spec-crew"),
      ages: document.getElementById("spec-ages"),
      blackout: document.getElementById("spec-blackout"),
      sound: document.getElementById("spec-sound"),
      capacity: document.getElementById("spec-capacity"),
      status: document.getElementById("spec-status"),
      note: document.getElementById("spec-note"),
      plan: document.getElementById("spec-plan"),
      planDims: document.getElementById("plan-dims")
    };

    function drawPlan(show) {
      /* Stage plan, top view. Plot area 240 x 120 units represents
         8 m x 4 m at the same scale for every show, so footprints
         can be compared honestly between productions. */
      var S = 30; /* units per metre */
      var ox = 30, oy = 14;
      var w = show.pw * S, d = show.pd * S;
      var x = ox + (240 - w) / 2, y = oy + (120 - d) / 2;
      var ink = "#221a11", line = "#a08c5e", velvet = "#7c1d1d", brass = "#8a6414";
      var s = "";
      s += '<rect x="' + ox + '" y="' + oy + '" width="240" height="120" fill="none" stroke="' + line + '" stroke-dasharray="4 4"/>';
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + d + '" fill="#ece3cd" stroke="' + ink + '" stroke-width="1.6"/>';
      if (show.plan === "table") {
        for (var i = 0; i < 3; i++) {
          s += '<rect x="' + (x + 12 + i * (w - 24) / 3 + 3) + '" y="' + (y + d / 2 - 13) + '" width="' + ((w - 24) / 3 - 6) + '" height="26" fill="none" stroke="' + velvet + '" stroke-width="1.3"/>';
        }
        s += '<text x="' + (x + w / 2) + '" y="' + (y + d / 2 + 3) + '" text-anchor="middle" font-size="8.5" fill="' + velvet + '" font-family="IBM Plex Mono,monospace">3 CRATES / TABLES</text>';
      } else if (show.plan === "screen") {
        s += '<line x1="' + (x + 10) + '" y1="' + (y + 16) + '" x2="' + (x + w - 10) + '" y2="' + (y + 16) + '" stroke="' + velvet + '" stroke-width="3"/>';
        s += '<circle cx="' + (x + w / 2) + '" cy="' + (y + d - 14) + '" r="5" fill="none" stroke="' + brass + '" stroke-width="1.6"/>';
        s += '<text x="' + (x + w / 2) + '" y="' + (y + 10) + '" text-anchor="middle" font-size="8.5" fill="' + velvet + '" font-family="IBM Plex Mono,monospace">SCREEN 3.2 m</text>';
        s += '<text x="' + (x + w / 2) + '" y="' + (y + d - 1) + '" text-anchor="middle" font-size="8" fill="' + brass + '" font-family="IBM Plex Mono,monospace">LAMP</text>';
      } else if (show.plan === "bridge") {
        s += '<line x1="' + (x + 8) + '" y1="' + (y + 20) + '" x2="' + (x + w - 8) + '" y2="' + (y + 20) + '" stroke="' + velvet + '" stroke-width="2.4"/>';
        s += '<line x1="' + (x + 8) + '" y1="' + (y + d - 20) + '" x2="' + (x + w - 8) + '" y2="' + (y + d - 20) + '" stroke="' + velvet + '" stroke-width="2.4"/>';
        for (var j = 0; j < 5; j++) {
          var sx = x + 22 + j * (w - 44) / 4;
          s += '<line x1="' + sx + '" y1="' + (y + 20) + '" x2="' + sx + '" y2="' + (y + d - 20) + '" stroke="' + brass + '" stroke-width="0.8" stroke-dasharray="2.5 2.5"/>';
        }
        s += '<text x="' + (x + w / 2) + '" y="' + (y + d / 2 + 3) + '" text-anchor="middle" font-size="8.5" fill="' + velvet + '" font-family="IBM Plex Mono,monospace">BRIDGE AT 3.0 m</text>';
      } else if (show.plan === "booth") {
        s += '<rect x="' + (x + w / 2 - 34) + '" y="' + (y + d / 2 - 20) + '" width="68" height="40" fill="none" stroke="' + velvet + '" stroke-width="1.6"/>';
        s += '<text x="' + (x + w / 2) + '" y="' + (y + d / 2 + 3) + '" text-anchor="middle" font-size="8.5" fill="' + velvet + '" font-family="IBM Plex Mono,monospace">BOOTH</text>';
        s += '<text x="' + (x + w / 2) + '" y="' + (y + d - 5) + '" text-anchor="middle" font-size="8" fill="' + brass + '" font-family="IBM Plex Mono,monospace">FLOOR CLOTH + MATS</text>';
      }
      /* dimension lines */
      s += '<line x1="' + x + '" y1="' + (oy + 128) + '" x2="' + (x + w) + '" y2="' + (oy + 128) + '" stroke="' + ink + '" stroke-width="1"/>';
      s += '<line x1="' + x + '" y1="' + (oy + 124) + '" x2="' + x + '" y2="' + (oy + 132) + '" stroke="' + ink + '"/>';
      s += '<line x1="' + (x + w) + '" y1="' + (oy + 124) + '" x2="' + (x + w) + '" y2="' + (oy + 132) + '" stroke="' + ink + '"/>';
      s += '<text x="' + (x + w / 2) + '" y="' + (oy + 141) + '" text-anchor="middle" font-size="9.5" fill="' + ink + '" font-family="IBM Plex Mono,monospace">' + show.pw.toFixed(1) + ' m</text>';
      s += '<line x1="' + (ox + 248) + '" y1="' + y + '" x2="' + (ox + 248) + '" y2="' + (y + d) + '" stroke="' + ink + '"/>';
      s += '<text x="' + (ox + 254) + '" y="' + (y + d / 2) + '" font-size="9.5" fill="' + ink + '" font-family="IBM Plex Mono,monospace" transform="rotate(90 ' + (ox + 254) + ' ' + (y + d / 2) + ')" text-anchor="middle">' + show.pd.toFixed(1) + ' m</text>';
      /* audience */
      s += '<rect x="' + ox + '" y="168" width="240" height="26" fill="#e3d7b8" stroke="' + line + '"/>';
      s += '<text x="' + (ox + 120) + '" y="185" text-anchor="middle" font-size="9.5" letter-spacing="2" fill="' + ink + '" font-family="IBM Plex Mono,monospace">AUDIENCE</text>';
      s += '<text x="' + ox + '" y="162" font-size="8.5" fill="' + ink + '" opacity="0.65" font-family="IBM Plex Mono,monospace">ONE 8 × 4 m PLOT FOR ALL FOUR SHOWS</text>';
      el.plan.innerHTML = s;
      el.planDims.textContent = show.footprint;
    }

    function selectShow(keyName) {
      var show = SHOWS[keyName];
      if (!show) return;
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-show") === keyName ? "true" : "false");
      });
      el.title.textContent = show.title;
      el.sub.textContent = show.form;
      el.running.textContent = show.running;
      el.interval.textContent = show.interval;
      el.puppets.textContent = show.puppets;
      el.performers.textContent = show.performers;
      el.footprint.textContent = show.footprint;
      el.height.textContent = show.height;
      el.getin.textContent = show.getin;
      el.getout.textContent = show.getout;
      el.crew.textContent = show.crew;
      el.ages.textContent = show.ages;
      el.blackout.textContent = show.blackout;
      el.sound.textContent = show.sound;
      el.capacity.textContent = show.capacity;
      el.status.textContent = show.status;
      el.note.textContent = show.note;
      drawPlan(show);
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { selectShow(b.getAttribute("data-show")); });
    });
    selectShow("salt-road");
  }

  /* ---------- booking form (contact) ---------- */
  var form = document.getElementById("book-form");
  if (form) {
    var confirm = document.getElementById("form-confirm");
    var refEl = document.getElementById("confirm-ref");
    function markInvalid(input, bad) {
      var field = input.closest(".field");
      if (field) field.classList.toggle("invalid", bad);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      return !bad;
    }
    function validate() {
      var ok = true;
      var name = form.elements["name"];
      var email = form.elements["email"];
      var type = form.elements["type"];
      var msg = form.elements["message"];
      ok = markInvalid(name, !name.value.trim()) && ok;
      ok = markInvalid(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = markInvalid(type, !type.value) && ok;
      ok = markInvalid(msg, msg.value.trim().length < 20) && ok;
      return ok;
    }
    ["name", "email", "type", "message"].forEach(function (n) {
      var input = form.elements[n];
      if (input) input.addEventListener("input", function () { markInvalid(input, false); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = "EP-2026-" + String(Math.floor(100 + Math.random() * 900));
      if (refEl) refEl.textContent = ref;
      form.style.display = "none";
      if (confirm) {
        confirm.classList.add("show");
        confirm.setAttribute("tabindex", "-1");
        confirm.focus();
      }
    });
    var again = document.getElementById("send-another");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        form.style.display = "";
        if (confirm) confirm.classList.remove("show");
        var first = form.elements["name"];
        if (first) first.focus();
      });
    }
  }
})();
