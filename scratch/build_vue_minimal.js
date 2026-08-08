const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = 'd:\\My Projects\\GitHub-Projects\\Portfolio Builder\\templates\\netlify\\creative\\vue-designer\\vue-vite\\vue-minimal';

// Create directories
fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
fs.mkdirSync(path.join(targetDir, 'src', 'views'), { recursive: true });

// 1. package.json
fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify({
  "name": "vue-minimal",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.21",
    "vue-router": "^4.3.0",
    "lucide-vue-next": "^0.359.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "vite": "^5.2.0"
  }
}, null, 2));

// 2. vite.config.js
fs.writeFileSync(path.join(targetDir, 'vite.config.js'), `
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './' // Important for relative paths in dist
})
`);

// 3. index.html
fs.writeFileSync(path.join(targetDir, 'index.html'), `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Minimalist Visual Studio | Vue Portfolio</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`);

// 4. src/main.js
fs.writeFileSync(path.join(targetDir, 'src', 'main.js'), `
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
`);

// 5. src/router.js
fs.writeFileSync(path.join(targetDir, 'src', 'router.js'), `
import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'
import About from './views/About.vue'
import Projects from './views/Projects.vue'
import Contact from './views/Contact.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/projects', component: Projects },
  { path: '/contact', component: Contact }
]

const router = createRouter({
  history: createWebHashHistory(), // use hash history so static file hosting works out of the box
  routes
})

export default router
`);

// 6. src/style.css
fs.writeFileSync(path.join(targetDir, 'src', 'style.css'), `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

:root {
  --bg-color: #fcfcfc;
  --text-color: #1a1a1a;
  --accent: #e2e8f0;
  --primary: #3b82f6;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 5%;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  font-weight: 600;
  font-size: 1.2rem;
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: #666;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.nav-links a:hover, .nav-links a.router-link-active {
  color: var(--text-color);
  font-weight: 500;
}

/* Main Container */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 5%;
  min-height: calc(100vh - 100px);
}

/* Typography */
h1 {
  font-size: 3.5rem;
  font-weight: 600;
  letter-spacing: -1.5px;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

p {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 2rem;
  max-width: 600px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background: var(--text-color);
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.9;
}

/* Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  background: #fff;
  border: 1px solid var(--accent);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s;
}

.card:hover {
  transform: translateY(-5px);
}

.card-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  background: #eee;
}

.card-content {
  padding: 1.5rem;
}

.card-content h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.card-content p {
  font-size: 0.95rem;
  margin-bottom: 0;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
`);

// 7. src/App.vue
fs.writeFileSync(path.join(targetDir, 'src', 'App.vue'), `
<template>
  <nav class="navbar">
    <div class="logo">Alex Designer</div>
    <div class="nav-links">
      <router-link to="/">Home</router-link>
      <router-link to="/projects">Projects</router-link>
      <router-link to="/about">About</router-link>
      <router-link to="/contact">Contact</router-link>
    </div>
  </nav>

  <main class="main-content">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
</template>
`);

// 8. src/views/Home.vue
fs.writeFileSync(path.join(targetDir, 'src', 'views', 'Home.vue'), `
<template>
  <div class="home">
    <div style="margin-top: 10vh;">
      <h1>Minimalist UI/UX<br/>& Vue Developer.</h1>
      <p>I craft clean, fast, and accessible digital experiences using Vue.js and modern design principles. Less is more.</p>
      <router-link to="/projects" class="btn">View My Work</router-link>
    </div>
  </div>
</template>
`);

// 9. src/views/Projects.vue
fs.writeFileSync(path.join(targetDir, 'src', 'views', 'Projects.vue'), `
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
`);

// 10. src/views/About.vue
fs.writeFileSync(path.join(targetDir, 'src', 'views', 'About.vue'), `
<template>
  <div class="about" style="max-width: 800px;">
    <h2 style="font-size: 2.5rem; margin-bottom: 2rem;">About Me</h2>
    <p>I'm a designer and developer who believes in the power of simplicity. For the past 5 years, I've been helping startups build products that are both beautiful and highly functional.</p>
    <p>My stack includes Vue 3, Vite, Tailwind CSS, and Figma.</p>
  </div>
</template>
`);

// 11. src/views/Contact.vue
fs.writeFileSync(path.join(targetDir, 'src', 'views', 'Contact.vue'), `
<template>
  <div class="contact" style="max-width: 600px;">
    <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">Let's talk</h2>
    <p>Have a project in mind? Feel free to reach out.</p>
    
    <form @submit.prevent style="display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem;">
      <input type="text" placeholder="Name" style="padding: 1rem; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; font-size: 1rem;" />
      <input type="email" placeholder="Email" style="padding: 1rem; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; font-size: 1rem;" />
      <textarea placeholder="Message" rows="5" style="padding: 1rem; border: 1px solid #ccc; border-radius: 6px; font-family: inherit; font-size: 1rem; resize: vertical;"></textarea>
      <button class="btn" style="border: none; cursor: pointer; justify-content: center; font-size: 1rem;">Send Message</button>
    </form>
  </div>
</template>
`);

console.log('Template source generated successfully.');

// Now let's run npm install and npm run build
try {
  console.log('Running npm install...');
  execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
  console.log('Running npm run build...');
  execSync('npm run build', { cwd: targetDir, stdio: 'inherit' });
  console.log('Build complete!');
} catch (e) {
  console.error('Error during build:', e.message);
}
