import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const projectDirectory = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'canlooks-router-consumer-'))
const consumerDirectory = join(temporaryDirectory, 'consumer')
const localReactDirectory = join(projectDirectory, 'node_modules', 'react')
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npmCli = process.env.npm_execpath

function runNpm(args, options) {
    return npmCli
        ? execFileSync(process.execPath, [npmCli, ...args], options)
        : execFileSync(npmExecutable, args, options)
}

try {
    const packOutput = runNpm(
        ['pack', '--json', '--pack-destination', temporaryDirectory],
        {cwd: projectDirectory, encoding: 'utf8'}
    )
    const [{filename}] = JSON.parse(packOutput)
    const tarball = join(temporaryDirectory, filename)

    mkdirSync(consumerDirectory)
    writeFileSync(
        join(consumerDirectory, 'package.json'),
        JSON.stringify({private: true, type: 'module'}, null, 2) + '\n'
    )
    runNpm(
        ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball, localReactDirectory],
        {cwd: consumerDirectory, stdio: 'pipe'}
    )

    const installedEsmBoundary = JSON.parse(readFileSync(
        join(consumerDirectory, 'node_modules', '@canlooks', 'react-router', 'dist', 'esm', 'package.json'),
        'utf8'
    ))
    assert.equal(installedEsmBoundary.type, 'module')

    writeFileSync(
        join(consumerDirectory, 'esm.mjs'),
        "import * as api from '@canlooks/react-router'; if (!api.Router || !api.matchPath) process.exit(1)\n"
    )
    writeFileSync(
        join(consumerDirectory, 'cjs.cjs'),
        "const api = require('@canlooks/react-router'); if (!api.Router || !api.matchPath) process.exit(1)\n"
    )

    const esmOutput = execFileSync(process.execPath, ['esm.mjs'], {
        cwd: consumerDirectory,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    })
    const cjsOutput = execFileSync(process.execPath, ['cjs.cjs'], {
        cwd: consumerDirectory,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    })
    assert.equal(esmOutput, '')
    assert.equal(cjsOutput, '')
    console.log(`Tarball consumer smoke test passed on Node ${process.versions.node}.`)
} finally {
    const resolvedTemporaryDirectory = join(temporaryDirectory)
    if (resolvedTemporaryDirectory.startsWith(tmpdir()) &&
        resolvedTemporaryDirectory.includes('canlooks-router-consumer-')) {
        rmSync(resolvedTemporaryDirectory, {recursive: true, force: true})
    }
}
