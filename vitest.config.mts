import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'smoke',
          include: ['test/smoke/**/*.test.ts'],
          environment: 'node',
          // Runs against a live deployment, cold starts included.
          testTimeout: 60_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
})
