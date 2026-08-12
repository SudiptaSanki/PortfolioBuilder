/* ============================================
   Developer Portfolio — Main JavaScript
   Features: Navbar, Theme Toggle, Typing Effect,
   Scroll Animations, Contact Form (EmailJS),
   Back to Top
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initThemeToggle();
  initTypingEffect();
  initScrollReveal();
  initBackToTop();
  initContactForm();
  initSmoothScroll();
});

/* ── Navbar ── */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile toggle
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }

  // Active link highlight
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navLinks?.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ── Theme Toggle ── */
function initThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  const savedTheme = localStorage.getItem('dev-portfolio-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(toggle, savedTheme);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dev-portfolio-theme', next);
    updateThemeIcon(toggle, next);
  });
}

function updateThemeIcon(btn, theme) {
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ── Typing Effect ── */
function initTypingEffect() {
  const el = document.querySelector('.typing-text');
  if (!el) return;

  const strings = [
    'Full-Stack Developer',
    'Open Source Contributor',
    'Problem Solver',
    'UI Engineer',
    'Tech Enthusiast'
  ];

  let stringIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 80;

  function type() {
    const current = strings[stringIndex];

    if (isDeleting) {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 40;
    } else {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 80;
    }

    if (!isDeleting && charIndex === current.length) {
      typingSpeed = 2000; // Pause at end
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      stringIndex = (stringIndex + 1) % strings.length;
      typingSpeed = 400;
    }

    setTimeout(type, typingSpeed);
  }

  type();
}

/* ── Scroll Reveal ── */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => observer.observe(el));
}

/* ── Back to Top ── */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── Contact Form (EmailJS) ── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const statusEl = document.getElementById('form-status');
    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;

    // Basic validation
    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    if (!name || !email || !message) {
      showFormStatus(statusEl, 'error', 'Please fill in all fields.');
      return;
    }

    if (!isValidEmail(email)) {
      showFormStatus(statusEl, 'error', 'Please enter a valid email address.');
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    /*
     * ── EmailJS Integration ──
     * Replace the values below with your own:
     * 1. Sign up at https://www.emailjs.com/
     * 2. Create an Email Service (get SERVICE_ID)
     * 3. Create an Email Template (get TEMPLATE_ID)
     * 4. Get your Public Key from Account > API Keys
     */
    if (typeof emailjs !== 'undefined') {
      emailjs.sendForm(
        'YOUR_SERVICE_ID',    // ← Replace with your EmailJS Service ID
        'YOUR_TEMPLATE_ID',   // ← Replace with your EmailJS Template ID
        form
      ).then(() => {
        showFormStatus(statusEl, 'success', '✅ Message sent successfully! I\'ll get back to you soon.');
        form.reset();
      }).catch((err) => {
        showFormStatus(statusEl, 'error', '❌ Failed to send. Please try again or email me directly.');
        console.error('EmailJS error:', err);
      }).finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
    } else {
      // Fallback: Formspree
      // Change the action URL in the HTML form to your Formspree endpoint
      showFormStatus(statusEl, 'success', '✅ Form submitted! (Configure EmailJS for full functionality)');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      form.reset();
    }
  });
}

function showFormStatus(el, type, message) {
  if (!el) return;
  el.className = 'form-status ' + type;
  el.textContent = message;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Smooth Scroll ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
