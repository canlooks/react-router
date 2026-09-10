import {spawnSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const require = createRequire(import.meta.url)
const profile = process.argv[2] || 'all'
if (!['all', 'baseline', 'regressions', 'coverage', 'watch'].includes(profile)) {
    throw new Error(`Unknown test profile: ${profile}`)
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const vitest = resolve(dirname(require.resolve('vitest/package.json')), 'vitest.mjs')
const args = [vitest, profile === 'watch' ? 'watch' : 'run', '--config', 'test/vitest.config.mts']
if (profile === 'coverage') args.push('--coverage')
args.push(...process.argv.slice(3))
const child = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
    env: {...process.env, ROUTER_TEST_PROFILE: profile}
})
if (child.error) throw child.error
process.exitCode = child.status ?? 1
