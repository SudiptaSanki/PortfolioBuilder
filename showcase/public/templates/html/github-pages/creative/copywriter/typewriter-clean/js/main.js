document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (navToggle && navLinks) {
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

  // Smart Sticky Header
  let lastScroll = 0;
  const header = document.getElementById('header');

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
      header.classList.remove('scrolled');
      header.classList.remove('hide');
      return;
    }
    
    header.classList.add('scrolled');
    
    if (currentScroll > lastScroll && !header.classList.contains('hide')) {
      // Scroll Down
      header.classList.add('hide');
    } else if (currentScroll < lastScroll && header.classList.contains('hide')) {
      // Scroll Up
      header.classList.remove('hide');
    }
    
    lastScroll = currentScroll;
  });
});
