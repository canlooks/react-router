import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: [
            path.join(__dirname, 'vitest.setup.ts'),
        ],
        include: [
            '**/*.test.ts',
            '**/*.test.tsx'
        ],
        globals: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../src'),
        }
    }
})
