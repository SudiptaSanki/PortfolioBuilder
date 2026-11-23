/* Ashworth Solicitors: interactions.
   Sound ruling: NONE. This profession's product is careful writing;
   audio would be costume, not information. No web-audio calls, no
   audio files — the stub's generic template script was deleted and
   rebuilt around the one interaction this trade earns: the Matter
   Planner, whose figures are the printed fee table's figures. */
(function () {
  'use strict';

  /* View-transition abort guard: when Chrome aborts a cross-document
     view transition it surfaces as an unhandled InvalidStateError
     rejection. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile matter-index panel ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('indexPanel');
  if (menuBtn && panel) {
    var closePanel = function (refocus) {
      panel.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (refocus) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            var first = panel.querySelector('a');
            if (first) first.focus();
          });
        });
      }
    });
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closePanel(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel(true);
    });
    document.addEventListener('click', function (e) {
      if (panel.classList.contains('open') && !panel.contains(e.target) && !menuBtn.contains(e.target)) {
        closePanel(false);
      }
    });
  }

  /* ---------- reveal on scroll (opacity only) ---------- */
  var rvEls = document.querySelectorAll('.rv');
  if (rvEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      rvEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      rvEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- the Matter Planner ---------- */
  var MATTERS = {
    will: {
      ref: 'MATTER SHEET · WILLS & ESTATE PLANNING',
      title: 'A single will',
      fee: '£240 fixed',
      feeNote: 'Mirror wills for a couple: £390 fixed',
      timescale: '2–3 weeks from instruction to signing, in most cases',
      stages: [
        ['First meeting', 'Your wishes, your family and an outline of what you own. Forty-five minutes, at the office or by video call.'],
        ['Draft prepared', 'A draft will is prepared and sent to you to read at home — nothing is signed on the spot.'],
        ['Amendments agreed', 'Changes are discussed and made; one revision round is included in the fee.'],
        ['Signing appointment', 'The will is signed and witnessed at the office, with two independent witnesses arranged by us.'],
        ['Storage & copy', 'The original is stored in our deed store without charge; a certified copy goes home with you.']
      ],
      provide: [
        'Full names and addresses of your executors and beneficiaries',
        'An outline of your property, accounts and anything jointly owned',
        'Photo ID and proof of address for the identity check'
      ],
      notin: [
        'Inheritance-tax planning beyond the will itself — a separate instruction, quoted in writing first',
        'A home visit for the signing appointment — available at £60'
      ]
    },
    lpa: {
      ref: 'MATTER SHEET · POWERS OF ATTORNEY',
      title: 'Lasting power of attorney',
      fee: '£320 fixed',
      feeNote: 'Both documents prepared together: £560 fixed',
      timescale: 'Drafting 1–2 weeks; registration then takes 8–10 weeks at the Office of the Public Guardian — that part of the clock is theirs, not ours',
      stages: [
        ['First meeting', 'Who you would appoint as attorneys, and how they should be able to act — together, or independently.'],
        ['Draft prepared', 'The document is drafted, including any instructions or preferences you want recorded in it.'],
        ['Certificate step', 'An independent certificate provider confirms that you understand the document and are making it freely.'],
        ['Signing in order', 'The document must be signed in a set order — you, the certificate provider, then your attorneys. We supervise the sequence.'],
        ['Registration', 'We submit the document to the Office of the Public Guardian; it can only be used once it is registered.']
      ],
      provide: [
        'Full names, addresses and dates of birth of your attorneys',
        'The name of your certificate provider, or we can discuss who may act',
        'Photo ID and proof of address for the identity check'
      ],
      notin: [
        'The Office of the Public Guardian’s registration fee — charged at cost, confirmed to you before we submit',
        'Certified copies beyond the first two — £15 each'
      ]
    },
    purchase: {
      ref: 'MATTER SHEET · CONVEYANCING',
      title: 'Buying a house',
      fee: '£1,250 fixed',
      feeNote: 'Freehold purchase at £250,001–£500,000. The bands start at £1,050; leasehold adds £180',
      timescale: '8–12 weeks from instruction to completion in a straightforward chain',
      stages: [
        ['Instruction & checks', 'Conflicts check, identity checks and the file opened; the seller’s solicitor is contacted the same day.'],
        ['Contract & searches', 'The contract pack is reviewed and searches ordered — local authority, drainage and environmental.'],
        ['Enquiries', 'Questions are raised with the seller’s solicitor, and your mortgage offer is checked against the title.'],
        ['Report & exchange', 'We report on the title in plain English; on exchange the deposit is paid and the moving date becomes binding.'],
        ['Completion & registration', 'Funds are transferred, keys are released, and your ownership is registered at the Land Registry.']
      ],
      provide: [
        'Photo ID and proof of address for everyone who is buying',
        'Your mortgage offer, or evidence of funds if you are buying without one',
        'Deposit funds in an account we can trace — source-of-funds checks are a regulatory requirement, not a suspicion'
      ],
      notin: [
        'Search fees and the Land Registry fee — at cost, and itemised for you before exchange',
        'Stamp Duty Land Tax — your tax, not our fee; we calculate it and file the return for you'
      ]
    },
    settlement: {
      ref: 'MATTER SHEET · EMPLOYMENT',
      title: 'Settlement agreement review',
      fee: '£450 fixed',
      feeNote: 'Employers commonly contribute the full amount — the agreement itself states their contribution',
      timescale: 'Appointment within 3 working days; advice meeting and certificate usually complete within a week',
      stages: [
        ['Send the documents', 'After instruction, the draft agreement and your contract reach us by a secure route — not open email.'],
        ['Advice meeting', 'Clause by clause in plain English: what you would be giving up, what the payment is made of, what happens next.'],
        ['Amendments', 'If the terms need changing, one round of amendments is proposed to the employer’s side.'],
        ['Certificate', 'The adviser’s certificate is signed; without it, the agreement cannot take effect.'],
        ['Return & payment date', 'The completed agreement goes back to the employer, with the payment date confirmed to you in writing.']
      ],
      provide: [
        'The draft settlement agreement, exactly as you received it',
        'Your contract of employment, if you have a copy',
        'Photo ID for the identity check'
      ],
      notin: [
        'Negotiating a higher payment beyond one round of amendments — quoted separately if you want it',
        'Bringing a tribunal claim — a different instruction, never bundled into a review'
      ]
    }
  };

  var planBtns = document.querySelectorAll('[data-matter]');
  var sheet = document.getElementById('matterSheet');
  if (sheet && planBtns.length) {
    var el = {
      ref: sheet.querySelector('[data-f="ref"]'),
      title: sheet.querySelector('[data-f="title"]'),
      fee: sheet.querySelector('[data-f="fee"]'),
      feeNote: sheet.querySelector('[data-f="feenote"]'),
      timescale: sheet.querySelector('[data-f="timescale"]'),
      stages: sheet.querySelector('[data-f="stages"]'),
      provide: sheet.querySelector('[data-f="provide"]'),
      notin: sheet.querySelector('[data-f="notin"]'),
      enquire: sheet.querySelector('[data-f="enquire"]')
    };
    var feeRows = document.querySelectorAll('.fee-row[data-matter]');
    var setMatter = function (key) {
      var m = MATTERS[key];
      if (!m) return;
      planBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-matter') === key ? 'true' : 'false');
      });
      el.ref.textContent = m.ref;
      el.title.textContent = m.title;
      el.fee.textContent = m.fee;
      el.feeNote.textContent = m.feeNote;
      el.timescale.textContent = m.timescale;
      el.stages.innerHTML = '';
      m.stages.forEach(function (s) {
        var li = document.createElement('li');
        var t = document.createElement('span');
        t.className = 'st-t'; t.textContent = s[0] + ' — ';
        li.appendChild(t);
        li.appendChild(document.createTextNode(s[1]));
        el.stages.appendChild(li);
      });
      var fill = function (list, items) {
        list.innerHTML = '';
        items.forEach(function (txt) {
          var li = document.createElement('li');
          li.textContent = txt;
          list.appendChild(li);
        });
      };
      fill(el.provide, m.provide);
      fill(el.notin, m.notin);
      el.enquire.setAttribute('href', 'contact.html?matter=' + key);
      feeRows.forEach(function (row) {
        row.classList.toggle('hl', row.getAttribute('data-matter') === key);
      });
    };
    planBtns.forEach(function (b) {
      b.addEventListener('click', function () { setMatter(b.getAttribute('data-matter')); });
    });
    /* register "plan this matter" links reuse the same buttons' data */
    document.querySelectorAll('[data-plan]').forEach(function (a) {
      a.addEventListener('click', function () { setMatter(a.getAttribute('data-plan')); });
    });
    setMatter('will');
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var confirmBox = document.getElementById('confirmBox');
    var fields = {
      name: form.querySelector('#f-name'),
      email: form.querySelector('#f-email'),
      matter: form.querySelector('#f-matter'),
      message: form.querySelector('#f-message')
    };
    /* preselect from ?matter= (planner and register links) */
    var want = new URLSearchParams(window.location.search).get('matter');
    if (want && fields.matter) {
      for (var i = 0; i < fields.matter.options.length; i++) {
        if (fields.matter.options[i].value === want) { fields.matter.selectedIndex = i; break; }
      }
    }
    var mark = function (input, bad) {
      var wrap = input.closest('.field');
      if (wrap) wrap.classList.toggle('invalid', bad);
      input.setAttribute('aria-invalid', bad ? 'true' : 'false');
      return !bad;
    };
    Object.keys(fields).forEach(function (k) {
      fields[k].addEventListener('input', function () { mark(fields[k], false); });
      fields[k].addEventListener('change', function () { mark(fields[k], false); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ok = mark(fields.name, fields.name.value.trim().length < 2) && ok;
      ok = mark(fields.email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.value.trim())) && ok;
      ok = mark(fields.matter, !fields.matter.value) && ok;
      ok = mark(fields.message, fields.message.value.trim().length < 10) && ok;
      if (!ok) {
        var firstBad = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'AS-2026-' + Math.floor(100 + Math.random() * 900);
      confirmBox.querySelector('[data-c="ref"]').textContent = ref;
      confirmBox.querySelector('[data-c="who"]').textContent = fields.name.value.trim();
      confirmBox.querySelector('[data-c="matter"]').textContent =
        fields.matter.options[fields.matter.selectedIndex].text;
      form.style.display = 'none';
      confirmBox.classList.add('show');
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
    var again = document.getElementById('sendAnother');
    if (again) {
      again.addEventListener('click', function () {
        form.reset();
        Object.keys(fields).forEach(function (k) { mark(fields[k], false); });
        confirmBox.classList.remove('show');
        form.style.display = '';
        fields.name.focus();
      });
    }
  }
})();
