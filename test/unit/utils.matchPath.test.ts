import { describe, it, expect } from 'vitest'
import { matchPath, segmentRank } from '../../src/utils'

describe('segmentRank', () => {
    it('classifies catch-all, wildcard, parameter, and static segments', () => {
        expect(segmentRank('**')).toBe(1)
        expect(segmentRank('*')).toBe(2)
        expect(segmentRank(':id')).toBe(3)
        expect(segmentRank(':')).toBe(4)
        expect(segmentRank('users')).toBe(4)
    })
})

describe('matchPath', () => {
    it('should match exact paths and return empty params', () => {
        expect(matchPath('/user', '/user')).toEqual({})
    })

    it('should match a named parameter', () => {
        expect(matchPath('/user/123', '/user/:id')).toEqual({ id: '123' })
    })

    it('should match multiple named parameters', () => {
        expect(matchPath('/user/123/post/456', '/user/:uid/post/:pid')).toEqual({
            uid: '123',
            pid: '456',
        })
    })

    it('should match a single-segment wildcard', () => {
        expect(matchPath('/docs/any', '/docs/*')).toEqual({ '*': 'any' })
    })

    it('should match catch-all double asterisk', () => {
        expect(matchPath('/files/a/b/c', '/files/**')).toEqual({})
    })

    it('should match root-level catch-all', () => {
        expect(matchPath('/files/a/b/c', '/**')).toEqual({})
    })

    it('should return null when partial path does not match full pattern', () => {
        expect(matchPath('/a/b', '/a')).toBeNull()
    })

    it('should return null when required param is missing', () => {
        expect(matchPath('/user', '/user/:id')).toBeNull()
    })

    it('should match dynamic segments against dynamic route patterns', () => {
        expect(matchPath('/x/y/z', '/:a/:b/:c')).toEqual({
            a: 'x',
            b: 'y',
            c: 'z',
        })
    })

    it('should match root path', () => {
        expect(matchPath('/', '/')).toEqual({})
    })

    it('should match hyphenated path segments', () => {
        expect(matchPath('/a-b/c-d', '/:a/:b')).toEqual({
            a: 'a-b',
            b: 'c-d',
        })
    })

    it('should return null when single-segment wildcard cannot match multiple segments', () => {
        expect(matchPath('/a/b/c', '/a/*')).toBeNull()
    })

    it('should match unicode path segments', () => {
        expect(matchPath('/中文/パス', '/:a/:b')).toEqual({
            a: '中文',
            b: 'パス',
        })
    })

    it('should collect duplicate named params into an array', () => {
        expect(matchPath('/user/42', '/:a/:a')).toEqual({
            a: ['user', '42'],
        })
    })

    it.each([
        '.', '+', '?', '(', ')', '[', ']', '{', '}', '^', '$', '|', '\\',
    ])('should treat static metacharacter "%s" literally', character => {
        const literalSegment = `v1${character}0`
        const literalRoute = `/release/${encodeURIComponent(literalSegment)}`
        expect(matchPath(literalRoute, literalRoute)).toEqual({})
        expect(matchPath('/release/v1x0', literalRoute)).toBeNull()
    })

    it('should decode named and wildcard params exactly once', () => {
        expect(matchPath('/%E4%B8%AD/%252F', '/:name/*')).toEqual({
            name: '中',
            '*': '%2F',
        })
    })

    it('should preserve malformed percent encoding', () => {
        expect(matchPath('/bad%2', '/:value')).toEqual({value: 'bad%2'})
    })

    it('should decode an encoded slash only after segment matching', () => {
        expect(matchPath('/files/a%2Fb', '/files/:name')).toEqual({name: 'a/b'})
    })

    it('should append a third duplicate named param to the existing array', () => {
        expect(matchPath('/a/b/c', '/:value/:value/:value')).toEqual({
            value: ['a', 'b', 'c'],
        })
    })

    it('should backtrack and fail a non-terminal catch-all when its suffix never matches', () => {
        expect(matchPath('/a/b/c', '/**/missing')).toBeNull()
    })
})
