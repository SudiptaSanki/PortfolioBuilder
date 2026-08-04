// Form submission
const form = document.querySelector('.glam-form');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        const ogText = btn.textContent;
        btn.textContent = 'Received. Thank You.';
        form.reset();
        setTimeout(() => {
            btn.textContent = ogText;
        }, 3000);
    });
}