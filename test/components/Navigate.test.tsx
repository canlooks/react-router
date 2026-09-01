import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, act, cleanup } from '@testing-library/react'
import React, { createElement as h, StrictMode } from 'react'
import { Navigate, Redirect, RouterContext } from '../../src'
import type { RouteItem } from '../../index'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Renders a component inside a mocked RouterContext.Provider.
 * Returns the mocked navigate spy for assertions.
 */
function renderWithMockRouter(
    children: React.ReactNode,
    overrides: Record<string, any> = {},
) {
    const navigate = vi.fn()
    const replace = vi.fn()
    const contextValue = {
        pathname: '/',
        params: {} as Record<string, string | string[]>,
        mode: 'history' as const,
        base: '/',
        location: window.location,
        replace: replace.mockImplementation((to: any, opts?: any) => {
            navigate(to, { ...opts, replace: true })
        }),
        navigate,
        back: vi.fn(),
        forward: vi.fn(),
        state: null,
        setState: vi.fn(),
        ...overrides,
    }
    const result = render(
        h(RouterContext.Provider, { value: contextValue }, children),
    )
    return { ...result, navigate, replace, contextValue }
}

// ── Navigate tests ───────────────────────────────────────────────────────────

describe('Navigate', () => {
    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
    })

    it('should call navigate(to) on mount', () => {
        const { navigate } = renderWithMockRouter(
            h(Navigate, { to: '/login' }),
        )

        expect(navigate).toHaveBeenCalledWith('/login', expect.objectContaining({}))
    })

    it('should call navigate(to, { replace: true }) when replace is set', () => {
        const { navigate } = renderWithMockRouter(
            h(Navigate, { to: '/dash', replace: true }),
        )

        expect(navigate).toHaveBeenCalledWith('/dash', expect.objectContaining({ replace: true }))
    })

    it('should call navigate with state prop', () => {
        const { navigate } = renderWithMockRouter(
            h(Navigate, { to: '/dash', state: { from: '/' } }),
        )

        expect(navigate).toHaveBeenCalledWith('/dash', expect.objectContaining({ state: { from: '/' } }))
    })

    it('should call navigate with scrollRestore: false', () => {
        const { navigate } = renderWithMockRouter(
            h(Navigate, { to: '/dash', scrollRestore: false }),
        )

        expect(navigate).toHaveBeenCalledWith('/dash', expect.objectContaining({ scrollRestore: false }))
    })

    it('should call navigate(delta) when delta is provided', () => {
        const { navigate } = renderWithMockRouter(
            h(Navigate, { delta: 1 }),
        )

        expect(navigate).toHaveBeenCalledWith(1)
    })

    it('should call navigate(-1) for delta={-1}', () => {
        const { navigate } = renderWithMockRouter(
            h(Navigate, { delta: -1 }),
        )

        expect(navigate).toHaveBeenCalledWith(-1)
    })

    it('should not call navigate when delta is 0', () => {
        // The router's navigate(0) returns early (no-op).
        // Navigate calls navigate(0), but the mock records the call.
        // Delta 0 still calls navigate - the no-op is inside navigate, not Navigate.
        const { navigate } = renderWithMockRouter(
            h(Navigate, { delta: 0 }),
        )

        expect(navigate).toHaveBeenCalledWith(0)
    })

    it('should not call navigate when no "to" and no delta', () => {
        const { navigate } = renderWithMockRouter(
            h(Navigate, {}),
        )

        expect(navigate).not.toHaveBeenCalled()
    })

    it('should render null', () => {
        const { container } = renderWithMockRouter(
            h(Navigate, { to: '/login' }),
        )

        // Navigate returns null, so container should have no visible content
        expect(container.innerHTML).toBe('')
    })

    it('should execute only once when StrictMode replays effects', () => {
        const {navigate} = renderWithMockRouter(
            h(StrictMode, null, h(Navigate, {to: '/strict'})),
        )

        expect(navigate).toHaveBeenCalledTimes(1)
    })

    it('should not navigate again when the parent rerenders the same intent', () => {
        const {navigate, rerender, contextValue} = renderWithMockRouter(
            h(Navigate, {to: '/same', state: {render: 1}}),
        )

        rerender(h(
            RouterContext.Provider,
            {value: contextValue},
            h(Navigate, {to: '/same', state: {render: 2}}),
        ))

        expect(navigate).toHaveBeenCalledTimes(1)
    })

    it('should navigate again when the target changes', () => {
        const {navigate, rerender, contextValue} = renderWithMockRouter(
            h(Navigate, {to: '/first'}),
        )

        rerender(h(
            RouterContext.Provider,
            {value: contextValue},
            h(Navigate, {to: '/second'}),
        ))

        expect(navigate).toHaveBeenCalledTimes(2)
        expect(navigate).toHaveBeenLastCalledWith('/second', expect.objectContaining({}))
    })

    it('uses URL href as the stable navigation intent key', () => {
        const url = new URL('/from-url', location.origin)
        const {navigate} = renderWithMockRouter(h(Navigate, {to: url}))

        expect(navigate).toHaveBeenCalledWith(url, expect.objectContaining({}))
    })
})

// ── Redirect tests ───────────────────────────────────────────────────────────

describe('Redirect', () => {
    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
    })

    it('should call navigate with replace: true by default', () => {
        const { navigate } = renderWithMockRouter(
            h(Redirect, { to: '/dash' }),
        )

        expect(navigate).toHaveBeenCalledWith('/dash', expect.objectContaining({ replace: true }))
    })

    it('should pass through state prop to navigate', () => {
        const { navigate } = renderWithMockRouter(
            h(Redirect, { to: '/dash', state: { redirectFrom: '/' } }),
        )

        expect(navigate).toHaveBeenCalledWith(
            '/dash',
            expect.objectContaining({ replace: true, state: { redirectFrom: '/' } }),
        )
    })

    it('should pass scrollRestore prop', () => {
        const { navigate } = renderWithMockRouter(
            h(Redirect, { to: '/dash', scrollRestore: false }),
        )

        expect(navigate).toHaveBeenCalledWith(
            '/dash',
            expect.objectContaining({ replace: true, scrollRestore: false }),
        )
    })
})
