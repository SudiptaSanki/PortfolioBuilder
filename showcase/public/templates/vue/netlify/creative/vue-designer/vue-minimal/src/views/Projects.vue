
<template>
  <div class="projects">
    <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">Selected Projects</h2>
    <div class="grid">
      <div class="card" v-for="i in 3" :key="i">
        <img class="card-img" :src="'https://raw.githubusercontent.com/Alex-DevDrift/Assets/refs/heads/main/portfoliobuilders/preview-' + i + '.png'" alt="Project Image" @error="handleImgError" />
        <div class="card-content">
          <h3>E-Commerce Dashboard</h3>
          <p>A minimalist admin dashboard built with Vue 3 and Vite.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const handleImgError = (e) => {
  e.target.src = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'
}
</script>
