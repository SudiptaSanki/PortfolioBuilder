/* Kundan Fire — Meera Sethi. Menu, Setting & Stone Planner, enquiry form.
   No sound, no scroll effects: stillness is this template's choice. */
(function () {
  'use strict';

  /* View-transition abort guard: Chrome surfaces an aborted cross-document
     transition as an unhandled rejection; the navigation itself completes. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var menuPanel = document.getElementById('menuPanel');
  if (menuBtn && menuPanel) {
    var setMenu = function (open) {
      menuPanel.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    menuBtn.addEventListener('click', function () {
      setMenu(!menuPanel.classList.contains('open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuPanel.classList.contains('open')) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (menuPanel.classList.contains('open') &&
          !menuPanel.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
        setMenu(false);
      }
    });
  }

  /* ---------- Setting & Stone Planner ----------
     Rates below are the rate card printed on index.html. Keep them identical. */
  var RATES = {
    stonePerCt: { polki: 38000, emerald: 6500, ruby: 8200, pearl: 1150 },
    stoneLabel: { polki: 'polki', emerald: 'emerald', ruby: 'ruby', pearl: 'pearl' },
    sizeCt:     { small: 0.25, medium: 0.50, large: 1.00 },
    goldPerStone: { small: 1.1, medium: 1.8, large: 2.9 },
    labourPerStone: { closed: 850, open: 620, jadau: 1250 },
    settingLabel: { closed: 'closed back', open: 'open back', jadau: 'jadau engraved' },
    goldPerGram: 7450,
    linkingGrams: 6.0
  };
  var fmt = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };

  var segStone = document.getElementById('segStone');
  if (segStone) {
    var state = { stone: 'polki', size: 'medium', count: 9, setting: 'closed' };
    var countOut = document.getElementById('countOut');

    var bindSeg = function (el, key) {
      el.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        state[key] = btn.dataset.stone || btn.dataset.size || btn.dataset.setting;
        Array.prototype.forEach.call(el.querySelectorAll('button'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        render();
      });
    };
    bindSeg(segStone, 'stone');
    bindSeg(document.getElementById('segSize'), 'size');
    bindSeg(document.getElementById('segSetting'), 'setting');

    document.getElementById('countMinus').addEventListener('click', function () {
      if (state.count > 1) { state.count -= 1; render(); }
    });
    document.getElementById('countPlus').addEventListener('click', function () {
      if (state.count < 21) { state.count += 1; render(); }
    });

    function render() {
      var totalCt = state.count * RATES.sizeCt[state.size];
      var stoneCost = totalCt * RATES.stonePerCt[state.stone];
      var goldG = state.count * RATES.goldPerStone[state.size] + RATES.linkingGrams;
      var goldCost = goldG * RATES.goldPerGram;
      var labour = state.count * RATES.labourPerStone[state.setting];
      countOut.textContent = state.count;
      document.getElementById('rStoneLabel').textContent =
        'Stones — ' + RATES.stoneLabel[state.stone] + ', ' + totalCt.toFixed(2) + ' ct in total';
      document.getElementById('rStone').textContent = fmt(stoneCost);
      document.getElementById('rGoldLabel').textContent =
        'Gold, 22k — ' + goldG.toFixed(1) + ' g';
      document.getElementById('rGold').textContent = fmt(goldCost);
      document.getElementById('rLabourLabel').textContent =
        'Setting labour — ' + state.count + (state.count === 1 ? ' stone' : ' stones') + ', ' + RATES.settingLabel[state.setting];
      document.getElementById('rLabour').textContent = fmt(labour);
      document.getElementById('rTotal').textContent = fmt(stoneCost + goldCost + labour);
    }
    render();
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var seq = 0;
    try { seq = parseInt(localStorage.getItem('kf-enquiry-seq') || '0', 10) || 0; } catch (e) { seq = 0; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      if (!name) { document.getElementById('fName').focus(); return; }
      if (!email || email.indexOf('@') < 1) { document.getElementById('fEmail').focus(); return; }
      seq += 1;
      try { localStorage.setItem('kf-enquiry-seq', String(seq)); } catch (err) { /* private mode */ }
      var ref = 'KF-2026-' + String(1000 + seq);
      document.getElementById('cName').textContent = name.split(' ')[0];
      document.getElementById('cEmail').textContent = email;
      document.getElementById('cRef').textContent = ref;
      form.hidden = true;
      var conf = document.getElementById('confirmation');
      conf.hidden = false;
      conf.focus();
    });
  }
})();
