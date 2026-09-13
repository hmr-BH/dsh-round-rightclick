import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/**/*.spec.tsx', 'jsdom'],
      ['tests/**/*.client.spec.ts', 'jsdom'],
    ],
  },
  esbuild: {
    jsx: 'automatic',
  },
})
