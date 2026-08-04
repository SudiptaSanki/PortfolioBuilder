// Form submission
const form = document.querySelector('.book-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.textContent = '[ REQUEST SENT ]';
    btn.style.backgroundColor = 'var(--text-color)';
    btn.style.color = 'var(--bg-color)';
    form.reset();
    setTimeout(() => {
        btn.textContent = 'Send Request';
        btn.style.backgroundColor = '';
        btn.style.color = '';
    }, 3000);
});