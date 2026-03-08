import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'

// https://vite.dev/config/
export default defineConfig({
  server: {
    open: true,
  },
  plugins: [
    glsl(),
  ],
})
