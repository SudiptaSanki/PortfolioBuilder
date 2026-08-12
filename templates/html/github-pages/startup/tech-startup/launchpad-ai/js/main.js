
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      toggle.classList.toggle('active');
    });
    document.querySelectorAll('.nav-links a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('active');
        toggle.classList.remove('active');
      });
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
});

document.addEventListener('DOMContentLoaded', () => {
  // Counter animation
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        let current = 0;
        const step = Math.max(1, Math.ceil(target / 50));
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = current.toLocaleString();
        }, 25);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

  // Pricing toggle
  const toggle = document.getElementById('pricing-toggle');
  const monthlyLabel = document.getElementById('monthly-label');
  const annualLabel = document.getElementById('annual-label');
  if (toggle) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('annual');
      const isAnnual = toggle.classList.contains('annual');
      monthlyLabel.classList.toggle('active', !isAnnual);
      annualLabel.classList.toggle('active', isAnnual);
      document.querySelectorAll('.monthly-price').forEach(el => el.style.display = isAnnual ? 'none' : '');
      document.querySelectorAll('.annual-price').forEach(el => el.style.display = isAnnual ? '' : 'none');
    });
  }
});
