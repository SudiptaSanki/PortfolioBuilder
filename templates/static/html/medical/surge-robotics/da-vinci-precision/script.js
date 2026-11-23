/* AVERY — ROBOTIC SURGERY. Sound ruling: no audio anywhere (see CREDITS.md).
   One data model per instrument: the readouts, bars and printed tables
   are driven from the same numbers, so the page cannot disagree with itself. */
(function(){
  "use strict";
  document.documentElement.classList.add('js');

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces an unhandled InvalidStateError rejection.
     Swallow exactly that, nothing else. */
  window.addEventListener('unhandledrejection', function(e){
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var btn = document.getElementById('menuBtn');
  var panel = document.getElementById('menuPanel');
  if (btn && panel) {
    var links = panel.querySelectorAll('a');
    function openMenu(){
      panel.classList.add('open');
      btn.setAttribute('aria-expanded','true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        if (links.length) links[0].focus();
      });});
    }
    function closeMenu(returnFocus){
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
      if (returnFocus) btn.focus();
    }
    btn.addEventListener('click', function(){
      if (panel.classList.contains('open')) closeMenu(true); else openMenu();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && panel.classList.contains('open')) closeMenu(true);
    });
    links.forEach(function(a){ a.addEventListener('click', function(){ closeMenu(false); }); });
  }

  /* ---------- reveals (opacity only) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && rvEls.length) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    rvEls.forEach(function(el){ io.observe(el); });
  } else {
    rvEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- §01 motion scaling explorer ---------- */
  var RATIO_NOTES = {
    "1": "<strong>1 : 1 — hand and tip move together.</strong> Gross positioning: reaching, retracting, moving the camera. No division and no forgiveness — what your hand does is what the tissue gets.",
    "2": "<strong>2 : 1 — the middle setting.</strong> General dissection in open fields, where structures are large and traverse distance matters more than the last half-millimetre.",
    "3": "<strong>3 : 1 — the fine-work default.</strong> Dissection and reconstruction live here: a third of your hand's travel arrives at the instrument, and the traverse cost is still reasonable.",
    "5": "<strong>5 : 1 — suturing and nerve-sparing territory.</strong> Slow for travel, exact for placement — the setting where tremor filtration earns its keep."
  };
  var range = document.getElementById('handRange');
  if (range) {
    var ratio = 3;
    var handVal = document.getElementById('handVal'),
        tipVal = document.getElementById('tipVal'),
        travelVal = document.getElementById('travelVal'),
        handBar = document.getElementById('handBar'),
        tipBar = document.getElementById('tipBar'),
        handBarVal = document.getElementById('handBarVal'),
        tipBarVal = document.getElementById('tipBarVal'),
        note = document.getElementById('ratioNote');
    function fmt(n){ return n.toFixed(1); }
    function renderScale(){
      var hand = parseFloat(range.value);
      var tip = hand / ratio;
      handVal.textContent = hand;
      tipVal.textContent = fmt(tip);
      travelVal.textContent = Math.round(60 * ratio);
      handBar.style.width = (hand / 60 * 100) + '%';
      tipBar.style.width = (tip / 60 * 100) + '%';
      handBarVal.textContent = fmt(hand) + ' mm';
      tipBarVal.textContent = fmt(tip) + ' mm';
      note.innerHTML = RATIO_NOTES[String(ratio)];
      document.querySelectorAll('#scaleTool + .table-scroll tr[data-row-ratio]').forEach(function(tr){
        tr.classList.toggle('hl', parseFloat(tr.getAttribute('data-row-ratio')) === ratio);
      });
    }
    document.querySelectorAll('.ratio-chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        ratio = parseFloat(chip.getAttribute('data-ratio'));
        document.querySelectorAll('.ratio-chip').forEach(function(c){
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        renderScale();
      });
    });
    range.addEventListener('input', renderScale);
    document.getElementById('handMinus').addEventListener('click', function(){
      range.value = Math.max(5, parseFloat(range.value) - 1); renderScale();
    });
    document.getElementById('handPlus').addEventListener('click', function(){
      range.value = Math.min(60, parseFloat(range.value) + 1); renderScale();
    });
    renderScale();
  }

  /* ---------- §02 error budget ---------- */
  var wcVal = document.getElementById('wcVal');
  if (wcVal) {
    var rssVal = document.getElementById('rssVal');
    function renderBudget(){
      var wc = 0, sq = 0;
      document.querySelectorAll('.comp-chip').forEach(function(chip){
        if (chip.getAttribute('aria-pressed') === 'true') {
          var v = parseFloat(chip.getAttribute('data-val'));
          wc += v; sq += v * v;
        }
      });
      wcVal.textContent = wc.toFixed(2);
      rssVal.textContent = Math.sqrt(sq).toFixed(2);
    }
    document.querySelectorAll('.comp-chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        renderBudget();
      });
    });
    renderBudget();
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById('inType');
    var wanted = params.get('type');
    if (wanted && typeSel) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
      }
    }
    function field(id){ return document.getElementById(id); }
    function setInvalid(wrapId, input, bad){
      var w = field(wrapId);
      if (w) w.classList.toggle('invalid', bad);
      if (input) input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    }
    ['inName','inEmail','inMsg'].forEach(function(id){
      var el = field(id);
      if (el) el.addEventListener('input', function(){
        var wrap = { inName:'f-name', inEmail:'f-email', inMsg:'f-msg' }[id];
        field(wrap).classList.remove('invalid');
        el.removeAttribute('aria-invalid');
      });
    });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = field('inName'), email = field('inEmail'), msg = field('inMsg');
      var ok = true;
      ok = setInvalid('f-name', name, !name.value.trim()) && ok;
      ok = setInvalid('f-email', email, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
      ok = setInvalid('f-msg', msg, msg.value.trim().length < 10) && ok;
      if (!ok) {
        var firstBad = form.querySelector('.field.invalid input, .field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      var s = name.value + '|' + email.value + '|' + msg.value, h = 0;
      for (var j = 0; j < s.length; j++) { h = (h * 31 + s.charCodeAt(j)) >>> 0; }
      document.getElementById('refOut').textContent = 'CA-2026-' + (100 + (h % 900));
      document.getElementById('confirmBox').classList.add('show');
      document.getElementById('confirmBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    var again = document.getElementById('sendAnother');
    if (again) again.addEventListener('click', function(){
      form.reset();
      document.getElementById('confirmBox').classList.remove('show');
      form.querySelectorAll('.field.invalid').forEach(function(f){ f.classList.remove('invalid'); });
      field('inName').focus();
    });
  }
})();
