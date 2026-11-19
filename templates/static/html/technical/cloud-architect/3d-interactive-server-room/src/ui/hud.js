// hud.js — builds the DOM HUD from config: tour rail, stop panel, machine
// inspector with live specs, audio bar state, and the contact CTA.
// No layout maths for the 3D scene lives here; this module only owns the HTML.

import { PROFILE, STOPS, MACHINES } from '../config/portfolio.js';

const $ = (id) => document.getElementById(id);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

function fmt(v, digits = 1) {
  return Number(v).toFixed(digits);
}

export function createHUD({ onGoStop, onReturn }) {
  // ---------------------------------------------------------------- brand --
  $('brand-hall').textContent = PROFILE.hall;
  $('brand-name').textContent = PROFILE.name;
  $('brand-role').textContent = PROFILE.role;

  // ------------------------------------------------------------ tour rail --
  const rail = $('tour-rail');
  rail.innerHTML =
    `<p class="rail__label">Server Room Tour</p>` +
    STOPS.map((s) => `
      <button class="rail__stop" type="button" data-stop="${s.id}" aria-current="false">
        <span class="rail__n">${s.n}</span>
        <span class="rail__t">${esc(s.title)}</span>
      </button>`).join('') +
    `<p class="rail__hint"><b>Tip</b> · click any rack or the CDU to inspect it</p>`;

  const railButtons = [...rail.querySelectorAll('.rail__stop')];
  railButtons.forEach((b) => b.addEventListener('click', () => {
    const idx = STOPS.findIndex((s) => s.id === b.dataset.stop);
    onGoStop(idx);
  }));

  // ----------------------------------------------------------- stop panel --
  const panel = $('stop-panel');

  function renderStop(i) {
    const s = STOPS[i];
    const facts = s.facts.map(([k, v]) => `<li><span>${esc(k)}</span><b>${esc(v)}</b></li>`).join('');
    let extra = '';
    if (s.timeline) {
      extra += `<div class="stop__timeline">${PROFILE.experience.map((j) => `
        <div class="stop__job">
          <div class="stop__job-top">
            <span class="stop__job-title">${esc(j.title)} · <span style="color:#a9b3bc;font-weight:400">${esc(j.org)}</span></span>
            <span class="stop__job-period">${esc(j.period)}</span>
          </div>
          <span class="stop__job-detail">${esc(j.detail)}</span>
        </div>`).join('')}</div>`;
    }
    const isContact = s.id === 'contact';
    if (isContact) {
      extra += `
        <div class="stop__contact">
          <a class="btn btn--primary" href="${esc(PROFILE.contact.email ? `mailto:${PROFILE.contact.email}` : '#')}">Email me</a>
          <button class="btn btn--ghost" type="button" id="copy-email" data-email="${esc(PROFILE.contact.email)}">Copy address</button>
        </div>
        <p class="stop__hint" style="margin-top:9px">${esc(PROFILE.contact.availability)}</p>`;
    } else {
      extra += `<p class="stop__hint"><b>Tip</b> · click any rack or CDU-01 to open its hardware card</p>`;
    }

    panel.innerHTML = `
      <div class="stop__head">
        <span class="stop__kicker">${esc(s.kicker)}</span>
        <span class="stop__n">${s.n} / ${String(STOPS.length).padStart(2, '0')}</span>
      </div>
      <h2 class="stop__title">${esc(s.title)}</h2>
      <p class="stop__tag">${esc(s.tag)}</p>
      <p class="stop__body">${esc(s.body)}</p>
      <ul class="stop__facts">${facts}</ul>
      ${extra}`;
    panel.scrollTop = 0;

    const copy = panel.querySelector('#copy-email');
    if (copy) {
      copy.addEventListener('click', async () => {
        const email = copy.dataset.email;
        let ok = false;
        try {
          await navigator.clipboard.writeText(email);
          ok = true;
        } catch {
          const ta = document.createElement('textarea');
          ta.value = email;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          ok = document.execCommand('copy');
          ta.remove();
        }
        copy.textContent = ok ? 'Copied ✓' : email;
        setTimeout(() => { copy.textContent = 'Copy address'; }, 2200);
      });
    }
  }

  // ------------------------------------------------------------- inspector --
  const inspector = $('inspector');
  let currentMachine = null;
  let tickTimer = null;

  const specPower = $('spec-power');
  const specCoolant = $('spec-coolant');
  const specLoad = $('spec-load');
  const specLoadBar = $('spec-load-bar');
  const specUptime = $('spec-uptime');

  function paintSpecs(base, jitter = true) {
    const wobble = (v, amp, digits = 1) => fmt(v + (jitter ? (Math.random() - 0.5) * amp : 0), digits);
    specPower.textContent = wobble(base.power, base.power > 30 ? 0.8 : 0.35);
    specCoolant.textContent = wobble(base.coolant, 0.5);
    const load = base.load + (jitter ? Math.round((Math.random() - 0.5) * 4) : 0);
    specLoad.textContent = String(load);
    specLoadBar.style.width = `${Math.min(100, Math.max(2, load))}%`;
    specUptime.textContent = fmt(base.uptime, 3);
  }

  function openMachine(id, { immediate = false } = {}) {
    const m = MACHINES[id];
    if (!m) return false;
    currentMachine = id;
    $('insp-code').textContent = id;
    $('insp-role').textContent = m.role;
    $('insp-kind').textContent = m.kind;
    $('insp-tags').innerHTML = m.tags.map((t) => `<span class="insp__tag">${esc(t)}</span>`).join('');
    $('insp-handle').textContent = m.handle;
    paintSpecs(m.specs, !immediate);
    inspector.hidden = false;
    document.body.classList.add('is-inspecting');
    clearInterval(tickTimer);
    tickTimer = setInterval(() => {
      if (!currentMachine) return;
      paintSpecs(MACHINES[currentMachine].specs, true);
    }, 1600);
    $('insp-return').focus({ preventScroll: true });
    return true;
  }

  function closeMachine() {
    currentMachine = null;
    clearInterval(tickTimer);
    tickTimer = null;
    inspector.hidden = true;
    document.body.classList.remove('is-inspecting');
  }

  $('insp-close').addEventListener('click', () => { closeMachine(); onReturn(); });
  $('insp-return').addEventListener('click', () => { closeMachine(); onReturn(); });

  // --------------------------------------------------------------- audio --
  const bar = $('sound-bar');
  const toggle = $('audio-toggle');

  const soundUI = {
    setState(state) {
      bar.dataset.state = state;
      const wins = state === 'running';
      $('audio-on').textContent = wins ? 'Audio On' : 'Power On Audio';
      $('audio-on').disabled = wins;
      $('audio-on').style.opacity = wins ? '0.62' : '';
      if (wins) {
        // collapse the buttons, keep the bar as a small live meter
        $('audio-on').hidden = true;
        $('audio-mute').textContent = 'Mute';
        $('audio-mute').setAttribute('aria-label', 'Mute server room audio');
      }
    },
    hide() { bar.hidden = true; toggle.dataset.show = 'true'; },
    show() { bar.hidden = false; toggle.dataset.show = 'false'; },
  };

  // --------------------------------------------------------------- tour nav --
  let stopIndex = 0;

  function setStop(i, { immediate = false } = {}) {
    stopIndex = i;
    renderStop(i);
    railButtons.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'step' : 'false'));
    if (!immediate) {
      const active = railButtons[i];
      active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    $('nav-n').textContent = STOPS[i].n;
    $('prev-stop').disabled = i === 0;
    $('next-stop').disabled = i === STOPS.length - 1;
    $('next-stop').innerHTML = i === STOPS.length - 1
      ? `Contact ↗` : `<span>Next</span> →`;
  }

  $('prev-stop').addEventListener('click', () => { if (stopIndex > 0) onGoStop(stopIndex - 1); });
  $('next-stop').addEventListener('click', () => {
    if (stopIndex < STOPS.length - 1) onGoStop(stopIndex + 1);
    else document.querySelector('#copy-email')?.focus({ preventScroll: true });
  });

  // -------------------------------------------------------------- overlap API --
  function rects() {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el || el.hidden) return null;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return null;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return null;
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      brand: pick('.brand'),
      rail: pick('.rail'),
      stop: pick('.stop'),
      soundbar: pick('#sound-bar'),
      tournav: pick('.tournav'),
      inspector: pick('#inspector'),
    };
  }

  return {
    setStop,
    openMachine,
    closeMachine,
    soundUI,
    rects,
    get stopIndex() { return stopIndex; },
    get machine() { return currentMachine; },
  };
}
