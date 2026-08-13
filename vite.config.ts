import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              output: {
                // Rolldown emits `require()` for externalized Node builtins even in the ESM
                // bundle, and ESM has no `require`. Define one so those calls resolve.
                banner:
                  "import { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);",
              },
            },
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: 'electron/preload.ts',
      },
      // No `renderer` option: `nodeIntegration` is disabled in the Main process and the
      // Renderer talks to the local express server instead of using Node.js APIs directly.
    }),
  ],
})
