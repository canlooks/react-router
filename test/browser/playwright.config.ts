import {defineConfig, devices} from '@playwright/test'

const loopbackNoProxy = ['127.0.0.1', 'localhost', process.env.NO_PROXY]
    .filter(Boolean)
    .join(',')
process.env.NO_PROXY = loopbackNoProxy
process.env.no_proxy = loopbackNoProxy

export default defineConfig({
    testDir: '.',
    testMatch: '**/*.browser.spec.ts',
    outputDir: 'results',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: 'line',
    use: {
        baseURL: 'http://127.0.0.1:4173',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure'
    },
    webServer: {
        command: 'npm run test:browser:serve',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: false,
        timeout: 120_000
    },
    projects: [
        {
            name: 'Chrome',
            use: {...devices['Desktop Chrome'], channel: 'chrome'}
        },
        {
            name: 'Edge',
            use: {...devices['Desktop Edge'], channel: 'msedge'}
        },
        {
            name: 'Firefox',
            use: {
                ...devices['Desktop Firefox'],
                launchOptions: {
                    firefoxUserPrefs: {'accessibility.tabfocus': 7}
                }
            }
        }
    ]
})
