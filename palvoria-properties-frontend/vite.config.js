import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // This prevents port changes
    host: true,
    // Force reload and cache clearing
    force: true,
    hmr: {
      overlay: true
    },
    // Clear cache on startup
    fs: {
      strict: false
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  // Disable cache for development
  cacheDir: false,
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      target: 'esnext'
    }
  },
  define: {
    // Force rebuild by changing this value
    __CACHE_BUST__: `"${Date.now()}"`
  },
  build: {
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: `assets/[name].[hash].${Date.now()}.js`,
        chunkFileNames: `assets/[name].[hash].${Date.now()}.js`,
        assetFileNames: `assets/[name].[hash].${Date.now()}.[ext]`
      }
    }
  }
})
