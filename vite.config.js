import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import dotenv from 'dotenv'
import { resolvePaletteCatalogS3UrlFromRecord } from './modules/utils/paletteCatalogS3Url.mjs'

// Load .env so EXPRESS_PORT / VITE_DEV_PORT / VITE_API_PORT are set (see docs/REPLICATE-PORTS-CONFIG.md)
dotenv.config({ path: path.join(process.cwd(), '.env') })

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Merge file env + shell/CI env so GitHub Actions `env: S3_*` is visible at build time.
  const fromFiles = loadEnv(mode, process.cwd(), ['S3_', 'VITE_'])
  const merged = { ...process.env, ...fromFiles }

  const catalogResolved = resolvePaletteCatalogS3UrlFromRecord(merged)
  const awsRegion = (merged.AWS_REGION || merged.S3_REGION || '').trim()

  const viteDevPort = parseInt(merged.VITE_DEV_PORT, 10) || parseInt(merged.VITE_PORT, 10) || 5174
  const apiPort = parseInt(merged.VITE_API_PORT, 10) || parseInt(merged.EXPRESS_PORT, 10) || 3001
  const proxyTarget = merged.VITE_PROXY_TARGET || `http://localhost:${apiPort}`
  const base = merged.VITE_BASE || '/'

  return {
    base,
    publicDir: 'public',
    define: {
      // Baked into client so static hosts (GitHub Pages) get the catalog URL without relying on
      // Vite's import.meta.env file-only loading for S3_*.
      'import.meta.env.AWS_REGION': JSON.stringify(awsRegion),
      'import.meta.env.S3_PALETTE_CATALOG_RESOLVED': JSON.stringify(catalogResolved),
    },
    envPrefix: ['VITE_', 'S3_'],
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.')
      }
    },
    server: {
      port: viteDevPort,
      strictPort: false,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      }
    }
  }
})
