import { defineConfig } from 'vite'

export default defineConfig({
  // Set base to your repository name for GitHub Pages
  // Change 'zarr-validator' to your actual repository name if different
  base: process.env.NODE_ENV === 'production' ? '/zarr-validator/' : '/',
  root: '.',
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild'
  },
  css: {
    devSourcemap: true
  }
})
