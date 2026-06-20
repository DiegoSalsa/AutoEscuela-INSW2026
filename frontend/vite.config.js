import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 443,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://146.83.198.35:1347',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 443,
    strictPort: true,
  },
});
