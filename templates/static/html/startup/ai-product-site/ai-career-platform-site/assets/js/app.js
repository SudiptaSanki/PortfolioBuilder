/* CareerForge AI — interaction layer for the static clone
   (sticky nav, dropdowns, mobile drawer, tabs, video, scroll reveals) */
(function () {
  'use strict';

  var docEl = document.documentElement;
  docEl.classList.add('js');

  /* ---------------------------------------------------------------- promo */
  var promo = document.getElementById('ds-promo');
  var nav = document.querySelector('nav[class*="fixed"]') || document.querySelector('nav');
  var navShadow = document.querySelector('[data-ds-navshadow]');

  function promoHeight() {
    return promo ? promo.getBoundingClientRect().height : 0;
  }

  function syncPromoOffset() {
    var y = window.pageYOffset || docEl.scrollTop;
    var h = promoHeight();
    // the promo bar scrolls away with the page; the nav docks to the top
    // once it has passed
    var hidden = y > h - 8;
    docEl.style.setProperty('--promo-offset', (hidden ? 0 : h) + 'px');
    if (navShadow) navShadow.style.opacity = y > 12 ? '1' : '0';
    swapLogo(y > 70);
  }

  function swapLogo(small) {
    if (!nav) return;
    var container = nav.querySelector('div[style*="width:215px"], div[style*="height:48px"]');
    if (!container) return;
    var links = container.querySelectorAll('a');
    if (links.length < 2) return;
    links[0].style.opacity = small ? '0' : '1';
    links[0].style.pointerEvents = small ? 'none' : 'auto';
    links[1].style.opacity = small ? '1' : '0';
    links[1].style.pointerEvents = small ? 'auto' : 'none';
  }

  window.addEventListener('scroll', syncPromoOffset, { passive: true });
  window.addEventListener('resize', syncPromoOffset);
  syncPromoOffset();

  /* ------------------------------------------------------------ dropdowns */
  var MENUS = {
    features: [
      ['Career Paths', 'Pick a role and follow a clear route to it'],
      ['Roadmaps', 'Structured, week-by-week learning paths'],
      ['Online Compilers', 'Write and run code in 90+ languages'],
      ['AI Mock Interviews', 'Practise out loud and get scored feedback'],
      ['Resume Builder', 'Clean, recruiter-friendly resumes with AI help'],
      ['Cheat Sheets', 'Quick references for languages and tools']
    ],
    community: [
      ['Posts', 'Ask and answer with other learners'],
      ['Topics', 'Follow what you are learning'],
      ['Clubs', 'Find a study group near you'],
      ['Tech Events', 'Hackathons, meetups and workshops'],
      ['Hackathons', 'Compete and ship something real']
    ],
    products: [
      ['ManageSnap', 'Run cohorts, colleges and assessments'],
      ['DataSnap', 'Analytics on every learner and test'],
      ['CreateSnap', 'Turn notes into courses with AI'],
      ['EvalSnap', 'Unlimited AI-proctored coding tests'],
      ['Career Mentor AI', 'Your AI mentor, inside the editor']
    ],
    resources: [
      ['Catalog', 'Every course in one place'],
      ['Interview Prep', 'Questions, guides and tips'],
      ['Compilers', 'Open a compiler for any language'],
      ['Resume Prep', 'Get past the ATS'],
      ['Blog', 'Articles, tutorials and career advice']
    ],
    pricing: [
      ['For Students', 'Learn free, upgrade when ready'],
      ['For Business', 'Train your engineering team'],
      ['For Universities', 'Unlimited assessments and analytics']
    ]
  };

  function menuKey(label) {
    var l = (label || '').trim().toLowerCase();
    for (var k in MENUS) {
      if (l.indexOf(k) === 0) return k;
    }
    return null;
  }

  function buildMenu(key) {
    var wrap = document.createElement('div');
    wrap.className = 'ds-menu' + (key === 'pricing' ? ' ds-menu-tight' : '');
    var items = MENUS[key] || [];
    items.forEach(function (it) {
      var a = document.createElement('a');
      a.href = '#';
      var txt = document.createElement('span');
      txt.textContent = it[0];
      if (it[1]) {
        var d = document.createElement('span');
        d.className = 'ds-desc';
        d.textContent = it[1];
        txt.appendChild(d);
      }
      a.appendChild(txt);
      wrap.appendChild(a);
    });
    return wrap;
  }

  // desktop nav: attach a panel to each labelled button
  var desktopNav = document.querySelector('[data-nav-container] > div.relative.hidden');
  if (desktopNav) {
    var buttons = desktopNav.querySelectorAll('button');
    Array.prototype.forEach.call(buttons, function (btn) {
      var key = menuKey(btn.textContent);
      if (!key) return;
      var host = btn.parentElement;
      if (!host || host.querySelector('.ds-menu')) return;
      host.classList.add('ds-item');
      host.appendChild(buildMenu(key));
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
      host.addEventListener('mouseenter', function () { btn.setAttribute('aria-expanded', 'true'); });
      host.addEventListener('mouseleave', function () {
        btn.setAttribute('aria-expanded', 'false');
        host.classList.remove('ds-open');
      });
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var open = host.classList.toggle('ds-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('click', function (e) {
      if (!desktopNav.contains(e.target)) {
        Array.prototype.forEach.call(desktopNav.querySelectorAll('.ds-item'), function (el) {
          el.classList.remove('ds-open');
        });
      }
    });
  }

  /* ------------------------------------------------------- mobile drawer */
  var drawer = document.getElementById('ds-drawer');
  var openBtn = document.querySelector('[data-ds-drawer-open]');
  var closeBtn = document.querySelector('[data-ds-drawer-close]');

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('ds-drawer-open');
    document.body.classList.add('ds-locked');
    var items = drawer.querySelectorAll('[style*="translateY(16px)"]');
    Array.prototype.forEach.call(items, function (el, i) {
      setTimeout(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 60 + i * 40);
    });
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('ds-drawer-open');
    document.body.classList.remove('ds-locked');
  }
  if (openBtn) openBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  // accordions inside the drawer
  if (drawer) {
    var accButtons = drawer.querySelectorAll('div.border-b > button');
    Array.prototype.forEach.call(accButtons, function (btn) {
      var key = menuKey(btn.textContent);
      if (!key) return;
      var host = btn.parentElement;
      host.classList.add('ds-acc-item');
      var panel = document.createElement('div');
      panel.className = 'ds-acc-panel';
      (MENUS[key] || []).forEach(function (it) {
        var a = document.createElement('a');
        a.href = '#';
        a.textContent = it[0];
        a.addEventListener('click', closeDrawer);
        panel.appendChild(a);
      });
      host.appendChild(panel);
      btn.addEventListener('click', function () {
        var isOpen = host.classList.toggle('ds-open');
        panel.classList.toggle('ds-open', isOpen);
      });
    });
  }

  /* --------------------------------------------------------------- video */
  var video = document.querySelector('[data-ds-video]');
  if (video) {
    video.muted = true;
    video.setAttribute('muted', '');
    var tryPlay = function () {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) tryPlay();
          else video.pause();
        });
      }, { threshold: 0.25 }).observe(video);
    } else {
      tryPlay();
    }
    document.addEventListener('click', tryPlay, { once: true });
    document.addEventListener('touchstart', tryPlay, { once: true });
  }

  /* ---------------------------------------------------------------- tabs */
  var tabButtons = document.querySelectorAll('[data-ds-tab]');
  if (tabButtons.length) {
    var trendingBtn = document.querySelector('[data-ds-tab="trending"]');
    var contentWrap = null;
    if (trendingBtn) {
      var pillRow = trendingBtn.parentElement;
      var next = pillRow ? pillRow.nextElementSibling : null;
      while (next && !(next.className || '').match(/flex-col/)) next = next.nextElementSibling;
      contentWrap = next;
    }
    var certsPanel = null;
    if (contentWrap) {
      contentWrap.classList.add('ds-tabpanel');
      certsPanel = document.createElement('div');
      certsPanel.className = 'ds-certs ds-tabpanel';
      certsPanel.hidden = true;
      var certData = [
        ['Data Scientist', 'Python, SQL, statistics and model deployment, assessed end to end.', '8 weeks'],
        ['SQL Associate', 'Queries, joins, window functions and schema design.', '4 weeks'],
        ['AI Foundations', 'LLMs, prompting, RAG and agent basics, with hands-on labs.', '6 weeks'],
        ['Full-Stack Developer', 'From HTML to Node APIs and production deployment.', '12 weeks']
      ];
      certData.forEach(function (c) {
        var card = document.createElement('div');
        card.className = 'ds-cert';
        card.innerHTML = '<span class="ds-badge">' + c[2] + '</span>' +
          '<h3>' + c[0] + '</h3><p>' + c[1] + '</p>' +
          '<a href="#" style="font-size:13px;font-weight:700;color:#111;text-decoration:none">View certification &rarr;</a>';
        certsPanel.appendChild(card);
      });
      contentWrap.parentNode.insertBefore(certsPanel, contentWrap.nextSibling);
    }

    function activate(key) {
      Array.prototype.forEach.call(tabButtons, function (b) {
        var on = b.getAttribute('data-ds-tab') === key;
        var isTrending = b.getAttribute('data-ds-tab') === 'trending';
        b.classList.toggle('text-white', on);
        b.classList.toggle('text-black', !on);
        b.classList.toggle('opacity-60', !on);
        var fill = b.querySelector('div.bg-primaryPink');
        if (fill) fill.style.display = isTrending === on ? 'block' : 'none';
      });
      if (contentWrap) contentWrap.hidden = key !== 'trending';
      if (certsPanel) certsPanel.hidden = key !== 'certs';
    }
    Array.prototype.forEach.call(tabButtons, function (b) {
      b.addEventListener('click', function () { activate(b.getAttribute('data-ds-tab')); });
    });
  }

  /* ------------------------------------------------------- scroll reveal */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = [];
    Array.prototype.forEach.call(document.querySelectorAll('main h2, main section > div > h3'), function (el) {
      if (el.closest('#ds-drawer')) return;
      targets.push(el);
    });
    Array.prototype.forEach.call(document.querySelectorAll('main section > div > div[class*="grid"], main section > div > div[class*="flex"][class*="gap"]'), function (el) {
      if (el.closest('#ds-drawer') || el.querySelector('h2')) return;
      targets.push(el);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('ds-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el, i) {
      if (el.classList.contains('ds-reveal')) return;
      el.classList.add('ds-reveal');
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });
    // anything already in view on load shows immediately
    requestAnimationFrame(function () {
      targets.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.9) el.classList.add('ds-in');
      });
    });
  }

  /* --------------------------------------------- current-year in footer */
  Array.prototype.forEach.call(document.querySelectorAll('footer span, footer p'), function (el) {
    if (el.children.length === 0 && /©\s*2026/.test(el.textContent)) {
      el.textContent = el.textContent.replace(/©\s*2026/, '© ' + new Date().getFullYear());
    }
  });
})();

