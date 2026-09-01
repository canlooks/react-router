import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act, waitFor, fireEvent, cleanup } from '@testing-library/react'
import React, { createElement as h } from 'react'
import { Router, Link } from '../../src'
import type { RouteItem } from '../../index'

// ── Route fixtures ───────────────────────────────────────────────────────────
// Factory to create fresh route objects per test — avoids _parent mutation leaks

function createEntryWithTargets(): RouteItem {
    return {
        children: {
            about: {
                page: h('div', { 'data-testid': 'about-page' }, 'About'),
            },
            login: {
                page: h('div', { 'data-testid': 'login-page' }, 'Login'),
            },
        },
    }
}

function preventBrowserNavigationOnce() {
    window.addEventListener('click', event => event.preventDefault(), {once: true})
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Link', () => {
    beforeEach(() => {
        // Reset hash/URL to ensure test isolation
        window.history.replaceState(null, '', '/')
        vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    })

    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
    })

    // ── Rendering ────────────────────────────────────────────────────────

    it('should render as an <a> tag by default', () => {
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link, { to: '/about' }, 'About'),
        }
        render(h(Router, { entry }))

        const link = screen.getByText('About')
        expect(link.tagName).toBe('A')
    })

    it('should set href to "/about" when to="/about"', () => {
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link, { to: '/about' }, 'About'),
        }
        render(h(Router, { entry }))

        const link = screen.getByText('About')
        expect(link.getAttribute('href')).toBe('/about')
    })

    it('should set href starting with "#/about" in hash mode', () => {
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link, { to: '/about' }, 'About'),
        }
        render(h(Router, { mode: 'hash', entry }))

        const link = screen.getByText('About')
        expect(link.getAttribute('href')).toBe('#/about')
    })

    it('should not set href attribute when delta is provided', () => {
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link, { delta: -1 }, 'Back'),
        }
        render(h(Router, { entry }))

        const link = screen.getByText('Back')
        expect(link.hasAttribute('href')).toBe(false)
    })

    it('should render a <button> when component="button"', () => {
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link as React.ElementType, { component: 'button', to: '/about' }, 'Button Link'),
        }
        render(h(Router, { entry }))

        const btn = screen.getByText('Button Link')
        expect(btn.tagName).toBe('BUTTON')
    })

    // ── Click behavior ───────────────────────────────────────────────────

    it('should navigate to target route on click (hash mode)', async () => {
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link as React.ElementType, { to: '/about', 'data-testid': 'nav-link' }, 'About Link'),
        }
        render(h(Router, { mode: 'hash', entry }))

        act(() => {
            fireEvent.click(screen.getByTestId('nav-link'))
        })

        await waitFor(() => {
            expect(screen.getByTestId('about-page')).toBeInTheDocument()
        })
    })

    it('should NOT prevent default when ctrlKey is pressed', () => {
        let wasPreventedBeforeConsumer = true
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link as React.ElementType, {
                to: '/about',
                'data-testid': 'link',
                onClick: (event: React.MouseEvent) => {
                    wasPreventedBeforeConsumer = event.defaultPrevented
                    event.preventDefault()
                },
            }, 'About'),
        }
        render(h(Router, { entry }))

        const link = screen.getByTestId('link')
        fireEvent.click(link, {ctrlKey: true})

        expect(wasPreventedBeforeConsumer).toBe(false)
    })

    it.each([
        ['Meta', {metaKey: true}],
        ['Shift', {shiftKey: true}],
        ['Alt', {altKey: true}],
        ['middle button', {button: 1}],
    ])('should preserve native behavior for %s clicks', (_label, clickOptions) => {
        const pushState = vi.spyOn(history, 'pushState')
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link as React.ElementType, {
                to: '/about',
                'data-testid': 'native-link',
            }, 'About'),
        }
        render(h(Router, {entry}))

        preventBrowserNavigationOnce()
        fireEvent.click(screen.getByTestId('native-link'), clickOptions)

        expect(pushState).not.toHaveBeenCalled()
    })

    it.each([
        ['target=_blank', {target: '_blank'}],
        ['download', {download: 'report.txt'}],
        ['rel=external', {rel: 'external'}],
        ['case-insensitive rel=external', {rel: 'noopener EXTERNAL'}],
    ])('should preserve native behavior for %s', (_label, linkProps) => {
        const pushState = vi.spyOn(history, 'pushState')
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link as React.ElementType, {
                to: '/about',
                'data-testid': 'native-attribute-link',
                ...linkProps,
            }, 'About'),
        }
        render(h(Router, {entry}))

        preventBrowserNavigationOnce()
        fireEvent.click(screen.getByTestId('native-attribute-link'))

        expect(pushState).not.toHaveBeenCalled()
    })

    it('should honor consumer preventDefault before Router navigation', () => {
        const pushState = vi.spyOn(history, 'pushState')
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link as React.ElementType, {
                to: '/about',
                'data-testid': 'cancelled-link',
                onClick: (event: React.MouseEvent) => event.preventDefault(),
            }, 'About'),
        }
        render(h(Router, {entry}))

        fireEvent.click(screen.getByTestId('cancelled-link'))

        expect(pushState).not.toHaveBeenCalled()
    })

    it('should leave cross-origin links to the browser', () => {
        const pushState = vi.spyOn(history, 'pushState')
        const entry: RouteItem = {
            page: h(Link as React.ElementType, {
                to: 'https://example.com/path',
                'data-testid': 'external-link',
            }, 'External'),
        }
        render(h(Router, {entry}))

        const link = screen.getByTestId('external-link')
        preventBrowserNavigationOnce()
        fireEvent.click(link)

        expect(link).toHaveAttribute('href', 'https://example.com/path')
        expect(pushState).not.toHaveBeenCalled()
    })

    it('resolves links from the Router root when the current URL is outside base', () => {
        history.replaceState(null, '', '/outside')
        render(<Router
            base="/app"
            entry={{}}
            notFound={<Link to="/inside" data-testid="outside-base-link">Inside</Link>}
        />)

        expect(screen.getByTestId('outside-base-link')).toHaveAttribute('href', '/app/inside')
    })

    it('should do nothing when "to" is undefined and link is clicked', () => {
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link as React.ElementType, { to: undefined, 'data-testid': 'noop-link' }, 'Noop'),
        }
        render(h(Router, { entry }))

        act(() => {
            fireEvent.click(screen.getByTestId('noop-link'))
        })

        // Link should still be rendered (no navigation occurred)
        expect(screen.getByTestId('noop-link')).toBeInTheDocument()
    })

    it('should resolve an empty target to the current path and remove the current hash', () => {
        history.replaceState(null, '', '/current?x=1#old')
        const entry: RouteItem = {
            children: {
                '**': {
                    page: h(Link as React.ElementType, {
                        to: '',
                        'data-testid': 'empty-link',
                    }, 'Current path'),
                },
            },
        }
        render(h(Router, {entry}))

        const link = screen.getByTestId('empty-link')
        expect(link).toHaveAttribute('href', '/current?x=1')

        act(() => fireEvent.click(link))

        expect(location.pathname).toBe('/current')
        expect(location.search).toBe('?x=1')
        expect(location.hash).toBe('')
    })

    // ── Props forwarding ─────────────────────────────────────────────────

    it('should fire custom onClick alongside internal handler', () => {
        let customFired = false
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link as React.ElementType, {
                to: '/about',
                'data-testid': 'custom-link',
                onClick: () => { customFired = true },
            }, 'Custom'),
        }
        render(h(Router, { entry }))

        act(() => {
            fireEvent.click(screen.getByTestId('custom-link'))
        })

        expect(customFired).toBe(true)
    })

    it('should have scrollRestore and state props without crashing', () => {
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link as React.ElementType, {
                to: '/about',
                scrollRestore: false,
                state: { from: 'test' },
                'data-testid': 'props-link',
            }, 'Props'),
        }
        render(h(Router, { entry }))

        const link = screen.getByTestId('props-link')
        expect(link.getAttribute('href')).toBe('/about')
    })

    it('should navigate by delta when a delta link is clicked', () => {
        const go = vi.spyOn(history, 'go').mockImplementation(() => undefined)
        const entry: RouteItem = {
            page: h(Link, {delta: -2}, 'Back two'),
        }
        render(h(Router, {entry}))

        fireEvent.click(screen.getByText('Back two'))

        expect(go).toHaveBeenCalledWith(-2)
    })

    it('should forward replace, state, and scroll restoration options on click', () => {
        const replaceState = vi.spyOn(history, 'replaceState').mockImplementation(() => undefined)
        const entry: RouteItem = {
            page: h(Link as React.ElementType, {
                to: '/about',
                replace: true,
                state: {from: 'home'},
                scrollRestore: false,
                'data-testid': 'option-link',
            }, 'About with options'),
        }
        render(h(Router, {entry}))

        fireEvent.click(screen.getByTestId('option-link'))

        expect(replaceState).toHaveBeenCalledWith({from: 'home'}, '', '/about')
        expect(window.scrollTo).toHaveBeenCalledWith({left: 0, top: 0, behavior: 'auto'})
    })
})
