/* The vessel at the end of the pipe. Its profile is interpolated between four
   real stages of the making — gather, marver, blow, anneal — and the chapters
   scrolling beside it drive the change. The glow cools as the page advances. */
(function () {
  'use strict';

  var svg = document.getElementById('vessel');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var CX = 180;
  var GROUND = 430;

  var stages = [
    { name: 'gather', base: 106, belly: 142, shoulder: 118, neck: 80, lip: 90, height: 186, foot: 12 },
    { name: 'marver', base: 126, belly: 160, shoulder: 126, neck: 90, lip: 96, height: 268, foot: 16 },
    { name: 'blow', base: 98, belly: 228, shoulder: 170, neck: 80, lip: 126, height: 330, foot: 18 },
    { name: 'anneal', base: 140, belly: 228, shoulder: 188, neck: 78, lip: 148, height: 322, foot: 24 }
  ];

  var current = { base: 106, belly: 142, shoulder: 118, neck: 80, lip: 90, height: 186, foot: 12 };
  var target = current;
  var stageIndex = 0;
  var raf = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var glow = document.getElementById('vessel-glow');
  var ticks = Array.prototype.slice.call(document.querySelectorAll('[data-tick]'));

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function profilePath(p) {
    var y0 = GROUND;
    var y1 = GROUND - p.foot;
    var y2 = GROUND - p.height * 0.30;
    var y3 = GROUND - p.height * 0.58;
    var y4 = GROUND - p.height * 0.80;
    var y5 = GROUND - p.height;
    var wBase = p.base / 2;
    var wBelly = p.belly / 2;
    var wShoulder = p.shoulder / 2;
    var wNeck = p.neck / 2;
    var wLip = p.lip / 2;

    var right = [
      'M' + CX + ' ' + y0,
      'C' + (CX + wBase * 0.55) + ' ' + y0 + ' ' + (CX + wBase) + ' ' + (y1 + 6) + ' ' + (CX + wBase) + ' ' + y1,
      'C' + (CX + wBase) + ' ' + (y1 - 10) + ' ' + (CX + wBelly) + ' ' + (y2 + 26) + ' ' + (CX + wBelly) + ' ' + y2,
      'C' + (CX + wBelly) + ' ' + (y2 - 24) + ' ' + (CX + wShoulder) + ' ' + (y3 + 18) + ' ' + (CX + wShoulder) + ' ' + y3,
      'C' + (CX + wShoulder) + ' ' + (y3 - 18) + ' ' + (CX + wNeck) + ' ' + (y4 + 12) + ' ' + (CX + wNeck) + ' ' + y4,
      'C' + (CX + wNeck) + ' ' + (y4 - 10) + ' ' + (CX + wLip) + ' ' + (y5 + 10) + ' ' + (CX + wLip) + ' ' + y5
    ].join(' ');

    var left = [
      'L' + (CX - wLip) + ' ' + y5,
      'C' + (CX - wLip) + ' ' + (y5 + 10) + ' ' + (CX - wNeck) + ' ' + (y4 - 10) + ' ' + (CX - wNeck) + ' ' + y4,
      'C' + (CX - wNeck) + ' ' + (y4 + 12) + ' ' + (CX - wShoulder) + ' ' + (y3 - 18) + ' ' + (CX - wShoulder) + ' ' + y3,
      'C' + (CX - wShoulder) + ' ' + (y3 + 18) + ' ' + (CX - wBelly) + ' ' + (y2 - 24) + ' ' + (CX - wBelly) + ' ' + y2,
      'C' + (CX - wBelly) + ' ' + (y2 + 26) + ' ' + (CX - wBase) + ' ' + (y1 - 10) + ' ' + (CX - wBase) + ' ' + y1,
      'C' + (CX - wBase) + ' ' + (y1 + 6) + ' ' + (CX - wBase * 0.55) + ' ' + y0 + ' ' + CX + ' ' + y0,
      'Z'
    ].join(' ');

    return right + ' ' + left;
  }

  svg.appendChild(el('line', { x1: CX, y1: 20, x2: CX, y2: GROUND + 26, class: 'vessel-axis' }));
  svg.appendChild(el('line', { x1: 40, y1: GROUND + 24, x2: 320, y2: GROUND + 24, class: 'vessel-foot' }));

  var body = el('path', { class: 'vessel-body', d: profilePath(current) });
  svg.appendChild(body);

  var lip = el('ellipse', { cx: CX, cy: GROUND - current.height, rx: current.lip / 2, ry: 8, class: 'vessel-inner' });
  svg.appendChild(lip);

  var lipBack = el('ellipse', { cx: CX, cy: GROUND - current.height, rx: current.lip / 2, ry: 8, class: 'vessel-inner', opacity: '0.5' });
  svg.appendChild(lipBack);

  function render() {
    body.setAttribute('d', profilePath(current));
    lip.setAttribute('cy', GROUND - current.height);
    lip.setAttribute('rx', current.lip / 2);
    lipBack.setAttribute('cy', GROUND - current.height);
    lipBack.setAttribute('rx', current.lip / 2);
  }

  function animateTo(index) {
    if (index === stageIndex && !raf) return;
    stageIndex = index;
    target = stages[index];
    ticks.forEach(function (tick) {
      tick.classList.toggle('is-on', Number(tick.getAttribute('data-tick')) === index);
    });
    svg.setAttribute('aria-label', 'Silhouette of the vessel at the ' + stages[index].name + ' stage');

    if (reduce) {
      current = { base: target.base, belly: target.belly, shoulder: target.shoulder, neck: target.neck, lip: target.lip, height: target.height, foot: target.foot };
      render();
      return;
    }

    if (raf) cancelAnimationFrame(raf);
    var start = Date.now();
    var from = { base: current.base, belly: current.belly, shoulder: current.shoulder, neck: current.neck, lip: current.lip, height: current.height, foot: current.foot };
    var duration = 760;

    function step() {
      var t = Math.min(1, (Date.now() - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      current = {
        base: lerp(from.base, target.base, eased),
        belly: lerp(from.belly, target.belly, eased),
        shoulder: lerp(from.shoulder, target.shoulder, eased),
        neck: lerp(from.neck, target.neck, eased),
        lip: lerp(from.lip, target.lip, eased),
        height: lerp(from.height, target.height, eased),
        foot: lerp(from.foot, target.foot, eased)
      };
      render();
      if (t < 1) raf = requestAnimationFrame(step);
      else raf = null;
    }
    raf = requestAnimationFrame(step);
  }

  /* chapters decide the stage */
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
  if ('IntersectionObserver' in window && chapters.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateTo(Number(entry.target.getAttribute('data-stage')) || 0);
        }
      });
    }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
    chapters.forEach(function (chapter) { observer.observe(chapter); });
  }

  /* the glow cools as the studio is read */
  var duet = document.querySelector('.duet');
  var heat = 1;
  var queued = false;

  function updateHeat() {
    queued = false;
    if (!duet || !glow) return;
    var rect = duet.getBoundingClientRect();
    var span = Math.max(1, rect.height - window.innerHeight * 0.4);
    var progress = Math.min(1, Math.max(0, -rect.top / span));
    heat = 1 - progress * 0.78;
    glow.style.setProperty('--heat', heat.toFixed(3));
  }

  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(updateHeat);
  }, { passive: true });
  window.addEventListener('resize', updateHeat);
  updateHeat();
  render();
  window.__vesselReady = true;
})();
