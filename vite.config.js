import { defineConfig } from 'vite';
import { copyFileSync } from 'fs';

// Custom plugin to copy geff-schema.json to dist
function copyGeffSchema() {
  return {
    name: 'copy-geff-schema',
    closeBundle() {
      copyFileSync('geff-schema.json', 'dist/geff-schema.json');
    }
  };
}

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
  },
  plugins: [copyGeffSchema()]
});
