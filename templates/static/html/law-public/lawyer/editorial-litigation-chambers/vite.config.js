import { defineConfig } from 'vite';

/**
 * Vite is optional here: the page runs as-is on any static host because GSAP,
 * ScrollTrigger and Lenis are vendored under ./vendor and the site's own code
 * is a plain ES module. `base: './'` keeps every URL relative so a built copy
 * works from a domain root (https://sudiptasanki.github.io/PortfolioBuilder/law-public/lawyer/editorial-litigation-chambers/) or from a sub-path.
 */
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: false,
    allowedHosts: true
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
    chunkSizeWarningLimit: 900
  }
});
