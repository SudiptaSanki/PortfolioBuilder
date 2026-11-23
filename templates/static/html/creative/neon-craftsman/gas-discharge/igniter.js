/* The igniter: gas, bore and transformer voltage, with the tube striking when
   the secondary voltage clears the requirement. The hum is the 60 Hz transformer
   note, and it is only made when someone asks for it. */
(function () {
  'use strict';

  var svg = document.getElementById('tube');
  if (!svg) return;

  var hot = svg.querySelector('.tube__hot');
  var glowFilter = document.getElementById('tubeglow');
  var tag = document.getElementById('strike-tag');
  var state = document.getElementById('ignite-state');
  var strikeOut = document.getElementById('strike-v');
  var transformerOut = document.getElementById('transformer');
  var voltage = document.getElementById('voltage');
  var voltageOut = document.getElementById('voltage-out');

  var LENGTH_M = 2.4;
  var LENGTH_FT = LENGTH_M * 3.28084; /* 7.87 ft */

  var gases = {
    ne: { name: 'neon', colour: '#ff3b2f', vpf: 346, note: 'red-orange, the brightest of the four' },
    ar: { name: 'argon', colour: '#a98bff', vpf: 281, note: 'pale lavender; blue when mercury is added' },
    kr: { name: 'krypton', colour: '#dbe6ff', vpf: 400, note: 'silvery white, cooler than neon' },
    xe: { name: 'xenon', colour: '#7fb0ff', vpf: 455, note: 'bluish white, needs the most voltage' }
  };

  var transformerSizes = [2000, 3000, 4000, 5000, 6000, 7500, 9000, 12000, 15000];

  var gas = 'ne';

  function requiredVoltage(key) {
    var raw = LENGTH_FT * gases[key].vpf + 500; /* plus the electrode drop */
    return Math.ceil(raw / 100) * 100;
  }

  function transformerFor(volts) {
    for (var i = 0; i < transformerSizes.length; i += 1) {
      if (transformerSizes[i] >= volts) return transformerSizes[i];
    }
    return transformerSizes[transformerSizes.length - 1];
  }

  function format(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function render() {
    var data = gases[gas];
    var need = requiredVoltage(gas);
    var volts = Number(voltage.value);
    var lit = volts >= need;

    var over = Math.max(0, volts - need);
    var brightness = lit ? Math.min(1, 0.55 + over / 5000) : 0;

    hot.setAttribute('stroke', lit ? data.colour : 'transparent');
    hot.setAttribute('opacity', String(brightness));
    hot.style.filter = 'none';

    tag.textContent = lit ? 'Struck' : 'Below strike';
    tag.classList.toggle('is-live', lit);
    state.textContent = lit
      ? 'Lit — ' + data.name + ', drawing 30 mA'
      : 'Dark — needs ' + format(need) + ' V to strike';
    state.classList.toggle('is-dark', !lit);

    strikeOut.textContent = format(need) + ' V';
    transformerOut.textContent = (transformerFor(need) / 1000).toFixed(transformerFor(need) % 1000 === 0 ? 0 : 1).replace(/\.0$/, '') + ' kV / 30 mA';
    voltageOut.textContent = format(volts) + ' V';

    svg.setAttribute('aria-label', lit
      ? 'A bent tube lit in ' + data.name + ': ' + data.note
      : 'A bent tube, unlit. Raise the voltage above ' + format(need) + ' volts to strike.');

    window.__igniteState = {
      gas: gas,
      volts: volts,
      required: need,
      lit: lit,
      transformer: transformerFor(need)
    };
  }

  document.querySelectorAll('[data-gas]').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('[data-gas]').forEach(function (other) {
        other.classList.remove('is-on');
        other.setAttribute('aria-checked', 'false');
      });
      button.classList.add('is-on');
      button.setAttribute('aria-checked', 'true');
      gas = button.getAttribute('data-gas');
      render();
    });
  });

  voltage.addEventListener('input', render);

  /* --------------------------------------------------------------- hum */
  var hum = document.getElementById('hum');
  var humLabel = document.getElementById('hum-label');
  var audio = null;
  var master = null;
  var oscillators = [];

  function startHum() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      humLabel.textContent = 'No audio here';
      return;
    }
    audio = new Ctx();
    master = audio.createGain();
    master.gain.value = 0;
    master.connect(audio.destination);

    var partials = [
      { f: 60, level: 0.5, type: 'sine' },
      { f: 120, level: 0.16, type: 'triangle' },
      { f: 180, level: 0.06, type: 'sine' }
    ];

    partials.forEach(function (p) {
      var osc = audio.createOscillator();
      var gain = audio.createGain();
      osc.type = p.type;
      osc.frequency.value = p.f;
      gain.gain.value = p.level;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      oscillators.push(osc);
    });

    master.gain.linearRampToValueAtTime(0.06, audio.currentTime + 0.5);
  }

  function stopHum() {
    if (!audio) return;
    var ctx = audio;
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    setTimeout(function () {
      oscillators.forEach(function (osc) { try { osc.stop(); } catch (error) { /* already stopped */ } });
      oscillators = [];
      try { ctx.close(); } catch (error) { /* already closed */ }
      audio = null;
      master = null;
    }, 320);
  }

  hum.addEventListener('click', function () {
    var on = hum.getAttribute('aria-pressed') === 'true';
    if (on) {
      stopHum();
      hum.setAttribute('aria-pressed', 'false');
      humLabel.textContent = 'Transformer hum';
    } else {
      startHum();
      hum.setAttribute('aria-pressed', 'true');
      humLabel.textContent = 'Hum on — 60 Hz';
    }
    window.__humOn = !on;
  });

  render();
  window.__igniterReady = true;
})();
