import { describe, it, expect } from 'vitest'
import { joinPath } from '../../src/utils'

describe('joinPath', () => {
    it('should join two simple segments', () => {
        expect(joinPath('a', 'b')).toBe('a/b')
    })

    it('should normalize trailing slash on prev and leading slash on next', () => {
        expect(joinPath('a/', '/b')).toBe('/b')
    })

    it('should handle empty first argument', () => {
        expect(joinPath('', 'b')).toBe('b')
    })

    it('should handle empty second argument', () => {
        expect(joinPath('a', '')).toBe('a')
    })

    it('should treat absolute next path as winner', () => {
        expect(joinPath('a', '/b')).toBe('/b')
    })

    it('should preserve protocol URL as base', () => {
        expect(joinPath('http://a.com', 'b')).toBe('http:/a.com/b')
    })

    it('should resolve one-level parent reference', () => {
        expect(joinPath('a/b/c', '../d')).toBe('a/b/d')
    })

    it('should resolve two-level parent reference', () => {
        expect(joinPath('a/b/c', '../../d')).toBe('a/d')
    })

    it('should resolve explicit current directory reference', () => {
        expect(joinPath('a/b', './c')).toBe('a/b/c')
    })

    it('should resolve single dot to same path', () => {
        expect(joinPath('a/b', '.')).toBe('a/b')
    })

    it('should strip hash from prev and join', () => {
        expect(joinPath('a/b?q=1#h', 'c')).toBe('a/b?q=1/c')
    })

    it('should join multiple path segments', () => {
        expect(joinPath('a', 'b', 'c')).toBe('a/b/c')
    })

    it('should return empty string for all empty arguments', () => {
        expect(joinPath('', '')).toBe('')
    })

    it('should resolve parent past root for deep path', () => {
        expect(joinPath('a/b/c', '../../../d')).toBe('a/d')
    })

    it('should resolve parent reference with URL base', () => {
        expect(joinPath('https://x.com/path', '..')).toBe('https:/x.com')
    })

    it('should resolve parent reference with root path', () => {
        expect(joinPath('/a/b/', '..')).toBe('/a')
    })
})
