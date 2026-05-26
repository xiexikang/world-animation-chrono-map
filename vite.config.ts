import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const WIKI_UA =
  'WorldAnimationChronoMap/1.0 (local-dev; contact: dev@localhost)'

function wikiProxyConfig() {
  return {
    target: 'https://upload.wikimedia.org',
    changeOrigin: true,
    secure: true,
    timeout: 30_000,
    rewrite: (p: string) => p.replace(/^\/cover-proxy/, ''),
    configure: (proxy: {
      on: (
        ev: string,
        fn: (...args: unknown[]) => void,
      ) => void
    }) => {
      proxy.on('proxyReq', (proxyReq: { setHeader: (k: string, v: string) => void }) => {
        proxyReq.setHeader('User-Agent', WIKI_UA)
        proxyReq.setHeader('Accept', 'image/*,*/*')
      })
      proxy.on('error', (err: Error) => {
        console.warn('[cover-proxy]', err.message)
      })
    },
  }
}

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 2500,
    allowedHosts: true,
    proxy: {
      '/cover-proxy': wikiProxyConfig(),
      '/placehold-proxy': {
        target: 'https://placehold.co',
        changeOrigin: true,
        secure: true,
        timeout: 30_000,
        rewrite: (p: string) => p.replace(/^\/placehold-proxy/, ''),
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
