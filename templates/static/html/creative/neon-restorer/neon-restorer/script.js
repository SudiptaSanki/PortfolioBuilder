/* Blue Ridge Neon Works — transformer bench, tube preview, opt-in hum. */

(function () {
  'use strict';

  /* ------------------------------------------------------------- mobile nav */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = 'Menu';
      }
    });
  }

  /* ------------------------------------------------------------------- gas */
  var GAS = {
    neon: { label: 'Neon', color: '#ff5a45', line: '585–640 nm · the original red', vpf: { 8: 330, 10: 285, 12: 240, 15: 200 } },
    argon: { label: 'Argon + mercury', color: '#7d9bff', line: '436 nm + 546 nm · blue with a green cast', vpf: { 8: 300, 10: 255, 12: 215, 15: 180 } },
    helium: { label: 'Helium', color: '#ffc978', line: '587 nm · warm gold-white', vpf: { 8: 420, 10: 360, 12: 300, 15: 250 } },
    krypton: { label: 'Krypton', color: '#cfd4ff', line: '557–587 nm · pale white', vpf: { 8: 360, 10: 310, 12: 260, 15: 215 } },
    xenon: { label: 'Xenon', color: '#b9c8ff', line: '467–492 nm · blue-white', vpf: { 8: 400, 10: 345, 12: 290, 15: 240 } },
    co2: { label: 'CO2', color: '#ffe9d6', line: '500–560 nm · warm white', vpf: { 8: 520, 10: 450, 12: 380, 15: 320 } }
  };

  var bench = {
    gas: document.getElementById('gas'),
    diam: document.getElementById('diam'),
    len: document.getElementById('len'),
    elec: document.getElementById('elec'),
    current: document.getElementById('current')
  };
  if (!bench.gas) { initForm(); return; }

  var out = {
    gasTag: document.getElementById('gasTag'),
    gasSwatch: document.getElementById('gasSwatch'),
    gasLine: document.getElementById('gasLine'),
    diamTag: document.getElementById('diamTag'),
    lenTag: document.getElementById('lenTag'),
    elecTag: document.getElementById('elecTag'),
    currentTag: document.getElementById('currentTag'),
    preview: document.getElementById('tubePreview'),
    previewLabel: document.getElementById('previewLabel'),
    previewSpec: document.getElementById('previewSpec'),
    loadFill: document.getElementById('loadFill'),
    loadPct: document.getElementById('loadPct'),
    loadNote: document.getElementById('loadNote'),
    outVolts: document.getElementById('outVolts'),
    outIgn: document.getElementById('outIgn'),
    outCore: document.getElementById('outCore'),
    outVa: document.getElementById('outVa'),
    coreNote: document.getElementById('coreNote')
  };

  var CORES = [6000, 9000, 12000, 15000];

  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  function drawTube(gas, lengthFt, volts, core) {
    var c = GAS[gas].color;
    var sway = Math.min(1, lengthFt / 40);
    var glow = 'filter:drop-shadow(0 0 3px ' + c + ') drop-shadow(0 0 10px ' + c + '99) drop-shadow(0 0 26px ' + c + '55)';
    var amp = 26 + sway * 34;
    var path = 'M46 150 C 86 ' + (150 - amp) + ', 128 ' + (150 - amp) + ', 166 118 S 214 ' + (150 + amp * 0.6) + ', 258 118 S 312 ' + (150 - amp) + ', 356 118 S 414 ' + (150 + amp * 0.5) + ', 470 132';
    var svg = '<g style="' + glow + '">' +
      '<path d="' + path + '" fill="none" stroke="' + c + '" stroke-width="9" stroke-opacity="0.22" stroke-linecap="round"/>' +
      '<path d="' + path + '" fill="none" stroke="' + c + '" stroke-width="3.2" stroke-linecap="round"/>' +
      '</g>';
    svg += '<g fill="#3b2d23">' +
      '<rect x="34" y="142" width="16" height="18" rx="2"/>' +
      '<rect x="462" y="124" width="16" height="18" rx="2"/>' +
      '</g>';
    svg += '<g font-family="Courier Prime, monospace" font-size="9" fill="#8d7a68">' +
      '<text x="46" y="188">ELECTRODE</text>' +
      '<text x="470" y="188" text-anchor="end">ELECTRODE</text>' +
      '</g>';
    svg += '<line x1="34" y1="168" x2="486" y2="168" stroke="#3b2d23" stroke-width="1"/>';
    out.preview.innerHTML = svg;
  }

  function update() {
    var gasKey = bench.gas.value;
    var gas = GAS[gasKey];
    var diam = bench.diam.value;
    var len = Number(bench.len.value);
    var elecDrop = Number(bench.elec.value);
    var current = Number(bench.current.value);

    var perFt = gas.vpf[diam];
    var currentFactor = current === 60 ? 1.06 : 1;
    var operating = (perFt * len + 2 * elecDrop) * currentFactor;
    var ignition = Math.max(operating * 1.5, operating + 1000);

    var core = CORES[CORES.length - 1];
    for (var i = 0; i < CORES.length; i++) {
      if (CORES[i] >= ignition) { core = CORES[i]; break; }
    }
    var overload = ignition > CORES[CORES.length - 1];
    var load = Math.min(999, (operating / core) * 100);

    out.gasTag.textContent = gas.label;
    out.gasSwatch.style.color = gas.color;
    out.gasSwatch.style.background = gas.color;
    out.gasLine.textContent = gas.line;
    out.diamTag.textContent = diam + ' mm';
    out.lenTag.textContent = len + ' ft';
    out.elecTag.textContent = elecDrop === 250 ? 'Cold cathode' : elecDrop === 200 ? 'Mercury jacket' : 'Standard';
    out.currentTag.textContent = current + ' mA';

    out.outVolts.innerHTML = fmt(operating) + '<small>V</small>';
    out.outIgn.innerHTML = fmt(ignition) + '<small>V</small>';
    out.outCore.innerHTML = overload
      ? 'Split<small>2 circuits</small>'
      : (core / 1000) + ' kV<small>' + current + ' mA</small>';
    out.outVa.innerHTML = overload
      ? '—<small>per core</small>'
      : fmt(core * current / 1000) + '<small>VA</small>';

    out.loadPct.textContent = overload ? 'over' : Math.round(load) + '%';
    out.loadFill.style.width = (overload ? 100 : Math.min(100, load)) + '%';
    out.loadFill.style.background = (overload || load > 85) ? '#8e4433' : '#b0714f';

    if (overload) {
      out.loadNote.textContent = 'This run is longer than a single 15 kV core can strike. Split it into two circuits with a jumper, or move to a cold-cathode electrode and re-check.';
      out.coreNote.textContent = 'No standard core in this shop reaches the ignition figure for this length. Two circuits is the honest answer.';
    } else if (load > 85) {
      out.loadNote.textContent = 'Above 85% load. On a warm evening this will run hot and the tube will darken at the far end; use the next core up.';
      out.coreNote.textContent = 'Sized from the next standard core above the ignition voltage. This one is working hard — check the can can breathe.';
    } else if (load < 35) {
      out.loadNote.textContent = 'Well under-loaded. The tube may strike unevenly and the core will run cool; a smaller core would last longer.';
      out.coreNote.textContent = 'Sized from the next standard core above the ignition voltage; a smaller core is possible but may not strike on a cold morning.';
    } else {
      out.loadNote.textContent = 'A ' + (core / 1000) + ' kV core at ' + Math.round(load) + '% has headroom for a cold morning. Keep below 85% in an enclosed can where the core cannot breathe.';
      out.coreNote.textContent = 'Sized from the next standard core above the ignition voltage. A core rated below the ignition figure will strike unreliably below 5 °C.';
    }

    out.previewLabel.textContent = len + ' ft · ' + diam + ' mm · ' + gas.label.toLowerCase();
    out.previewSpec.textContent = (core / 1000) + ' kV / ' + current + ' mA';
    drawTube(gasKey, len, operating, core);
  }

  ['gas', 'diam', 'len', 'elec', 'current'].forEach(function (id) {
    bench[id].addEventListener('input', update);
    bench[id].addEventListener('change', update);
  });
  update();

  /* ------------------------------------------------------------------- hum */
  var humBtn = document.getElementById('humBtn');
  var humLabel = document.getElementById('humLabel');
  var audio = null;
  var master = null;
  var source = null;
  var playing = false;

  function buildHum() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    audio = new Ctx();
    master = audio.createGain();
    master.gain.value = 0;
    master.connect(audio.destination);

    source = audio.createBufferSource();
    var seconds = 2;
    var buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate);
    var data = buffer.getChannelData(0);
    var last = 0;
    for (var i = 0; i < data.length; i++) {
      last = last * 0.96 + (Math.random() * 2 - 1) * 0.04;
      data[i] = last;
    }
    source.buffer = buffer;
    source.loop = true;

    var lowpass = audio.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 320;
    var noiseGain = audio.createGain();
    noiseGain.gain.value = 0.09;

    source.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(master);

    var fundamental = audio.createOscillator();
    fundamental.type = 'sine';
    fundamental.frequency.value = 60;
    var g1 = audio.createGain();
    g1.gain.value = 0.14;
    fundamental.connect(g1);
    g1.connect(master);

    var harmonic = audio.createOscillator();
    harmonic.type = 'triangle';
    harmonic.frequency.value = 120;
    var g2 = audio.createGain();
    g2.gain.value = 0.045;
    harmonic.connect(g2);
    g2.connect(master);

    var buzz = audio.createOscillator();
    buzz.type = 'sawtooth';
    buzz.frequency.value = 180;
    var buzzFilter = audio.createBiquadFilter();
    buzzFilter.type = 'bandpass';
    buzzFilter.frequency.value = 180;
    buzzFilter.Q.value = 6;
    var g3 = audio.createGain();
    g3.gain.value = 0.018;
    buzz.connect(buzzFilter);
    buzzFilter.connect(g3);
    g3.connect(master);

    [fundamental, harmonic, buzz, source].forEach(function (node) { node.start(); });
  }

  if (humBtn) {
    humBtn.addEventListener('click', function () {
      if (!audio) buildHum();
      if (audio.state === 'suspended') audio.resume();

      playing = !playing;
      humBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      humLabel.textContent = playing ? 'Stop transformer hum' : 'Play transformer hum';

      var now = audio.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      if (playing) {
        master.gain.linearRampToValueAtTime(0.22, now + 0.6);
        humBtn.querySelector('i').style.background = '#ff6a4d';
      } else {
        master.gain.linearRampToValueAtTime(0, now + 0.35);
        humBtn.querySelector('i').style.background = '#6f6257';
      }
    });
  }

