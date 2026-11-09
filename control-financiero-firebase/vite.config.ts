import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  base: './',
  plugins: [react()],
  // Let Rollup split route-level dynamic imports automatically.
  // The former manualChunks rule forced every Firebase package into one
  // 966 kB chunk, including modules not needed on the first screen.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
