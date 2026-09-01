import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React, { createElement as h } from 'react'
import {
    Routes,
    RouterContext,
    RouteLayoutStackIndex,
    RouteStack,
    useCurrentRoute,
    useRouteLayoutStack,
    useRouteLayoutStackIndex,
    useRouteStack,
    useParams,
} from '../../src'
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

    it('should match dynamic :param route without mutating the parent router context', () => {
        const parentParams = Object.freeze({}) as Record<string, string | string[]>
        const contextValue = createMockContext('/user/123', {params: parentParams})
        function MatchedParams() {
            return <div data-testid="user-page">{JSON.stringify(useParams())}</div>
        }
        const entry: RouteItem = {
            children: {
                user: {
                    children: {
                        ':id': {
                            page: <MatchedParams/>,
                        },
                    },
                },
            },
        }

        render(
            h(RouterContext.Provider, { value: contextValue },
                h(Routes, {entry}),
            ),
        )

        expect(screen.getByTestId('user-page')).toBeInTheDocument()
        expect(screen.getByTestId('user-page')).toHaveTextContent('{"id":"123"}')
        expect(contextValue.params).toBe(parentParams)
        expect(parentParams).toEqual({})
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

    it('should isolate notFound from any surrounding route stack context', () => {
        const surroundingRoute: RouteItem = {
            page: h('div'),
            layout: h('div'),
        }
        function NotFoundContextProbe() {
            const routeStack = useRouteStack()
            const layoutStack = useRouteLayoutStack()
            const layoutIndex = useRouteLayoutStackIndex()
            const currentRoute = useCurrentRoute()
            return (
                <div data-testid="not-found-context">
                    <span data-testid="not-found-route-count">{routeStack.length}</span>
                    <span data-testid="not-found-layout-count">{layoutStack.length}</span>
                    <span data-testid="not-found-layout-index">{layoutIndex}</span>
                    <span data-testid="not-found-current-route">{currentRoute ? 'set' : 'unset'}</span>
                </div>
            )
        }
        const contextValue = createMockContext('/nonexistent')

        render(
            <RouteStack value={[surroundingRoute]}>
                <RouteLayoutStackIndex value={4}>
                    <RouterContext.Provider value={contextValue}>
                        <Routes entry={simpleEntry} notFound={<NotFoundContextProbe/>}/>
                    </RouterContext.Provider>
                </RouteLayoutStackIndex>
            </RouteStack>,
        )

        expect(screen.getByTestId('not-found-context')).toBeInTheDocument()
        expect(screen.getByTestId('not-found-route-count')).toHaveTextContent('0')
        expect(screen.getByTestId('not-found-layout-count')).toHaveTextContent('0')
        expect(screen.getByTestId('not-found-layout-index')).toHaveTextContent('0')
        expect(screen.getByTestId('not-found-current-route')).toHaveTextContent('unset')
    })

    it('should prefer an exact route over a later dynamic sibling', () => {
        const entry: RouteItem = {
            children: {
                settings: {
                    page: h('div', {'data-testid': 'settings-page'}, 'Settings'),
                },
                ':id': {
                    page: h('div', {'data-testid': 'dynamic-page'}, 'Dynamic'),
                },
            },
        }

        renderRoutes('/settings', entry)

        expect(screen.getByTestId('settings-page')).toBeInTheDocument()
        expect(screen.queryByTestId('dynamic-page')).not.toBeInTheDocument()
    })

    it('should rebuild route maps when the entry prop changes', () => {
        const contextValue = createMockContext('/')
        const firstEntry: RouteItem = {
            page: h('div', {'data-testid': 'first-page'}, 'First'),
        }
        const secondEntry: RouteItem = {
            page: h('div', {'data-testid': 'second-page'}, 'Second'),
        }
        const renderTree = (entry: RouteItem) => h(
            RouterContext.Provider,
            {value: contextValue},
            h(Routes, {entry}),
        )
        const {rerender} = render(renderTree(firstEntry))

        rerender(renderTree(secondEntry))

        expect(screen.getByTestId('second-page')).toBeInTheDocument()
        expect(screen.queryByTestId('first-page')).not.toBeInTheDocument()
    })
})
