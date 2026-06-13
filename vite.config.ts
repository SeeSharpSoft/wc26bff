import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// The site is hosted under https://seesharpsoft.github.io/wc26bff/, so the
// production build must use that sub-path as its base. The dev server (and the
// Playwright e2e suite) keep the root base so `/` keeps working locally.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/wc26bff/' : '/',
  plugins: [react()],
}))
