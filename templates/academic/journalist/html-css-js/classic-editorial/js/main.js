// Journalist JS — minimal, mostly pure CSS driven design
document.addEventListener('DOMContentLoaded', () => {
  // Highlight current nav link
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-bar a').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
    else a.classList.remove('active');
  });
});
