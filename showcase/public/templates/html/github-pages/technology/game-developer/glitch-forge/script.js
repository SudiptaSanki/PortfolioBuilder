// Glitch Forge game dev template script
document.addEventListener('DOMContentLoaded', () => {
  console.log('GLITCH_FORGE console linked.');

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Glitch effect on hover
  const title = document.querySelector('.glitch-title');
  if (title) {
    title.addEventListener('mouseenter', () => {
      title.style.animationPlayState = 'running';
    });
  }
});
