/* ═══════════════════════════════════════════════════════════════════
   OBSIDIAN ARCHIVE APP — preloader, ScrollTrigger spine, artifacts, modal,
   terminal, HUD. The world (world.js) is driven from here.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
  const isReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══ ARTIFACTS — every photo a verified assets/photos (local copies) URL ══ */
  const U = (id, w) => './assets/photos/' + imgLocal(id);

  const ARTIFACTS = [
    {
      id: 'kepler-bead',
      num: '01',
      name: 'The Kepler Bead',
      kind: 'ORBITAL RELIC',
      year: 'RECOVERED 1968',
      img: U('1462331940025-496dfbfc7564'),
      alt: 'A red-tinted nebula cloud in deep space',
      desc: 'A single lacquered sphere, 22 mm across, found at the exact centre of the slab’s shadow at noon. Painted with pigment that has never been manufactured on record. It is warm at all hours.',
      meta: [
        ['DIAMETER', '22.0 mm'],
        ['MASS', '44.6 g'],
        ['TEMPERATURE', '36.7 °C — CONSTANT'],
        ['STORAGE', 'VAULT B / GLASS 3'],
      ],
    },
    {
      id: 'meridian-plate',
      num: '02',
      name: 'Meridian Plate',
      kind: 'SATELLITE HULL',
      year: 'RECOVERED 1974',
      img: U('1446776811953-b23d57bd21aa'),
      alt: 'Earth seen from orbit with a satellite in frame',
      desc: 'A section of hull, scorched on one face only, from a craft no agency claims. The scorch pattern repeats the 1 : 4 : 9 ratio eleven times across the surface, each repetition more exact.',
      meta: [
        ['DIMENSIONS', '412 × 412 mm'],
        ['ALLOY', 'UNKNOWN / Fe-Ni'],
        ['SCORCH RATIO', '1 : 4 : 9 ×11'],
        ['STORAGE', 'VAULT A / RACK 9'],
      ],
    },
    {
      id: 'terra-journal',
      num: '03',
      name: 'The Terra Journal',
      kind: 'DOCUMENT',
      year: 'RECOVERED 1979',
      img: U('1470071459604-3b5ec3a7fe05'),
      alt: 'A sunlit green headland above a winding valley road',
      desc: 'One hundred and forty pages of survey notes, the last forty written in a hand that does not match the first hundred. The final entry reads, in full: “It was here before the ground was.”',
      meta: [
        ['PAGES', '140'],
        ['LANGUAGE', 'EN / FR / —'],
        ['CONDITION', 'STABLE'],
        ['STORAGE', 'FLAT FILE 12'],
      ],
    },
    {
      id: 'night-signal',
      num: '04',
      name: 'Night Signal Tape',
      kind: 'RECORDING',
      year: 'RECOVERED 1983',
      img: U('1520034475321-cbe63696469a'),
      alt: 'A star field above a silhouetted horizon',
      desc: 'Six hours of magnetic tape. Playable for ninety seconds before the head clogs. The audible portion is a single voice counting upward — it has never reached the same number twice.',
      meta: [
        ['LENGTH', '6 h 04 m'],
        ['PLAYABLE', '90 s'],
        ['ORIGIN', 'STATION 9'],
        ['STORAGE', 'VAULT C / DECK 2'],
      ],
    },
    {
      id: 'vantage-print',
      num: '05',
      name: 'Vantage Print No. 4',
      kind: 'PHOTOGRAPH',
      year: 'RECOVERED 1991',
      img: U('1518005020951-eccb494ad742'),
      alt: 'A white curved building against a blue sky',
      desc: 'The only known photograph taken from inside the exclusion zone during the second survey. The building it shows has never existed. The negative is older than the film stock.',
      meta: [
        ['MEDIUM', 'SILVER GELATIN'],
        ['DIMENSIONS', '508 × 406 mm'],
        ['NEGATIVE', 'PRE-DATES STOCK'],
        ['STORAGE', 'FLAT FILE 03'],
      ],
    },
    {
      id: 'cetacea-chart',
      num: '06',
      name: 'Cetacea Chart',
      kind: 'STAR CHART',
      year: 'RECOVERED 2004',
      img: U('1502134249126-9f3755a50d78'),
      alt: 'A violet Milky Way arc above dark mountains',
      desc: 'A chart of eighty-four stars, sixty of them joined by hand in red ink. The figure they form has no name in any catalogue, but every surveyor who has seen it has described it the same way: patient.',
      meta: [
        ['STARS', '84'],
        ['LINES', '60 — RED INK'],
        ['SCALE', '1 : 2 400 000'],
        ['STORAGE', 'TUBE 44'],
      ],
    },
  ];

  /* ═══ preloader ═════════════════════════════════════════════════ */
  const loader = $('#loader');
  const loadBar = $('#loadBar');
  const loadPct = $('#loadPct');
  const loadStatus = $('#loadStatus');
  const STATUS = ['INITIALISING GEOMETRY', 'LOADING DRAWING SET', 'CALIBRATING FOG', 'INKING EDGES', 'OPENING ARCHIVE'];

  function preload() {
    const dur = isReduce ? 0.4 : 2.6;
    const tl = gsap.timeline({
      onComplete() {
        loader.classList.add('done');
        document.body.setAttribute('data-ready', '1');
        setTimeout(() => { loader.style.display = 'none'; }, 1000);
      },
    });
    tl.to({ v: 0 }, {
      v: 100,
      duration: dur,
      ease: 'power2.inOut',
      onUpdate() {
        const v = Math.round(this.targets()[0].v);
        loadBar.style.transform = `scaleX(${v / 100})`;
        loadPct.textContent = String(v).padStart(3, '0');
        loadStatus.textContent = STATUS[Math.min(Math.floor(v / 22), STATUS.length - 1)];
      },
    });
    // hard release
    setTimeout(() => {
      if (!loader.classList.contains('done')) {
        loader.classList.add('done');
        document.body.setAttribute('data-ready', '1');
      }
    }, 6500);
  }

  /* ═══ artifact cards ════════════════════════════════════════════ */
  function buildCards() {
    const grid = $('#artifactGrid');
    grid.innerHTML = ARTIFACTS.map((a, i) => `
      <button class="card" role="listitem" data-idx="${i}" aria-haspopup="dialog" aria-label="Open artifact: ${a.name}">
        <span class="card__frame">
          <img src="${a.img}" alt="${a.alt}" loading="lazy" decoding="async" crossorigin="anonymous" referrerpolicy="no-referrer" />
          <span class="card__bead" aria-hidden="true"></span>
          <span class="card__label"><span class="card__num">${a.num}</span><span class="card__name">${a.name}</span></span>
        </span>
        <span class="card__kind">${a.kind} · ${a.year}</span>
        <span class="card__open">OPEN FILE →</span>
      </button>
    `).join('');
  }

  /* ═══ modal ═════════════════════════════════════════════════════ */
  const modal = $('#modal');
  let modalIdx = 0;

  function openModal(i) {
    modalIdx = ((i % ARTIFACTS.length) + ARTIFACTS.length) % ARTIFACTS.length;
    const a = ARTIFACTS[modalIdx];
    $('#modalImg').src = a.img;
    $('#modalImg').alt = a.alt;
    $('#modalNum').textContent = a.num;
    $('#modalKind').textContent = a.kind;
    $('#modalTitle').textContent = a.name;
    $('#modalYear').textContent = a.year;
    $('#modalDesc').textContent = a.desc;
    $('#modalIdx').textContent = `${a.num} / 0${ARTIFACTS.length}`;
    $('#modalMeta').innerHTML = a.meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('lock');
    $('#modalClose').focus();
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('lock');
  }

  /* ═══ colophon ══════════════════════════════════════════════════ */
  const colophon = $('#colophon');
  function openColophon() {
    colophon.classList.add('open');
    colophon.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('lock');
  }
  function closeColophon() {
    colophon.classList.remove('open');
    colophon.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('lock');
  }

  /* ═══ terminal log ══════════════════════════════════════════════ */
  const termBody = $('#termBody');
  const termLines = [];
  function termStamp(d, h, m, s) {
    return `1987-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  function buildLog() {
    const msgs = [
      'PASS 0 0 2 9 1 — NOMINAL',
      'PASS 0 0 2 9 2 — NOMINAL',
      'PASS 0 0 2 9 3 — OBJECT ROTATED 0.4°',
      'PASS 0 0 3 0 1 — NOMINAL',
      'PASS 0 0 3 0 2 — NO OBJECT AT STATION',
      'PASS 0 0 3 0 3 — OBJECT RETURNED. CLOSER.',
      'PASS 0 0 3 1 7 — SIGNAL RECEIVED 1420.4 MHz',
      'PASS 0 0 3 1 8 — SIGNAL REPEATED. COUNTED.',
      'PASS 0 0 4 0 2 — DUST RISING 0.02 m/s',
      'PASS 0 0 4 0 3 — ECLIPSE PREDICTED 1290 d',
      'PASS 0 0 4 1 1 — DRAWING FOUND ON SITE. WET INK.',
      'PASS 0 0 4 1 2 — INK MATCHES OBJECT WITHIN 0.002 mm',
      'END OF ARCHIVE — BEGIN AGAIN AT 01',
    ];
    let d = 12, h = 3, m = 41, s = 7;
    for (let i = 0; i < msgs.length; i++) {
      termLines.push(`[${termStamp(d, h, m, s)}]  ${msgs[i]}`);
      d += 17; if (d > 28) { d -= 28; m += 3; }
      h = (h + 7) % 24; m = (m + 13) % 60; s = (s + 29) % 60;
    }
    termBody.textContent = termLines.slice(-8).join('\n');
  }
  let logHead = 0;
  function tickLog() {
    if (!termLines.length) return;
    termLines.push(termLines[logHead % termLines.length]);
    logHead++;
    const win = termLines.slice(Math.max(0, logHead - 8), logHead);
    termBody.textContent = win.join('\n');
  }

  /* ═══ HUD tickers ═══════════════════════════════════════════════ */
  const tmPass = $('#tmPass'), tmAlt = $('#tmAlt'), tmVel = $('#tmVel'), tmPer = $('#tmPer'), tmFreq = $('#tmFreq');
  function tickTelemetry() {
    if (tmAlt) {
      tmAlt.textContent = `${(418 + Math.sin(Date.now() / 4000) * 1.8).toFixed(1)} km`;
      tmVel.textContent = `${(7.66 + Math.cos(Date.now() / 5200) * 0.01).toFixed(2)} km/s`;
      tmPer.textContent = `${(11 + Math.sin(Date.now() / 9000) * 0.05).toFixed(2)} s`;
    }
    if (tmFreq) tmFreq.textContent = `${(1420.405 + Math.sin(Date.now() / 3000) * 0.002).toFixed(3)} MHz`;
  }

  const termClock = $('#termClock');
  function tickClock() {
    if (!termClock) return;
    const t = new Date();
    termClock.textContent = [t.getHours(), t.getMinutes(), t.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
  }

  /* ═══ chapter bookkeeping ═══════════════════════════════════════ */
  const chapters = $$('.chap');
  const hudNum = $('#hudNum');
  const railItems = $$('#railList li');
  let active = 0;

  function setActive(i) {
    if (i === active) return;
    active = i;
    hudNum.textContent = String(i + 1).padStart(2, '0');
    railItems.forEach((li, j) => li.classList.toggle('on', j === i));
  }
  railItems.forEach((li) => {
    li.querySelector('button').addEventListener('click', () => {
      const target = chapters[Number(li.querySelector('button').dataset.go)];
      window.scrollTo({ top: target.offsetTop + 10, behavior: isReduce ? 'auto' : 'smooth' });
    });
  });

  /* night/paper theme flip for DOM */
  const body = document.body;
  const bg = $('#bg');
  const grain = $('#grain');
  const vignette = $('#vignette');
  let night = false;
  function setNight(v) {
    if (v === night) return;
    night = v;
    body.classList.toggle('night', v);
    bg.classList.toggle('night', v);
    grain.classList.toggle('night', v);
    vignette.classList.toggle('night', v);
  }

  /* ═══ the spine — one scrubbed timeline across all 13 chapters ══ */
  function buildScroll() {
    const story = $('#story');

    // master progress → world state
    ScrollTrigger.create({
      trigger: story,
      start: 'top top',
      end: 'bottom bottom',
      scrub: isReduce ? false : 0.6,
      onUpdate(self) {
        const p = self.progress * 12; // chapter-space 0..12
        window.MONO && window.MONO.set(p);
        $('#hudProgress').style.transform = `scaleX(${self.progress})`;
        $('#railFill').style.transform = `scaleY(${self.progress})`;
      },
    });

    // per-chapter triggers: active chapter, theme flips, reveals
    chapters.forEach((ch, i) => {
      ScrollTrigger.create({
        trigger: ch,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle(self) { if (self.isActive) setActive(i); },
      });
      // theme: chapters 3+ are night
      if (i >= 2) {
        ScrollTrigger.create({
          trigger: ch,
          start: 'top 62%',
          end: 'bottom 20%',
          onEnter: () => setNight(true),
          onEnterBack: () => setNight(true),
          onLeaveBack: () => setNight(false),
        });
      }
      // copy reveal
      const copy = ch.querySelector('[data-copy], .chap__copy');
      if (copy && !isReduce) {
        const parts = [
          ...(copy.querySelectorAll('.kicker, .title, .body, .meta, .contact__mail, .contact__cols, .terminal')),
        ];
        if (parts.length) {
          gsap.fromTo(parts,
            { y: 44, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1.1,
              stagger: 0.08,
              ease: 'power3.out',
              scrollTrigger: { trigger: ch, start: 'top 70%' },
            });
        }
      }
    });

    // hero copy gentle parallax out
    if (!isReduce) {
      gsap.to('.chap--hero .chap__copy', {
        y: -60,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: '.chap--hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    }
  }

  /* ═══ wiring ════════════════════════════════════════════════════ */
  function wire() {
    buildCards();
    buildLog();

    $('#artifactGrid').addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (card) openModal(Number(card.dataset.idx));
    });
    $('#modalClose').addEventListener('click', closeModal);
    $('[data-close]', modal).addEventListener('click', closeModal);
    $('#modalPrev').addEventListener('click', () => openModal(modalIdx - 1));
    $('#modalNext').addEventListener('click', () => openModal(modalIdx + 1));

    $('#colophonBtn').addEventListener('click', openColophon);
    $('#colophonClose').addEventListener('click', closeColophon);
    $('[data-close-colophon]').addEventListener('click', closeColophon);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(); closeColophon(); }
      if (modal.classList.contains('open')) {
        if (e.key === 'ArrowRight') openModal(modalIdx + 1);
        if (e.key === 'ArrowLeft') openModal(modalIdx - 1);
      }
    });

    window.MONO && window.MONO.onPass((n) => {
      if (tmPass) tmPass.textContent = `0 0 ${String(2 + Math.floor(n / 100)).padStart(1, '0')} ${String(n % 100).padStart(2, '0')} ${String((n * 7) % 10)}`;
    });

    setInterval(() => { tickTelemetry(); tickClock(); tickLog(); }, 1000);
  }

  /* ═══ boot ══════════════════════════════════════════════════════ */
  function boot() {
    wire();
    buildScroll();
    preload();
    setActive(0);
    railItems[0].classList.add('on');
    ScrollTrigger.refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
