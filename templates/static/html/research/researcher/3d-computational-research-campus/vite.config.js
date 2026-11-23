import { defineConfig } from 'vite';

/**
 * Vite config for local development and for any static host.
 *
 * `base: './'` keeps every asset URL relative, so the built site works from a
 * domain root (https://sudiptasanki.github.io/PortfolioBuilder/research/researcher/3d-computational-research-campus/) or from a sub-path without changes. No
 * plugin is required: the scene, audio and UI are plain ES modules, and the
 * import map in index.html already points at esm.sh for the zero-build path.
 */
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: false,
    allowedHosts: true,
    hmr: { overlay: true }
  },
  preview: {
    host: true,
    port: 4173,
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
