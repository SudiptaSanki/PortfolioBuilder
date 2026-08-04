// Swiss Editorial copywriter template script
document.addEventListener('DOMContentLoaded', () => {
  console.log('Swiss Editorial ledger active.');

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
