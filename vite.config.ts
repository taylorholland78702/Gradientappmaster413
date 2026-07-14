import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    // Using SWC instead of Babel for faster builds and no size limits
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Split vendor deps into their own chunk so they're cached separately
        // from app code (which changes on every edit) — firebase in particular
        // is large and otherwise gets re-downloaded on every deploy even when
        // it hasn't changed.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          icons: ['@phosphor-icons/react'],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },

  // Cross-origin isolation would enable the multi-threaded ffmpeg.wasm core
  // (SharedArrayBuffer) used by video export — see useVCRPlayback's loadFFmpeg.
  // COOP is deliberately 'same-origin-allow-popups' rather than the stricter
  // 'same-origin': the strict value blocks Firebase's signInWithPopup/
  // linkWithPopup (the opener can no longer see the popup complete, so
  // Google/email sign-in just silently fails). That means crossOriginIsolated
  // is false here and video export always uses ffmpeg's slower single-thread
  // core (useVCRPlayback already falls back to it automatically when
  // crossOriginIsolated is false — no error, just slower encoding). CORP is
  // required alongside COEP so same-origin worker chunks (e.g. ffmpeg's own
  // worker.js) aren't blocked by the embedder policy.
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
