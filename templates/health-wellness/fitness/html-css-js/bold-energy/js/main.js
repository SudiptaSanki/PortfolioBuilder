// Fitness / Trainer JS
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      alert("Thanks! I'll be in touch within 24 hours.");
      form.reset();
    });
  }
});
