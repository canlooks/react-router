import {beforeEach, describe, it, expect, afterEach, vi} from 'vitest'
import {render, screen, act, waitFor, fireEvent, cleanup} from '@testing-library/react'
import React, {createElement as h} from 'react'
import {Router, useRouter} from '../../src'
import type {RouteItem} from '../../index'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * A page component that captures router context on render.
 * Uses '**' catch-all entry so it renders regardless of pathname.
 */
function createContextReporter() {
    let captured: ReturnType<typeof useRouter> | null = null
    const Reporter = () => {
        captured = useRouter()
        return h('div', {'data-testid': 'page'}, 'Page Content')
    }
    return {Reporter, getContext: () => captured}
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Router', () => {
    beforeEach(() => {
        window.history.replaceState(null, '', '/')
    })

    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
    })
    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
    })

    // ── mode ─────────────────────────────────────────────────────────────

    it('should render with default mode "history"', () => {
        const {Reporter, getContext} = createContextReporter()
        // Use ** to catch any pathname
        const entry: RouteItem = {
            children: {'**': {page: h(Reporter)}}
        }
        render(h(Router, {entry}))
        expect(getContext()?.mode).toBe('history')
    })

    it('should render with mode "hash"', () => {
        const {Reporter, getContext} = createContextReporter()
        const entry: RouteItem = {
            children: {'**': {page: h(Reporter)}}
        }
        render(h(Router, {mode: 'hash', entry}))
        expect(getContext()?.mode).toBe('hash')
    })

    it('should render with mode "memory"', () => {
        const {Reporter, getContext} = createContextReporter()
        const entry: RouteItem = {
            children: {'**': {page: h(Reporter)}}
        }
        render(h(Router, {mode: 'memory', entry}))
        expect(getContext()?.mode).toBe('memory')
    })

    // ── base ─────────────────────────────────────────────────────────────
    // When base doesn't match the document URL, no route matches → use notFound
    // to ensure Reporter renders within RouterContext regardless.

    it('should normalize base from "app" to "/app"', () => {
        const {Reporter, getContext} = createContextReporter()
        const entry: RouteItem = {}
        render(h(Router, {mode: 'hash', base: 'app', entry, notFound: h(Reporter)}))
        expect(getContext()?.base).toBe('/app')
    })

    it('should normalize base from "/app/" to "/app"', () => {
        const {Reporter, getContext} = createContextReporter()
        const entry: RouteItem = {}
        render(h(Router, {mode: 'hash', base: '/app/', entry, notFound: h(Reporter)}))
        expect(getContext()?.base).toBe('/app')
    })

    it('should default base to "/"', () => {
        const {Reporter, getContext} = createContextReporter()
        const entry: RouteItem = {page: h(Reporter)}
        render(h(Router, {entry}))
        expect(getContext()?.base).toBe('/')
    })

    it('should default base to "/"', () => {
        const {Reporter, getContext} = createContextReporter()
        const entry: RouteItem = {
            children: {'**': {page: h(Reporter)}}
        }
        render(h(Router, {entry}))
        expect(getContext()?.base).toBe('/')
    })

    // ── page rendering ───────────────────────────────────────────────────

    it('should render page content from entry route', () => {
        const entry: RouteItem = {
            page: h('div', {'data-testid': 'home'}, 'Home')
        }
        render(h(Router, {entry}))
        expect(screen.getByTestId('home')).toBeInTheDocument()
    })

    // ── notFound ─────────────────────────────────────────────────────────

    it('should render notFound content when route does not match', () => {
        const entry: RouteItem = {
            children: {
                dashboard: {page: h('div', null, 'Dashboard')}
            }
        }
        render(
            h(Router, {
                entry,
                notFound: h('div', {'data-testid': 'not-found'}, 'Not Found')
            })
        )
        expect(screen.getByTestId('not-found')).toBeInTheDocument()
    })

    // ── pathname ─────────────────────────────────────────────────────────

    it('should set pathname to reflect current URL', () => {
        const {Reporter, getContext} = createContextReporter()
        const entry: RouteItem = {
            children: {'**': {page: h(Reporter)}}
        }
        render(h(Router, {entry}))
        expect(getContext()?.pathname).toBe('/')
    })

    it('should change pathname when navigating (hash mode)', async () => {
        const HomePage = () => {
            const {navigate} = useRouter()
            return h(
                'button',
                {'data-testid': 'nav-btn', onClick: () => navigate('/about')},
                'Go to About'
            )
        }
        const entry: RouteItem = {
            page: h(HomePage),
            children: {
                about: {page: h('div', {'data-testid': 'about'}, 'About')}
            }
        }
        render(h(Router, {mode: 'hash', entry}))

        act(() => {
            fireEvent.click(screen.getByTestId('nav-btn'))
        })

        await waitFor(() => {
            expect(screen.getByTestId('about')).toBeInTheDocument()
        }, {timeout: 3000})
    })

    // ── params ───────────────────────────────────────────────────────────

    it('should populate params for dynamic segments and reset on new route', async () => {
        let lastParams: Record<string, string | string[]> = {}
        const UserPage = () => {
            const {params, navigate} = useRouter()
            lastParams = {...params}
            return h(
                'div',
                {'data-testid': 'user-page'},
                h('span', null, `User ${params.id}`),
                h(
                    'button',
                    {
                        'data-testid': 'nav-to-about',
                        onClick: () => navigate('/about')
                    },
                    'Go to About'
                )
            )
        }
        const AboutPage = () => {
            const {params} = useRouter()
            lastParams = {...params}
            return h('div', {'data-testid': 'about-page'}, 'About')
        }
        const HomePage = () => {
            const {navigate} = useRouter()
            return h(
                'button',
                {
                    'data-testid': 'nav-to-user',
                    onClick: () => navigate('/user/123')
                },
                'Go to User 123'
            )
        }
        const entry: RouteItem = {
            page: h(HomePage),
            children: {
                user: {
                    children: {
                        ':id': {page: h(UserPage)}
                    }
                },
                about: {page: h(AboutPage)}
            }
        }
        render(h(Router, {mode: 'hash', entry}))

        // Navigate to /user/123
        act(() => {
            fireEvent.click(screen.getByTestId('nav-to-user'))
        })

        await waitFor(() => {
            expect(screen.getByTestId('user-page')).toBeInTheDocument()
            expect(lastParams.id).toBe('123')
        }, {timeout: 3000})

        // Navigate from user page to /about
        act(() => {
            fireEvent.click(screen.getByTestId('nav-to-about'))
        })

        await waitFor(() => {
            expect(screen.getByTestId('about-page')).toBeInTheDocument()
            expect(lastParams.id).toBeUndefined()
        }, {timeout: 3000})
    })

    // ── setState ─────────────────────────────────────────────────────────

    it('should update inner state via setState', () => {
        let capturedState: any = undefined
        const Page = () => {
            const {state, setState} = useRouter()
            capturedState = state
            return h(
                'button',
                {
                    'data-testid': 'set-state-btn',
                    onClick: () => setState({user: 'test'})
                },
                'Set State'
            )
        }
        const entry: RouteItem = {
            children: {'**': {page: h(Page)}}
        }
        render(h(Router, {mode: 'hash', entry}))

        expect(capturedState).toBeNull()

        act(() => {
            fireEvent.click(screen.getByTestId('set-state-btn'))
        })

        expect(capturedState).toEqual({user: 'test'})
    })
})
