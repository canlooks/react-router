import {mkdir, writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'

const esmDirectory = fileURLToPath(new URL('../dist/esm/', import.meta.url))

await mkdir(esmDirectory, {recursive: true})
await writeFile(
    new URL('../dist/esm/package.json', import.meta.url),
    JSON.stringify({type: 'module'}, null, 2) + '\n',
    'utf8'
)
