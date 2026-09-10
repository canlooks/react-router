import {describe, expect, it} from 'vitest'
import {joinPath, matchPath, resolvePath, truncatePath} from '../../src'

// These are ordinary assertions of the intended contract, deliberately NOT it.fails/skip.
// See TEST_PLAN.md for defect ownership, priority and the archived failing baseline.
describe('Known defects: path contracts', () => {
    it.each([
        ['?q=new', '/items/1'], ['#detail', '/items/1'],
        ['?q=new', '/items/1?old=yes#previous'], ['#detail', '/items/1?q=keep'],
        ['next', '/items/1?return=/a/b'], ['next', '/items/'],
        ['../../../next', '/a/b'], ['../about', '/users/42'], ['.well-known', '/a/b']
    ])('D-10 resolvePath(%j, %j) agrees with browser URL resolution', (to, from) => {
        const expected = new URL(to, `https://router.test${from}`)
        expect(resolvePath(to, from)).toBe(expected.pathname + expected.search + expected.hash)
    })
    it('D-11 joinPath removes the previous query before appending a segment', () => {
        expect(joinPath('/items?q=old', 'next')).toBe('/items/next')
    })
    it('D-11 dollar signs in real path segments are preserved', () => {
        expect(joinPath('/price$usd', 'detail')).toBe('/price$usd/detail')
    })
    it('D-12 string base is literal, including regular-expression metacharacters', () => {
        expect(truncatePath('/v1X0/users', '/v1.0')).toBeNull()
    })
    it('D-12 explicit regular-expression base retains escaped character classes', () => {
        expect(truncatePath('/app/v2/users', /^app\/v\d+$/)).toBe('users')
    })
    it('D-13 static route segments containing dots do not match arbitrary characters', () => {
        expect(matchPath('/v1X0/users/42', '/v1.0/users/:id')).toBeNull()
    })
    it('D-14 catch-all only matches after a complete path segment', () => {
        expect(matchPath('/filesXYZ/secret', '/files/**')).toBeNull()
    })
    it.each([['/:id/:id/:id', 'id'], ['/*/*/*', '*']])('D-15 three repeated captures in %s remain an array', (pattern, key) => {
        expect(matchPath('/one/two/three', pattern)).toEqual({[key]: ['one', 'two', 'three']})
    })
    it('D-16 a single absolute URL passed to joinPath retains its protocol separator', () => {
        expect(joinPath('https://router.test/a/')).toBe('https://router.test/a')
    })
    it.each([
        ['next$usd//中文/%2F?return=/a//b/$#part//$', '/old', '/next$usd/%E4%B8%AD%E6%96%87/%2F?return=/a//b/$#part//$'],
        ['#part//$', '/items/?q=/a//b/$', '/items/?q=/a//b/$#part//$'],
        ['next', 'https://router.test/app/items/?q=keep', '/app/items/next'],
        ['mailto:note', '/app/items/', '/app/items/mailto:note'],
        ['../../../../', '/a/b', '/'],
        ['next//part?q=//', null, 'next/part?q=//']
    ])('D-10 path and suffix boundaries: %j from %j', (to, from, expected) => {
        expect(resolvePath(to!, from)).toBe(expected)
    })
    it('D-16 single URL normalizes only its pathname, preserving authority and suffix', () => {
        expect(joinPath('https://user:pass@router.test:8443/a$//中文/%2F///?return=/a//b/$/#part//'))
            .toBe('https://user:pass@router.test:8443/a$/中文/%2F?return=/a//b/$/#part//')
        expect(joinPath('https://router.test/a/?return=/')).toBe('https://router.test/a?return=/')
    })
    it.each(['v1.0', 'app+beta', 'app(test)'])('D-12 literal base %s respects segment boundaries', base => {
        expect(truncatePath(`/${base}/users`, base)).toBe('users')
        expect(truncatePath(`/${base}extra/users`, base)).toBeNull()
    })
    it.each([/^app\/v\d+$/i, /^app\/v\d+$/gi, /^app\/v\d+$/iy])('D-12 repeatable regexp %s retains flags and caller lastIndex', base => {
        base.lastIndex = 7
        expect(truncatePath('/APP/v2/users', base)).toBe('users')
        expect(truncatePath('/APP/v3', base)).toBe('')
        expect(truncatePath('/APP/v3suffix', base)).toBeNull()
        expect(base.lastIndex).toBe(7)
    })
    it('D-12 escaped literals and internal anchors retain their meaning', () => {
        expect(truncatePath('/app$/users', /^app\$/)).toBe('users')
        expect(truncatePath('/v1.0/users', /^(v1\.0)$/)).toBe('users')
        expect(truncatePath('/app/users', /^(app$)/)).toBeNull()
    })
    it.each(['v1.0', 'a+b', '(app)', '[app]', 'a|b', 'x^y$', 'file*', 'path**'])('D-13 static metacharacters in %s are literal beside captures', segment => {
        expect(matchPath(`/${segment}/42`, `/${segment}/:id`)).toEqual({id: '42'})
        expect(matchPath('/different/42', `/${segment}/:id`)).toBeNull()
    })
    it('D-14 catch-all keeps a full segment boundary with empty and nested remainders', () => {
        for (const path of ['/files', '/files/', '/files/a/b']) expect(matchPath(path, '/files/**')).toEqual({})
        expect(matchPath('/filesXYZ/a', '/files/**')).toBeNull()
        expect(matchPath('/', '/**')).toEqual({})
        expect(matchPath('/a/end', '/**/end')).toEqual({})
    })
    it.each(['id', '*'])('D-15 two through four %s captures accumulate without sharing arrays', key => {
        for (const count of [2, 3, 4]) {
            const values = ['one', 'two', 'three', 'four'].slice(0, count)
            const pattern = Array(count).fill(key === '*' ? '*' : ':' + key).join('/')
            expect(matchPath('/' + values.join('/'), '/' + pattern)).toEqual({[key]: values})
        }
    })
})
