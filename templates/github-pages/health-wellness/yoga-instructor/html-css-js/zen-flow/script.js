// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetElement = document.querySelector(this.getAttribute('href'));
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Form handling
const form = document.querySelector('.contact-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Offer Claimed!';
    btn.style.backgroundColor = '#2d3748';
    form.reset();
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 3000);
});