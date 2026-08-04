/* ============================================================
   MIDNIGHT SAPPHIRE ANALYST — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ── Theme Toggle ──
  const html = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', saved);
  if (themeToggle) {
    themeToggle.textContent = saved === 'dark' ? '☀️' : '🌙';
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }

  // ── Mobile Nav ──
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  // ── Navbar Scroll ──
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ── Back to Top ──
  const btt = document.getElementById('back-to-top');
  if (btt) {
    window.addEventListener('scroll', () => {
      btt.classList.toggle('visible', window.scrollY > 400);
    });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ── Scroll Reveal ──
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    reveals.forEach(el => observer.observe(el));
  }

  // ── Contact Form ──
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const status = document.getElementById('form-status');
      if (status) {
        status.className = 'form-status success';
        status.textContent = 'Message sent successfully! I\'ll get back to you soon.';
        form.reset();
        setTimeout(() => { status.className = 'form-status'; }, 5000);
      }
    });
  }
});

// ── Canvas Effect ──

// Matrix Code Rain Canvas
(function() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;

  function resize() {
    w = canvas.width = canvas.parentElement.offsetWidth;
    h = canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const cols = Math.floor(w / 18);
  const drops = Array(cols).fill(1);
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

  function draw() {
    ctx.fillStyle = 'rgba(3, 7, 18, 0.06)';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '14px JetBrains Mono, monospace';

    for (let i = 0; i < cols; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * 18;
      const y = drops[i] * 18;

      const brightness = Math.random();
      if (brightness > 0.95) {
        ctx.fillStyle = '#ffffff';
      } else if (brightness > 0.8) {
        ctx.fillStyle = '#3b82f6';
      } else {
        ctx.fillStyle = 'rgba(6, 182, 212, ' + (0.3 + Math.random() * 0.5) + ')';
      }
      ctx.fillText(char, x, y);

      if (y > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  draw();
})();
