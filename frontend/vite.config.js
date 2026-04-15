import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind IPv4 explicitly — avoids mismatch when "localhost" resolves to ::1 only.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: '/',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
