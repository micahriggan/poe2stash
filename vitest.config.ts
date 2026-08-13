import { defineConfig } from 'vitest/config'

// Deliberately separate from vite.config.ts: the electron plugin there builds and
// launches the Main process, which has no place in a unit test run.
export default defineConfig({
  test: {
    // `test/proxy.test.ts` is a manual script that hits the live trade API, not a unit test.
    include: ['src/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
  },
})
