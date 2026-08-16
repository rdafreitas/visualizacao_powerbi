// apps/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Caminhos relativos: essencial para funcionar ao abrir o index.html
  // diretamente no browser sem servidor (modo offline/SPA).
  base: './',

  server: {
    port: 5173,
  },

  build: {
    // Saída na raiz do monorepo — fácil de localizar e abrir offline.
    outDir: '../../dist',
    emptyOutDir: true,
  },
});
