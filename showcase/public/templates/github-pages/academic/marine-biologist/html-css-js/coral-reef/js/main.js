/* ============================================================
   CORAL REEF BIOLOGIST — Main JavaScript
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

// Underwater Bubbles Canvas
(function() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;
  const bubbles = [];

  function resize() {
    w = canvas.width = canvas.parentElement.offsetWidth;
    h = canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 40; i++) {
    bubbles.push({
      x: Math.random() * 2000,
      y: Math.random() * 1000 + 500,
      r: Math.random() * 8 + 2,
      speed: Math.random() * 0.8 + 0.2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.005,
      opacity: Math.random() * 0.3 + 0.1,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    bubbles.forEach(b => {
      b.y -= b.speed;
      b.wobble += b.wobbleSpeed;
      b.x += Math.sin(b.wobble) * 0.5;
      if (b.y < -20) { b.y = h + 20; b.x = Math.random() * w; }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(102, 217, 239, ' + b.opacity + ')';
      ctx.lineWidth = 1;
      ctx.stroke();

      // highlight
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (b.opacity * 0.8) + ')';
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();
