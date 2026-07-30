/* ============================================================
   AURORA BOREALIS ANALYST — Main JavaScript
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

// Aurora Borealis Canvas Effect
(function() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, time = 0;

  function resize() {
    w = canvas.width = canvas.parentElement.offsetWidth;
    h = canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawAurora() {
    ctx.clearRect(0, 0, w, h);
    time += 0.003;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.3);
      for (let x = 0; x <= w; x += 4) {
        const y = h * 0.3 + Math.sin(x * 0.003 + time + i * 0.8) * (40 + i * 15)
                  + Math.sin(x * 0.007 + time * 1.5) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.7);
      const hue = 140 + i * 40 + Math.sin(time) * 20;
      grad.addColorStop(0, 'hsla(' + hue + ', 80%, 60%, 0)');
      grad.addColorStop(0.3, 'hsla(' + hue + ', 80%, 50%, ' + (0.08 - i * 0.012) + ')');
      grad.addColorStop(1, 'hsla(' + hue + ', 80%, 40%, 0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }
    requestAnimationFrame(drawAurora);
  }
  drawAurora();
})();
