// Form submit
const form = document.querySelector('.contact-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Sent Successfully';
    btn.style.backgroundColor = '#222';
    btn.style.color = 'white';
    form.reset();
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = 'transparent';
        btn.style.color = '#222';
    }, 3000);
});