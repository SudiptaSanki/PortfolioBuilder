// Form simulation
const form = document.querySelector('.action-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    const ogText = btn.textContent;
    btn.textContent = 'Welcome to the team!';
    btn.style.backgroundColor = 'var(--primary-red)';
    form.reset();
    setTimeout(() => {
        btn.textContent = ogText;
        btn.style.backgroundColor = '';
    }, 3000);
});