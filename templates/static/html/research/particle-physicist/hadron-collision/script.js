/* hadron-collision — shared script.
   Sound ruling: NO audio anywhere. Particle physics is not a sound
   profession; the stub's Geiger-counter synth was decoration, and
   decoration that makes noise is worse than decoration. See CREDITS.md. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* --- view-transition abort guard --------------------------------
     Cross-document view transitions that get aborted surface as an
     unhandled InvalidStateError rejection. Filter only that case. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* --- mobile menu: the run index --------------------------------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.querySelector('.panel');
  if (btn && panel) {
    var sheet = panel.querySelector('.sheet');
    var closeBtn = panel.querySelector('.close');
    var firstLink = panel.querySelector('.sheet a');
    function openMenu() {
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('locked');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
      });
    }
    function closeMenu() {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('locked');
      btn.focus();
    }
    btn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    var scrim = panel.querySelector('.scrim');
    if (scrim) scrim.addEventListener('click', closeMenu);
    panel.querySelectorAll('.sheet a').forEach(function (a) {
      a.addEventListener('click', function () {
        panel.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('locked');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu();
    });
    if (sheet) sheet.addEventListener('transitionend', function () {});
  }

  /* --- reveal on scroll (opacity only) ----------------------------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* --- event explorer (index) -------------------------------------- */
  var EVENTS = {
    'four-lepton': {
      title: 'Four leptons: a Higgs candidate',
      sub: 'H → ZZ* → 4ℓ · transverse view, schematic',
      look: 'Four charged tracks leave the interaction point and nothing else does. ' +
        'Two stop in the electromagnetic calorimeter — <strong>electrons</strong>, which shower and die there. ' +
        'Two punch through every layer to the muon chambers — <strong>muons</strong>, the only charged particles that can. ' +
        'No jets, no missing energy worth the name. This is the cleanest signature a hadron collider produces.',
      trigger: 'Kept by a <strong>dilepton trigger</strong>: two leptons above threshold at Level-1, confirmed in the ' +
        'high-level trigger. Four-lepton events are so rare and so clean that the trigger keeps essentially every one it sees — ' +
        'the opposite problem from the pileup event below.',
      mass: 'Add the four measured energy–momentum vectors and the combination has an invariant mass. ' +
        'For this schematic event the arithmetic lands at <strong>m(4ℓ) ≈ 125 GeV</strong> — on the Higgs peak in the ' +
        'spectrum below. One pair sits near the Z mass (91 GeV); the other, from the off-shell Z*, is lighter. ' +
        'That pairing is the fingerprint.'
    },
    'top-pair': {
      title: 'Top pair: lepton + jets',
      sub: 't t̄ → b W⁺ · b̄ W⁻ · transverse view, schematic',
      look: 'One <strong>muon</strong> escapes to the outer chambers and one <strong>electron</strong> dies in the ' +
        'electromagnetic calorimeter — the two W bosons decaying leptonically and hadronically. Around them, ' +
        '<strong>four jets</strong>: cones of tracks and calorimeter deposits, two of them tagged as b-jets by a ' +
        'displaced vertex in the tracker. The dashed arrow is <strong>missing transverse energy</strong> — momentum ' +
        'that left no track because a neutrino carried it away.',
      trigger: 'Kept by a <strong>single-muon trigger</strong> (p<sub>T</sub> above roughly 27 GeV in Run 3 menus). ' +
        'One hard, isolated lepton is a cheap thing for the trigger to ask for and a hard thing for ordinary ' +
        'QCD events to fake — which is why lepton-plus-jets is the workhorse top channel.',
      mass: 'There is no single mass peak to point at: the neutrino escapes, so the event is reconstructed ' +
        'kinematically, not summed. Top physics is done with fits and templates, not bumps — a useful reminder ' +
        'that the four-lepton peak is the exception, not the method.'
    },
    'pileup': {
      title: 'Minimum bias: the pileup event',
      sub: 'Soft QCD + pileup · transverse view, schematic',
      look: 'Dozens of soft tracks, small deposits everywhere, nothing hard, nothing rare. This is what almost ' +
        'every crossing looks like — and in Run 3 conditions it is not one collision but <strong>50–60 of them at ' +
        'once</strong>, spread along the beam line (inset). Untangling which tracks belong to which vertex — ' +
        '<strong>pileup</strong> — is half of modern reconstruction.',
      trigger: 'Recorded on a <strong>prescaled minimum-bias trigger</strong>: the machine deliberately keeps only ' +
        'a small, known fraction — of order one crossing in a thousand — because a complete sample of the ordinary ' +
        'is exactly what you need to measure rates, tune simulations and subtract backgrounds.',
      mass: 'No mass, no peak, no paper. But every number in the other two readouts — efficiencies, fake rates, ' +
        'backgrounds — is measured against events like this one. The boring events are the calibration.'
    }
  };
  var tabs = document.querySelectorAll('.evt-tab');
  if (tabs.length) {
    var title = document.getElementById('evt-title');
    var sub = document.getElementById('evt-sub');
    var look = document.getElementById('evt-look');
    var trig = document.getElementById('evt-trigger');
    var mass = document.getElementById('evt-mass');
    var lepWrap = document.getElementById('evt-leptons');
    function selectEvent(key) {
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', t.getAttribute('data-event') === key ? 'true' : 'false'); });
      ['four-lepton', 'top-pair', 'pileup'].forEach(function (k) {
        var g = document.getElementById('evt-' + k);
        if (g) g.style.display = k === key ? '' : 'none';
      });
      var d = EVENTS[key];
      if (d && title) {
        title.textContent = d.title;
        sub.textContent = d.sub;
        look.innerHTML = d.look;
        trig.innerHTML = d.trigger;
        mass.innerHTML = d.mass;
      }
      if (lepWrap) lepWrap.style.display = key === 'four-lepton' ? '' : 'none';
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { selectEvent(t.getAttribute('data-event')); });
    });
    selectEvent('four-lepton');
  }

  /* --- luminosity panel (index) ------------------------------------ */
  var sigChips = document.querySelectorAll('.sig-chip');
  var lumChips = document.querySelectorAll('.lum-chip');
  if (sigChips.length && lumChips.length) {
    var sigma = 55000, lumi = 140;
    var outN = document.getElementById('lumi-n');
    var outEq = document.getElementById('lumi-eq');
    function fmt(n) { return n.toLocaleString('en-GB'); }
    function renderLumi() {
      var n = sigma * lumi;
      if (outN) outN.textContent = fmt(n) + (n === 1 ? ' event' : ' events');
      if (outEq) outEq.innerHTML = 'N = σ × ℒ = <b>' + fmt(sigma) + ' fb</b> × <b>' + fmt(lumi) + ' fb⁻¹</b>';
    }
    sigChips.forEach(function (c) {
      c.addEventListener('click', function () {
        sigChips.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        sigma = parseFloat(c.getAttribute('data-sigma'));
        renderLumi();
      });
    });
    lumChips.forEach(function (c) {
      c.addEventListener('click', function () {
        lumChips.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', 'true');
        lumi = parseFloat(c.getAttribute('data-lumi'));
        renderLumi();
      });
    });
    renderLumi();
  }

  /* --- enquiry form (contact) -------------------------------------- */
  var form = document.getElementById('enquiry');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById('f-type');
    var preset = params.get('type');
    if (typeSel && preset) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === preset) { typeSel.selectedIndex = i; break; }
      }
    }
    function fieldErr(id, msg) {
      var f = document.getElementById(id);
      var e = document.getElementById(id + '-err');
      if (f) f.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (e) { e.textContent = msg || ''; e.classList.toggle('on', !!msg); }
      return !msg;
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = document.getElementById('f-name');
      var email = document.getElementById('f-email');
      var msg = document.getElementById('f-message');
      var ok = true;
      ok = fieldErr('f-name', name.value.trim() ? '' : 'Your name is needed — the log has to say who called.') && ok;
      ok = fieldErr('f-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'That email does not parse. Check it and resend.') && ok;
      ok = fieldErr('f-message', msg.value.trim().length >= 20 ? '' : 'A little more detail — twenty characters at least — so the reply can be useful.') && ok;
      if (!ok) return;
      var h = 0, s = name.value + '|' + email.value + '|' + msg.value;
      for (var j = 0; j < s.length; j++) { h = (h * 31 + s.charCodeAt(j)) % 900; }
      var ref = 'HC-2026-' + (100 + h);
      document.getElementById('confirm-ref').textContent = ref;
      document.getElementById('confirm-name').textContent = name.value.trim();
      form.style.display = 'none';
      var conf = document.getElementById('confirm');
      conf.classList.add('on');
      conf.setAttribute('tabindex', '-1');
      conf.focus();
    });
    var again = document.getElementById('send-another');
    if (again) again.addEventListener('click', function () {
      document.getElementById('confirm').classList.remove('on');
      form.reset();
      form.style.display = '';
      document.getElementById('f-name').focus();
    });
  }
})();
