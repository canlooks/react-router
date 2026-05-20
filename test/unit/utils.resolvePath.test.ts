import { describe, it, expect } from 'vitest'
import { resolvePath } from '../../src/utils'

describe('resolvePath', () => {
    it('should treat non-absolute to as segment under empty base', () => {
        expect(resolvePath('b', '/a')).toBe('b')
    })

    it('should resolve relative to parent base', () => {
        expect(resolvePath('c', '/a/b')).toBe('/a/c')
    })

    it('should treat absolute to as final path', () => {
        expect(resolvePath('/c', '/a/b')).toBe('/c')
    })

    it('should append query string to base', () => {
        expect(resolvePath('?q=1', '/a/b')).toBe('/a/b/?q=1')
    })

    it('should append hash to base', () => {
        expect(resolvePath('#hash', '/a/b')).toBe('/a/b/#hash')
    })

    it('should return full URL for HTTP protocol to', () => {
        expect(resolvePath('http://x.com', '/a')).toBe('http://x.com')
    })

    it('should return URL href for URL instance', () => {
        expect(resolvePath(new URL('http://x.com'), null)).toBe('http://x.com/')
    })

    it('should resolve parent directory reference', () => {
        expect(resolvePath('../d', '/a/b/c')).toBe('/a/d')
    })

    it('should resolve parent on path with trailing slash', () => {
        expect(resolvePath('..', '/a/b/')).toBe('')
    })

    it('should return to as-is when fromPath is null', () => {
        expect(resolvePath('b', null)).toBe('b')
    })
})
