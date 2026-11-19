import { defineConfig } from 'vite';

/**
 * Vite config tuned for local dev and any plain static host.
 *
 * `base: './'` keeps every asset URL relative, so the sanctuary loads from the
 * domain root (e.g. a shared subpath shard) or a sub-path. No plugin is needed: the
 * terrain, wildlife and audio are plain ES modules, and index.html carries an
 * import map so the same folder also runs with zero build on a static sandbox.
 */
export default defineConfig({
  base: './',
  publicDir: 'public',
  server: {
    host: true,
    port: 5174,
    strictPort: false,
    open: false,
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
