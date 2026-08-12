// Servo Motion - Scrolling Gallery
document.addEventListener('DOMContentLoaded', () => {
  // Pause animations on scroll for performance
  let scrollTimeout;
  const allAnimated = document.querySelectorAll('[class*="scroll-"]');

  // Optional: Speed modulation based on viewport scroll
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // Resume normal speed after scroll stops
    }, 150);
  });

  console.log('Servo Motion portfolio loaded.');
});
