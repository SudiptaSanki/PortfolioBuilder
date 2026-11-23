/**
 * Meridian Counsel — scroll, parallax, index rail and interactions.
 * ---------------------------------------------------------------------------
 * GSAP + ScrollTrigger + Lenis are vendored under ./vendor and loaded before
 * this module, so the site runs from any static host with no build step.
 * The whole experience degrades to a readable page when reduced motion is
 * requested, and stays usable if the libraries fail to load.
 */

import { site } from './config/portfolio.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGSAP = typeof window.gsap !== 'undefined';
const hasLenis = typeof window.Lenis !== 'undefined';

if (hasGSAP && typeof window.ScrollTrigger !== 'undefined') {
  window.gsap.registerPlugin(window.ScrollTrigger);
}

/* --------------------------------------------------------------- rendering */

const el = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
};

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function renderBasics() {
  document.title = site.brand.title;
  const description = $('meta[name="description"]');
  if (description) description.setAttribute('content', site.brand.description);

  $$('[data-bind="brand.name"]').forEach((node) => (node.textContent = site.brand.name));
  $$('[data-bind="brand.tagline"]').forEach((node) => (node.textContent = site.brand.tagline));
  $$('[data-bind="hero.kicker"]').forEach((node) => {
    const line = node.querySelector('.hero__kicker-line');
    node.innerHTML = '';
    if (line) node.appendChild(line);
    node.appendChild(document.createTextNode(' ' + site.hero.kicker));
  });
  $$('[data-bind="hero.caption"]').forEach((n) => (n.textContent = site.hero.caption));
  $$('[data-bind="hero.credit"]').forEach((n) => (n.textContent = site.hero.credit));
}

