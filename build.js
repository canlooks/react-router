const childProcess = require('child_process')
const path = require('path')

async function _() {
    await exec('shx rm -rf dist')
    await Promise.all([
        exec('tsc -p tsconfig.esm.json'),
        exec('tsc -p tsconfig.cjs.json')
    ])
    console.log('done.')
}

function exec(command) {
    return new Promise((resolve, reject) => {
        childProcess.exec(path.join(__dirname, 'node_modules/.bin', command), (err, stdout) => {
            stdout && console.error(stdout)
            err ? reject(err) : resolve(stdout)
        })
    })
}

_()