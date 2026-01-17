import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'crypto.hash': 'undefined' // disables broken usage if any package tries it
  }
});
