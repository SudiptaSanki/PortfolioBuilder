
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
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
});

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab');
  const items = document.querySelectorAll('.menu-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.tab;
      items.forEach(item => {
        item.style.display = (cat === 'all' || item.dataset.cat === cat) ? '' : 'none';
      });
    });
  });
});
