import {fileURLToPath} from 'node:url'
import {defineConfig} from 'vitest/config'

const profile = process.env.ROUTER_TEST_PROFILE || 'all'
export default defineConfig({
    root: fileURLToPath(new URL('..', import.meta.url)),
    test: {
        environment: 'jsdom',
        environmentOptions: {jsdom: {url: 'https://router.test/'}},
        setupFiles: ['test/setup.ts'],
        include: profile === 'regressions'
            ? ['test/regressions/**/*.test.{ts,tsx}']
            : ['test/**/*.test.{ts,tsx}'],
        exclude: profile === 'baseline' ? ['test/regressions/**', 'node_modules/**'] : ['node_modules/**'],
        maxWorkers: 4,
        testTimeout: 5000,
        allowOnly: false,
        reporters: [
            'default',
            ['json', {outputFile: `test/reports/${profile}/results.json`}],
            ['junit', {outputFile: `test/reports/${profile}/junit.xml`}]
        ],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            reporter: ['text', 'html', 'json-summary', 'lcov'],
            reportsDirectory: 'test/coverage',
            reportOnFailure: true,
            thresholds: {statements: 95, branches: 90, functions: 95, lines: 95}
        }
    }
})
