import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React, { createElement as h } from 'react'
import { Routes, RouterContext } from '../../src'
import type { RouteItem } from '../../index'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a mock RouterContext value with a controlled pathname and params.
 */
function createMockContext(pathname: string, overrides: Record<string, any> = {}) {
    return {
        pathname,
        params: {} as Record<string, string | string[]>,
        mode: 'history' as const,
        base: '/',
        location: window.location,
        replace: vi.fn(),
        navigate: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        state: null,
        setState: vi.fn(),
        ...overrides,
    }
}

/**
 * Renders a Routes component wrapped in a mocked RouterContext.Provider.
 */
function renderRoutes(
    pathname: string,
    entry: RouteItem,
    notFound?: React.ReactNode,
) {
    const contextValue = createMockContext(pathname)
    return render(
        h(RouterContext.Provider, { value: contextValue },
            h(Routes, { entry, notFound }),
        ),
    )
}

// ── Route fixtures ───────────────────────────────────────────────────────────

const simpleEntry: RouteItem = {
    page: h('div', { 'data-testid': 'root-page' }, 'Root'),
}

const nestedEntry: RouteItem = {
    page: h('div', { 'data-testid': 'root-page' }, 'Root'),
    children: {
        a: {
            page: h('div', { 'data-testid': 'page-a' }, 'Page A'),
        },
    },
}

const groupedEntry: RouteItem = {
    children: {
        '#g': {
            children: {
                b: {
                    page: h('div', { 'data-testid': 'page-b' }, 'Page B'),
                },
            },
        },
    },
}

const paramEntry: RouteItem = {
    children: {
        user: {
            children: {
                ':id': {
                    page: h('div', { 'data-testid': 'user-page' }, 'User'),
                },
            },
        },
    },
}

const wildcardEntry: RouteItem = {
    children: {
        docs: {
            children: {
                '*': {
                    page: h('div', { 'data-testid': 'docs-page' }, 'Docs'),
                },
            },
        },
    },
}

const catchAllEntry: RouteItem = {
    children: {
        files: {
            children: {
                '**': {
                    page: h('div', { 'data-testid': 'files-page' }, 'Files'),
                },
            },
        },
    },
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Routes', () => {
    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
    })

    it('should render page for static route match', () => {
        renderRoutes('/', simpleEntry)
        expect(screen.getByTestId('root-page')).toBeInTheDocument()
    })

    it('should render page for nested static route match', () => {
        renderRoutes('/a', nestedEntry)
        expect(screen.getByTestId('page-a')).toBeInTheDocument()
    })

    it('should match route under # grouped path (excludes # from path)', () => {
        // Entry: children → '#g' → children → 'b'
        // Matching pathname: /b (the #g is transparent)
        renderRoutes('/b', groupedEntry)
        expect(screen.getByTestId('page-b')).toBeInTheDocument()
    })

    it('should match dynamic :param route and populate params', () => {
        const params: Record<string, string | string[]> = {}
        const contextValue = createMockContext('/user/123')
        contextValue.params = params

        render(
            h(RouterContext.Provider, { value: contextValue },
                h(Routes, { entry: paramEntry }),
            ),
        )

        expect(screen.getByTestId('user-page')).toBeInTheDocument()
        // Routes should have populated params
        expect(params.id).toBe('123')
    })

    it('should match * wildcard for single segment', () => {
        renderRoutes('/docs/something', wildcardEntry)
        expect(screen.getByTestId('docs-page')).toBeInTheDocument()
    })

    it('should NOT match * wildcard for multi-segment path', () => {
        // /docs/a/b should NOT match docs/* (only single segment)
        renderRoutes(
            '/docs/a/b',
            wildcardEntry,
            h('div', { 'data-testid': 'not-found' }, 'Not Found'),
        )
        expect(screen.getByTestId('not-found')).toBeInTheDocument()
        expect(screen.queryByTestId('docs-page')).not.toBeInTheDocument()
    })

    it('should match ** catch-all for multi-segment paths', () => {
        renderRoutes('/files/a/b/c', catchAllEntry)
        expect(screen.getByTestId('files-page')).toBeInTheDocument()
    })

    it('should also match ** for single segment', () => {
        renderRoutes('/files/readme', catchAllEntry)
        expect(screen.getByTestId('files-page')).toBeInTheDocument()
    })

    it('should render notFound when no route matches', () => {
        renderRoutes(
            '/nonexistent',
            simpleEntry,
            h('div', { 'data-testid': 'not-found' }, 'Not Found'),
        )
        expect(screen.getByTestId('not-found')).toBeInTheDocument()
        expect(screen.queryByTestId('root-page')).not.toBeInTheDocument()
    })
})
