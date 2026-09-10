// @vitest-environment node
import {expect, it} from 'vitest'
import * as api from '../../src'

it('U-NODE-01 package source imports without browser globals and pure utilities remain usable', () => {
    expect(typeof window).toBe('undefined')
    expect(api.matchPath('/users/42', '/users/:id')).toEqual({id: '42'})
    expect(api.resolvePath('43', '/users/42')).toBe('/users/43')
    expect(api.joinPath('/app', 'about')).toBe('/app/about')
})
