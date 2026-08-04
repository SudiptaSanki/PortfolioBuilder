// Academic publication filtering
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Toggle active button
        document.querySelector('.filter-btn.active').classList.remove('active');
        btn.classList.add('active');
        
        const filterType = btn.getAttribute('data-type');
        document.querySelectorAll('.pub-item').forEach(item => {
            if (filterType === 'all' || item.getAttribute('data-type') === filterType) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
});