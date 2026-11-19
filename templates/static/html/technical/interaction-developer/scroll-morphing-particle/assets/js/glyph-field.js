/* Glyph field — canvas particles sampled from glyph-art point data.
   Chars assemble from a scatter, drift with scroll, react to the pointer and to clicks. */
(function () {
  "use strict";

  var CHARS = "#+=-:.*/%\u00b7";
  var INK = ["#2b2b2b", "#6b6b6b", "#a8a8a6"];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  var fields = [];
  var pointer = { x: -9999, y: -9999, active: false };
  var ripples = [];
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function tones() {
    var dark = document.documentElement.dataset.theme === "dark";
    var cs = getComputedStyle(document.documentElement);
    var strong = cs.getPropertyValue("--text").trim() || (dark ? "#f1f0ec" : "#2b2b2b");
    var mid = cs.getPropertyValue("--muted").trim() || "#6b6b6b";
    var soft = cs.getPropertyValue("--soft").trim() || "#a8a8a6";
    return [strong, mid, soft];
  }

  function GlyphField(el) {
    this.el = el;
    this.canvas = el.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.data = el.dataset.glyph === "quote" ? window.GLYPH_QUOTE : window.GLYPH_BRANCH;
    this.local = el.hasAttribute("data-local");
    this.visible = true;
    this.start = 0;
    this.dpr = 1;
    this.scale = 1;
    this.parts = [];
    this.colors = tones();
    this.lastScramble = 0;
    this.build();
    this.bind();
    this.resize();
    var self = this;
    this.io = new IntersectionObserver(function (entries) {
      self.visible = entries[0].isIntersecting;
    }, { rootMargin: "20% 0px 20% 0px" });
    this.io.observe(el);
    el.classList.add("is-ready");
    this.start = performance.now();
    fields.push(this);
  }

  GlyphField.prototype.build = function () {
    var d = this.data;
    if (!d) return;
    var cells = d.cells;
    var parts = [];
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var x = c[0], y = c[1], ch = c[2], tone = c[3] || 0, w = c[4] || 3;
      var ang = Math.atan2(y / d.rows - 0.5, x / d.cols - 0.5) + rand(-0.7, 0.7);
      parts.push({
        gx: x, gy: y, ch: ch, fin: ch, tone: tone,
        wx: w / 9,
        dx: Math.cos(ang), dy: Math.sin(ang) * 0.8,
        ax: rand(-1, 1), ay: rand(-1, 1),
        delay: rand(0, 0.55),
        size: w > 7 ? 1.12 : w > 4 ? 0.98 : 0.86,
        jitter: rand(0, 6.28)
      });
    }
    this.parts = parts;
  };

  GlyphField.prototype.bind = function () {
    var self = this;
    this.el.addEventListener("pointermove", function (e) {
      var r = self.el.getBoundingClientRect();
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      if (self.local) {
        pointer.lx = e.clientX - r.left;
        pointer.ly = e.clientY - r.top;
      }
    });
    this.el.addEventListener("pointerleave", function () { pointer.active = false; });
  };

  GlyphField.prototype.resize = function () {
    var r = this.el.getBoundingClientRect();
    if (!r.width) return;
    this.w = r.width;
    this.h = r.height || r.width / (this.data.cols / (this.data.rows * (this.data.aspect || 1)));
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    var cell = Math.max(12, Math.round(this.w / (window.innerWidth < 768 ? 5 : 6.5)));
    this.scale = this.w / this.data.cols;
    this.ctx.font = "500 " + (cell * 0.14).toFixed(2) + "px " + getFont() ;
  };

  function getFont() {
    return '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  }

  GlyphField.prototype.theme = function () {
    this.colors = tones();
  };

  GlyphField.prototype.draw = function (now) {
    if (!this.visible || !this.w) return;
    var ctx = this.ctx, parts = this.parts, s = this.scale;
    var sy = s * (this.data.aspect || 1);
    ctx.clearRect(0, 0, this.w, this.h);
    if (!parts.length) return;

    var vh = window.innerHeight;
    var scroll = window.scrollY || window.pageYOffset || 0;
    var rTop = this.el.getBoundingClientRect().top;
    var inView = rTop < vh && rTop + this.h > -vh;

    var intro = reduced ? 1 : clamp((now - this.start - 120) / 2100, 0, 1);
    var scat = reduced ? 0 : clamp(scroll / (0.92 * vh), 0, 1);

    var mx = pointer.x, my = pointer.y;
    var pr = this.el.getBoundingClientRect();
    var localX = mx - pr.left, localY = my - pr.top;
    var hover = pointer.active && mx > pr.left - 40 && mx < pr.right + 40 && my > pr.top - 40 && my < pr.bottom + 40;

    var fontPx = Math.max(5, s * 1.05);
    ctx.font = "500 " + fontPx.toFixed(2) + "px " + getFont();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // active ripples
    var ripplesNow = [];
    for (var i = ripples.length - 1; i >= 0; i--) {
      var rp = ripples[i];
      var age = (now - rp.t) / 1000;
      if (age < 1.35) ripplesNow.push({ x: rp.x, y: rp.y, t: rp.t, age: age });
      else ripples.splice(i, 1);
    }

    for (var t = 0; t < 3; t++) {
      ctx.fillStyle = this.colors[t] || INK[t];
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        if (p.tone !== t) continue;
        var ix = p.gx * s, iy = p.gy * sy;
        var a = clamp(0.28 + p.wx * 0.85, 0, 1);
        var e = reduced ? 1 : smooth(clamp((intro - p.delay) / 0.45, 0, 1));
        var x = ix + (1 - e) * p.ax * 140;
        var y = iy + (1 - e) * p.ay * 120;
        a *= 0.25 + 0.75 * e;

        if (scat > 0) {
          var push = scat * (26 + p.wx * 46);
          x += p.dx * push;
          y += p.dy * push;
          a *= 1 - scat * 0.55;
        }

        if (hover) {
          var px = localX, py = localY;
          var ddx = x - px, ddy = y - py;
          var dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < 78) {
            var f = (1 - dist / 78) * 16;
            x += (ddx / (dist || 1)) * f;
            y += (ddy / (dist || 1)) * f;
          }
        }

        for (var q = 0; q < ripplesNow.length; q++) {
          var r2 = ripplesNow[q];
          var lx = x - r2.x, ly = y - r2.y;
          var dd = Math.sqrt(lx * lx + ly * ly) || 1;
          var radius = 1150 * r2.age;
          var band = 56 * Math.exp(-Math.pow((dd - radius) / 90, 2)) * Math.pow(Math.max(0, 1 - r2.age / 1.3), 2);
          if (band > 0.2) {
            x += (lx / dd) * band;
            y += (ly / dd) * band;
            a = Math.min(1, a + band / 40);
          }
        }

        if (a <= 0.02) continue;
        ctx.globalAlpha = a;
        var ch = p.fin;
        if (!reduced && (scat > 0.02 || ripplesNow.length) && Math.random() < 0.06) {
          ch = CHARS[(Math.random() * CHARS.length) | 0];
        }
        ctx.fillText(ch, x, y);
      }
    }
    ctx.globalAlpha = 1;
  };

  function tick(now) {
    for (var i = 0; i < fields.length; i++) fields[i].draw(now);
    requestAnimationFrame(tick);
  }

  // global ripple on click (hero + footer vignettes react where they are)
  document.addEventListener("pointerdown", function (e) {
    if (e.button > 0) return;
    var t = e.target;
    if (t.closest && t.closest("a, button, input, textarea, select, label, [role='button']")) return;
    ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (ripples.length > 6) ripples.shift();
    document.documentElement.classList.add("waved");
  }, { passive: true });

  window.addEventListener("resize", function () {
    for (var i = 0; i < fields.length; i++) fields[i].resize();
  });
  window.addEventListener("theme:change", function () {
    for (var i = 0; i < fields.length; i++) fields[i].theme();
  });

  function init() {
    document.querySelectorAll("[data-glyph]").forEach(function (el) { new GlyphField(el); });
    requestAnimationFrame(tick);
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);

  window.GlyphField = GlyphField;
})();
