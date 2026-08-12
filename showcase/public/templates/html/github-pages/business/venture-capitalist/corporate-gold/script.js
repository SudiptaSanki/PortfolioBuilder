// Navbar background on scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(10, 14, 23, 0.95)';
        nav.style.backdropFilter = 'blur(10px)';
        nav.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    } else {
        nav.style.background = 'transparent';
        nav.style.backdropFilter = 'none';
        nav.style.borderBottom = 'none';
    }
});

// Simple form handle
document.querySelector('.pitch-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = 'Received.';
    btn.style.background = '#2e8b57';
    btn.style.color = 'white';
    setTimeout(() => {
        btn.textContent = 'Submit Pitch';
        btn.style.background = '';
    }, 3000);
    e.target.reset();
});