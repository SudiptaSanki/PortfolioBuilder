/* =========================================================
   Höhenwerk — envelope sizing bench
   ISA atmosphere, superpressure buoyancy balance, lift chart.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- navigation ---------------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------------- atmosphere ---------------- */
  // International Standard Atmosphere, 0–32 km.
  function isa(km) {
    var h = km * 1000;
    var T, p;
    if (h <= 11000) {
      T = 288.15 - 0.0065 * h;
      p = 101325 * Math.pow(1 - 0.0065 * h / 288.15, 5.25588);
    } else if (h <= 20000) {
      T = 216.65;
      p = 22632.06 * Math.exp(-(h - 11000) / 6341.62);
    } else if (h <= 32000) {
      T = 216.65 + 0.001 * (h - 20000);
      p = 5474.89 * Math.pow(216.65 / T, 34.1632);
    } else {
      T = 228.65;
      p = 868.02;
    }
    return { T: T, p: p, rho: p / (287.05 * T) };
  }

  var R_GAS = { he: 2077.1, h2: 4123.9 };
  var GAS_NAME = { he: 'helium', h2: 'hydrogen' };

  function geometry(V, fineness) {
    var D = Math.pow((6 * V) / (Math.PI * fineness), 1 / 3);
    var L = fineness * D;
    var a = D / 2, c = L / 2, p = 1.6075;
    var ap = Math.pow(a, p), cp = Math.pow(c, p);
    var S = 4 * Math.PI * Math.pow((ap * ap + 2 * ap * cp) / 3, 1 / p);
    return { D: D, L: L, area: S };
  }

  var state = { alt: 20, payload: 450, areal: 210, dp: 600, fineness: 4, gas: 'he' };

  function solve(s) {
    var atm = isa(s.alt);
    var Tg = atm.T + 20;
    var R = R_GAS[s.gas];
    var rhoAir = atm.rho;
    var rhoGas = (atm.p + s.dp) / (R * Tg);
    var denom = rhoAir - 2 * rhoGas;
    if (denom <= 0.004) {
      return { feasible: false, reason: 'no lift margin at this altitude', atm: atm };
    }

    var V = 30000, mHull = 0, geo = geometry(V, s.fineness);
    for (var i = 0; i < 60; i++) {
      geo = geometry(V, s.fineness);
      mHull = (geo.area * s.areal) / 1000;
      var next = (s.payload + mHull) / denom;
      if (!isFinite(next) || next <= 0) break;
      V = V + (next - V) * 0.55;
    }
    geo = geometry(V, s.fineness);
    mHull = (geo.area * s.areal) / 1000;
    var mGas = rhoGas * V;
    var total = s.payload + mHull + mGas;
    var lift = V * (rhoAir - rhoGas);
    var seaLevel = isa(0);
    var Vfill = (mGas * R * 288.15) / 101325;
    var dpDay = s.dp + (mGas * R * 28) / V;
    var dpNight = s.dp - (mGas * R * 18) / V;

    return {
      feasible: true,
      V: V, D: geo.D, L: geo.L, area: geo.area,
      mHull: mHull, mGas: mGas, total: total, lift: lift,
      fill: (Vfill / V) * 100,
      dpDay: dpDay, dpNight: Math.max(dpNight, 0),
      atm: atm, rhoAir: rhoAir, rhoGas: rhoGas, Tg: Tg,
      seaLevel: seaLevel
    };
  }

  /* ---------------- formatting ---------------- */
  function nf(n, d) {
    return n.toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }

  /* ---------------- chart ---------------- */
  var canvas = document.getElementById('liftChart');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var CW = 720, CH = 320;

  function liftAt(res, km) {
    var atm = isa(km);
    var Tg = atm.T + 20;
    var R = R_GAS[state.gas];
    var rhoGasFree = atm.p / (R * Tg);
    var Vgas = res.mGas / rhoGasFree;
    if (Vgas >= res.V) {
      var rhoG = (atm.p + state.dp) / (R * Tg);
      return res.V * (atm.rho - rhoG);
    }
    return Vgas * (atm.rho - rhoGasFree);
  }

  function drawChart(res) {
    if (!ctx) return;
    ctx.fillStyle = '#fdfbf4';
    ctx.fillRect(0, 0, CW, CH);
    var padL = 58, padR = 14, padT = 26, padB = 38;
    var w = CW - padL - padR, h = CH - padT - padB;
    var maxAlt = 24;

    var sample = [];
    for (var a = 0; a <= maxAlt; a += 0.25) sample.push(liftAt(res, a));
    var minLift = Math.min.apply(null, sample.concat([res.total]));
    var maxLift = Math.max.apply(null, sample.concat([res.total]));
    var span = Math.max(maxLift - minLift, res.total * 0.12);
    var yMin = Math.max(0, Math.floor((minLift - span * 0.35) / 100) * 100);
    var yMax = Math.ceil((maxLift + span * 0.35) / 100) * 100;

    function X(km) { return padL + (km / maxAlt) * w; }
    function Y(kg) { return padT + h - ((kg - yMin) / (yMax - yMin)) * h; }

    // grid
    ctx.strokeStyle = 'rgba(16,26,32,0.10)';
    ctx.lineWidth = 1;
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#55626a';
    for (var t = yMin; t <= yMax + 1; t += (yMax - yMin) / 4) {
      var yy = Y(t);
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(padL + w, yy);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(nf(t), padL - 8, yy + 3);
    }
    for (var k = 0; k <= maxAlt; k += 4) {
      var xx = X(k);
      ctx.beginPath();
      ctx.moveTo(xx, padT);
      ctx.lineTo(xx, padT + h);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(k + ' km', xx, padT + h + 16);
    }

    // axes
    ctx.strokeStyle = '#101a20';
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + h);
    ctx.lineTo(padL + w, padT + h);
    ctx.stroke();

    // mass line
    ctx.strokeStyle = '#b8560c';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, Y(res.total));
    ctx.lineTo(padL + w, Y(res.total));
    ctx.stroke();

    // lift curve
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1f6f9c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < sample.length; i++) {
      var px = X(i * 0.25);
      var py = Y(Math.min(sample[i], yMax));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // float marker
    var fx = X(state.alt);
    ctx.strokeStyle = 'rgba(85,98,106,0.9)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(fx, padT);
    ctx.lineTo(fx, padT + h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#b8560c';
    ctx.beginPath();
    ctx.arc(fx, Y(res.total), 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#55626a';
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('lift available, kg', padL + 4, padT - 5);
  }

  /* ---------------- readouts ---------------- */
  var el = {
    alt: document.getElementById('alt'),
    altOut: document.getElementById('altOut'),
    altHint: document.getElementById('altHint'),
    payload: document.getElementById('payload'),
    payloadOut: document.getElementById('payloadOut'),
    areal: document.getElementById('areal'),
    arealOut: document.getElementById('arealOut'),
    dp: document.getElementById('dp'),
    dpOut: document.getElementById('dpOut'),
    fineness: document.getElementById('fineness'),
    finenessOut: document.getElementById('finenessOut'),
    vol: document.getElementById('outVol'),
    dim: document.getElementById('outDim'),
    gas: document.getElementById('outGas'),
    film: document.getElementById('outFilm'),
    fill: document.getElementById('outFill'),
    verdict: document.getElementById('verdict'),
    note: document.getElementById('resultNote')
  };

  function update() {
    var res = solve(state);

    if (el.altOut) el.altOut.textContent = state.alt.toFixed(1) + ' km';
    if (el.payloadOut) el.payloadOut.textContent = nf(state.payload) + ' kg';
    if (el.arealOut) el.arealOut.textContent = nf(state.areal) + ' g/m²';
    if (el.dpOut) el.dpOut.textContent = nf(state.dp) + ' Pa';
    if (el.finenessOut) el.finenessOut.textContent = state.fineness.toFixed(1);

    var atm = res.atm;
    if (el.altHint) {
      el.altHint.textContent = 'p = ' + nf(atm.p) + ' Pa · ρ air ' + atm.rho.toFixed(3) +
        ' kg/m³ · ' + (atm.T - 273.15).toFixed(1) + ' °C';
    }

    if (!res.feasible) {
      if (el.verdict) el.verdict.textContent = 'Not feasible — ' + res.reason;
      if (el.vol) el.vol.innerHTML = '—<small>m³</small>';
      if (el.dim) el.dim.innerHTML = '—<small>m</small>';
      if (el.gas) el.gas.innerHTML = '—<small>kg</small>';
      if (el.film) el.film.innerHTML = '—<small>kg</small>';
      if (el.fill) el.fill.innerHTML = '—<small>%</small>';
      if (el.note) el.note.textContent = 'At this altitude the gas at ' + nf(state.dp) + ' Pa superpressure is lighter than the air by too little to lift any hull. Raise the altitude or lower the pressure limit.';
      return;
    }

    if (el.vol) el.vol.innerHTML = nf(res.V) + '<small>m³</small>';
    if (el.dim) el.dim.innerHTML = nf(res.L) + '<small>m × ' + nf(res.D) + ' m</small>';
    if (el.gas) el.gas.innerHTML = nf(res.mGas) + '<small>kg</small>';
    if (el.film) el.film.innerHTML = nf(res.mHull) + '<small>kg</small>';
    if (el.fill) el.fill.innerHTML = nf(res.fill, 0) + '<small>% of volume</small>';

    if (el.verdict) {
      el.verdict.textContent = 'Feasible · ' + (res.total / 1000).toFixed(1) + ' t on ' +
        nf(res.V) + ' m³ of ' + GAS_NAME[state.gas];
    }

    if (el.note) {
      var over = res.dpDay > state.dp;
      el.note.textContent = 'Day swing at float: +' + nf(res.dpDay - state.dp) + ' Pa (' +
        '28 K gas rise) takes the hull to ' + nf(res.dpDay) + ' Pa against a ' + nf(state.dp) + ' Pa limit — ' +
        (over ? 'over the limit: add a ballonet of about ' + nf(res.V * (res.dpDay - state.dp) / (atm.p + state.dp)) + ' m³ or vent gas each morning.'
              : 'inside the limit, with ' + nf(state.dp - res.dpDay) + ' Pa of margin.') +
        ' Launch fill ' + nf(res.fill, 0) + '% of envelope volume.';
    }

    drawChart(res);
  }

  function bindRange(input, key) {
    if (!input) return;
    input.addEventListener('input', function () {
      state[key] = parseFloat(input.value);
      update();
    });
  }
  bindRange(el.alt, 'alt');
  bindRange(el.payload, 'payload');
  bindRange(el.areal, 'areal');
  bindRange(el.dp, 'dp');
  bindRange(el.fineness, 'fineness');

  var gasInputs = Array.prototype.slice.call(document.querySelectorAll('input[name="gas"]'));
  gasInputs.forEach(function (r) {
    r.addEventListener('change', function () {
      if (r.checked) { state.gas = r.value; update(); }
    });
  });

  update();

  /* ---------------- hull filter ---------------- */
  var fbtns = Array.prototype.slice.call(document.querySelectorAll('.fbtn'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.hull'));
  var filterCount = document.getElementById('filterCount');
  if (fbtns.length) {
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        fbtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var n = 0;
        cards.forEach(function (c) {
          var show = f === 'all' || c.getAttribute('data-cat') === f;
          c.classList.toggle('is-hidden', !show);
          if (show) n++;
        });
        if (filterCount) filterCount.textContent = n + (n === 1 ? ' programme shown' : ' programmes shown');
      });
    });
  }

  /* ---------------- hull enquiry ---------------- */
  var form = document.getElementById('hullForm');
  var result = document.getElementById('hullResult');
  var preview = document.getElementById('hullPreview');
  var send = document.getElementById('hullSend');
  var edit = document.getElementById('hullEdit');

  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function flag(id, on) { var el = document.getElementById(id); if (el) el.hidden = !on; }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = val('name'), email = val('email'), station = val('station'), mass = val('mass'), msg = val('message');
      var consent = document.getElementById('consent').checked;
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      flag('err-name', !name);
      flag('err-email', !emailOk);
      flag('err-station', !station);
      flag('err-mass', !mass);
      flag('err-message', !msg);
      flag('err-consent', !consent);
      if (!name || !emailOk || !station || !mass || !msg || !consent) {
        var first = !name ? 'name' : (!emailOk ? 'email' : (!station ? 'station' : (!mass ? 'mass' : (!msg ? 'message' : 'consent'))));
        var target = document.getElementById(first);
        if (target && target.focus) target.focus();
        if (result) result.hidden = true;
        return;
      }

      var org = val('org'), mission = val('mission');
      var text = 'Hull enquiry\n\n' +
        'Name: ' + name + '\n' +
        (org ? 'Organisation: ' + org + '\n' : '') +
        'Email: ' + email + '\n' +
        'Mission: ' + mission + '\n' +
        'Station altitude: ' + station + ' km\n' +
        'Payload mass: ' + mass + ' kg\n\n' +
        'Mission notes:\n' + msg + '\n\n' +
        'Sent from the Höhenwerk hull enquiry form.';

      if (preview) preview.textContent = text;
      if (send) send.setAttribute('href', 'mailto:hulls@hohenwerk.example?subject=' + encodeURIComponent('Hull enquiry — ' + (org || name)) + '&body=' + encodeURIComponent(text));
      if (result) result.hidden = false;
    });
  }

  if (edit) {
    edit.addEventListener('click', function () {
      if (result) result.hidden = true;
      var n = document.getElementById('name');
      if (n) n.focus();
    });
  }

})();
