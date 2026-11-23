/* Block Bazaar — repeat studio, navigation, commission form. */

(function () {
  'use strict';

  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------------- repeat studio ---------------- */
  var canvas = document.getElementById('repeatCanvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width;
    var H = canvas.height;
    var PX_PER_MM = W / 1000; // the sheet shows one metre of cloth

    var COLORWAYS = {
      indigo: { ground: '#f6eeda', ink: '#1b2a47', accent: '#9a3a24', colours: 2 },
      madder: { ground: '#f6eeda', ink: '#9a3a24', accent: '#1b2a47', colours: 2 },
      iron: { ground: '#f6eeda', ink: '#2b2620', accent: '#9a3a24', colours: 2 },
      syahi: { ground: '#f6eeda', ink: '#2b2620', accent: '#9a3a24', colours: 3 },
      indigoMadder: { ground: '#9a3a24', ink: '#1b2a47', accent: '#f6eeda', colours: 2 }
    };

    var state = { motif: 'booti', block: 60, gap: 20, layout: 'drop', colorway: 'indigo' };

    function motifBooti(c, x, y, s, ink, accent) {
      c.fillStyle = ink;
      for (var i = 0; i < 6; i++) {
        var a = (i / 6) * Math.PI * 2;
        c.beginPath();
        c.ellipse(x + Math.cos(a) * s * 0.2, y + Math.sin(a) * s * 0.2, s * 0.085, s * 0.19, a, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = accent;
      c.beginPath();
      c.arc(x, y, s * 0.075, 0, Math.PI * 2);
      c.fill();
    }

    function motifAmbi(c, x, y, s, ink, accent) {
      c.save();
      c.translate(x, y);
      c.scale(s / 100, s / 100);
      c.strokeStyle = ink;
      c.lineWidth = 7;
      c.lineJoin = 'round';
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-34, 40);
      c.bezierCurveTo(-34, -6, -14, -44, 18, -44);
      c.bezierCurveTo(42, -44, 52, -28, 52, -12);
      c.bezierCurveTo(52, 14, 20, 30, -6, 46);
      c.stroke();
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(-20, 30);
      c.bezierCurveTo(-20, 8, -8, -20, 16, -20);
      c.stroke();
      c.fillStyle = accent;
      c.beginPath();
      c.arc(-2, 34, 5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    function motifJaali(c, x, y, s, ink, accent) {
      var r = s * 0.46;
      c.save();
      c.translate(x, y);
      c.strokeStyle = ink;
      c.lineWidth = Math.max(2, s * 0.035);
      c.beginPath();
      c.moveTo(0, -r); c.lineTo(r, 0); c.lineTo(0, r); c.lineTo(-r, 0); c.closePath();
      c.stroke();
      c.strokeStyle = accent;
      c.lineWidth = Math.max(1.5, s * 0.022);
      c.beginPath();
      c.moveTo(0, -r * 0.62); c.lineTo(r * 0.62, 0); c.lineTo(0, r * 0.62); c.lineTo(-r * 0.62, 0); c.closePath();
      c.stroke();
      c.fillStyle = ink;
      c.beginPath(); c.arc(0, 0, s * 0.05, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    function motifLotus(c, x, y, s, ink, accent) {
      c.save();
      c.translate(x, y);
      c.scale(s / 100, s / 100);
      c.strokeStyle = ink;
      c.lineWidth = 6;
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(0, 30);
      c.bezierCurveTo(-26, 22, -42, 4, -42, -14);
      c.bezierCurveTo(-22, -14, -6, -4, 0, 8);
      c.bezierCurveTo(6, -4, 22, -14, 42, -14);
      c.bezierCurveTo(42, 4, 26, 22, 0, 30);
      c.closePath();
      c.stroke();
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, 8); c.bezierCurveTo(-10, -6, -10, -28, 0, -38);
      c.bezierCurveTo(10, -28, 10, -6, 0, 8);
      c.stroke();
      c.strokeStyle = accent;
      c.lineWidth = 5;
      c.beginPath(); c.moveTo(0, 30); c.lineTo(0, 46); c.stroke();
      c.restore();
    }

    function motifLeheriya(c, x, y, s, ink, accent) {
      var h = s * 0.9;
      c.save();
      c.strokeStyle = ink;
      c.lineWidth = Math.max(4, s * 0.09);
      for (var i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(x - h + i * s * 0.34, y + h);
        c.lineTo(x + h + i * s * 0.34, y - h);
        c.stroke();
      }
      c.strokeStyle = accent;
      c.lineWidth = Math.max(2, s * 0.03);
      c.beginPath();
      c.moveTo(x - h + s * 0.17, y + h);
      c.lineTo(x + h + s * 0.17, y - h);
      c.stroke();
      c.restore();
    }

    var MOTIFS = { booti: motifBooti, ambi: motifAmbi, jaali: motifJaali, lotus: motifLotus, leheriya: motifLeheriya };

    function registration(c) {
      c.save();
      c.strokeStyle = 'rgba(36,31,25,.42)';
      c.lineWidth = 2;
      var m = 26;
      [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(function (p) {
        c.beginPath();
        c.moveTo(p[0] - 12, p[1]); c.lineTo(p[0] + 12, p[1]);
        c.moveTo(p[0], p[1] - 12); c.lineTo(p[0], p[1] + 12);
        c.stroke();
        c.beginPath();
        c.arc(p[0], p[1], 7, 0, Math.PI * 2);
        c.stroke();
      });
      c.restore();
    }

    function ruler(c) {
      c.save();
      c.strokeStyle = 'rgba(36,31,25,.5)';
      c.fillStyle = 'rgba(36,31,25,.55)';
      c.fillRect(0, H - 34, W, 34);
      c.strokeStyle = 'rgba(246,238,218,.7)';
      c.fillStyle = 'rgba(246,238,218,.8)';
      c.font = '18px "IBM Plex Mono", monospace';
      c.textAlign = 'center';
      for (var mm = 0; mm <= 1000; mm += 50) {
        var x = mm * PX_PER_MM;
        c.beginPath();
        c.moveTo(x, H - 34);
        c.lineTo(x, H - (mm % 100 === 0 ? 20 : 27));
        c.stroke();
        if (mm % 200 === 0 && mm > 0 && mm < 1000) c.fillText(mm + ' mm', x, H - 6);
      }
      c.restore();
    }

    function draw() {
      var cw = COLORWAYS[state.colorway];
      var repeat = state.block + state.gap;
      var rp = repeat * PX_PER_MM;
      var size = state.block * PX_PER_MM;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = cw.ground;
      ctx.fillRect(0, 0, W, H);

      var cols = Math.ceil(W / rp) + 1;
      var rows = Math.ceil((H - 34) / rp) + 1;

      for (var col = 0; col < cols; col++) {
        for (var row = 0; row < rows; row++) {
          var x = col * rp + rp / 2;
          var y = row * rp + rp / 2 + (state.layout === 'drop' && col % 2 ? rp / 2 : 0);
          if (y > H - 40) continue;
          (MOTIFS[state.motif] || motifBooti)(ctx, x, y, size, cw.ink, cw.accent);
        }
      }

      // selvedge line down the right edge
      ctx.strokeStyle = 'rgba(36,31,25,.25)';
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W - 12, 0);
      ctx.lineTo(W - 12, H - 34);
      ctx.stroke();
      ctx.setLineDash([]);

      registration(ctx);
      ruler(ctx);

      var perMetre = Math.floor(1000 / repeat);
      document.getElementById('rRepeat').textContent = repeat + ' × ' + repeat + ' mm';
      document.getElementById('rMotifs').textContent = perMetre;
      document.getElementById('rBlocks').textContent = state.motif === 'jaali' ? 2 : 1;
      document.getElementById('rColours').textContent = cw.colours;
      document.getElementById('blockVal').textContent = state.block + ' mm';
      document.getElementById('gapVal').textContent = state.gap + ' mm';
    }

    function syncButtons() {
      document.querySelectorAll('.motif-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-motif') === state.motif ? 'true' : 'false');
      });
    }

    document.querySelectorAll('.motif-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        state.motif = b.getAttribute('data-motif');
        syncButtons();
        draw();
      });
    });

    var blockInput = document.getElementById('blockSize');
    var gapInput = document.getElementById('gapSize');
    blockInput.addEventListener('input', function () { state.block = parseInt(blockInput.value, 10); draw(); });
    gapInput.addEventListener('input', function () { state.gap = parseInt(gapInput.value, 10); draw(); });
    document.getElementById('layout').addEventListener('change', function (e) { state.layout = e.target.value; draw(); });
    document.getElementById('colorway').addEventListener('change', function (e) { state.colorway = e.target.value; draw(); });

    document.getElementById('resetRepeat').addEventListener('click', function () {
      state = { motif: 'booti', block: 60, gap: 20, layout: 'drop', colorway: 'indigo' };
      blockInput.value = '60';
      gapInput.value = '20';
      document.getElementById('layout').value = 'drop';
      document.getElementById('colorway').value = 'indigo';
      syncButtons();
      draw();
    });

    document.getElementById('printSheet').addEventListener('click', function () {
      var motifs = ['booti', 'ambi', 'jaali', 'lotus', 'leheriya'];
      var ways = Object.keys(COLORWAYS);
      state.motif = motifs[Math.floor(Math.random() * motifs.length)];
      state.block = 30 + Math.floor(Math.random() * 31) * 2;
      state.gap = 8 + Math.floor(Math.random() * 17) * 2;
      state.layout = Math.random() > 0.5 ? 'drop' : 'straight';
      state.colorway = ways[Math.floor(Math.random() * ways.length)];
      blockInput.value = String(state.block);
      gapInput.value = String(state.gap);
      document.getElementById('layout').value = state.layout;
      document.getElementById('colorway').value = state.colorway;
      syncButtons();
      draw();
    });

    draw();
  }

  /* ---------------- commission form ---------------- */
  var form = document.getElementById('commissionForm');
  if (form) {
    var status = document.getElementById('formStatus');
    function setErr(id, on) {
      var el = document.getElementById(id);
      if (el) {
        var f = el.closest('.field');
        if (f) f.classList.toggle('has-err', on);
      }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('q-name');
      var email = document.getElementById('q-email');
      var phone = document.getElementById('q-phone');
      var metres = document.getElementById('q-metres');
      var cloth = document.getElementById('q-cloth');
      var date = document.getElementById('q-date');
      var brief = document.getElementById('q-brief');
      var consent = document.getElementById('q-consent');
      var bad = [];

      var okName = name.value.trim().length >= 2;
      var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      var okPhone = phone.value.trim() === '' || /^[0-9+\s()-]{7,18}$/.test(phone.value.trim());
      var okMetres = parseInt(metres.value, 10) >= 10;
      var okCloth = cloth.value !== '';
      var okDate = date.value !== '';
      var okBrief = brief.value.trim().length >= 20;
      var okConsent = consent.checked;

      setErr('q-name', !okName); if (!okName) bad.push('name');
      setErr('q-email', !okEmail); if (!okEmail) bad.push('email');
      setErr('q-phone', !okPhone); if (!okPhone) bad.push('phone');
      setErr('q-metres', !okMetres); if (!okMetres) bad.push('metres');
      setErr('q-cloth', !okCloth); if (!okCloth) bad.push('cloth');
      setErr('q-date', !okDate); if (!okDate) bad.push('date');
      setErr('q-brief', !okBrief); if (!okBrief) bad.push('brief');
      setErr('q-consent', !okConsent); if (!okConsent) bad.push('consent');

      if (bad.length) {
        status.textContent = 'Please check the highlighted fields.';
        status.className = 'form-status bad';
        var first = form.querySelector('.has-err input, .has-err select, .has-err textarea');
        if (first) first.focus();
        return;
      }
      status.textContent = 'Received. Meera will reply within two working days with a price per metre and the earliest printing date.';
      status.className = 'form-status ok';
      form.reset();
      form.querySelectorAll('.has-err').forEach(function (f) { f.classList.remove('has-err'); });
    });
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f) f.classList.remove('has-err');
    });
  }
})();
