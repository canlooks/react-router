import {describe, expect, it} from 'vitest'
import {
    dropEndSlash, dropLastPortion, dropStartSlash, isStartWithProtocol,
    joinPath, resolvePath, truncatePath, unifyPath, unifySlash
} from '../../src'

describe('U-PATH path normalization', () => {
    it.each([
        ['', ''], ['/', '/'], ['///a//b///', '/a/b/'],
        ['\\a\\b\\', '/a/b/'], ['a/\\b', 'a/b'], ['中文/%20', '中文/%20']
    ])('U-PATH-01 unifySlash(%j) = %j', (input, expected) => {
        expect(unifySlash(input)).toBe(expected)
        expect(unifySlash(unifySlash(input))).toBe(expected)
    })
    it.each([
        ['', ''], ['///', ''], ['/a/b/', 'a/b/'], ['a/b', 'a/b']
    ])('U-PATH-02 dropStartSlash(%j) = %j', (input, expected) => {
        expect(dropStartSlash(input)).toBe(expected)
    })
    it.each([
        ['', ''], ['///', ''], ['/a/b///', '/a/b'], ['a/b', 'a/b']
    ])('U-PATH-03 dropEndSlash(%j) = %j', (input, expected) => {
        expect(dropEndSlash(input)).toBe(expected)
    })
    it.each([
        ['', ''], ['/', ''], ['//a\\b///', 'a/b'], ['a', 'a'], ['/中文/', '中文']
    ])('U-PATH-04 unifyPath(%j) = %j', (input, expected) => {
        expect(unifyPath(input)).toBe(expected)
    })
    it.each([
        ['/a/b', '/a'], ['/a/b/', '/a'], ['/a', ''], ['/', '/'], ['a', 'a'], ['', '']
    ])('U-PATH-05 dropLastPortion(%j) = %j', (input, expected) => {
        expect(dropLastPortion(input)).toBe(expected)
    })
    it.each([
        ['https://example.test', true], ['HTTP://example.test', true], ['ftp://host', true],
        ['/about', false], ['//example.test', false], ['mailto:a@b.test', false], ['', false]
    ])('U-PATH-06 protocol guard(%j) = %j', (input, expected) => {
        expect(isStartWithProtocol(input)).toBe(expected)
    })
})

describe('U-JOIN path composition', () => {
    it.each<{parts: string[]; expected: string}>([
        {parts: [], expected: ''},
        {parts: ['/a//b/'], expected: '/a/b'},
        {parts: ['/a', 'b', 'c'], expected: '/a/b/c'},
        {parts: ['/a', '/b'], expected: '/b'},
        {parts: ['', 'a'], expected: 'a'},
        {parts: ['/a', ''], expected: '/a'},
        {parts: ['/a', './b'], expected: '/a/b'},
        {parts: ['/a/b', '../c'], expected: '/a/c'},
        {parts: ['/a/b/c', '../../d'], expected: '/a/d'},
        {parts: ['/a#old', 'b'], expected: '/a/b'},
        {parts: ['/a', 'https://example.test/x'], expected: 'https://example.test/x'},
        {parts: ['/', ''], expected: '/'}
    ])('U-JOIN-01 $parts -> $expected', ({parts, expected}) => {
        expect(joinPath(...parts)).toBe(expected)
    })
})

describe('U-RESOLVE relative destination resolution', () => {
    it.each([
        ['/target', '/a/b', '/target'],
        ['sibling', '/a/b', '/a/sibling'],
        ['./sibling', '/a/b', '/a/sibling'],
        ['../sibling', '/a/b/c', '/a/sibling'],
        ['next', null, 'next'],
        ['next', '', 'next'],
        ['\\a\\b', '/previous', '/a/b'],
        ['https://example.test/next', '/a', 'https://example.test/next'],
        ['next?x=1#detail', '/a/old', '/a/next?x=1#detail'],
        ['next', '/a/old#detail', '/a/next']
    ])('U-RESOLVE-01 resolve(%j, %j) = %j', (to, from, expected) => {
        expect(resolvePath(to!, from)).toBe(expected)
    })
    it('U-RESOLVE-02 accepts a URL instance without losing search/hash', () => {
        const url = new URL('https://router.test/a?q=中文#part')
        expect(resolvePath(url, '/other')).toBe(url.href)
    })
})

describe('U-BASE base truncation', () => {
    it.each<[string, string | RegExp | undefined, string | null]>([
        ['/app/users/42', '/app', 'users/42'], ['/app', '/app', ''],
        ['/application/users', '/app', null], ['/other', '/app', null],
        ['/app//users/', '\\app\\', 'users'], ['/', '/', ''],
        ['/a/b', undefined, 'a/b'], ['/a/b', '', 'a/b'],
        ['/app/users', /^app$/, 'users'], ['/other/users', /^app$/, null]
    ])('U-BASE-01 truncate(%j, %s) = %j', (path, base, expected) => {
        expect(truncatePath(path, base)).toBe(expected)
    })
})
