/* ============================================
   Video Editor Portfolio — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initContactForm();
  initSmoothScroll();
});

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
  }

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navLinks?.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

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
      showFormStatus(statusEl, 'error', 'ALL FIELDS ARE REQUIRED.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'SENDING...';

    if (typeof emailjs !== 'undefined') {
      emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form)
        .then(() => {
          showFormStatus(statusEl, 'success', 'MESSAGE SENT SUCCESSFULLY.');
          form.reset();
        }).catch((err) => {
          showFormStatus(statusEl, 'error', 'FAILED TO SEND MESSAGE.');
          console.error(err);
        }).finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        });
    } else {
      showFormStatus(statusEl, 'success', 'MESSAGE SENT! (Configure EmailJS to enable)');
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
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

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
