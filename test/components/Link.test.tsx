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

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Link', () => {
    beforeEach(() => {
        // Reset hash/URL to ensure test isolation
        window.history.replaceState(null, '', '/')
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
            page: h(Link, { component: 'button', to: '/about' }, 'Button Link'),
        }
        render(h(Router, { entry }))

        const btn = screen.getByText('Button Link')
        expect(btn.tagName).toBe('BUTTON')
    })

    // ── Click behavior ───────────────────────────────────────────────────

    it('should navigate to target route on click (hash mode)', async () => {
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link, { to: '/about', 'data-testid': 'nav-link' }, 'About Link'),
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
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link, { to: '/about', 'data-testid': 'link' }, 'About'),
        }
        render(h(Router, { entry }))

        const link = screen.getByTestId('link')
        // Simulate a click with ctrlKey=true via fireEvent with modifier
        const clickEvent = new MouseEvent('click', {
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
        })
        const defaultPrevented = !link.dispatchEvent(clickEvent)

        // When ctrlKey is true, Link does NOT call preventDefault,
        // so the event's defaultPrevented should remain false
        expect(defaultPrevented).toBe(false)
    })

    it('should do nothing when "to" is undefined and link is clicked', () => {
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link, { to: undefined, 'data-testid': 'noop-link' }, 'Noop'),
        }
        render(h(Router, { entry }))

        act(() => {
            fireEvent.click(screen.getByTestId('noop-link'))
        })

        // Link should still be rendered (no navigation occurred)
        expect(screen.getByTestId('noop-link')).toBeInTheDocument()
    })

    // ── Props forwarding ─────────────────────────────────────────────────

    it('should fire custom onClick alongside internal handler', () => {
        let customFired = false
        const entry: RouteItem = {
            ...createEntryWithTargets(),
            page: h(Link, {
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
            page: h(Link, {
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
})
