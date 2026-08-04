// Cosmic Lens astrophotography template script
document.addEventListener('DOMContentLoaded', () => {
  console.log('COSMIC_LENS systems online.');

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Animated numbers or coordinates tracker effect
  const coordDisplay = document.querySelector('.coords');
  if (coordDisplay) {
    coordDisplay.addEventListener('mouseenter', () => {
      // simulate quick coordinates updates
      let counts = 0;
      const interval = setInterval(() => {
        const raHr = Math.floor(Math.random() * 24);
        const raMin = Math.floor(Math.random() * 60);
        const decDeg = Math.floor(Math.random() * 90);
        coordDisplay.textContent = `TRACKING: RA ${raHr}h ${raMin}m // DEC +${decDeg}°`;
        counts++;
        if (counts > 8) {
          clearInterval(interval);
          coordDisplay.textContent = 'RA 18h 36m 56.3s / DEC +38° 47′ 01″';
        }
      }, 80);
    });
  }
});
