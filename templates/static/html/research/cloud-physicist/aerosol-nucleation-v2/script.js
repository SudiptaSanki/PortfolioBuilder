/* ============================================================
   VERHOEVEN — CLOUD MICROPHYSICS
   Menu, reveals, the Activation Explorer (teaching model M1),
   the campaign estimator (Table F1) and the enquiry form.
   Sound ruling: FAILS the need-test — no audio anywhere.
   Atmospheric physics is not a sound profession and nothing
   here teaches through audio. The site is silent by design.
   ============================================================ */
(function(){
'use strict';

/* --- View-transition abort guard: a cross-document VT that the
       browser aborts surfaces as an unhandled rejection; it is not
       a page error and the navigation always completes. Swallow
       only that exact rejection. --- */
window.addEventListener('unhandledrejection', function(e){
  var r = e.reason;
  if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
    e.preventDefault();
  }
});

/* --- Mobile menu: the log index panel --- */
var menuBtn = document.getElementById('menuBtn');
var menuPanel = document.getElementById('menuPanel');
if (menuBtn && menuPanel) {
  var lastFocus = null;
  function openMenu(){
    lastFocus = document.activeElement;
    menuPanel.hidden = false;
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        menuPanel.classList.add('open');
        menuBtn.setAttribute('aria-expanded','true');
        document.body.classList.add('locked');
        var first = menuPanel.querySelector('a');
        if (first) first.focus();
      });
    });
  }
  function closeMenu(restore){
    menuPanel.classList.remove('open');
    menuBtn.setAttribute('aria-expanded','false');
    document.body.classList.remove('locked');
    setTimeout(function(){ menuPanel.hidden = true; }, 60);
    if (restore && lastFocus) lastFocus.focus();
  }
  menuBtn.addEventListener('click', function(){
    if (menuPanel.classList.contains('open')) closeMenu(true); else openMenu();
  });
  menuPanel.addEventListener('click', function(e){
    if (e.target.closest('a')) closeMenu(false);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && menuPanel.classList.contains('open')) closeMenu(true);
  });
}

/* --- Reveals: opacity only, reduced-motion safe --- */
var rvEls = document.querySelectorAll('.rv');
if ('IntersectionObserver' in window && rvEls.length) {
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  rvEls.forEach(function(el){ io.observe(el); });
} else {
  rvEls.forEach(function(el){ el.classList.add('in'); });
}

/* --- Activation Explorer — teaching model M1.
       Rule (printed as Table M1 on the page):
       f = (S - S0) * k, capped at 1, floored at 0.
       Droplets = round(f * N), N = 1,000 cm^-3. --- */
