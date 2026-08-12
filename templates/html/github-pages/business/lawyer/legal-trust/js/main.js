document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav-links');
  
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
      nav.style.flexDirection = 'column';
      nav.style.position = 'absolute';
      nav.style.top = '70px';
      nav.style.left = '0';
      nav.style.width = '100%';
      nav.style.background = 'var(--bg)';
      nav.style.padding = '20px';
      nav.style.boxShadow = '0 5px 10px rgba(0,0,0,0.1)';
    });
  }
});