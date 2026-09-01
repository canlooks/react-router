import assert from 'node:assert/strict'
import {execFileSync, spawnSync} from 'node:child_process'
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const supportedNodeMajors = [18, 20, 22, 24]
const expectedExportCount = 31
const projectDirectory = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'canlooks-router-node-matrix-'))
const consumerDirectory = join(temporaryDirectory, 'consumer')
const localReactDirectory = join(projectDirectory, 'node_modules', 'react')
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npmCli = process.env.npm_execpath

function npmCommand(args) {
    return npmCli
        ? {executable: process.execPath, args: [npmCli, ...args]}
        : {executable: npmExecutable, args}
}

function runNpm(args, options) {
    const command = npmCommand(args)
    return execFileSync(command.executable, command.args, options)
}

function runNpmResult(args, options) {
    const command = npmCommand(args)
    return spawnSync(command.executable, command.args, options)
}

function assertMatrixEntry(version, format, scriptFile) {
    const result = runNpmResult(
        [
            'exec',
            '--yes',
            `--package=node@${version}`,
            '--',
            'node',
            scriptFile
        ],
        {
            cwd: consumerDirectory,
            encoding: 'utf8',
            env: {...process.env, FORCE_COLOR: '0'}
        }
    )

    assert.equal(
        result.status,
        0,
        `Node ${version} ${format} consumer failed:\n${result.stdout}${result.stderr}`
    )
    assert.doesNotMatch(
        result.stderr,
        /MODULE_TYPELESS_PACKAGE_JSON/,
        `Node ${version} ${format} emitted a module-type warning`
    )
    const summary = result.stdout.trim()
    assert.match(summary, new RegExp(`^v${version}\\..*:${format}:${expectedExportCount}$`))
    console.log(summary)
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

    writeFileSync(
        join(consumerDirectory, 'matrix-esm.mjs'),
        `import * as api from '@canlooks/react-router';
        if (!api.Router || !api.matchPath || Object.keys(api).length !== ${expectedExportCount}) {
            process.exit(1)
        }
        console.log(process.version + ':esm:' + Object.keys(api).length)\n`
    )
    writeFileSync(
        join(consumerDirectory, 'matrix-cjs.cjs'),
        `const api = require('@canlooks/react-router');
        if (!api.Router || !api.matchPath || Object.keys(api).length !== ${expectedExportCount}) {
            process.exit(1)
        }
        console.log(process.version + ':cjs:' + Object.keys(api).length)\n`
    )

    for (const version of supportedNodeMajors) {
        assertMatrixEntry(version, 'esm', 'matrix-esm.mjs')
        assertMatrixEntry(version, 'cjs', 'matrix-cjs.cjs')
    }

    console.log('Tarball Node 18/20/22/24 ESM/CJS matrix passed.')
} finally {
    const resolvedTemporaryDirectory = join(temporaryDirectory)
    if (resolvedTemporaryDirectory.startsWith(tmpdir()) &&
        resolvedTemporaryDirectory.includes('canlooks-router-node-matrix-')) {
        rmSync(resolvedTemporaryDirectory, {recursive: true, force: true})
    }
}
