/* Matte Lumen — control plate behaviour, scene player, form.
   No audio (the sound need-test fails for lighting: the trade is visual,
   and the stub's slider hum taught nothing). No libraries. */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile panel ---------- */
  var btn = document.querySelector(".fader-btn");
  var panel = document.getElementById("mobile-panel");
  if (btn && panel) {
    var firstLink = panel.querySelector("a");
    function setPanel(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        panel.hidden = false;
        document.body.style.overflow = "hidden";
        if (firstLink) firstLink.focus({ preventScroll: true });
      } else {
        panel.hidden = true;
        document.body.style.overflow = "";
        btn.focus({ preventScroll: true });
      }
    }
    btn.addEventListener("click", function () {
      setPanel(panel.hidden);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) setPanel(false);
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        panel.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && !panel.hidden) {
        panel.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
  }

  /* ---------- reveal on scroll (reading order only) ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length && !reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- scene player ---------- */
  var player = document.getElementById("scene-player");
  if (player) {
    /* Circuit order everywhere: cove, pendants, wash, lamp, shelf.
       lux = additive model: each circuit's full-level contribution at the
       reference plane (pendants measured at the table, others ambient). */
    var CIRCUITS = ["cove", "pend", "wash", "lamp", "shelf"];
    var LUX = { cove: 55, pend: 105, wash: 30, lamp: 25, shelf: 15 };
    var SCENES = {
      arrive: { no: "01", name: "Arrive", fade: 3, cct: 2700, levels: { cove: 80, pend: 70, wash: 90, lamp: 40, shelf: 60 } },
      dinner: { no: "02", name: "Dinner", fade: 5, cct: 2400, levels: { cove: 35, pend: 85, wash: 50, lamp: 20, shelf: 30 } },
      film:   { no: "03", name: "Film",   fade: 4, cct: 2200, levels: { cove: 10, pend: 0,  wash: 15, lamp: 0,  shelf: 45 } },
      night:  { no: "04", name: "Night",  fade: 6, cct: 2000, levels: { cove: 0,  pend: 0,  wash: 0,  lamp: 15, shelf: 20 } }
    };
    var state = { scene: "arrive", master: 100, warmdim: true };
    var anim = null;

    var glows = {};
    CIRCUITS.forEach(function (c) {
      glows[c] = player.querySelectorAll('[data-glow="' + c + '"]');
    });
    var sceneBtns = player.querySelectorAll(".scene-btn");
    var master = document.getElementById("master-fader");
    var masterOut = document.getElementById("master-out");
    var warmdim = document.getElementById("warmdim");
    var line = document.getElementById("scene-line");
    var lvEls = {};
    CIRCUITS.forEach(function (c) {
      lvEls[c] = {
        bar: document.querySelector('[data-lv-bar="' + c + '"]'),
        val: document.querySelector('[data-lv-val="' + c + '"]')
      };
    });

    function currentLevels() {
      var s = SCENES[state.scene].levels, out = {};
      CIRCUITS.forEach(function (c) { out[c] = Math.round(s[c] * state.master / 100); });
      return out;
    }
    function effectiveCCT(levels) {
      var base = SCENES[state.scene].cct;
      if (!state.warmdim) return base;
      /* dim-to-warm: the room's dominant circuits pull colour down as they dim */
      var weighted = 0, weight = 0;
      CIRCUITS.forEach(function (c) {
        weighted += levels[c] * LUX[c];
        weight += 100 * LUX[c];
      });
      var ratio = weight ? weighted / weight : 0; /* 0..1 of full output */
      var drop = Math.round((1 - ratio) * 500);
      return Math.max(1800, base - drop);
    }
    function render(levels, cct) {
      CIRCUITS.forEach(function (c) {
        var o = (levels[c] / 100).toFixed(2);
        glows[c].forEach(function (g) { g.setAttribute("opacity", o); });
        if (lvEls[c].bar) lvEls[c].bar.style.width = levels[c] + "%";
        if (lvEls[c].val) lvEls[c].val.textContent = levels[c] + "%";
      });
      var tint = document.getElementById("warm-tint");
      if (tint) {
        /* warmer as CCT falls: 3000K -> 0, 1800K -> .55 */
        var w = Math.min(0.55, Math.max(0, (3000 - cct) / 1200 * 0.55));
        tint.setAttribute("opacity", w.toFixed(2));
      }
      var lux = 0;
      CIRCUITS.forEach(function (c) { lux += LUX[c] * levels[c] / 100; });
      lux = Math.round(lux);
      var s = SCENES[state.scene];
      line.innerHTML =
        "<b>SC " + s.no + " · " + s.name.toUpperCase() + "</b>" +
        " — fade " + s.fade + " s · COVE " + levels.cove +
        " · PEND " + levels.pend +
        " · WASH " + levels.wash +
        " · LAMP " + levels.lamp +
        " · SHELF " + levels.shelf +
        " · CCT ≈" + cct + " K · room ≈" + lux + " lx · master " + state.master + "%";
    }
    function apply(animate) {
      var target = currentLevels();
      var cct = effectiveCCT(target);
      if (!animate || reduceMotion) {
        if (anim) cancelAnimationFrame(anim);
        render(target, cct);
        return;
      }
      var from = {};
      CIRCUITS.forEach(function (c) {
        var g = glows[c][0];
        from[c] = g ? parseFloat(g.getAttribute("opacity") || "0") * 100 : 0;
      });
      var dur = SCENES[state.scene].fade * 220; /* compressed: 1 s of fade ≈ 220 ms here */
      var t0 = null;
      if (anim) cancelAnimationFrame(anim);
      var step = function (ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        var now = {};
        CIRCUITS.forEach(function (c) { now[c] = Math.round(from[c] + (target[c] - from[c]) * e); });
        render(now, cct);
        if (p < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }
    sceneBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        state.scene = b.getAttribute("data-scene");
        sceneBtns.forEach(function (x) {
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        apply(true);
      });
    });
    if (master) {
      master.addEventListener("input", function () {
        state.master = parseInt(master.value, 10);
        if (masterOut) masterOut.textContent = state.master + "%";
        apply(false);
      });
    }
    if (warmdim) {
      warmdim.addEventListener("change", function () {
        state.warmdim = warmdim.checked;
        apply(false);
      });
    }
    apply(false);
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var conf = document.getElementById("confirmation");
    function fieldErr(input, msg) {
      var wrap = input.closest(".field");
      var err = wrap ? wrap.querySelector(".err") : null;
      if (err) {
        err.textContent = msg || "";
        err.classList.toggle("show", !!msg);
      }
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var name = form.querySelector("#f-name");
      var email = form.querySelector("#f-email");
      var type = form.querySelector("#f-type");
      var msg = form.querySelector("#f-msg");
      if (!name.value.trim()) ok = fieldErr(name, "Please give your name.") && ok;
      else ok = fieldErr(name, "") && ok;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
        ok = fieldErr(email, "Please give an email address that can receive a reply.") && ok;
      else ok = fieldErr(email, "") && ok;
      if (!type.value) ok = fieldErr(type, "Please choose the closest project type.") && ok;
      else ok = fieldErr(type, "") && ok;
      if (msg.value.trim().length < 20)
        ok = fieldErr(msg, "A little more helps — rooms involved, stage of the project, and the town are the useful facts.") && ok;
      else ok = fieldErr(msg, "") && ok;
      if (!ok) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = "ML-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("conf-ref").textContent = ref;
      form.hidden = true;
      conf.classList.add("show");
      conf.setAttribute("tabindex", "-1");
      conf.focus({ preventScroll: false });
    });
    ["input", "change"].forEach(function (evt) {
      form.addEventListener(evt, function (e) {
        if (e.target.getAttribute("aria-invalid") === "true") fieldErr(e.target, "");
      });
    });
  }
})();
