/* =========================================================
   Interactions: loader, scroll-driven sky, reveals,
   hover badge, case-study drawer.
   ========================================================= */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = window.SunsetScene;
  const hasGSAP = typeof window.gsap !== 'undefined';

  if (hasGSAP && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------------- loader ---------------- */
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPct = document.getElementById('loaderPct');

  let shown = 0;
  let fontsDone = false;

  function paintLoader(v) {
    shown = v;
    if (loaderFill) loaderFill.style.width = v.toFixed(1) + '%';
    if (loaderPct) loaderPct.textContent = Math.round(v) + '%';
  }

  function tickLoader() {
    const target = fontsDone ? 100 : 88;
    if (shown < target) {
      paintLoader(Math.min(target, shown + Math.max(0.8, (target - shown) * 0.12)));
    }
    if (shown >= 99.5) {
      paintLoader(100);
      finishLoader();
      return;
    }
    requestAnimationFrame(tickLoader);
  }

  let loaderFinished = false;
  function finishLoader() {
    if (loaderFinished) return;
    loaderFinished = true;
    setTimeout(() => {
      if (loader) loader.classList.add('is-done');
      document.body.classList.add('is-ready');
      playHero();
    }, 260);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { fontsDone = true; });
  } else {
    fontsDone = true;
  }
  // never hold the door longer than a moment
  setTimeout(() => { fontsDone = true; }, 1600);
  setTimeout(() => { finishLoader(); }, 3400);
  paintLoader(0);
  requestAnimationFrame(tickLoader);

  /* ---------------- hero reveal ---------------- */
  function playHero() {
    if (!hasGSAP || reduceMotion) return;
    const items = document.querySelectorAll('.hero [data-reveal]');
    gsap.fromTo(items,
      { y: 26, opacity: 0, filter: 'blur(6px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.25, ease: 'power3.out', stagger: 0.12, delay: 0.1, clearProps: 'filter' }
    );
  }

  /* ---------------- scroll → scene progress ---------------- */
  if (scene) {
    scene.setProgress(0);
    if (hasGSAP && window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => scene.setProgress(self.progress)
      });
      ScrollTrigger.addEventListener('refresh', () => {
        scene.setProgress(ScrollTrigger.maxScroll(window) ? window.scrollY / ScrollTrigger.maxScroll(window) : 0);
      });
    } else {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scene.setProgress(max > 0 ? window.scrollY / max : 0);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---------------- section reveals ---------------- */
  if (hasGSAP && window.ScrollTrigger) {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      if (el.closest('.hero')) return;
      gsap.fromTo(el,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
    });

    // work rows ease in
    document.querySelectorAll('.work').forEach((row, i) => {
      gsap.fromTo(row, { y: 36, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: i * 0.05,
        scrollTrigger: { trigger: row, start: 'top 92%', once: true }
      });
    });

    // nav active state
    document.querySelectorAll('main section, footer').forEach((sec) => {
      const id = sec.id;
      if (!id || id === 'top') return;
      const link = document.querySelector('.nav--left a[href="#' + id + '"]');
      if (!link) return;
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => link.classList.toggle('is-active', self.isActive)
      });
    });
  }

  /* ---------------- cursor badge ---------------- */
  const cursor = document.getElementById('cursor');
  const badge = document.getElementById('badge');
  const tip = document.getElementById('cursorTip');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (canHover && cursor) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let x = mx, y = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    (function loop() {
      x += (mx - x) * 0.16;
      y += (my - y) * 0.16;
      cursor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('.work').forEach((row) => {
      const src = row.querySelector('.work__tooltip');
      row.addEventListener('mouseenter', () => {
        if (tip) tip.textContent = src ? src.textContent : '';
        cursor.classList.add('is-on');
      });
      row.addEventListener('mouseleave', () => cursor.classList.remove('is-on'));
    });
  }

  /* ---------------- case studies ---------------- */
  const CASES = {
    payroll: {
      kicker: 'Case study · 01 / 03',
      title: 'Before the First Paycheck',
      lede: 'Employers own the record. Employees have to sign it. Everything breaks in the gap between those two facts.',
      meta: [
        ['Role', 'Product design &amp; front-end'],
        ['Year', '2024'],
        ['Client', 'U.S. payroll platform'],
        ['Team', '1 PM · 3 engineers · 1 designer']
      ],
      body: `
        <div class="case__section">
          <h4 class="case__h">The problem</h4>
          <p>Onboarding paperwork is signed under pressure, on a phone, in the first week of a job. When something on the form was wrong, the only path was to send it back and start over — new links, new signatures, another two days of an unpaid payroll cycle hanging in the balance.</p>
          <p>Support was absorbing the difference: roughly a third of first-week tickets were corrections to documents that had already been signed.</p>
        </div>
        <div class="case__section">
          <h4 class="case__h">What I did</h4>
          <ul class="case__list">
            <li>Mapped the employer/employee disagreement loop end to end, including the states nobody had drawn yet: correction requested, employer replied, signature stale.</li>
            <li>Designed in-place corrections — edit the field, keep everything else, re-sign only what changed.</li>
            <li>Built the field-level diff and signature validity model with engineering rather than handing over screens and hoping.</li>
            <li>Wrote the error and empty-state copy, then rewrote it again after watching five people fill out their own forms.</li>
            <li>Shipped the front-end for the correction flow, including keyboard and screen-reader paths.</li>
          </ul>
        </div>
        <div class="case__section">
          <h4 class="case__h">Results</h4>
          <div class="case__results">
            <div class="case__result"><strong>15/15</strong><span>tasks completed unaided in moderated testing</span></div>
            <div class="case__result"><strong>−38%</strong><span>first-week correction tickets</span></div>
            <div class="case__result"><strong>2.4×</strong><span>faster time to a valid signature</span></div>
          </div>
        </div>
        <p class="case__foot">Also: the least glamorous work I am proudest of. Nobody photographs a payroll form. Everybody's rent depends on one.</p>
      `
    },
    discovery: {
      kicker: 'Case study · 02 / 03',
      title: 'Organic Discovery',
      lede: 'An expert network with a search box nobody used, and a library of knowledge nobody could find.',
      meta: [
        ['Role', 'Design lead'],
        ['Year', '2023'],
        ['Client', 'Expert network platform'],
        ['Team', '4 engineers · 1 content lead']
      ],
      body: `
        <div class="case__section">
          <h4 class="case__h">The problem</h4>
          <p>The expert library was a dead end: search only worked if you already knew the exact name. Everything else arrived through a salesperson. Four years of conversations were sitting behind a query field with the wrong vocabulary.</p>
        </div>
        <div class="case__section">
          <h4 class="case__h">What I did</h4>
          <ul class="case__list">
            <li>Rebuilt search around Algolia with typo tolerance, synonyms drawn from real support transcripts, and facets that matched how people actually describe expertise.</li>
            <li>Designed a selective programmatic layer: only topics where the library had genuine depth got a landing page, with a quality gate and a human review step.</li>
            <li>Made internal link structure part of the page template instead of an afterthought, so related expertise surfaced naturally.</li>
            <li>Instrumented the funnel so content decisions followed query data, not opinion.</li>
          </ul>
        </div>
        <div class="case__section">
          <h4 class="case__h">Results</h4>
          <div class="case__results">
            <div class="case__result"><strong>4×</strong><span>daily organic traffic</span></div>
            <div class="case__result"><strong>+62%</strong><span>pages per session</span></div>
            <div class="case__result"><strong>1.9s</strong><span>median LCP on landing pages</span></div>
          </div>
        </div>
        <p class="case__foot">The gate mattered more than the automation. Half the candidate topics were rejected, and the traffic grew anyway.</p>
      `
    },
    retail: {
      kicker: 'Case study · 03 / 03',
      title: 'Retail Transformation',
      lede: 'A large retail platform migrating to a responsive front end without losing its brand on the way.',
      soon: true
    },
    resume: {
      kicker: 'Resume',
      title: 'Sunset Valley Studio',
      lede: 'Designer and developer. Ten years spent making complicated products feel obvious — from first sketch to the code that ships.',
      meta: [
        ['Based in', 'Punjab &amp; Hyderabad, India'],
        ['Focus', 'Product design, design systems, front-end'],
        ['Availability', 'Freelance &amp; contract']
      ],
      body: `
        <div class="case__section">
          <h4 class="case__h">Experience</h4>
          <ul class="case__list">
            <li><strong>Independent designer &amp; developer</strong> — 2022 to now. Payroll onboarding, expert-network discovery, retail platform migration, lab tooling.</li>
            <li><strong>Senior product designer, enterprise tools</strong> — 2019 to 2022. Research tooling for life-sciences teams; design system adopted across four product lines.</li>
            <li><strong>Front-end developer, agency</strong> — 2016 to 2019. Shipped marketing sites and web apps, learned to read a brief properly.</li>
          </ul>
        </div>
        <div class="case__section">
          <h4 class="case__h">What I do</h4>
          <ul class="case__list">
            <li>Product &amp; interaction design: flows, prototypes, and the copy that holds them together.</li>
            <li>Design systems: tokens, components, and the documentation people actually read.</li>
            <li>Front-end: semantic HTML, modern CSS, vanilla JS and the usual frameworks when they earn their keep.</li>
            <li>Accessibility as a build requirement, not a retrofit.</li>
          </ul>
        </div>
        <p class="case__foot">Full CV with dates and references on request — <a href="mailto:hello@mirasolis.design" style="color:var(--cream);border-bottom:1px solid rgba(230,222,200,0.3)">hello@mirasolis.design</a></p>
      `
    }
  };

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');
  const modalPanel = modal ? modal.querySelector('.modal__panel') : null;
  let lastFocus = null;

  function caseHTML(c) {
    const meta = (c.meta || []).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    return `
      <p class="case__kicker">${c.kicker}</p>
      <h2 class="case__title" id="modalTitle">${c.title}</h2>
      <p class="case__lede">${c.lede}</p>
      ${meta ? `<dl class="case__meta">${meta}</dl>` : ''}
      ${c.body || ''}
      ${c.soon ? `<p class="case__soon">This one is being written up — ask me about it and I'll talk your ear off.</p>` : ''}
      ${c.soon ? `<p class="case__foot">In the meantime: <a href="mailto:hello@mirasolis.design" style="color:var(--cream);border-bottom:1px solid rgba(230,222,200,0.3)">email me</a> and I'll send the short version.</p>` : ''}
    `;
  }

  function openCase(key) {
    const data = CASES[key];
    if (!data || !modal) return;
    lastFocus = document.activeElement;
    modalContent.innerHTML = caseHTML(data);
    modal.hidden = false;
    modal.scrollTop = 0;
    if (modalPanel) modalPanel.scrollTop = 0;
    document.body.classList.add('is-locked');
    if (cursor) cursor.classList.remove('is-on');
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      const closeBtn = modal.querySelector('.modal__close');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    });
  }

  function closeCase() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(() => {
      modal.hidden = true;
      modalContent.innerHTML = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, 420);
  }

  document.querySelectorAll('.work').forEach((row) => {
    const key = row.dataset.project;
    row.addEventListener('click', () => {
      if (key && CASES[key]) openCase(key);
    });
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (key && CASES[key]) openCase(key);
      }
    });
  });

  document.querySelectorAll('[data-open-case]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openCase(el.dataset.openCase);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeCase);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCase();
  });

  /* ---------------- misc ---------------- */
  if (hasGSAP) {
    // keep ScrollTrigger honest once fonts land
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
