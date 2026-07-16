// Moss Tea green tea barista sommelier script
document.addEventListener('DOMContentLoaded', () => {
  console.log('Moss Tea engine online.');

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
