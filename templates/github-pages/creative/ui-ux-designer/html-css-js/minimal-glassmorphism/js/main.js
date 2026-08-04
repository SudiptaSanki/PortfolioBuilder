/* ============================================
   UI/UX Designer Portfolio — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initThemeToggle();
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

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }

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

  const savedTheme = localStorage.getItem('designer-portfolio-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(toggle, savedTheme);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('designer-portfolio-theme', next);
    updateThemeIcon(toggle, next);
  });
}

function updateThemeIcon(btn, theme) {
  btn.innerHTML = theme === 'light' 
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
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

/* ── Contact Form ── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const statusEl = document.getElementById('form-status');
    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;

    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    if (!name || !email || !message) {
      showFormStatus(statusEl, 'error', 'Please fill in all fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFormStatus(statusEl, 'error', 'Please enter a valid email address.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    if (typeof emailjs !== 'undefined') {
      emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form)
        .then(() => {
          showFormStatus(statusEl, 'success', '✨ Message sent successfully! I will reply shortly.');
          form.reset();
        }).catch((err) => {
          showFormStatus(statusEl, 'error', '😔 Failed to send. Please try again.');
          console.error(err);
        }).finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        });
    } else {
      showFormStatus(statusEl, 'success', '✨ Form submitted! (Configure EmailJS for full functionality)');
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

/* ── Smooth Scroll ── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
