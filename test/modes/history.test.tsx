import {act, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {mountRouter, receivePopstate} from '../helpers/router'

describe('M-HISTORY browser history routing', () => {
    it('M-HISTORY-01 is the default mode and exposes normalized base and location', () => {
        history.replaceState(null, '', '/app/users/42?q=one#detail')
        const app = mountRouter({base: '\\app///'})
        expect(app.router).toMatchObject({mode: 'history', base: '/app', pathname: '/users/42', params: {id: '42'}, state: null})
        expect(app.router.location).toMatchObject({pathname: '/app/users/42', search: '?q=one', hash: '#detail'})
        expect(screen.getByRole('heading')).toHaveTextContent('User')
    })
    it.each(['/other', '/application/about'])('M-HISTORY-02 rejects URL %s outside base /app', path => {
        history.replaceState(null, '', path)
        const app = mountRouter({base: '/app'})
        expect(app.router.pathname).toBeNull()
        expect(screen.getByRole('heading')).toHaveTextContent('Missing')
    })
    it('M-HISTORY-03 push appends one entry, applies base and keeps state', () => {
        history.replaceState(null, '', '/app')
        const app = mountRouter({base: '/app'})
        const length = history.length
        act(() => app.router.navigate('/about?tab=1#part', {state: {from: 'home'}}))
        expect(location.href).toBe('https://router.test/app/about?tab=1#part')
        expect(history.length).toBe(length + 1)
        expect(history.state).toEqual({from: 'home'})
        expect(app.router.state).toEqual({from: 'home'})
        expect(screen.getByRole('heading')).toHaveTextContent('About')
    })
    it('M-HISTORY-04 replace helper replaces only the current entry and forwards options', () => {
        const app = mountRouter()
        const length = history.length
        act(() => app.router.replace('/about', {state: {edited: true}, scrollRestore: false}))
        expect(location.pathname).toBe('/about')
        expect(history.length).toBe(length)
        expect(history.state).toEqual({edited: true})
        expect(app.router.state).toEqual({edited: true})
        expect(history.scrollRestoration).toBe('manual')
    })
    it.each([
        ['43', '/users/43'], ['../about', '/about'], ['?q=next', '/users/42?q=next'],
        ['#detail', '/users/42#detail'], ['\\about', '/about']
    ])('M-HISTORY-05 relative navigation %s yields %s', (to, expected) => {
        history.replaceState(null, '', '/users/42')
        const app = mountRouter()
        act(() => app.router.navigate(to))
        expect(location.pathname + location.search + location.hash).toBe(expected)
    })
    it('M-HISTORY-06 a same-origin URL object is used as an absolute browser URL', () => {
        history.replaceState(null, '', '/app')
        const app = mountRouter({base: '/app'})
        act(() => app.router.navigate(new URL('https://router.test/app/about?q=1')))
        expect(location.pathname).toBe('/app/about')
        expect(app.router.pathname).toBe('/about')
    })
    it('M-HISTORY-07 rejects cross-origin URL objects without side effects', () => {
        const app = mountRouter()
        const original = location.href
        expect(() => act(() => app.router.navigate(new URL('https://other.test/about')))).toThrow(/Cannot navigate different origin/)
        expect(location.href).toBe(original)
        expect(app.router.state).toBeNull()
    })
    it('M-HISTORY-08 numeric navigation delegates to native History API; zero is a no-op', () => {
        const go = vi.spyOn(history, 'go').mockImplementation(() => {})
        const back = vi.spyOn(history, 'back').mockImplementation(() => {})
        const forward = vi.spyOn(history, 'forward').mockImplementation(() => {})
        const app = mountRouter()
        act(() => { app.router.navigate(-2); app.router.navigate(0); app.router.back(); app.router.forward() })
        expect(go).toHaveBeenCalledExactlyOnceWith(-2)
        expect(back).toHaveBeenCalledTimes(1)
        expect(forward).toHaveBeenCalledTimes(1)
    })
    it('M-HISTORY-09 popstate refreshes rendered page and params', () => {
        const app = mountRouter()
        receivePopstate('/users/7')
        expect(app.router.params).toEqual({id: '7'})
        expect(screen.getByRole('heading')).toHaveTextContent('User')
        receivePopstate('/about')
        expect(app.router.params).toEqual({})
        expect(screen.getByRole('heading')).toHaveTextContent('About')
    })
    it('M-HISTORY-10 actual history back/forward updates the route asynchronously', async () => {
        const app = mountRouter()
        act(() => app.router.navigate('/about'))
        act(() => app.router.navigate('/users/8'))
        act(() => app.router.back())
        await waitFor(() => expect(app.router.pathname).toBe('/about'))
        act(() => app.router.forward())
        await waitFor(() => expect(app.router.pathname).toBe('/users/8'))
    })
    it.each([true, false])('M-HISTORY-11 scrollRestore=%s sets browser scrollRestoration', scrollRestore => {
        const app = mountRouter()
        act(() => app.router.navigate('/about', {scrollRestore}))
        expect(history.scrollRestoration).toBe(scrollRestore ? 'auto' : 'manual')
    })
    it('M-HISTORY-12 setState updates context and native state without changing URL/history length', () => {
        const app = mountRouter()
        const length = history.length
        act(() => app.router.setState({step: 1}))
        expect(app.router.state).toEqual({step: 1})
        expect(history.state).toEqual({step: 1})
        expect(location.pathname).toBe('/')
        expect(history.length).toBe(length)
        act(() => app.router.navigate('/about'))
        expect(app.router.state).toBeNull()
        expect(history.state).toBeNull()
    })
    it('M-HISTORY-13 same-URL navigation still updates state', () => {
        const app = mountRouter()
        act(() => app.router.navigate('/', {state: {same: true}}))
        expect(app.router.state).toEqual({same: true})
        expect(app.router.pathname).toBe('/')
    })
    it('M-HISTORY-14 adds and removes the exact popstate listener on unmount', () => {
        const add = vi.spyOn(window, 'addEventListener')
        const remove = vi.spyOn(window, 'removeEventListener')
        const app = mountRouter()
        const handler = add.mock.calls.find(([name]) => name === 'popstate')?.[1]
        expect(handler).toBeTypeOf('function')
        app.unmount()
        expect(remove).toHaveBeenCalledWith('popstate', handler)
    })
    it('M-HISTORY-15 an unchanged popstate event does not schedule a context update', () => {
        const app = mountRouter()
        const original = app.router
        act(() => dispatchEvent(new PopStateEvent('popstate')))
        expect(app.router).toBe(original)
    })
})
