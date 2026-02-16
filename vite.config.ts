import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/miranda-republic/',
  plugins: [react(), tailwindcss()],
  test: {
    include: ['src/test/**/*.test.ts'],
    exclude: ['src/test/cross-browser.test.ts'],
    testTimeout: 30000,
  },
})
