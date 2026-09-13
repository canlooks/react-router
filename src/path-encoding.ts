/**
 * Convert static path text to the representation used by URL.pathname.
 * Existing percent escapes and ASCII punctuation are intentionally preserved.
 */
export function encodePathText(path: string) {
    return path.replace(/[\u0080-\uFFFF ]+/g, text => {
        const url = new URL('https://router.invalid/')
        url.pathname = '/' + text
        return url.pathname.slice(1)
    })
}
