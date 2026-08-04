// Form submission handler
const form = document.querySelector('.newsletter-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Subscribed';
    btn.style.backgroundColor = '#2b2b2b';
    form.reset();
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 3000);
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});