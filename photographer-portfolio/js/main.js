/* ============================================
   Photographer Portfolio — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initThemeToggle();
  initHeroSlider();
  initScrollReveal();
  initLightbox();
  initContactForm();
});

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  // Change navbar background depending on scroll and page
  const isHomePage = document.querySelector('.hero') !== null;
  
  if (!isHomePage) {
    navbar.classList.add('scrolled'); // Always solid on non-home pages
  }

  window.addEventListener('scroll', () => {
    if (isHomePage) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
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

function initThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  const savedTheme = localStorage.getItem('photo-portfolio-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  toggle.innerHTML = savedTheme === 'light' ? '☾' : '☼';

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('photo-portfolio-theme', next);
    toggle.innerHTML = next === 'light' ? '☾' : '☼';
  });
}

function initHeroSlider() {
  const slides = document.querySelectorAll('.slide');
  if (!slides.length) return;

  let currentSlide = 0;
  setInterval(() => {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, 5000);
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
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  reveals.forEach(el => observer.observe(el));
}

function initLightbox() {
  const items = document.querySelectorAll('.portfolio-item');
  if (!items.length) return;

  // Create lightbox elements
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-close">&times;</div>
    <img src="" alt="Lightbox image">
  `;
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector('img');
  const lbClose = lightbox.querySelector('.lightbox-close');

  items.forEach(item => {
    item.addEventListener('click', () => {
      const imgSrc = item.querySelector('img').src;
      lbImg.src = imgSrc;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLB = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
  };

  lbClose.addEventListener('click', closeLB);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLB();
  });
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
      showFormStatus(statusEl, 'error', 'Please complete all fields.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    if (typeof emailjs !== 'undefined') {
      emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form)
        .then(() => {
          showFormStatus(statusEl, 'success', 'Inquiry sent successfully.');
          form.reset();
        }).catch((err) => {
          showFormStatus(statusEl, 'error', 'Failed to send inquiry.');
          console.error(err);
        }).finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        });
    } else {
      showFormStatus(statusEl, 'success', 'Inquiry submitted! (Configure EmailJS)');
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
