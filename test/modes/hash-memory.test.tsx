import {act, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {hashNavigate, mountRouter} from '../helpers/router'

describe('M-HASH hash routing', () => {
    it('M-HASH-01 reads route, query and inner fragment from hash only', () => {
        history.replaceState(null, '', '/host?outer=1#/users/42?q=two#detail')
        const app = mountRouter({mode: 'hash'})
        expect(app.router).toMatchObject({mode: 'hash', base: '/', pathname: '/users/42', params: {id: '42'}})
        expect(app.router.location).toMatchObject({pathname: '/users/42', search: '?q=two', hash: '#detail'})
        expect(screen.getByRole('heading')).toHaveTextContent('User')
    })
    it.each(['', '#'])('M-HASH-02 empty hash %j starts at the root page', hash => {
        history.replaceState(null, '', `/host${hash}`)
        const app = mountRouter({mode: 'hash'})
        expect(app.router.pathname).toBe('/')
        expect(screen.getByRole('heading')).toHaveTextContent('Home')
    })
    it('M-HASH-03 navigation preserves outer pathname/search and updates the rendered page', async () => {
        history.replaceState(null, '', '/host?outer=1#/')
        const app = mountRouter({mode: 'hash'})
        await hashNavigate(app, '/about?q=2#part')
        expect(location.pathname + location.search).toBe('/host?outer=1')
        expect(location.hash).toBe('#/about?q=2#part')
        expect(app.router.location.search).toBe('?q=2')
        expect(app.router.location.hash).toBe('#part')
        expect(screen.getByRole('heading')).toHaveTextContent('About')
    })
    it('M-HASH-04 relative navigation resolves beside the current segment', async () => {
        history.replaceState(null, '', '/#/users/42')
        const app = mountRouter({mode: 'hash'})
        act(() => app.router.navigate('43'))
        await waitFor(() => expect(app.router.pathname).toBe('/users/43'))
        expect(app.router.params).toEqual({id: '43'})
    })
    it('M-HASH-05 maintains a push stack for back/forward', async () => {
        const app = mountRouter({mode: 'hash'})
        await hashNavigate(app, '/about')
        await hashNavigate(app, '/users/7')
        act(() => app.router.back())
        await waitFor(() => expect(app.router.pathname).toBe('/about'))
        act(() => app.router.back())
        await waitFor(() => expect(app.router.pathname).toBe('/'))
        act(() => app.router.forward())
        await waitFor(() => expect(app.router.pathname).toBe('/about'))
    })
    it('M-HASH-06 pushing after back discards the forward branch', async () => {
        const app = mountRouter({mode: 'hash'})
        await hashNavigate(app, '/about')
        await hashNavigate(app, '/users/7')
        act(() => app.router.back())
        await waitFor(() => expect(app.router.pathname).toBe('/about'))
        await hashNavigate(app, '/users/8')
        act(() => app.router.forward())
        expect(location.hash).toBe('#/users/8')
        expect(app.router.pathname).toBe('/users/8')
    })
    it.each([-99, -1, 0, 1, 99])('M-HASH-07 delta %i outside initial stack is harmless', delta => {
        const app = mountRouter({mode: 'hash'})
        const original = location.href
        act(() => app.router.navigate(delta))
        expect(location.href).toBe(original)
        expect(app.router.pathname).toBe('/')
    })
    it('M-HASH-08 responds to an external hashchange', async () => {
        const app = mountRouter({mode: 'hash'})
        act(() => { location.hash = '/users/9' })
        await waitFor(() => expect(app.router.params).toEqual({id: '9'}))
        expect(screen.getByRole('heading')).toHaveTextContent('User')
    })
    it('M-HASH-09 truncates base on initial deep link', () => {
        history.replaceState(null, '', '/#/app/users/42')
        const app = mountRouter({mode: 'hash', base: '/app'})
        expect(app.router.pathname).toBe('/users/42')
    })
    it('M-HASH-10 stores state in context and leaves native state/scrollRestoration alone', async () => {
        history.replaceState({outer: true}, '')
        const app = mountRouter({mode: 'hash'})
        act(() => app.router.setState({step: 1}))
        expect(app.router.state).toEqual({step: 1})
        expect(history.state).toEqual({outer: true})
        act(() => app.router.navigate('/about', {state: {step: 2}, scrollRestore: false}))
        await waitFor(() => expect(app.router.pathname).toBe('/about'))
        expect(app.router.state).toEqual({step: 2})
        expect(history.scrollRestoration).toBe('auto')
    })
    it('M-HASH-11 rejects cross-origin URL objects before changing the hash', () => {
        const app = mountRouter({mode: 'hash'})
        expect(() => act(() => app.router.navigate(new URL('https://other.test/a')))).toThrow(/different origin/)
        expect(location.hash).toBe('')
    })
    it('M-HASH-12 removes hashchange subscription on unmount', () => {
        const add = vi.spyOn(window, 'addEventListener')
        const remove = vi.spyOn(window, 'removeEventListener')
        const app = mountRouter({mode: 'hash'})
        const handler = add.mock.calls.find(([name]) => name === 'hashchange')?.[1]
        expect(handler).toBeTypeOf('function')
        app.unmount()
        expect(remove).toHaveBeenCalledWith('hashchange', handler)
    })
})

describe('M-MEMORY memory mode baseline', () => {
    it('M-MEMORY-01 starts with a root page when the browser hash is empty', () => {
        const app = mountRouter({mode: 'memory'})
        expect(app.router).toMatchObject({mode: 'memory', pathname: '/', state: null, params: {}})
        expect(screen.getByRole('heading')).toHaveTextContent('Home')
    })
    it('M-MEMORY-02 navigation does not modify browser URL, native history or scrollRestoration', () => {
        const push = vi.spyOn(history, 'pushState')
        const replace = vi.spyOn(history, 'replaceState')
        const app = mountRouter({mode: 'memory'})
        const url = location.href
        act(() => app.router.navigate('/about', {state: {step: 1}, scrollRestore: false}))
        expect(location.href).toBe(url)
        expect(push).not.toHaveBeenCalled()
        expect(replace).not.toHaveBeenCalled()
        expect(app.router.state).toEqual({step: 1})
        expect(history.scrollRestoration).toBe('auto')
    })
    it('M-MEMORY-03 setState accepts object and functional updates', () => {
        const app = mountRouter({mode: 'memory'})
        act(() => app.router.setState({count: 1}))
        act(() => app.router.setState((previous: {count: number}) => ({count: previous.count + 1})))
        expect(app.router.state).toEqual({count: 2})
    })
    it('M-MEMORY-04 does not subscribe to browser route events', () => {
        const add = vi.spyOn(window, 'addEventListener')
        mountRouter({mode: 'memory'})
        expect(add.mock.calls.filter(([event]) => event === 'popstate' || event === 'hashchange')).toHaveLength(0)
    })
})
