import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // Expose on local network (access from phone during dev)
    port: 5173,
  },
});
