import { describe, it, expect } from 'vitest'
import { joinPath } from '../../src/utils'

describe('joinPath', () => {
    it('should return an empty string when called without arguments', () => {
        expect(joinPath()).toBe('')
    })

    it('should normalize separators and trailing slashes for one argument', () => {
        expect(joinPath('a\\b///')).toBe('a/b')
    })

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
        expect(joinPath('http://a.com', 'b')).toBe('http://a.com/b')
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

    it('should strip search and hash from the previous path before joining', () => {
        expect(joinPath('a/b?q=1#h', 'c')).toBe('a/b/c')
    })

    it('should join multiple path segments', () => {
        expect(joinPath('a', 'b', 'c')).toBe('a/b/c')
    })

    it('should return empty string for all empty arguments', () => {
        expect(joinPath('', '')).toBe('')
    })

    it('should resolve parent past root for deep path', () => {
        expect(joinPath('a/b/c', '../../../d')).toBe('d')
    })

    it('should resolve parent reference with URL base', () => {
        expect(joinPath('https://x.com/path', '..')).toBe('https://x.com/')
    })

    it('should resolve parent reference with root path', () => {
        expect(joinPath('/a/b/', '..')).toBe('/a')
    })

    it('should preserve a single absolute URL argument', () => {
        expect(joinPath('https://example.com/a//b')).toBe('https://example.com/a//b')
    })

    it('should let an absolute URL in a later segment replace the previous path', () => {
        expect(joinPath('/a', 'https://example.com/b')).toBe('https://example.com/b')
    })

    it('should resolve protocol-relative URLs using the current protocol', () => {
        const expected = new URL('//cdn.example.com/assets', window.location.href).href

        expect(joinPath('//cdn.example.com/assets')).toBe(expected)
        expect(joinPath('/ignored', '//cdn.example.com/assets')).toBe(expected)
    })

    it('should normalize an absolute URL followed by an empty segment', () => {
        expect(joinPath('https://example.com/a/?q=1#old', '')).toBe('https://example.com/a')
    })

    it('should preserve the root pathname for an absolute URL followed by an empty segment', () => {
        expect(joinPath('https://example.com/', '')).toBe('https://example.com/')
    })

    it.each([
        ['a/b', '?q=1', 'a/b?q=1'],
        ['/a/b', '#part', '/a/b#part'],
        ['https://example.com/a?q=1#old', '#new', 'https://example.com/a?q=1#new'],
    ])('should apply a query or hash target to %s', (previous, next, expected) => {
        expect(joinPath(previous, next)).toBe(expected)
    })

    it('should replace the pathname of an absolute URL with an absolute path segment', () => {
        expect(joinPath('https://example.com/a?q=1#old', '/b')).toBe('https://example.com/b')
    })

    it('should return a query target when the previous path is empty', () => {
        expect(joinPath('', '?q=1')).toBe('?q=1')
    })

    it('should preserve URL credentials and ports while joining relative segments', () => {
        expect(joinPath('https://user:pass@example.com:8443/a', 'b'))
            .toBe('https://user:pass@example.com:8443/a/b')
        expect(joinPath('https://u%40ser:p%3Ass@example.com:8443/a/b', '../c?x=1#part'))
            .toBe('https://u%40ser:p%3Ass@example.com:8443/a/c?x=1#part')
    })

    it.each([
        ['?q=1', 'https://user:pass@example.com:8443/a?q=1'],
        ['#new', 'https://user:pass@example.com:8443/a#new'],
        ['/b', 'https://user:pass@example.com:8443/b'],
    ])('should preserve URL credentials when applying %s', (next, expected) => {
        expect(joinPath('https://user:pass@example.com:8443/a', next)).toBe(expected)
    })

    it('should support relative joins for other hierarchical URL protocols', () => {
        expect(joinPath('ftp://user:pass@example.com:2121/a', 'b'))
            .toBe('ftp://user:pass@example.com:2121/a/b')
        expect(joinPath('file:///C:/workspace/a', 'b'))
            .toBe('file:///C:/workspace/a/b')
    })

    it.each([
        ['mailto:test@example.com', 'next'],
        ['data:text/plain,hello', 'next'],
    ])('should reject relative joins against opaque URL %s', (previous, next) => {
        expect(() => joinPath(previous, next)).toThrow(/Cannot join a relative reference/)
    })

    it('should fully replace an earlier credentialed URL with a later absolute URL', () => {
        expect(joinPath('https://user:pass@example.com/a', 'https://other.example/b'))
            .toBe('https://other.example/b')
    })
})
