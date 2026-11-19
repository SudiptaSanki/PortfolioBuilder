import { defineConfig } from 'vite';

/**
 * Vite config tuned for local dev and any plain static host.
 *
 * `base: './'` keeps every asset URL relative, so the same folder works from a
 * domain root (e.g. a shared subpath shard), a sub-path, or `python -m http.server`.
 * No plugin is needed: the scene, the hardware rig, the audio graph and the UI
 * are all plain ES modules, and index.html carries an import map for `three`,
 * `gsap` and `lenis` so the site also runs with zero build.
 */
export default defineConfig({
  base: './',
  publicDir: 'public',
  server: {
    host: true,
    port: 5174,
    strictPort: false,
    open: false,
    // CodeSandbox proxies the dev server through its own host.
    allowedHosts: true,
    hmr: { overlay: true }
  },
  preview: {
    host: true,
    port: 4174,
    strictPort: false,
    allowedHosts: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // three.js is ~700 kB minified; that is expected, not a mistake.
    chunkSizeWarningLimit: 1600
  },
  optimizeDeps: {
    include: ['three', 'gsap', 'gsap/ScrollTrigger', 'lenis']
  }
});
