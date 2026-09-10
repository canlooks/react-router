import {describe, expect, it} from 'vitest'
import {matchPath} from '../../src'
import type {Params} from '../../index'

describe('U-MATCH static, dynamic and wildcard matching', () => {
    it.each<[string, string, Params | null]>([
        ['/', '/', {}], ['/about', '/about', {}], ['/About', '/about', null],
        ['/about/', '/about', null], ['/about/us', '/about', null],
        ['/users/42', '/users/:id', {id: '42'}],
        ['/users/42/posts/101', '/users/:userId/posts/:postId', {userId: '42', postId: '101'}],
        ['/users', '/users/:id', null], ['/users/', '/users/:id', null],
        ['/users/42/extra', '/users/:id', null],
        ['/docs/intro', '/docs/*', {'*': 'intro'}], ['/docs/a/b', '/docs/*', null],
        ['/docs', '/docs/*', null], ['/docs/', '/docs/*', null],
        ['/files', '/files/**', {}], ['/files/', '/files/**', {}],
        ['/files/a/b/c', '/files/**', {}], ['/a/b/c', '/**', {}], ['/', '/**', {}],
        ['/users/42/a/b', '/users/:id/**', {id: '42'}],
        ['/a/b', '/:id/:id', {id: ['a', 'b']}], ['/a/b', '/*/*', {'*': ['a', 'b']}],
        ['/users/%E4%B8%AD', '/users/:id', {id: '%E4%B8%AD'}],
        ['/users/中文', '/users/:id', {id: '中文'}],
        ['/users/%2F', '/users/:id', {id: '%2F'}]
    ])('U-MATCH-01 %j against %j -> %j', (pathname, pattern, expected) => {
        expect(matchPath(pathname, pattern)).toEqual(expected)
    })
    it('U-MATCH-02 each call returns an independent parameter object', () => {
        const first = matchPath('/users/1', '/users/:id')!
        first.id = 'mutated'
        expect(matchPath('/users/2', '/users/:id')).toEqual({id: '2'})
    })
})
