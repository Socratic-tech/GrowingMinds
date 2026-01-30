import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: Change this to match your repo name
export default defineConfig({
  base: '/growingminds-beta/',
  plugins: [react()],
})