/* ==========================================================================
   Restored sections: feature tabs + soft reveal
   ========================================================================== */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- "Everything a student needs, in one app." tab switching ---------- */
  var featTabs = Array.prototype.slice.call(document.querySelectorAll('[data-ds-feat]'));
  var featImg = document.getElementById('ds-feat-img');

  if (featTabs.length && featImg) {
    var swap = function (btn) {
      featTabs.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (featImg.getAttribute('src') === btn.getAttribute('data-img')) return;
      featImg.classList.add('is-fading');
      var src = btn.getAttribute('data-img');
      var alt = btn.getAttribute('data-alt') || btn.textContent.trim();
      var pre = new Image();
      pre.onload = function () {
        featImg.src = src;
        featImg.alt = alt;
        featImg.classList.remove('is-fading');
      };
      pre.onerror = function () { featImg.classList.remove('is-fading'); };
      pre.src = src;
    };

    featTabs.forEach(function (b) {
      b.addEventListener('click', function () { swap(b); });
      b.addEventListener('keydown', function (e) {
        var i = featTabs.indexOf(b);
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = featTabs[(i + 1) % featTabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = featTabs[(i - 1 + featTabs.length) % featTabs.length];
        if (next) { e.preventDefault(); next.focus(); swap(next); }
      });
    });
  }

  /* ---- reveal the new blocks as they scroll into view ------------------- */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('[data-ds-reveal]'));
  if (revealables.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('ds-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('ds-in');
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealables.forEach(function (el) {
        el.classList.add('ds-reveal');
        io.observe(el);
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) el.classList.add('ds-in');
      });
    }
  }
})();
