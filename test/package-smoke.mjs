import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {existsSync, readFileSync} from 'node:fs'

import * as esmApi from '@canlooks/react-router'

const require = createRequire(import.meta.url)
const cjsApi = require('@canlooks/react-router')
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

const publicRuntimeExports = [
    'Link',
    'Navigate',
    'Outlet',
    'Redirect',
    'RouteLayoutStackIndex',
    'RouteStack',
    'Router',
    'RouterContext',
    'Routes',
    'dropEndSlash',
    'dropStartSlash',
    'isUnset',
    'joinPath',
    'matchPath',
    'resolvePath',
    'truncatePath',
    'unifyPath',
    'unifySlash',
    'useCurrentRoute',
    'useNavigate',
    'useOutlet',
    'useParams',
    'useQuery',
    'useResolvePath',
    'useRouteLayoutStack',
    'useRouteLayoutStackIndex',
    'useRouteStack',
    'useRouter',
    'useSearchParams',
    'useSync',
    'useSyncState',
]

for (const name of publicRuntimeExports) {
    assert.ok(name in esmApi, `ESM build is missing the public export "${name}"`)
    assert.ok(name in cjsApi, `CommonJS build is missing the public export "${name}"`)
}

assert.equal(esmApi.unifyPath('/app/'), 'app')
assert.equal(cjsApi.unifyPath('/app/'), 'app')
assert.deepEqual(esmApi.matchPath('/users/42', '/users/:id'), {id: '42'})
assert.deepEqual(cjsApi.matchPath('/users/42', '/users/:id'), {id: '42'})

for (const field of ['main', 'module', 'types']) {
    assert.equal(typeof packageJson[field], 'string', `package.json is missing "${field}"`)
    assert.ok(
        existsSync(new URL(`../${packageJson[field]}`, import.meta.url)),
        `Published entry "${packageJson[field]}" does not exist`,
    )
}

console.log(`Package smoke test passed for ${publicRuntimeExports.length} public runtime exports.`)
