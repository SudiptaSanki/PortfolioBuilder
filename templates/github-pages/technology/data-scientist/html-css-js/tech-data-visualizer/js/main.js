document.addEventListener('DOMContentLoaded', () => {
  const dockItems = document.querySelectorAll('.dock-item');
  
  // Update active state based on click
  dockItems.forEach(item => {
    item.addEventListener('click', function() {
      dockItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });
});
