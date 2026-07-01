import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const isAnalyze = process.env.ANALYZE === 'true'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    isAnalyze && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@xenova/transformers': resolve(__dirname, 'node_modules/@xenova/transformers/dist/transformers.js'),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
  appType: 'mpa',
  server: {
    fs: {
      allow: ['.'],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
})
