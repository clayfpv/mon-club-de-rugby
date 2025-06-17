import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path" // <-- Importer 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- AJOUT DE CETTE SECTION ---
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})