var MODEL = {
  salt:    { name:'Sea salt — eager',     s0:0.02, k:2.2,
             note:'Sea salt takes up water eagerly: in the model it starts activating almost as soon as the air is supersaturated, and it is fully active well inside the printed range. Marine air really is dominated by particles that behave this way — which is why clean marine clouds form so readily.' },
  sulfate: { name:'Sulfate — moderate',   s0:0.08, k:1.1,
             note:'Sulfate — the aged, acidic workhorse of continental air — needs a firmer push than sea salt: nothing below its threshold, then a steady climb. Much of the aerosol over land behaves roughly like this class, which is why its spectrum is the one modellers ask for first.' },
  soot:    { name:'Fresh soot — reluctant', s0:0.25, k:0.45,
             note:'Fresh soot is reluctant: most of it stays unactivated across the whole printed range, and none of it moves below its threshold. Ageing and coatings change this in the real atmosphere — the model deliberately leaves that out, and says so.' }
};
var exState = { cls:'sulfate', s:0.35 };
var shClass = document.getElementById('shClass');
if (shClass) {
  var shS = document.getElementById('shS'),
      shThr = document.getElementById('shThr'),
      shWorking = document.getElementById('shWorking'),
      shFrac = document.getElementById('shFrac'),
      shDrop = document.getElementById('shDrop'),
      shNote = document.getElementById('shNote');
  function fmt(n, d){ return n.toFixed(d); }
  function renderExplorer(){
    var m = MODEL[exState.cls], S = exState.s;
    var raw = (S - m.s0) * m.k;
    var f = Math.min(1, Math.max(0, raw));
    var fracPct = Math.round(f * 100);
    var drops = Math.round(f * 1000);
    var work = '(' + fmt(S,2) + ' − ' + fmt(m.s0,2) + ') × ' + m.k + ' = ' + fmt(raw,3);
    if (raw > 1) work += ' → capped at 1.000';
    if (raw < 0) work += ' → floored at 0.000';
    work += '<br>droplets = ' + fmt(f,3) + ' × 1,000 cm⁻³ = ' + drops + ' cm⁻³';
    shClass.textContent = m.name;
    shS.textContent = 'S = ' + fmt(S,2) + '%';
    shThr.textContent = 'S₀ = ' + fmt(m.s0,2) + '% · k = ' + m.k;
    shWorking.innerHTML = work;
    shFrac.textContent = fracPct + '%';
    shDrop.textContent = drops;
    shNote.textContent = m.note;
    document.querySelectorAll('#modelTable tbody tr').forEach(function(tr){
      tr.classList.toggle('sel', tr.getAttribute('data-row') === exState.cls);
    });
  }
  document.querySelectorAll('[data-cls]').forEach(function(btn){
    btn.addEventListener('click', function(){
      exState.cls = btn.getAttribute('data-cls');
      document.querySelectorAll('[data-cls]').forEach(function(b){
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      renderExplorer();
    });
  });
  document.querySelectorAll('[data-s]').forEach(function(btn){
    btn.addEventListener('click', function(){
      exState.s = parseFloat(btn.getAttribute('data-s'));
      document.querySelectorAll('[data-s]').forEach(function(b){
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      renderExplorer();
    });
  });
  renderExplorer();
}

/* --- Campaign estimator — applies the printed Table F1 rates --- */
var estTotal = document.getElementById('estTotal');
if (estTotal) {
  var RATES = { analysis: 1150, mobilisation: 3200 };
  var est = { rate: 1850, rname: 'Chamber days', days: 5, analysis: 4 };
  var daysVal = document.getElementById('daysVal'),
      analysisVal = document.getElementById('analysisVal'),
      estLine1 = document.getElementById('estLine1'),
      estVal1 = document.getElementById('estVal1'),
      estLine2 = document.getElementById('estLine2'),
      estVal2 = document.getElementById('estVal2');
  function eur(n){ return '€' + n.toLocaleString('en-GB'); }
  function renderEst(){
    var v1 = est.days * est.rate, v2 = est.analysis * RATES.analysis;
    daysVal.textContent = est.days;
    analysisVal.textContent = est.analysis;
    estLine1.textContent = est.rname + ' — ' + est.days + ' × ' + eur(est.rate);
    estVal1.textContent = eur(v1);
    estLine2.textContent = 'Analysis & reporting — ' + est.analysis + ' × ' + eur(RATES.analysis);
    estVal2.textContent = eur(v2);
    estTotal.textContent = eur(v1 + v2 + RATES.mobilisation);
  }
  document.querySelectorAll('[data-rate]').forEach(function(btn){
    btn.addEventListener('click', function(){
      est.rate = parseInt(btn.getAttribute('data-rate'), 10);
      est.rname = btn.getAttribute('data-rname');
      document.querySelectorAll('[data-rate]').forEach(function(b){
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      renderEst();
    });
  });
  document.querySelectorAll('[data-step]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var key = btn.getAttribute('data-step'),
          dir = parseInt(btn.getAttribute('data-dir'), 10),
          max = key === 'days' ? 20 : 30,
          min = key === 'days' ? 1 : 0;
      est[key] = Math.min(max, Math.max(min, est[key] + dir));
      renderEst();
    });
  });
  renderEst();
}

/* --- Enquiry form: demonstration only, transmits nothing --- */
var form = document.getElementById('enquiryForm');
if (form) {
  var params = new URLSearchParams(window.location.search);
  var typeSel = document.getElementById('f-type');
  if (typeSel && params.get('type')) {
    for (var i = 0; i < typeSel.options.length; i++) {
      if (typeSel.options[i].value === params.get('type')) { typeSel.selectedIndex = i; break; }
    }
  }
  var fields = {
    name:    { el: document.getElementById('f-name'),    err: document.getElementById('err-name'),
               test: function(v){ return v.trim().length > 1; } },
    email:   { el: document.getElementById('f-email'),   err: document.getElementById('err-email'),
               test: function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
    message: { el: document.getElementById('f-message'), err: document.getElementById('err-message'),
               test: function(v){ return v.trim().length > 9; } }
  };
  function validate(key){
    var f = fields[key], ok = f.test(f.el.value);
    f.el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    f.err.classList.toggle('on', !ok);
    return ok;
  }
  Object.keys(fields).forEach(function(key){
    fields[key].el.addEventListener('input', function(){
      if (fields[key].el.getAttribute('aria-invalid') === 'true') validate(key);
    });
  });
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var keys = Object.keys(fields), firstBad = null;
    keys.forEach(function(key){ if (!validate(key) && !firstBad) firstBad = fields[key].el; });
    if (firstBad) { firstBad.focus(); return; }
    var ref = 'AV-2026-' + (100 + Math.floor(Math.random() * 900));
    document.getElementById('confirmRef').textContent = ref;
    document.getElementById('formWrap').hidden = true;
    var confirm = document.getElementById('confirm');
    confirm.hidden = false;
    confirm.querySelector('h3').focus();
  });
  var again = document.getElementById('againBtn');
  if (again) again.addEventListener('click', function(){
    form.reset();
    Object.keys(fields).forEach(function(key){
      fields[key].el.setAttribute('aria-invalid', 'false');
      fields[key].err.classList.remove('on');
    });
    document.getElementById('confirm').hidden = true;
    document.getElementById('formWrap').hidden = false;
    document.getElementById('f-name').focus();
  });
}
})();