function renderHero() {
  const title = $('#hero-title');
  title.innerHTML = site.hero.titleLines
    .map(
      (line) =>
        `<span class="hero__line${line.accent ? ' hero__line--accent' : ''}"><span>${esc(line.text)}</span></span>`
    )
    .join('');

  const meta = $('.hero__meta');
  meta.innerHTML = site.hero.meta
    .map((item) => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`)
    .join('');

  const primary = $('.hero__actions .btn--solid span');
  if (primary) primary.textContent = site.hero.primaryCta.label;
  const secondary = $('.hero__actions .btn--ghost span');
  if (secondary) secondary.textContent = site.hero.secondaryCta.label;
}

function renderRail() {
  const rail = $('#rail');
  rail.innerHTML = site.sections
    .map(
      (section, index) => `
      <button class="rail__item" type="button" data-target="${section.id}"
        aria-current="${index === 0 ? 'true' : 'false'}"
        aria-label="${esc(section.number + ' ' + section.title)}">
        <span class="rail__label">${esc(section.label)}</span>
        <span class="rail__num">${esc(section.number)}</span>
        <span class="rail__tick" aria-hidden="true"></span>
      </button>`
    )
    .join('');
}

function renderCounsel() {
  $('.prose').innerHTML = site.philosophy.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('');
  $('.pull p').textContent = site.philosophy.pullQuote;
  const caption = $('.plate figcaption');
  caption.innerHTML =
    '<span class="plate__dash" aria-hidden="true"></span>' + esc(site.philosophy.plate.caption);
  const plateImage = $('.plate__frame img');
  plateImage.alt = site.philosophy.plate.alt;

  $('.stats').innerHTML = site.philosophy.stats
    .map(
      (stat) =>
        `<div class="stats__item"><dt>${esc(stat.label)}</dt><dd>${esc(stat.value)}</dd></div>`
    )
    .join('');
}

let selectedPractice = site.practice.items[0].id;

function practiceCard(item) {
  const selected = item.id === selectedPractice;
  return `
    <button class="practice-item" type="button" role="tab" id="tab-${item.id}"
      aria-controls="practice-detail" aria-selected="${selected}" data-practice="${item.id}">
      <span class="practice-item__num">${esc(item.number)}</span>
      <span>
        <span class="practice-item__title">${esc(item.title)}</span>
        <span class="practice-item__summary">${esc(item.summary)}</span>
      </span>
      <svg class="practice-item__arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" /></svg>
    </button>`;
}

function practiceDetail(item) {
  const index = site.practice.items.findIndex((entry) => entry.id === item.id) + 1;
  const pad = (n) => String(n).padStart(2, '0');
  return `
    <div class="detail__head">
      <span>${esc(site.practice.detailLabel)}</span>
      <span class="detail__counter">${pad(index)} / ${pad(site.practice.items.length)}</span>
    </div>
    <h3 class="detail__title">${esc(item.title)}</h3>
    <p class="detail__text">${esc(item.detail)}</p>
    <p class="detail__label">Forums</p>
    <ul class="detail__forums">
      ${item.forums
        .map((forum, i) => `<li>${esc(forum)}<span>${pad(i + 1)}</span></li>`)
        .join('')}
    </ul>
    <div class="detail__foot">
      <span class="detail__counsel">Lead counsel · ${esc(item.counsel)}</span>
      <span class="detail__note">${esc(item.note)}</span>
    </div>`;
}

function renderPractice() {
  const list = $('#practice-list');
  const detail = $('#practice-detail');
  list.innerHTML = site.practice.items.map(practiceCard).join('');
  const first = site.practice.items[0];
  detail.innerHTML = practiceDetail(first);
  detail.setAttribute('role', 'tabpanel');
  detail.setAttribute('aria-labelledby', 'tab-' + first.id);
}

function renderMatters() {
  const list = $('#matters-list');
  list.innerHTML = site.matters.items
    .map(
      (matter) => `
      <div class="matter" data-matter="${matter.id}">
        <button class="matter__head" type="button" id="head-${matter.id}"
          aria-expanded="false" aria-controls="panel-${matter.id}" data-toggle="${matter.id}">
          <span class="matter__num">${esc(matter.numeral)}</span>
          <span class="matter__title">${esc(matter.title)}</span>
          <span class="matter__court">${esc(matter.court)}<span class="matter__year">${esc(matter.year)}</span></span>
          <span class="matter__outcome">${esc(matter.outcome)}</span>
          <span class="matter__icon" aria-hidden="true"></span>
        </button>
        <div class="matter__panel" id="panel-${matter.id}" role="region" aria-labelledby="head-${matter.id}">
          <div class="matter__panel-inner">
            <p class="matter__note">${esc(matter.note)}</p>
            <dl class="matter__meta">
              <div><dt>Posture</dt><dd>${esc(matter.posture)}</dd></div>
              <div><dt>Decided</dt><dd>${esc(matter.year)}</dd></div>
              <div><dt>Advocates</dt><dd>${esc(matter.counsel)}</dd></div>
            </dl>
          </div>
        </div>
      </div>`
    )
    .join('');
}

function renderRecord() {
  const { articles, speaking, admissions, clerkships } = site.credentials.groups;

  $('#record-articles').innerHTML = `
    <h3 class="record-group__title">${esc(articles.title)}</h3>
    ${articles.items
      .map(
        (item) => `
      <article class="article">
        <span class="article__year">${esc(item.year)}</span>
        <div>
          <h4 class="article__title">${esc(item.title)}</h4>
          <p class="article__venue">${esc(item.venue)}</p>
          <p class="article__authors">${esc(item.authors)}</p>
        </div>
      </article>`
      )
      .join('')}`;

  $('#record-speaking').innerHTML = `
    <h3 class="record-group__title">${esc(speaking.title)}</h3>
    ${speaking.items
      .map(
        (item) => `
      <div class="speak">
        <span class="speak__year">${esc(item.year)}</span>
        <div>
          <p class="speak__title">${esc(item.title)}</p>
          <p class="speak__venue">${esc(item.venue)}</p>
        </div>
      </div>`
      )
      .join('')}`;

  $('#record-admissions').innerHTML = `
    <h3 class="record-group__title">${esc(admissions.title)}</h3>
    <ul class="chips">
      ${admissions.items.map((item) => `<li class="chip">${esc(item)}</li>`).join('')}
    </ul>`;

  $('#record-clerkships').innerHTML = `
    <h3 class="record-group__title">${esc(clerkships.title)}</h3>
    ${clerkships.items.map((item) => `<p class="clerk">${esc(item)}</p>`).join('')}`;
}

function renderProcess() {
  const list = $('#steps-list');
  list.innerHTML = site.process.steps
    .map(
      (step) => `
      <li class="step">
        <span class="step__num">${esc(step.number)}</span>
        <p class="step__kicker">${esc(step.kicker)}</p>
        <h3 class="step__title">${esc(step.title)}</h3>
        <p class="step__body">${esc(step.body)}</p>
        <span class="step__deliverable">${esc(step.deliverable)}</span>
      </li>`
    )
    .join('');

  $('.process__note').textContent = site.process.footnote;
  const plate = $('.process__plate figcaption');
  plate.innerHTML = '<span class="plate__dash" aria-hidden="true"></span>' + esc(site.process.plate.caption);
  $('.process__plate img').alt = site.process.plate.alt;
}

function renderContact() {
  const emailLink = $('#contact-email');
  emailLink.textContent = site.contact.email;
  emailLink.href = 'mailto:' + site.contact.email;

  $$('[data-bind="contact.phone"]').forEach((node) => {
    node.textContent = site.contact.phone;
    node.setAttribute('href', 'tel:' + site.contact.phoneHref);
  });

  const copyLabel = $('#copy-email span');
  copyLabel.textContent = site.contact.copyLabel;

  $$('.modal__note a, .contact__card-note a, .form-success__body a').forEach((a) => {
    a.textContent = site.contact.email;
    a.href = 'mailto:' + site.contact.email;
  });
}

/* ------------------------------------------------------------- interactions */

let lenis = null;

function setActiveSection(id) {
  $$('.rail__item').forEach((item) => {
    item.setAttribute('aria-current', item.dataset.target === id ? 'true' : 'false');
  });
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const offset = id === 'top' ? 0 : -60;
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate: reduceMotion, duration: reduceMotion ? 0 : 1.15 });
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY + (id === 'top' ? 0 : -60);
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}

function bindRail() {
  const rail = $('#rail');
  rail.addEventListener('click', (event) => {
    const button = event.target.closest('.rail__item');
    if (!button) return;
    scrollToSection(button.dataset.target);
  });

  if (!hasGSAP || typeof window.ScrollTrigger === 'undefined') {
    // Fallback: observe sections without GSAP.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    site.sections.forEach((section) => {
      const node = document.getElementById(section.id);
      if (node) observer.observe(node);
    });

    const pastHero = () => {
      const hero = $('.hero');
      const passed = window.scrollY > (hero ? hero.offsetHeight - 120 : 400);
      rail.classList.toggle('is-visible', passed);
      $('#topbar').classList.toggle('is-solid', passed);
    };
    pastHero();
    window.addEventListener('scroll', pastHero, { passive: true });
    return;
  }

  site.sections.forEach((section) => {
    const node = document.getElementById(section.id);
    if (!node) return;
    window.ScrollTrigger.create({
      trigger: node,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (self.isActive) setActiveSection(section.id);
      }
    });
  });
}

function bindPractice() {
  const list = $('#practice-list');
  const detail = $('#practice-detail');

  function select(id) {
    const item = site.practice.items.find((entry) => entry.id === id);
    if (!item || id === selectedPractice) return;
    selectedPractice = id;
    $$('.practice-item', list).forEach((card) => {
      card.setAttribute('aria-selected', card.dataset.practice === id ? 'true' : 'false');
    });
    detail.setAttribute('aria-labelledby', 'tab-' + id);
    detail.innerHTML = practiceDetail(item);
    if (hasGSAP && !reduceMotion) {
      window.gsap.fromTo(
        detail,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', overwrite: true }
      );
    }
  }

  list.addEventListener('click', (event) => {
    const card = event.target.closest('.practice-item');
    if (card) select(card.dataset.practice);
  });

  list.addEventListener('keydown', (event) => {
    const cards = $$('.practice-item', list);
    const index = cards.indexOf(document.activeElement);
    if (index === -1) return;
    let next = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = cards[(index + 1) % cards.length];
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = cards[(index - 1 + cards.length) % cards.length];
    if (event.key === 'Home') next = cards[0];
    if (event.key === 'End') next = cards[cards.length - 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
    select(next.dataset.practice);
  });
}

function bindMatters() {
  const list = $('#matters-list');

  const setHeight = (panel, open) => {
    if (!hasGSAP || reduceMotion) {
      panel.style.height = open ? 'auto' : '0px';
      return;
    }
    window.gsap.killTweensOf(panel);
    if (open) {
      window.gsap.to(panel, {
        height: 'auto',
        duration: 0.55,
        ease: 'power2.out',
        onComplete: () => {
          panel.style.height = 'auto';
        }
      });
    } else {
      window.gsap.to(panel, { height: 0, duration: 0.45, ease: 'power2.inOut' });
    }
  };

  list.addEventListener('click', (event) => {
    const head = event.target.closest('.matter__head');
    if (!head) return;
    const panel = document.getElementById(head.getAttribute('aria-controls'));
    const willOpen = head.getAttribute('aria-expanded') !== 'true';

    $$('.matter__head', list).forEach((other) => {
      if (other === head) return;
      if (other.getAttribute('aria-expanded') === 'true') {
        other.setAttribute('aria-expanded', 'false');
        setHeight(document.getElementById(other.getAttribute('aria-controls')), false);
      }
    });

    head.setAttribute('aria-expanded', String(willOpen));
    setHeight(panel, willOpen);
  });
}

function bindCopy() {
  const button = $('#copy-email');
  const label = button.querySelector('span');
  const original = site.contact.copyLabel;

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (err) {
        ok = false;
      }
      document.body.removeChild(area);
      return ok;
    }
  }

  button.addEventListener('click', async () => {
    const ok = await copy(site.contact.email);
    label.textContent = ok ? site.contact.copiedLabel : original;
    button.classList.toggle('is-copied', ok);
    window.clearTimeout(button._timer);
    button._timer = window.setTimeout(() => {
      label.textContent = original;
      button.classList.remove('is-copied');
    }, 2200);
  });
}

/* ------------------------------------------------------------------- modal */

const modal = $('#consult-modal');
const modalPanel = $('.modal__panel', modal);
const form = $('#consult-form');
const success = $('#consult-success');
let lastFocus = null;

function setBackgroundInert(inert) {
  const main = $('#main');
  const header = $('#topbar');
  if (inert) {
    main.setAttribute('inert', '');
    header.setAttribute('inert', '');
    $('#rail').setAttribute('inert', '');
  } else {
    main.removeAttribute('inert');
    header.removeAttribute('inert');
    $('#rail').removeAttribute('inert');
  }
}

function openConsult() {
  if (!modal.hidden) return;
  lastFocus = document.activeElement;
  modal.hidden = false;
  setBackgroundInert(true);
  if (lenis) lenis.stop();
  document.documentElement.classList.add('modal-open');
  window.setTimeout(() => {
    const firstField = $('#f-name');
    if (firstField && !success.offsetParent) firstField.focus();
    else modalPanel.focus();
  }, 60);
}

function closeConsult() {
  if (modal.hidden) return;
  modal.hidden = true;
  setBackgroundInert(false);
  if (lenis) lenis.start();
  document.documentElement.classList.remove('modal-open');
  form.hidden = false;
  success.hidden = true;
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
}

function trapFocus(event) {
  if (event.key !== 'Tab' || modal.hidden) return;
  const focusables = $$(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    modal
  ).filter((node) => node.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function bindModal() {
  $$('[data-open-consult]').forEach((button) => button.addEventListener('click', openConsult));
  $$('[data-close-consult]').forEach((button) => button.addEventListener('click', closeConsult));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeConsult();
    else trapFocus(event);
  });
}

function composeMailto(data) {
  const subject = `Consultation request — ${data.matter}`;
  const body = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Matter: ${data.matter}`,
    '',
    data.message || '—',
    '',
    'Sent from the chambers site.'
  ].join('\n');
  return `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function bindForm() {
  const error = $('#form-error');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = {
      name: $('#f-name').value.trim(),
      email: $('#f-email').value.trim(),
      matter: $('#f-matter').value,
      message: $('#f-message').value.trim()
    };

    if (!data.name) {
      error.textContent = 'A name is required.';
      error.hidden = false;
      $('#f-name').focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
      error.textContent = 'A working email address is required.';
      error.hidden = false;
      $('#f-email').focus();
      return;
    }

    error.hidden = true;
    const link = $('#mailto-link');
    link.href = composeMailto(data);
    link.dataset.body = data.message;
    form.hidden = true;
    success.hidden = false;
    if (hasGSAP && !reduceMotion) {
      window.gsap.fromTo(success, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45 });
    }
    link.focus();
  });

  $('#form-back').addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    $('#f-name').focus();
  });

  $('#copy-request').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const label = button.querySelector('span');
    const text = [
      `Name: ${$('#f-name').value.trim()}`,
      `Email: ${$('#f-email').value.trim()}`,
      `Matter: ${$('#f-matter').value}`,
      '',
      $('#f-message').value.trim() || '—'
    ].join('\n');
    const original = label.textContent;
    try {
      await navigator.clipboard.writeText(text);
      label.textContent = 'Copied';
    } catch (err) {
      label.textContent = 'Copy failed';
    }
    window.setTimeout(() => (label.textContent = original), 2200);
  });
}

/* ------------------------------------------------------- motion & scrollfx */

function bindMotion() {
  if (!hasGSAP || typeof window.ScrollTrigger === 'undefined') return;
  const { gsap, ScrollTrigger } = window;

  // Top bar turns solid once the hero is behind it; the rail arrives with it.
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'bottom 92px',
    onEnter: () => {
      $('#topbar').classList.add('is-solid');
      $('#rail').classList.add('is-visible');
    },
    onLeaveBack: () => {
      $('#topbar').classList.remove('is-solid');
      $('#rail').classList.remove('is-visible');
    }
  });

  // The top bar takes the colour of the band it sits over.
  ScrollTrigger.create({
    trigger: '.section--contact',
    start: 'top 71px',
    onEnter: () => $('#topbar').classList.add('is-dark'),
    onLeaveBack: () => $('#topbar').classList.remove('is-dark')
  });

  // Rail colour flips over the dark bands (contact section and interlude).
  ['.section--contact', '.interlude'].forEach((selector) => {
    const node = $(selector);
    if (!node) return;
    ScrollTrigger.create({
      trigger: node,
      start: 'top 62%',
      end: 'bottom 38%',
      onToggle: (self) => {
        const others = $$('.interlude, .section--contact').filter((other) => other !== node);
        const otherActive = others.some((other) => other._stActive);
        node._stActive = self.isActive;
        $('#rail').classList.toggle('is-light', self.isActive || otherActive);
      }
    });
  });

  if (reduceMotion) return;

  // Hero: the photograph settles as the page leaves it.
  gsap.fromTo(
    '.hero__media img',
    { scale: 1.15 },
    {
      scale: 1.04,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    }
  );

  // Title lines rise out of their masks.
  gsap.from($$('.hero__line > span'), {
    yPercent: 115,
    duration: 1.35,
    ease: 'power4.out',
    stagger: 0.12,
    delay: 0.15
  });
  gsap.from(
    ['.hero__kicker', '.hero__lede', '.hero__actions', '.hero__meta', '.hero__foot'],
    { opacity: 0, y: 18, duration: 1.1, ease: 'power3.out', stagger: 0.09, delay: 0.45 }
  );

  // Section headings and their lead-ins.
  $$('.sec-head').forEach((head) => {
    gsap.from(head.children, {
      y: 22,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: { trigger: head, start: 'top 82%', once: true }
    });
  });

  gsap.utils.toArray('[data-reveal]').forEach((node) => {
    gsap.from(node, {
      y: 26,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: node, start: 'top 88%', once: true }
    });
  });

  gsap.utils.toArray('.prose p, .pull, .stats__item, .article, .speak, .step, .contact__row').forEach(
    (node) => {
      gsap.from(node, {
        y: 18,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: node, start: 'top 92%', once: true }
      });
    }
  );

  // Parallax plates.
  gsap.utils.toArray('[data-parallax]').forEach((img) => {
    if (img.closest('.hero__media')) return;
    const frame = img.closest('.plate__frame, .interlude__media, figure, section') || img.parentElement;
    gsap.fromTo(
      img,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
      }
    );
  });

  // The process rail fills as the steps are read.
  const fill = $('#steps-progress');
  if (fill) {
    gsap.fromTo(
      fill,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.steps', start: 'top 72%', end: 'bottom 64%', scrub: true }
      }
    );
  }
}

/* ------------------------------------------------------------------- start */

function init() {
  renderBasics();
  renderHero();
  renderRail();
  renderCounsel();
  renderPractice();
  renderMatters();
  renderRecord();
  renderProcess();
  renderContact();
  bindRail();
  bindPractice();
  bindMatters();
  bindCopy();
  bindModal();
  bindForm();

  if (hasLenis && !reduceMotion) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4
    });
    if (hasGSAP && typeof window.ScrollTrigger !== 'undefined') {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    }
  }

  bindMotion();
  if (hasGSAP && typeof window.ScrollTrigger !== 'undefined') {
    window.ScrollTrigger.refresh();
  }

  document.documentElement.classList.add('is-ready');
  window.__vance = {
    scrollToSection,
    jump: (top) => {
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo(0, top);
    },
    setActiveSection,
    openConsult,
    closeConsult,
    selectPractice: (id) => {
      const card = document.querySelector(`.practice-item[data-practice="${id}"]`);
      if (card) card.click();
    },
    toggleMatter: (id) => {
      const head = document.querySelector(`.matter__head[data-toggle="${id}"]`);
      if (head) head.click();
    },
    sections: site.sections,
    content: site
  };
  window.__vanceReady = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
