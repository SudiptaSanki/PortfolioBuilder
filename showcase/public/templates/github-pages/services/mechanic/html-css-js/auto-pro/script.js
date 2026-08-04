// Form submission handling
const form = document.querySelector('.form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Request Sent!';
    btn.style.backgroundColor = '#111111';
    form.reset();
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 3000);
});