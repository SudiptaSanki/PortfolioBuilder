// Bauhaus Grid UI designer template script
document.addEventListener('DOMContentLoaded', () => {
  console.log('BAUHAUS_GRID compiled.');

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
});
