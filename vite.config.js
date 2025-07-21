import { defineConfig } from 'vite'

export default defineConfig({
  // Set base to your repository name for GitHub Pages
  // Change 'geff-site' to your actual repository name if different
  base: process.env.NODE_ENV === 'production' ? '/geff-site/' : '/',
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