function initForm() {
  /* ----------------------------------------------------------------- intake */
  var form = document.getElementById('intake');
  if (!form) return;

  var fstatus = document.getElementById('formStatus');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setErr(id, message) {
    var input = document.getElementById(id);
    var err = document.getElementById(id + 'Err');
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (err) err.textContent = message || '';
    return !message;
  }

  ['name', 'email', 'msg'].forEach(function (id) {
    var input = document.getElementById(id);
    if (input) input.addEventListener('input', function () { setErr(id, ''); });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var ok = true;
    if (!form.elements.name.value.trim()) ok = setErr('name', 'A name, so I know who I am writing to.') && ok;
    else setErr('name', '');
    if (!form.elements.email.value.trim()) ok = setErr('email', 'An email address is needed for the reply.') && ok;
    else if (!emailRe.test(form.elements.email.value.trim())) ok = setErr('email', 'That address looks incomplete.') && ok;
    else setErr('email', '');
    if (form.elements.msg.value.trim().length < 20) ok = setErr('msg', 'A sentence about the sign is enough to start.') && ok;
    else setErr('msg', '');

    if (!ok) {
      fstatus.className = 'form-status show';
      fstatus.textContent = 'The form needs a name, an email address and a line about the sign.';
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var who = form.elements.name.value.trim().split(' ')[0];
    fstatus.className = 'form-status show';
    fstatus.textContent = 'Thank you, ' + who + '. I answer bench enquiries on Tuesdays and Fridays, usually with a request for a photograph of the can and the transformer nameplate. This is a demonstration form in a portfolio template; nothing was transmitted.';
    form.reset();
    ['name', 'email', 'msg'].forEach(function (id) { setErr(id, ''); });
  });
}

  initForm();
})();
