/* Musician JS */
document.addEventListener('DOMContentLoaded', () => {
  // Simple interactions
  const btns = document.querySelectorAll('.tour-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.textContent = 'SOLD OUT';
      e.target.style.background = '#333';
      e.target.style.borderColor = '#333';
      e.target.style.color = '#fff';
      e.target.style.cursor = 'not-allowed';
    });
  });
});
