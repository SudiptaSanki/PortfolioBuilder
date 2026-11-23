/* Prismatic Mirror — shared bench script.
   Menu, the viewer, the Mirror System Planner, the Commission Estimator,
   and the demonstration enquiry form. No sound, anywhere, by design. */
(function () {
  'use strict';

  /* Cross-document view transitions abort noisily when interrupted;
     the navigation itself always completes. Swallow only that rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Mobile menu ---------------- */
  var menuBtn = document.getElementById('menuBtn');
  var menuPanel = document.getElementById('menuPanel');
  if (menuBtn && menuPanel) {
    menuBtn.addEventListener('click', function () {
      var open = menuPanel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        requestAnimationFrame(function () {
          var first = menuPanel.querySelector('a');
          if (first) first.focus();
        });
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuPanel.classList.contains('open')) {
        menuPanel.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---------------- The viewer (Home) ---------------- */
  var fig = document.getElementById('viewerFig');
  if (fig) {
    var svg = document.getElementById('viewer');
    var cellRot = document.getElementById('cellRot');
    var readout = document.getElementById('turnReadout');
    var turn = 0;
    var tweenId = null;

    function applyTurn() {
      cellRot.setAttribute('transform', 'rotate(' + turn + ')');
      var d = ((turn % 360) + 360) % 360;
      readout.innerHTML = 'Cell turned <strong>' + Math.round(d) + '°</strong>';
      fig.setAttribute('data-turn', String(Math.round(d)));
    }
    function tweenTo(target) {
      if (tweenId) cancelAnimationFrame(tweenId);
      if (reduced) { turn = target; applyTurn(); return; }
      var from = turn, start = null;
      function step(ts) {
        if (!start) start = ts;
        var t = Math.min((ts - start) / 240, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        turn = from + (target - from) * eased;
        applyTurn();
        if (t < 1) tweenId = requestAnimationFrame(step);
      }
      tweenId = requestAnimationFrame(step);
    }
    var fwd = document.getElementById('turnFwd');
    var back = document.getElementById('turnBack');
    if (fwd) fwd.addEventListener('click', function () { tweenTo(turn + 15); });
    if (back) back.addEventListener('click', function () { tweenTo(turn - 15); });

    /* Drag: the cell turns by the angle the pointer travels around the centre. */
    var dragging = false, lastAngle = 0;
    function pointerAngle(e) {
      var r = svg.getBoundingClientRect();
      var x = e.clientX - (r.left + r.width / 2);
      var y = e.clientY - (r.top + r.height / 2);
      return Math.atan2(y, x) * 180 / Math.PI;
    }
    svg.addEventListener('pointerdown', function (e) {
      dragging = true;
      lastAngle = pointerAngle(e);
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    svg.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var a = pointerAngle(e);
      var delta = a - lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      lastAngle = a;
      turn += delta;
      applyTurn();
    });
    function endDrag() { dragging = false; }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { tweenTo(turn + 5); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { tweenTo(turn - 5); e.preventDefault(); }
    });
    applyTurn();
  }

  /* ---------------- Mirror System Planner (Home) ---------------- */
  var plannerOut = document.getElementById('plannerOut');
  if (plannerOut) {
    var sysTwo = document.getElementById('sysTwo');
    var sysThree = document.getElementById('sysThree');
    var angleField = document.getElementById('angleField');
    var angleSel = document.getElementById('angleSel');
    var cellSel = document.getElementById('cellSel');
    var pMath = document.getElementById('plannerMath');
    var pVerdict = document.getElementById('plannerVerdict');
    var pWhy = document.getElementById('plannerWhy');
    var pCell = document.getElementById('plannerCell');
    var system = 'two';

    var CELL_TEXT = {
      dry: '<strong class="term">Cell character — dry cell:</strong> loose lampworked glass, beads and wire tumble as the cell turns. Shapes stay separate, points stay sharp, and no two turns give the same arrangement.',
      oil: '<strong class="term">Cell character — oil cell:</strong> the same elements, suspended in silicone oil, drift for a full minute after a turn. Points soften and trail; the field changes slowly and never repeats. This is the Cartographer\u2019s cell.',
      medallion: '<strong class="term">Cell character — fixed medallion cell:</strong> one fused glass medallion, made once and fixed. The image is identical at every turn — only its rotation changes. The honest opposite of chance, and the right cell when a field must be exact.'
    };
    function fmtAngle(x) {
      var v = Math.round(x * 10) / 10;
      return (v % 1 === 0 ? String(Math.round(v)) : String(v)) + '°';
    }
    function pointsFor(m) { return m % 2 === 0 ? m : 2 * m; }

    function renderPlanner() {
      pCell.innerHTML = CELL_TEXT[cellSel.value];
      if (system === 'three') {
        angleField.hidden = true;
        pMath.innerHTML = 'Three mirrors at 60° / 60° / 60° form a closed triangle; each mirror reflects the other two, and the reflections do not stop.';
        pVerdict.textContent = 'Field: no point count — a hexagonal repeat that runs to the edge of the glass.';
        pVerdict.classList.remove('bad');
        pWhy.textContent = 'There is no centre and no join to close, so the two-mirror relation does not apply, and the planner will not borrow its numbers. This is the system in Hexfield, Case File 2.';
        return;
      }
      angleField.hidden = false;
      var theta = parseFloat(angleSel.value, 10);
      var m = 360 / theta;
      var whole = Math.abs(m - Math.round(m)) < 1e-9;
      if (whole) {
        var mi = Math.round(m);
        var pts = pointsFor(mi);
        pMath.innerHTML = '360° ÷ ' + theta + '° = <strong>' + mi + ' sectors exactly</strong> — the pattern closes.';
        pVerdict.textContent = 'Field: ' + pts + ' points.';
        pVerdict.classList.remove('bad');
        if (mi % 2 === 0) {
          pWhy.textContent = mi + ' is even, so the object and its mirror image alternate evenly around the field and no point is doubled at the join.' +
            (theta === 30 ? ' This is the system in the viewer above.' : '') +
            (theta === 36 ? ' This is the angle measured in the 1987 parlour scope, Case File 3.' : '');
        } else {
          pWhy.textContent = mi + ' is odd, so the object and its mirror image fall out of step at the join and the eye reads them in pairs — ' + mi + ' sectors give ' + pts + ' points. Table 1 prints the same rule.';
        }
      } else {
        var lo = Math.floor(m), hi = Math.ceil(m);
        var near = [
          { a: 360 / hi, m: hi },
          { a: 360 / lo, m: lo }
        ].sort(function (x, y) { return Math.abs(x.a - theta) - Math.abs(y.a - theta); });
        pMath.innerHTML = '360° ÷ ' + theta + '° = <strong>' + m.toFixed(2) + ' sectors</strong> — not a whole number.';
        pVerdict.textContent = 'At ' + theta + '° the pattern cannot close — the seam shows.';
        pVerdict.classList.add('bad');
        pWhy.textContent = 'The last image lands out of register and the join doubles a point. The closing angles nearest to ' + theta + '° are ' +
          fmtAngle(near[0].a) + ' (' + near[0].m + ' sectors → ' + pointsFor(near[0].m) + ' points) and ' +
          fmtAngle(near[1].a) + ' (' + near[1].m + ' sectors → ' + pointsFor(near[1].m) + ' points). The bench cuts to a closing angle, or not at all.';
      }
    }
    sysTwo.addEventListener('click', function () {
      system = 'two';
      sysTwo.setAttribute('aria-pressed', 'true');
      sysThree.setAttribute('aria-pressed', 'false');
      renderPlanner();
    });
    sysThree.addEventListener('click', function () {
      system = 'three';
      sysThree.setAttribute('aria-pressed', 'true');
      sysTwo.setAttribute('aria-pressed', 'false');
      renderPlanner();
    });
    angleSel.addEventListener('change', renderPlanner);
    cellSel.addEventListener('change', renderPlanner);
    renderPlanner();
  }

  /* ---------------- Commission Estimator (Home) ---------------- */
  var estLines = document.getElementById('estLines');
  if (estLines) {
    var baseSel = document.getElementById('baseSel');
    var optOil = document.getElementById('optOil');
    var optDich = document.getElementById('optDich');
    var optEng = document.getElementById('optEng');
    var optCase = document.getElementById('optCase');
    var cellVal = document.getElementById('cellVal');
    var cells = 0;
    function gbp(n) { return '£' + n.toLocaleString('en-GB'); }
    function renderEst() {
      var rows = [];
      var total = 0;
      var opt = baseSel.options[baseSel.selectedIndex];
      var base = parseInt(opt.value, 10);
      rows.push([opt.getAttribute('data-name'), base]); total += base;
      if (optOil.checked) { rows.push(['Oil cell in place of dry', 220]); total += 220; }
      if (optDich.checked) { rows.push(['Dichroic glass set (coated glass)', 160]); total += 160; }
      if (optEng.checked) { rows.push(['Hand-cut engraving', 340]); total += 340; }
      if (optCase.checked) { rows.push(['Fitted oak case', 290]); total += 290; }
      if (cells > 0) { rows.push(['Extra interchangeable cells × ' + cells, cells * 180]); total += cells * 180; }
      var html = '';
      rows.forEach(function (r) {
        html += '<tr><td>' + r[0] + '</td><td class="num">' + gbp(r[1]) + '</td></tr>';
      });
      html += '<tr class="total"><td>Estimate from the printed list</td><td class="num" id="estTotal">' + gbp(total) + '</td></tr>';
      estLines.innerHTML = html;
    }
    [baseSel, optOil, optDich, optEng, optCase].forEach(function (el) {
      el.addEventListener('change', renderEst);
    });
    document.getElementById('cellMinus').addEventListener('click', function () {
      cells = Math.max(0, cells - 1); cellVal.textContent = String(cells); renderEst();
    });
    document.getElementById('cellPlus').addEventListener('click', function () {
      cells = Math.min(3, cells + 1); cellVal.textContent = String(cells); renderEst();
    });
    renderEst();
  }

  /* ---------------- Enquiry form (Contact) ---------------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var fName = document.getElementById('fName');
    var fEmail = document.getElementById('fEmail');
    var fMsg = document.getElementById('fMsg');
    var eName = document.getElementById('eName');
    var eEmail = document.getElementById('eEmail');
    var eMsg = document.getElementById('eMsg');
    var confirmBox = document.getElementById('confirmBox');
    var confirmRef = document.getElementById('confirmRef');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      if (fName.value.trim().length < 2) { eName.textContent = 'Please give your name — the bench book is kept by name.'; ok = false; } else { eName.textContent = ''; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fEmail.value.trim())) { eEmail.textContent = 'That email does not read as complete — check it and try again.'; ok = false; } else { eEmail.textContent = ''; }
      if (fMsg.value.trim().length < 10) { eMsg.textContent = 'A few words about the piece — ten characters at least, so the bench knows where to begin.'; ok = false; } else { eMsg.textContent = ''; }
      if (!ok) { confirmBox.hidden = true; return; }
      var ref = 'WK-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
      confirmRef.textContent = ref;
      confirmBox.hidden = false;
      confirmBox.focus();
      confirmBox.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    });
  }
})();
