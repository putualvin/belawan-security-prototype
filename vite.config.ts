import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal typing for the Node env this config runs in (avoids adding @types/node).
declare const process: { env: Record<string, string | undefined> }

// Prototype config — host:true so stakeholders can open it from a phone on the LAN.
// VITE_BASE lets GitHub Pages build under /<repo>/ while local/Netlify use '/'.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
