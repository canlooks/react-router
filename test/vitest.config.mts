import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'node:url'

const testDirectory = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: [path.join(testDirectory, 'vitest.setup.ts')],
        include: ['test/**/*.test.{ts,tsx}'],
        globals: true,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            reportsDirectory: 'test/coverage',
            reporter: ['text', 'html', 'json-summary'],
            thresholds: {
                statements: 100,
                branches: 99,
                functions: 100,
                lines: 100,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(testDirectory, '../src'),
        },
    },
})
