import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['packages/**/src/**/*.test.ts', 'backend/src/**/*.{test,spec}.ts'],
    environment: 'node',
    setupFiles: ['backend/src/test/setup-env.ts'],
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: [
        'packages/*/src/**/*.test.ts',
        'packages/*/src/index.ts',
        'packages/*/src/__fixtures__/**',
      ],
    },
  },
})
