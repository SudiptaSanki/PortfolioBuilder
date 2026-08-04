/* ============================================================
   OBSIDIAN FORGE DEVELOPER — Main JavaScript
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

// Floating Embers/Sparks Canvas
(function() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;
  const embers = [];

  function resize() {
    w = canvas.width = canvas.parentElement.offsetWidth;
    h = canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 50; i++) {
    embers.push({
      x: Math.random() * 2000,
      y: Math.random() * 1000,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.5,
      dy: -Math.random() * 1.2 - 0.3,
      life: Math.random(),
      decay: Math.random() * 0.003 + 0.001,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    embers.forEach(e => {
      e.x += e.dx + Math.sin(e.life * 10) * 0.3;
      e.y += e.dy;
      e.life -= e.decay;
      if (e.life <= 0) {
        e.x = Math.random() * w;
        e.y = h + 10;
        e.life = 1;
      }

      const alpha = e.life * 0.8;
      const r = e.r * e.life;
      // glow
      const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 4);
      grad.addColorStop(0, 'rgba(249, 115, 22, ' + (alpha * 0.4) + ')');
      grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(e.x - r * 4, e.y - r * 4, r * 8, r * 8);
      // core
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.fillStyle = e.life > 0.6
        ? 'rgba(251, 191, 36, ' + alpha + ')'
        : 'rgba(239, 68, 68, ' + alpha + ')';
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();
