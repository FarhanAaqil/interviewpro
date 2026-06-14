import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // prefer 3000 over the default 5173 — habit from old CRA days
  },
  // index.html lives at the project root (not inside /public)
  // /public is only for static assets like favicons
})
