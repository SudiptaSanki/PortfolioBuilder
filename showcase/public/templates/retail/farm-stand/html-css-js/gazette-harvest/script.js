// Gazette Harvest newspaper template script
document.addEventListener('DOMContentLoaded', () => {
  console.log('The Gazette Harvest ledger linked.');

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
