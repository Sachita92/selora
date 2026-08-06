import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true, // fail loudly if 5173 is busy instead of silently switching ports
  },
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  define: {
    // Needed by @solana/web3.js in browser
    'global': 'globalThis',
    'process.env': {},
    'process.version': '"v18.0.0"',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
})