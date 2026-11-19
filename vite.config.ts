import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://dyjtcbdnaka51.cloudfront.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
