/* Board-Game Storytelling — motion layer
   Rebuilt from scratch for this standalone copy: Lenis smooth scroll, GSAP
   ScrollTrigger timelines, a WebGL "brush" transition for the interlude card,
   draggable stat cards, the accordion play log and the game detail dialog. */
(function () {
  'use strict';

  if (!window.gsap) return;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var Draggable = window.Draggable || null;
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (Draggable) gsap.registerPlugin(Draggable);

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = gsap.utils.clamp;
  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn('[story-log] ' + name + ':', e); }
  }

  /* ---------------------------------------------------------------- helpers */

  function splitChars(el) {
    if (!el) return [];
    var text = el.textContent;
    el.textContent = '';
    var chars = [];
    text.split('').forEach(function (ch) {
      if (ch === ' ') {
        el.appendChild(document.createTextNode(' '));
        return;
      }
      var mask = document.createElement('span');
      mask.className = 'split-char-mask';
      var inner = document.createElement('span');
      inner.className = 'split-char';
      inner.textContent = ch;
      mask.appendChild(inner);
      el.appendChild(mask);
      chars.push(inner);
    });
    return chars;
  }

  function splitWords(el) {
    if (!el) return [];
    var words = el.textContent.split(/\s+/).filter(Boolean);
    el.textContent = '';
    var out = [];
    words.forEach(function (w, i) {
      var mask = document.createElement('span');
      mask.className = 'split-word-mask';
      var inner = document.createElement('span');
      inner.className = 'split-word';
      inner.textContent = w;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      out.push(inner);
    });
    return out;
  }

  function fitToWidth(el, container) {
    if (!el || !container) return function () {};
    var els = Array.isArray(el) ? el : [el];
    var baseW = 0;
    var ratio = 1272 / 446;
    function measure() {
      gsap.set(els, { scaleX: 1, scaleY: 1 });
      var r = els[0].getBoundingClientRect();
      baseW = r.width;
      return r.height;
    }
    var baseH = measure();
    function apply() {
      if (!baseW || !baseH) return;
      var w = container.clientWidth;
      gsap.set(els, { scaleX: w / baseW, scaleY: w / ratio / baseH });
    }
    apply();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        baseH = measure();
        apply();
      });
    }
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { apply(); });
      ro.observe(container);
    }
    return apply;
  }


  function fitFontSize(el, container) {
    if (!el || !container) return;
    function run() {
      el.style.fontSize = '';
      var fs = parseFloat(getComputedStyle(el).fontSize);
      var w = el.getBoundingClientRect().width;
      if (!w || !fs) return;
      el.style.fontSize = (100 * (fs / w)).toFixed(3) + 'cqw';
    }
    run();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
    if (window.ResizeObserver) new ResizeObserver(run).observe(container);
  }

  /* ------------------------------------------------------- smooth scrolling */

  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', function (e) {
      if (ScrollTrigger) ScrollTrigger.update();
      if (e && typeof e.scroll === 'number') lastDirection = e.direction;
    });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  var lastDirection = 0;

  /* ------------------------------------------------------------- roll text */

  safe('rollText', function () {
  gsap.utils.toArray('.Ovagoq_roll').forEach(function (roll) {
    roll.classList.add('Ovagoq_ready');
    var faces = roll.querySelectorAll('.Ovagoq_face');
    if (faces.length < 2) return;
    var top = faces[0];
    var under = faces[1];
    var host = roll.closest('a, button') || roll.parentElement || roll;
    gsap.set(under, { yPercent: 100 });
    var enter = gsap.timeline({ paused: true })
      .to(top, { yPercent: -100, duration: 0.5, ease: 'power3.out' }, 0)
      .to(under, { yPercent: 0, duration: 0.5, ease: 'power3.out' }, 0);
    function play() { enter.timeScale(1).play(); }
    function back() { enter.timeScale(1.4).reverse(); }
    host.addEventListener('mouseenter', play);
    host.addEventListener('mouseleave', back);
    host.addEventListener('focus', play);
    host.addEventListener('blur', back);
  });
  });

  /* ---------------------------------------------------------------- loader */

  var loader = document.querySelector('[data-loader]');
  safe('loader', function () {if (loader) {
    var loaderLogo = loader.querySelector('[data-loader-logo]');
    var strokes = loader.querySelectorAll('[data-loader-strokes] path');
    var fills = loader.querySelectorAll('[data-loader-fills] path');

    Array.prototype.forEach.call(strokes, function (p) {
      var len = 0;
      try { len = p.getTotalLength(); } catch (e) { len = 0; }
      if (len) {
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
      }
    });

    function endLoader() {
      document.documentElement.style.overflow = '';
      if (lenis) lenis.start();
      gsap.set(loader, { autoAlpha: 0 });
      loader.style.display = 'none';
      ScrollTrigger && ScrollTrigger.refresh();
    }

    window.scrollTo(0, 0);
    document.documentElement.style.overflow = 'hidden';
    window.__heroLocked = true;

    if (reduceMotion) {
      gsap.set(loaderLogo, { autoAlpha: 1 });
      gsap.set(fills, { autoAlpha: 1 });
      window.setTimeout(function () {
        window.__heroLocked = false;
        window.dispatchEvent(new Event('hero:reveal'));
        endLoader();
      }, 350);
    } else {
      gsap.set(fills, { autoAlpha: 0 });
      gsap.set(loaderLogo, { autoAlpha: 1 });
      var tl = gsap.timeline({ onComplete: endLoader });
      tl.to(strokes, { strokeDashoffset: 0, duration: 1.5, stagger: 0.035, ease: 'power2.inOut' }, 0)
        .to(fills, { autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: 'power2.out' }, 1.15)
        .to(loaderLogo, { yPercent: -10, autoAlpha: 0, duration: 0.5, ease: 'power2.inOut' }, '+=0.4')
        .to(loader, { yPercent: -118, rotation: -3, duration: 0.95, ease: 'power4.inOut' }, '-=0.3')
        .add(function () {
          window.__heroLocked = false;
          window.dispatchEvent(new Event('hero:reveal'));
        }, '-=0.6');
    }
    loader.addEventListener('transitionend', function () {});
  } else {
    window.__heroLocked = false;
  }
  });

  /* ---------------------------------------------------------------- navbar */

  var navbar = document.querySelector('[data-navbar]');
  var menuButton = document.querySelector('[data-menu-button]');
  var menuContent = document.querySelector('[data-menu-content]');
  var menuItems = document.querySelector('[data-menu-items]');
  var menuBgs = gsap.utils.toArray('[data-menu-content] > ._6qiM_q_navBg');
  var menuLines = gsap.utils.toArray('[data-menu-line]');
  var menuOpen = false;
  var menuTl = null;

  function navTone() {
    if (!navbar) return;
    if (menuOpen) {
      navbar.dataset.tone = 'dark';
      return;
    }
    var y = navbar.offsetHeight / 2;
    var under = document.elementsFromPoint(window.innerWidth / 2, y).filter(function (el) {
      return !navbar.contains(el);
    });
    var toneEl = null;
    for (var i = 0; i < under.length; i++) {
      var found = under[i].closest ? under[i].closest('[data-tone]') : null;
      if (found) { toneEl = found; break; }
    }
    navbar.dataset.tone = (toneEl && toneEl.dataset.tone) || 'dark';
  }

  safe('navbar', function () {if (navbar && menuButton && menuContent && menuItems) {
    gsap.set(menuBgs, { transformOrigin: '100% 0%', rotation: 90 });
    gsap.set(menuLines, { yPercent: 120 });
    gsap.set(menuItems, { autoAlpha: 0 });

    var openMenu = function () {
      menuOpen = true;
      menuButton.classList.add('_6qiM_q_open');
      menuButton.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-label', 'Close menu');
      menuContent.classList.add('_6qiM_q_open');
      menuContent.removeAttribute('inert');
      menuContent.setAttribute('aria-hidden', 'false');
      if (lenis) lenis.stop();
      navbar.dataset.hidden = 'false';
      navTone();
      if (reduceMotion) {
        gsap.set(menuBgs, { rotation: 0 });
        gsap.set(menuLines, { yPercent: 0 });
        gsap.set(menuItems, { autoAlpha: 1 });
        return;
      }
      if (menuTl) menuTl.kill();
      menuTl = gsap.timeline();
      menuTl.to(menuBgs, { rotation: 0, duration: 1.05, stagger: 0.08, ease: 'power4.out' }, 0)
        .set(menuItems, { autoAlpha: 1 }, 0.4)
        .to(menuLines, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: 'expo.out' }, 0.46);
    };

    var closeMenu = function () {
      menuOpen = false;
      menuButton.classList.remove('_6qiM_q_open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open menu');
      menuContent.classList.remove('_6qiM_q_open');
      menuContent.setAttribute('inert', '');
      menuContent.setAttribute('aria-hidden', 'true');
      if (lenis) lenis.start();
      if (reduceMotion) {
        gsap.set(menuBgs, { rotation: 90 });
        gsap.set(menuLines, { yPercent: 120 });
        gsap.set(menuItems, { autoAlpha: 0 });
        navTone();
        return;
      }
      if (menuTl) menuTl.kill();
      menuTl = gsap.timeline({ onComplete: navTone });
      menuTl.to(menuLines, { yPercent: 120, duration: 0.3, stagger: { each: 0.015, from: 'end' }, ease: 'power4.in' })
        .set(menuItems, { autoAlpha: 0 })
        .to(menuBgs, { rotation: 90, duration: 0.6, stagger: { each: 0.06, from: 'end' }, ease: 'power4.in' }, 0.16);
    };

    menuButton.addEventListener('click', function () {
      if (menuOpen) closeMenu(); else openMenu();
    });

    menuItems.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(); });
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) closeMenu();
    });

    if (!reduceMotion && lenis) {
      lenis.on('scroll', function (e) {
        if (menuOpen || !e) return;
        var hide = lastDirection === 1 && e.scroll > 160;
        if (e.scroll <= 160) hide = false;
        navbar.dataset.hidden = String(hide);
        navTone();
      });
    }

    window.addEventListener('scroll', function () { navTone(); }, { passive: true });
    window.setTimeout(navTone, 600);
    window.addEventListener('tone:change', navTone);
  }
  });

  /* ------------------------------------------------------------------ hero */

  var heroStage = document.querySelector('[data-hero-stage]');
  safe('hero', function () {if (heroStage) {
    var heroTitles = gsap.utils.toArray('[data-hero-title]');
    var heroEchoes = gsap.utils.toArray('.q_m67W_titleEcho');
    var heroH1 = heroStage.querySelector('h1');
    var heroBox = document.querySelector('[data-hero-titlebox]');
    var heroTagline = document.querySelector('[data-hero-tagline]');
    var heroIllustration = document.querySelector('[data-hero-illustration]');
    var heroImg = heroIllustration ? heroIllustration.querySelector('img') : null;
    var echoesOffsets = [0.22, 0.42];

    var heroTitleChars = heroTitles.map(function (el) { return splitChars(el); });
    var h1Chars = heroTitleChars[heroTitleChars.length - 1];
    var taglineChars = splitChars(heroTagline);

    gsap.set(heroTitles, { transformOrigin: 'left top' });
    fitToWidth(heroTitles, heroBox);

    var heroTl = gsap.timeline({ paused: true });
    heroTl.to(heroTagline, { opacity: 1, y: 0, duration: 1.1, ease: 'power2.out' })
      .to(taglineChars, { yPercent: 0, duration: 0.9, stagger: 0.012, ease: 'power4.out' }, 0.15)
      .to(h1Chars, { yPercent: 0, duration: 1, stagger: 0.03, ease: 'power4.out' }, '-=0.65')
      .set(heroEchoes, { opacity: 1 });

    if (reduceMotion) {
      gsap.set([heroTagline], { opacity: 1, y: 0 });
    } else {
      gsap.set(heroTagline, { opacity: 0, y: 24 });
      gsap.set(h1Chars, { yPercent: 100 });
      gsap.set(taglineChars, { yPercent: 100 });
      gsap.set(heroEchoes, { opacity: 0 });
      window.addEventListener('hero:reveal', function () {
        heroTl.play();
        ScrollTrigger && ScrollTrigger.refresh();
      });
      if (!loader) heroTl.play();
    }

    if (!reduceMotion && heroImg) {
      gsap.fromTo(heroImg, { yPercent: 0, scale: 1 }, {
        yPercent: 14, scale: 0.94, ease: 'none',
        scrollTrigger: { trigger: heroStage, start: 'top top', end: 'bottom top', scrub: true }
      });
      heroEchoes.forEach(function (el, i) {
        gsap.to(el, {
          y: function () { return heroStage.clientHeight * echoesOffsets[i]; },
          ease: 'none',
          scrollTrigger: {
            trigger: heroStage, start: 'top top', end: 'bottom top',
            scrub: true, invalidateOnRefresh: true
          }
        });
      });
    }

    if (heroIllustration && !reduceMotion) {
      var pointerTo = { x: gsap.quickTo(heroIllustration, 'x', { duration: 0.9, ease: 'power3.out' }), y: gsap.quickTo(heroIllustration, 'y', { duration: 0.9, ease: 'power3.out' }) };
      heroStage.addEventListener('pointermove', function (e) {
        pointerTo.x((e.clientX / window.innerWidth - 0.5) * 18);
        pointerTo.y((e.clientY / window.innerHeight - 0.5) * 12);
      });
      heroStage.addEventListener('pointerleave', function () {
        pointerTo.x(0);
        pointerTo.y(0);
      });
    }
  }
  });


  /* watchdog: never let a stalled timeline keep the page behind the loader */
  function failOpen() {
    document.documentElement.classList.add('tl-fallback');
    document.documentElement.style.overflow = '';
    var l = document.querySelector('[data-loader]');
    if (l) { l.style.display = 'none'; void l.offsetWidth; }
    if (lenis) { try { lenis.start(); } catch (e) {} }
    window.dispatchEvent(new Event('hero:reveal'));
  }
  window.addEventListener('error', function () {
    if (!document.documentElement.classList.contains('tl-fallback')) {
      window.setTimeout(failOpen, 60);
    }
  });
  window.setTimeout(function () {
    var l = document.querySelector('[data-loader]');
    if (l && l.style.display !== 'none' && window.getComputedStyle(l).display !== 'none') failOpen();
  }, 7000);

  /* ---------------------------------------------------------------- portal */

  safe('portalModule', function () {
    var portal = document.querySelector('[data-portal]');
    if (!portal) return;
    var stage = portal.querySelector('[data-portal-stage]');
    var canvas = portal.querySelector('[data-portal-paint]');
    var painting = portal.querySelector('[data-portal-painting]');
    var text = portal.querySelector('[data-portal-text]');
    var cue = portal.querySelector('[data-portal-cue]');
    var track = portal.querySelector('[data-portal-track] > span');
    if (!stage || !painting || !text || !cue || !track) return;

    var words = splitWords(text);
    var isActive = false;
    var hasPainted = false;
    var tone = 'dark';

    var VERT = '#version 300 es\nin vec2 position;\nvoid main() {\n  gl_Position = vec4(position, 0.0, 1.0);\n}';
    var FRAG = '#version 300 es\nprecision highp float;\nuniform vec2 u_view;\nuniform float u_dpr;\nuniform vec4 u_rect;\nuniform float u_spread;\nuniform float u_time;\nuniform vec3 u_paint;\nuniform vec3 u_ink;\nout vec4 color;\n' +
      'float hash(vec2 p) {\n  p = fract(p * vec2(123.34, 456.21));\n  p += dot(p, p + 45.32);\n  return fract(p.x * p.y);\n}\n' +
      'float noise(vec2 p) {\n  vec2 i = floor(p);\n  vec2 f = fract(p);\n  vec2 u = f * f * (3.0 - 2.0 * f);\n  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);\n}\n' +
      'float fbm(vec2 p) {\n  float value = 0.0;\n  float amplitude = 0.5;\n  for (int octave = 0; octave < 4; octave++) {\n    value += amplitude * noise(p);\n    p = p * 2.03 + 17.1;\n    amplitude *= 0.5;\n  }\n  return value;\n}\n' +
      'void main() {\n  vec2 p = vec2(gl_FragCoord.x, u_view.y * u_dpr - gl_FragCoord.y) / u_dpr;\n  vec2 q = p - u_rect.xy;\n  vec2 b = u_rect.zw;\n  vec2 d = abs(q) - b;\n  float s = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);\n  vec2 near = clamp(q, -b, b);\n  vec2 dir = normalize(near / b + (q - near) / max(b.x, b.y));\n  float brush = min(u_spread, 120.0);\n  float lobes = fbm(dir * 1.6 + vec2(u_time * 0.03, u_time * 0.02));\n  float strokes = fbm(dir * 9.0 + 3.1);\n  float bristles = noise(dir * 90.0 + 9.7);\n  float reach = u_spread * (0.55 + 0.75 * lobes) + brush * (0.7 * strokes + 0.12 * bristles);\n  float edge = reach - s;\n  float alpha = smoothstep(-1.2, 1.2, edge);\n  float depth = clamp(edge / max(brush * 0.2, 1.0), 0.0, 1.0);\n  float strand = noise(dir * 260.0 + s * 0.003);\n  alpha *= smoothstep(strand - 0.25, strand + 0.25, depth * 1.6);\n  float rim = (1.0 - smoothstep(0.0, 18.0, edge)) * step(0.0, edge);\n  vec3 tone = mix(u_paint, u_ink, 0.07 * rim);\n  color = vec4(tone * alpha, alpha);\n}';

    function colorOf(name) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace('#', '');
      var h = v.length === 3 ? v.split('').map(function (c) { return c + c; }).join('') : v;
      return [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; });
    }

    function shader(gl, type, src) {
      var s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    function createPaint(el) {
      var gl = null;
      try { gl = el.getContext('webgl2', { premultipliedAlpha: true, antialias: false }); } catch (e) { gl = null; }
      if (!gl) return null;
      var vs = shader(gl, gl.VERTEX_SHADER, VERT);
      var fs = shader(gl, gl.FRAGMENT_SHADER, FRAG);
      var prog = gl.createProgram();
      if (!vs || !fs || !prog) return null;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'position');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var uView = gl.getUniformLocation(prog, 'u_view');
      var uDpr = gl.getUniformLocation(prog, 'u_dpr');
      var uRect = gl.getUniformLocation(prog, 'u_rect');
      var uSpread = gl.getUniformLocation(prog, 'u_spread');
      var uTime = gl.getUniformLocation(prog, 'u_time');
      gl.uniform3fv(gl.getUniformLocation(prog, 'u_paint'), colorOf('--color-azure'));
      gl.uniform3fv(gl.getUniformLocation(prog, 'u_ink'), colorOf('--color-blue'));
      var w = 0;
      var h = 0;
      var dpr = 1;
      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        w = el.clientWidth;
        h = el.clientHeight;
        el.width = Math.max(1, Math.round(w * dpr));
        el.height = Math.max(1, Math.round(h * dpr));
        gl.viewport(0, 0, el.width, el.height);
      }
      resize();
      return {
        resize: resize,
        draw: function (rect, spread, time) {
          gl.uniform2f(uView, w, h);
          gl.uniform1f(uDpr, dpr);
          gl.uniform4f(uRect, rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 2, rect.height / 2);
          gl.uniform1f(uSpread, spread);
          gl.uniform1f(uTime, time);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        },
        clear: function () {
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        },
        destroy: function () {
          gl.deleteBuffer(buf);
          gl.deleteProgram(prog);
          gl.deleteShader(vs);
          gl.deleteShader(fs);
        }
      };
    }

    var paint = createPaint(canvas);
    var zoom = { progress: 0 };
    var spread = { progress: 0 };
    var baseScale = 1;
    var border = 0;

    function applyScale() {
      gsap.set(painting, { scale: Math.pow(baseScale, zoom.progress) });
    }
    function measure() {
      baseScale = 1.04 * Math.max(stage.offsetWidth / painting.offsetWidth, stage.offsetHeight / painting.offsetHeight);
      border = parseFloat(getComputedStyle(painting).borderTopWidth) || 0;
      if (paint) paint.resize();
      applyScale();
    }

    function setTone(next) {
      if (next === tone) return;
      tone = next;
      stage.dataset.tone = next;
      window.dispatchEvent(new Event('tone:change'));
    }

    var painted = false;
    function paintFrame(time) {
      if (!paint || !isActive) return;
      var reach = (spread.progress * Math.hypot(stage.offsetWidth, stage.offsetHeight)) / 0.55;
      if (reach < 0.5) {
        if (painted) paint.clear();
        painted = false;
        setTone('dark');
        return;
      }
      var pr = painting.getBoundingClientRect();
      var sr = stage.getBoundingClientRect();
      var b = (border * pr.width) / (painting.offsetWidth || 1);
      paint.draw({
        x: pr.left - sr.left + b,
        y: pr.top - sr.top + b,
        width: Math.max(1, pr.width - 2 * b),
        height: Math.max(1, pr.height - 2 * b)
      }, reach, time);
      painted = true;
      setTone(0.55 * reach > pr.top - sr.top + b ? 'light' : 'dark');
    }

    measure();
    gsap.ticker.add(paintFrame);

    if (ScrollTrigger) {
      ScrollTrigger.create({
        trigger: portal,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: function (self) { isActive = self.isActive; }
      });

      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: portal,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onRefresh: measure
        }
      });
      tl.to(words, { opacity: 0, duration: 0.08, stagger: { amount: 0.14 }, ease: 'power1.in' }, 0.12)
        .to(spread, { progress: 1, duration: 0.64, ease: 'power2.in' }, 0.26)
        .to(zoom, { progress: 1, duration: 0.6, ease: 'power1.inOut', onUpdate: applyScale }, 0.34)
        .fromTo(track, { scaleX: 0 }, { scaleX: 1, duration: 0.9 }, 0)
        .to(cue, { autoAlpha: 0, y: 12, duration: 0.06, ease: 'power1.in' }, 0.84)
        .to({}, { duration: 0.06 }, 0.94);
    }

    if (reduceMotion) {
      gsap.set(painting, { scale: 1 });
      if (canvas) canvas.style.display = 'none';
    }
  });

  /* --------------------------------------------------- section heading text */

  safe('headingModule', function () {
    var heading = document.querySelector('[data-heading]');
    if (!heading) return;
    var title = heading.querySelector('[data-fit-title]');
    var separator = heading.querySelector('.TQD0cq_separator');
    var description = heading.querySelector('[data-heading-lines]');
    var aside = heading.querySelector('[data-heading-aside]');
    if (title) fitFontSize(title, title.parentElement);
    if (reduceMotion) return;
    var lines = splitWords(description);

    gsap.set(title, { yPercent: 102 });
    gsap.set(separator, { clipPath: 'inset(0 100% 0 0)' });
    gsap.set(lines, { yPercent: 100 });
    if (aside) gsap.set(aside, { clipPath: 'inset(0% 0% 100% 0%)' });

    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
    tl.to(title, { yPercent: 0, duration: 1.2 })
      .to(separator, { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.inOut' }, 0.35)
      .to(lines, { yPercent: 0, duration: 1.1, stagger: 0.03 }, 0.45);
    if (aside) tl.to(aside, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out' }, 0.6);

    var played = false;
    function play() {
      if (played) return;
      played = true;
      tl.play();
    }
    window.addEventListener('hero:reveal', function () {
      window.setTimeout(play, 900);
    });
    if (ScrollTrigger) {
      ScrollTrigger.create({ trigger: heading, start: 'top 80%', once: true, onEnter: play });
    }
    window.setTimeout(play, 6000);
  });

  /* ------------------------------------------------------- featured cards */

  var modal = document.querySelector('[data-modal]');
  var gameData = {
    'quacks': {
      title: 'Quacks', genre: 'Strategy / Family', players: '2-5 Players', playersShort: '2-5',
      image: 'assets/img/quacks.webp', alt: 'Quacks box art', count: '53', sub: 'Push your luck, one ingredient at a time.',
      description: 'Nine ingredients, one bubbling cauldron and a bag of chips you keep reaching into. Every round asks the same question: stop while you are ahead, or risk the explosion for one more ingredient? Nobody has ever answered it well.',
      time: '45-60 min', year: '2024'
    },
    'hot-streak': {
      title: 'Hot Streak', genre: 'Party / Family', players: '2-8+ Players', playersShort: '2-8+',
      image: 'assets/img/hot-streak.webp', alt: 'Hot Streak box art', count: '12', sub: 'A race that keeps flipping the table.',
      description: 'Cards go down, fortunes turn, and the lead changes hands as often as the deck is shuffled. Loud, quick, and best played with people who do not mind losing badly in front of everyone.',
      time: '20 min', year: '2025'
    },
    'catan': {
      title: 'Catan', genre: 'Strategy / Family', players: '3-4 Players', playersShort: '3-4',
      image: 'assets/img/catan.webp', alt: 'Catan box art', count: '18', sub: 'The island that taught everyone to trade.',
      description: 'Wood, wheat, sheep and a long argument about who blocked the harbour. The oldest game on the shelf and still the one that starts the most negotiations across the table.',
      time: '60-90 min', year: '2021'
    },
    'bomb-busters': {
      title: 'Bomb Busters', genre: 'Cooperative / Card Game / Puzzle', players: '2-5 Players', playersShort: '2-5',
      image: 'assets/img/bomb-busters.webp', alt: 'Bomb Busters box art', count: '9', sub: 'Cut the right wire with people you trust.',
      description: 'A cooperative puzzle where the information lives in everyone else\u2019s hand. You cannot say what you know, so the whole table works by hints, gestures and hopeful silences.',
      time: '25 min', year: '2025'
    },
    'magical-athlete': {
      title: 'Magical Athlete', genre: 'Party / Family / Dice', players: '2-6 Players', playersShort: '2-6',
      image: 'assets/img/magical-athlete.webp', alt: 'Magical Athlete box art', count: '21', sub: 'Fantasy sprinters, extremely suspicious dice.',
      description: 'Pick a runner, roll, and watch the race rearrange itself. Short enough to play three times in a night, chaotic enough that the quietest person at the table usually wins.',
      time: '45 min', year: '2023'
    },
    'wavelength': {
      title: 'Wavelength', genre: 'Party', players: '2-8+ Players', playersShort: '2-8+',
      image: 'assets/img/wavelength.webp', alt: 'Wavelength box art', count: '14', sub: 'How hot is cold? How round is a corner?',
      description: 'One player sees a target on a hidden dial and gives a clue. Everyone else argues about where it lands. The game is really about discovering how differently the people you love think.',
      time: '30 min', year: '2022'
    }
  };

  var cards = gsap.utils.toArray('[data-card]');
  cards.forEach(function (card) {
    var paints = gsap.utils.toArray(card.querySelectorAll('.YZMoQq_paint'));
    if (paints.length !== 4 || reduceMotion) return;
    gsap.set(paints, { scaleY: 0, transformOrigin: 'top' });
    gsap.set(card, { color: '#08335d' });
    var tl = gsap.timeline({ paused: true });
    tl.to(paints, { scaleY: 1, duration: 0.32, stagger: 0.045, ease: 'power3.inOut' })
      .to(card, { color: '#f7b538', duration: 0.2 }, '-=0.2');
    var play = function () { tl.timeScale(1).play(); };
    var back = function () { tl.timeScale(1.8).reverse(); };
    card.addEventListener('mouseenter', play);
    card.addEventListener('mouseleave', back);
    card.addEventListener('focus', play);
    card.addEventListener('blur', back);
  });

  safe('cards-reveal', function () {if (!reduceMotion && ScrollTrigger) {
    cards.forEach(function (card) {
      var media = card.querySelector('[data-reveal-media]');
      var img = media && media.querySelector('img');
      var meta = card.querySelector('[data-reveal-meta]');
      if (media) gsap.set(media, { clipPath: 'inset(100% 0% 0% 0%)' });
      if (img) gsap.set(img, { scale: 1.18 });
      if (meta) gsap.set(meta, { yPercent: 60, autoAlpha: 0 });
      if (!media && !meta) gsap.set(card, { autoAlpha: 0 });
    });
    ScrollTrigger.batch(cards, {
      start: 'top 88%',
      once: true,
      onEnter: function (batch) {
        batch.forEach(function (card, i) {
          var media = card.querySelector('[data-reveal-media]');
          var img = media && media.querySelector('img');
          var meta = card.querySelector('[data-reveal-meta]');
          var delay = 0.09 * i;
          if (media) {
            gsap.to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, delay: delay, ease: 'expo.out', clearProps: 'clipPath' });
            if (img) gsap.to(img, { scale: 1, duration: 1.4, delay: delay, ease: 'expo.out' });
            if (meta) gsap.to(meta, { yPercent: 0, autoAlpha: 1, duration: 0.9, delay: delay + 0.2, ease: 'power3.out' });
          } else {
            gsap.to(card, { autoAlpha: 1, duration: 0.9, delay: delay, ease: 'power2.out' });
          }
        });
      }
    });
  }
  });

  /* ----------------------------------------------------------- game dialog */

  safe('dialog', function () {if (modal) {
    var backdrop = modal.querySelector('[data-modal-backdrop]') || modal.querySelector('._8wxUTq_backdrop');
    var layers = gsap.utils.toArray('[data-modal-layer]');
    var panel = modal.querySelector('[data-modal-panel]');
    var imagePane = modal.querySelector('[data-modal-imagepane]');
    var modalTitle = modal.querySelector('[data-modal-title]');
    var modalRule = modal.querySelector('[data-modal-rule]');
    var modalBody = modal.querySelector('[data-modal-body]');
    var modalFacts = modal.querySelector('[data-modal-facts]');
    var modalImg = modal.querySelector('[data-modal-image]');
    var lastCard = null;
    var modalTl = null;
    var isOpen = false;

    function fill(data) {
      if (!data) return;
      modal.querySelector('[data-modal-genre]').textContent = data.genre.split(' / ')[0];
      modal.querySelector('[data-modal-players]').textContent = data.players;
      modal.querySelector('[data-modal-title]').textContent = data.title;
      modal.querySelector('[data-modal-sub]').textContent = data.sub;
      modal.querySelector('[data-modal-desc]').textContent = data.description;
      modal.querySelector('[data-modal-count]').textContent = data.count;
      modal.querySelector('[data-modal-fact-players]').textContent = data.playersShort;
      modal.querySelector('[data-modal-fact-time]').textContent = data.time;
      modal.querySelector('[data-modal-fact-year]').textContent = data.year;
      modalImg.src = data.image;
      modalImg.alt = data.alt;
    }

    function openModal(card) {
      var data = gameData[card.dataset.game];
      if (!data) return;
      fill(data);
      lastCard = card;
      isOpen = true;
      modal.setAttribute('aria-hidden', 'false');
      modal.style.visibility = 'visible';
      modal.style.pointerEvents = 'auto';
      if (lenis) lenis.stop();
      if (modalTl) modalTl.kill();
      modalTl = gsap.timeline();
      modalTl.set(modal, { autoAlpha: 1 })
        .to(backdrop, { opacity: 1, duration: 0.5 }, 0);
      if (reduceMotion) {
        modalTl.set(layers, { xPercent: 0 }).set(panel, { xPercent: 0 })
          .set([imagePane], { clipPath: 'inset(0% 0% 0%)' })
          .set(modalTitle, { yPercent: 0 }).set(modalRule, { scaleX: 1 })
          .set([modalBody, modalFacts], { clipPath: 'inset(0% 0% 0%)' });
      } else {
        modalTl.fromTo(layers, { xPercent: 100 }, { xPercent: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' }, 0)
          .fromTo(panel, { xPercent: 103 }, { xPercent: 0, duration: 1, ease: 'expo.out' }, 0.12)
          .fromTo(imagePane, { clipPath: 'inset(100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0%)', duration: 0.9, ease: 'expo.out' }, 0.4)
          .fromTo(modalTitle, { yPercent: 110 }, { yPercent: 0, duration: 0.9, ease: 'power4.out' }, 0.45)
          .fromTo(modalRule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, 0.6)
          .fromTo([modalBody, modalFacts], { clipPath: 'inset(0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0%)', duration: 0.9, stagger: 0.08, ease: 'expo.out' }, 0.55);
      }
      var closeBtn = modal.querySelector('._8wxUTq_closeButton');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    function closeModal() {
      if (!isOpen) return;
      isOpen = false;
      modal.setAttribute('aria-hidden', 'true');
      if (modalTl) modalTl.kill();
      modalTl = gsap.timeline({
        onComplete: function () {
          modal.style.visibility = 'hidden';
          modal.style.pointerEvents = 'none';
          gsap.set(modal, { autoAlpha: 0 });
          if (lenis) lenis.start();
          if (lastCard) lastCard.focus({ preventScroll: true });
        }
      });
      if (reduceMotion) {
        modalTl.set(modal, { autoAlpha: 0 });
      } else {
        modalTl.to([modalBody, modalFacts], { clipPath: 'inset(0% 0% 100%)', duration: 0.25, ease: 'power2.in' }, 0)
          .to(modalTitle, { yPercent: -110, duration: 0.3, ease: 'power2.in' }, 0)
          .to([imagePane], { clipPath: 'inset(0% 0% 100%)', duration: 0.35, ease: 'power2.in' }, 0.05)
          .to(panel, { xPercent: 103, duration: 0.5, ease: 'power3.in' }, 0.1)
          .to(layers, { xPercent: 100, duration: 0.5, stagger: { each: 0.05, from: 'end' }, ease: 'power3.in' }, 0.2)
          .to(backdrop, { opacity: 0, duration: 0.4 }, 0.15);
      }
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function () { openModal(card); });
    });
    gsap.utils.toArray('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }
  });

  /* ----------------------------------------------------------------- plays */

  safe('playsModule', function () {
    var wrapper = document.querySelector('[data-plays]');
    if (!wrapper) return;
    var layer = wrapper.querySelector('[data-cards-layer]');
    var letterEls = gsap.utils.toArray('[data-play-letter]', wrapper);
    var wraps = gsap.utils.toArray('.P2goaW_cardWrap', wrapper);
    var faces = wraps.map(function (w) { return w.querySelector('[data-card-face]'); });
    if (!layer || !wraps.length) return;

    var isMobile = window.matchMedia('(max-width: 700px)').matches;
    var canDrag = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var rotationsMobile = [0, 4, -4, 5, -5, 0, 0, 0, 0];
    var rotationsDesktop = [0, 3, -3, 3, -3, -2.5, 2.5, 2, -2];
    var dealOrder = [6, 8, 5, 4, 1, 3, 2, 7, 0];
    var tilt = [10, -8, 7, 9, -9, 8, -7, 6, -6];
    var base = isMobile ? rotationsMobile : rotationsDesktop;
    var dealEase = 'power4.out';
    var arcEase = 'power2.inOut';
    var settleEase = 'back.out(1.4)';

    gsap.set(wraps, { xPercent: -50, yPercent: -50, x: 0, y: 0, rotation: 0, scale: 1, transformOrigin: '50% 68%' });
    wraps.forEach(function (w, i) { w.style.zIndex = String(wraps.length - i); });

    if (reduceMotion) {
      gsap.set(letterEls, { yPercent: 0 });
      return;
    }

    gsap.set(letterEls, { yPercent: 105 });
    var lettersTl = gsap.to(letterEls, { yPercent: 0, duration: 1.3, stagger: 0.09, ease: 'expo.out', paused: true });
    if (ScrollTrigger) {
      ScrollTrigger.create({ trigger: wrapper, start: 'top 55%', once: true, onEnter: function () { lettersTl.play(); } });
    }

    var layerRect = layer.getBoundingClientRect();
    var vh = window.innerHeight;
    var restCenters = wraps.map(function (w) {
      var r = w.getBoundingClientRect();
      return {
        x: r.left - layerRect.left + r.width / 2,
        y: r.top - layerRect.top + r.height / 2
      };
    });

    var startX = window.innerWidth * (isMobile ? 1.22 : 1.12);
    var startY = 0.52 * vh;
    wraps.forEach(function (w, i) {
      gsap.set(w, {
        x: startX - restCenters[i].x,
        y: startY - restCenters[i].y,
        rotation: tilt[i],
        scale: 0.94
      });
    });

    if (ScrollTrigger) {
      var master = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.55,
          invalidateOnRefresh: true
        }
      });
      dealOrder.forEach(function (idx, order) {
        var el = wraps[idx];
        if (!el) return;
        var cx = restCenters[idx];
        var upper = cx.y < 0.45 * vh;
        var nudge = idx === 0 ? -(0.055 * vh) : (upper ? -(0.065 * vh) : 0.065 * vh);
        var rest = base[idx];
        var overshoot = rest + (tilt[idx] > 0 ? -0.7 : 0.7);
        master.add(gsap.timeline()
          .to(el, { x: 0, duration: 0.62, ease: dealEase }, 0)
          .to(el, { y: 0.45 * (startY - cx.y) + nudge, duration: 0.42 * 0.62, ease: arcEase }, 0)
          .to(el, { y: 0, duration: 0.3596, ease: settleEase }, 0.42 * 0.62)
          .to(el, { rotation: overshoot, scale: 1.008, duration: 0.496, ease: dealEase }, 0)
          .to(el, { rotation: rest, scale: 1, duration: 0.124, ease: settleEase }, 0.496), 0.085 * order);
      });
      master.to({ progress: 0 }, { progress: 1, duration: 0.24, ease: 'none' });
    }

    if (canDrag && Draggable && faces.length) {
      var z = wraps.length + 1;
      faces.forEach(function (face, i) {
        if (!face) return;
        var wrap = wraps[i];
        var tiltTo = gsap.quickTo(face, 'rotation', { duration: 0.4, ease: 'power3.out' });
        var vx = 0;
        var vy = 0;
        var lastX = 0;
        var lastY = 0;
        var lastT = 0;
        Draggable.create(face, {
          type: 'x,y',
          bounds: layer,
          zIndexBoost: false,
          onPress: function () {
            z += 1;
            wrap.style.zIndex = String(z);
            gsap.to(face, { scale: 1.04, duration: 0.3, ease: 'power3.out' });
          },
          onDragStart: function () {
            lastX = this.x;
            lastY = this.y;
            lastT = performance.now();
            vx = 0;
            vy = 0;
          },
          onDrag: function () {
            var now = performance.now();
            var dt = Math.max(1, now - lastT);
            vx = (this.x - lastX) / dt;
            vy = (this.y - lastY) / dt;
            lastX = this.x;
            lastY = this.y;
            lastT = now;
            tiltTo(clamp(-14, 14, vx * 220));
          },
          onRelease: function () {
            var self = this;
            var mx = clamp(-260, 260, vx * 420);
            var my = clamp(-200, 200, vy * 420);
            tiltTo(gsap.utils.random(-4, 4));
            gsap.to(face, { scale: 1, duration: 0.5, ease: 'power3.out' });
            if (Math.abs(mx) > 2 || Math.abs(my) > 2) {
              gsap.to(face, {
                x: self.x + mx,
                y: self.y + my,
                duration: 0.9,
                ease: 'power3.out'
              });
            }
          }
        });
      });
    }
  });

  /* --------------------------------------------------------------- play log */

  safe('logModule', function () {
    var table = document.querySelector('[data-table]');
    if (!table) return;
    var featured = table.querySelector('[data-log-featured]');
    var archiveHeader = table.querySelector('[data-archive-header]');
    var rows = gsap.utils.toArray('[data-log-row]', table);
    var entries = gsap.utils.toArray('.AtWhqq_entry', table);
    var openId = null;

    if (!reduceMotion && ScrollTrigger) {
      var bars = featured ? gsap.utils.toArray('[data-bar-fill]', featured) : [];
      if (featured) gsap.set(featured, { clipPath: 'inset(6% 4% 6% 4%)', autoAlpha: 0 });
      gsap.set(bars, { scaleX: 0 });
      if (archiveHeader) gsap.set(archiveHeader, { autoAlpha: 0, y: 32 });

      if (featured) {
        ScrollTrigger.create({
          trigger: featured,
          start: 'top 82%',
          once: true,
          onEnter: function (self) {
            self.kill();
            gsap.timeline()
              .to(featured, { clipPath: 'inset(0% 0% 0% 0%)', autoAlpha: 1, duration: 1.1, ease: 'power4.out', clearProps: 'clipPath' })
              .to(bars, { scaleX: 1, duration: 1.2, stagger: 0.12, ease: 'expo.out' }, 0.45);
          }
        });
      }
      if (archiveHeader) {
        ScrollTrigger.create({
          trigger: archiveHeader,
          start: 'top 88%',
          once: true,
          onEnter: function () {
            gsap.to(archiveHeader, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power4.out' });
          }
        });
      }

      var revealSets = entries.map(function (entry) { return gsap.utils.toArray('[data-row-reveal]', entry); });
      var ledgers = entries.map(function (entry) { return entry.querySelector('[data-row-ledger]'); });
      gsap.set(revealSets.flat(), { autoAlpha: 0, y: 24 });
      gsap.set(ledgers.filter(Boolean), { scaleX: 0 });

      ScrollTrigger.batch(entries, {
        start: 'top 92%',
        once: true,
        onEnter: function (batch) {
          batch.forEach(function (entry, i) {
            var idx = entries.indexOf(entry);
            var delay = 0.08 * i;
            gsap.to(revealSets[idx], { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.05, delay: delay, ease: 'power4.out' });
            if (ledgers[idx]) gsap.to(ledgers[idx], { scaleX: 1, duration: 1.4, delay: delay + 0.2, ease: 'expo.out' });
          });
        }
      });
    }

    var easeOpen = 'power4.out';
    var easeClose = 'power4.in';
    var clipClosed = 'inset(0% 0% 100% 0%)';
    var clipOpen = 'inset(0% 0% 0% 0%)';

    function shellOf(entry) { return entry.querySelector('.AtWhqq_detailShell'); }

    function setState(shell, isOpen) {
      if (!shell) return;
      var reveal = shell.firstElementChild;
      gsap.killTweensOf([shell, reveal]);
      gsap.set(shell, { height: isOpen ? 'auto' : 0, overflow: 'hidden' });
      if (reveal) gsap.set(reveal, { clipPath: isOpen ? clipOpen : clipClosed, y: isOpen ? 0 : -12 });
      if (isOpen) {
        gsap.set(gsap.utils.toArray('[data-bar-fill]', shell), { scaleX: 1 });
        gsap.set(gsap.utils.toArray('[data-slip-part]', shell), { autoAlpha: 1, y: 0 });
      }
    }

    function drawer(entry, isOpen) {
      var shell = shellOf(entry);
      var reveal = shell && shell.firstElementChild;
      if (!shell) return;
      if (reduceMotion) {
        setState(shell, isOpen);
        return;
      }
      if (isOpen) {
        gsap.killTweensOf([shell, reveal]);
        var bars = gsap.utils.toArray('[data-bar-fill]', shell);
        var parts = gsap.utils.toArray('[data-slip-part]', shell);
        var tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
        tl.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 1, stagger: 0.08, ease: 'expo.out' }, 0.3)
          .fromTo(parts, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06, ease: easeOpen }, 0.12)
          .to(shell, { height: 'auto', duration: 0.58, ease: easeOpen }, 0);
        if (reveal) tl.to(reveal, { clipPath: clipOpen, y: 0, duration: 0.54, ease: easeOpen }, 0.03);
      } else {
        gsap.killTweensOf([shell, reveal]);
        var out = gsap.timeline({ defaults: { overwrite: 'auto' } });
        if (reveal) out.to(reveal, { clipPath: clipClosed, y: -12, duration: 0.3, ease: easeClose }, 0);
        out.to(shell, { height: 0, duration: 0.38, ease: easeClose }, 0);
      }
    }

    function toggle(id) {
      var next = openId === id ? null : id;
      var prev = openId;
      openId = next;
      entries.forEach(function (entry, i) {
        var row = rows[i];
        var entryId = row ? row.getAttribute('aria-controls') : null;
        var isThis = entryId === next;
        var wasThis = entryId === prev;
        if (row) {
          row.setAttribute('aria-expanded', String(isThis));
          row.classList.toggle('_1lIfoq_rowOpen', isThis);
        }
        var shell = shellOf(entry);
        if (isThis) drawer(entry, true);
        else if (wasThis) drawer(entry, false);
      });
    }

    rows.forEach(function (row) {
      row.addEventListener('click', function () {
        var id = row.getAttribute('aria-controls');
        if (id) toggle(id);
      });
    });
  });

  /* ----------------------------------------------------------------- footer */

  safe('footerModule', function () {
    var footer = document.querySelector('[data-footer]');
    if (!footer) return;
    var title = footer.querySelector('[data-footer-title]');
    var reveals = gsap.utils.toArray('[data-footer-reveal]', footer);
    var placeCards = gsap.utils.toArray('.tUdqrq_placeCard', footer);
    var art = footer.querySelector('[data-footer-art]');
    var gild = footer.querySelector('[data-gild]');
    var titleChars = splitChars(title);

    if (!reduceMotion) {
      gsap.set(titleChars, { yPercent: 100 });
      gsap.set(reveals, { autoAlpha: 0, y: 20 });
      gsap.set(placeCards, { autoAlpha: 0, yPercent: 30 });

      var tl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
      tl.to(titleChars, { yPercent: 0, duration: 1.2, stagger: 0.03 }, 0)
        .to(reveals, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.3)
        .to(placeCards, { autoAlpha: 1, yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, 0.45);

      if (ScrollTrigger) {
        ScrollTrigger.create({ trigger: footer, start: 'top 70%', once: true, onEnter: function () { tl.play(); } });
        if (art) {
          gsap.fromTo(art, { yPercent: 16, scale: 0.92 }, {
            yPercent: 0, scale: 1, ease: 'none',
            scrollTrigger: {
              trigger: footer, start: 'top bottom', end: 'bottom bottom',
              scrub: true, invalidateOnRefresh: true
            }
          });
        }
      }

      /* gilded foil follows the pointer across the table drawing */
      if (gild && art) {
        var gildState = { x: 50, y: 50, r: 0, tx: 50, ty: 50, tr: 0 };
        gsap.ticker.add(function () {
          gildState.x += (gildState.tx - gildState.x) * 0.14;
          gildState.y += (gildState.ty - gildState.y) * 0.14;
          gildState.r += (gildState.tr - gildState.r) * 0.1;
          gild.style.setProperty('--gild-x', gildState.x.toFixed(2) + '%');
          gild.style.setProperty('--gild-y', gildState.y.toFixed(2) + '%');
          gild.style.setProperty('--gild-r', gildState.r.toFixed(2));
        });
        footer.addEventListener('pointermove', function (e) {
          var r = art.getBoundingClientRect();
          if (!r.width || !r.height) return;
          gildState.tx = ((e.clientX - r.left) / r.width) * 100;
          gildState.ty = ((e.clientY - r.top) / r.height) * 100;
          gildState.tr = 36;
        });
        footer.addEventListener('pointerleave', function () { gildState.tr = 0; });
      }
    }
  });

  /* ------------------------------------------------------------ final pass */

  if (ScrollTrigger) {
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    document.fonts && document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  /* in-page links scroll through Lenis */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });
})();
