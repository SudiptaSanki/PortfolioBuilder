// Earth Harvest - CSA Box Builder
document.addEventListener('DOMContentLoaded', () => {
  console.log('Earth Harvest Box Builder initialized.');

  // Configurator State
  let basePrice = 25;
  let selectedSize = 'Small';
  let addons = [];

  // DOM Elements
  const sizeOptions = document.querySelectorAll('.size-option');
  const addonCheckboxes = document.querySelectorAll('.addon-cb');
  const selectedSizeDisplay = document.getElementById('selected-size-display');
  const basePriceDisplay = document.getElementById('base-price-display');
  const addonsListContainer = document.getElementById('addons-list');
  const totalPriceDisplay = document.getElementById('total-price-display');

  // Handle Size Selection
  sizeOptions.forEach(option => {
    option.addEventListener('click', () => {
      // Remove active from others
      sizeOptions.forEach(o => o.classList.remove('active'));
      
      // Set active
      option.classList.add('active');
      
      // Update state
      basePrice = parseFloat(option.getAttribute('data-price'));
      selectedSize = option.getAttribute('data-size') + ' Box';
      
      // Update UI displays
      selectedSizeDisplay.textContent = selectedSize;
      basePriceDisplay.textContent = `$${basePrice.toFixed(2)}`;
      
      updateTotal();
    });
  });

  // Handle Addon Selection
  addonCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const price = parseFloat(cb.value);
      const name = cb.getAttribute('data-name');
      
      if (cb.checked) {
        // Add to list
        addons.push({ name, price });
      } else {
        // Remove from list
        addons = addons.filter(item => item.name !== name);
      }
      
      renderAddonsSummary();
      updateTotal();
    });
  });

  // Render Addons list on side panel
  function renderAddonsSummary() {
    addonsListContainer.innerHTML = '';
    
    if (addons.length === 0) {
      addonsListContainer.innerHTML = '<p class="empty-addons-note">No extra goods added yet.</p>';
      return;
    }

    addons.forEach(addon => {
      const row = document.createElement('div');
      row.className = 'addon-summary-item';
      row.innerHTML = `
        <span>+ ${addon.name}</span>
        <span>$${addon.price.toFixed(2)}</span>
      `;
      addonsListContainer.appendChild(row);
    });
  }

  // Calculate & Display Total
  function updateTotal() {
    const addonsTotal = addons.reduce((sum, item) => sum + item.price, 0);
    const grandTotal = basePrice + addonsTotal;
    
    totalPriceDisplay.textContent = `$${grandTotal.toFixed(2)}`;
  }
});
