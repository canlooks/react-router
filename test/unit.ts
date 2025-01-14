export function unifySlash(path: string) {
    return path
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
}

const path = '/a//\\/bd/s'

console.log(7, unifySlash(path))