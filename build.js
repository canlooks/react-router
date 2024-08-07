const {promises: fs} = require('fs')
const path = require('path')

function generateTsconfig(directory = '') {
    const fn = (type) => fs.writeFile(
        path.resolve(directory, `tsconfig.${type}.json`),
        directory
            // 子目录的tsconfig
            ? `
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "module": "${type === 'cjs' ? 'CommonJS' : 'ESNext'}"
    },
    "include": [
        "**/*${type === 'cjs' ? '.ts' : '.mts'}"
    ]
}
            `
            // 根目录的tsconfig
            : `
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "module": "${type === 'cjs' ? 'CommonJS' : 'ESNext'}",
        "outDir": "dist/${type}"
    }
}
        `
    )
    return Promise.all([
        fn('cjs'),
        fn('esm')
    ])
}

generateTsconfig()