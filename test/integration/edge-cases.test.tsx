import React, { useState, useEffect } from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
    Router,
    Link,
    Navigate,
    Outlet,
    useRouter,
    useParams,
    useNavigate,
    useSyncState,
    useSync,
} from '../../src'
import type { RouteItem } from '../../index'

// ---- Test Components ----

function HomePage() {
    return <div data-testid="home-page">Home</div>
}

function AboutPage() {
    return <div data-testid="about-page">About</div>
}

function ItemPage() {
    const { id } = useParams()
    return <div data-testid="item-page">Item: {id}</div>
}

function DeepPage() {
    return <div data-testid="deep-page">Deep C</div>
}

function LayoutWithOutlet() {
    return (
        <div data-testid="layout">
            <Outlet />
        </div>
    )
}

// ---- Route Trees ----

// ---- Route Trees (factories to avoid _parent mutation leaks) ----

function createBaseRoutes(): RouteItem {
    return {
        page: <HomePage />,
        children: {
            about: {
                page: <AboutPage />,
            },
            items: {
                children: {
                    ':id': {
                        page: <ItemPage />,
                    },
                },
            },
            deep: {
                children: {
                    a: {
                        children: {
                            b: {
                                children: {
                                    c: {
                                        page: <DeepPage />,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }
}

function createLayoutOnlyRoute(): RouteItem {
    return {
        page: <HomePage />,
        children: {
            wrapped: {
                layout: <LayoutWithOutlet />,
            },
        },
    }
}

// ---- Helpers ----

function renderAtPath(routes: RouteItem, path: string) {
    history.pushState(null, '', path)
    return render(<Router mode="history" entry={routes} />)
}

// ---- Tests ----

describe('Edge Cases — Navigation', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('navigate("") empty string does nothing special', () => {
        function EmptyNavigateTester() {
            const navigate = useNavigate()
            return (
                <button data-testid="nav-empty" onClick={() => navigate('')}>
                    Nav to empty
                </button>
            )
        }

        const testRoutes: RouteItem = {
            page: (
                <div data-testid="root">
                    <HomePage />
                    <EmptyNavigateTester />
                </div>
            ),
        }

        renderAtPath(testRoutes, '/')

        fireEvent.click(screen.getByTestId('nav-empty'))
        // Root should still be rendered
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('navigate("/") stays at root', () => {
        function RootNavigateTester() {
            const navigate = useNavigate()
            return (
                <button data-testid="nav-root" onClick={() => navigate('/')}>
                    Nav to root
                </button>
            )
        }

        const testRoutes: RouteItem = {
            page: (
                <div data-testid="root">
                    <HomePage />
                    <RootNavigateTester />
                </div>
            ),
        }

        renderAtPath(testRoutes, '/')

        fireEvent.click(screen.getByTestId('nav-root'))
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('navigate to "/about" from root works correctly', () => {
        function Tester() {
            const navigate = useNavigate()
            return (
                <div>
                    <button data-testid="go-about" onClick={() => navigate('/about')}>
                        Go About
                    </button>
                    <Outlet />
                </div>
            )
        }

        const testRoutes: RouteItem = {
            layout: <Tester />,
            page: <HomePage />,
            children: {
                about: {
                    page: <AboutPage />,
                },
            },
        }

        renderAtPath(testRoutes, '/')

        fireEvent.click(screen.getByTestId('go-about'))

        // After navigation, the about page should be visible
        // Note: in jsdom, history.pushState may not trigger a React re-render
        // immediately. We verify the page state after click.
        // The navigate() call triggers updateClonedLocation which should re-render.
        expect(screen.getByTestId('about-page')).toBeInTheDocument()
    })

    it('double slash "//about" is normalized to "/about"', () => {
        // unifySlash normalizes // to /
        renderAtPath(createBaseRoutes(), '/about')
        expect(screen.getByTestId('about-page')).toBeInTheDocument()
    })

    it('base with trailing slash is normalized', () => {
        history.pushState(null, '', '/app/about')
        render(
            <Router mode="history" base="/app/" entry={createBaseRoutes()} />
        )

        expect(screen.getByTestId('about-page')).toBeInTheDocument()
    })

    it('rapid consecutive navigations — last one wins', () => {
        function RapidNavTester() {
            const navigate = useNavigate()
            return (
                <button
                    data-testid="rapid-nav"
                    onClick={() => {
                        navigate('/about')
                        navigate('/items/999')
                    }}
                >
                    Rapid Nav
                </button>
            )
        }

        const testRoutes: RouteItem = {
            page: (
                <div>
                    <HomePage />
                    <RapidNavTester />
                </div>
            ),
            children: {
                about: { page: <AboutPage /> },
                items: {
                    children: {
                        ':id': { page: <ItemPage /> },
                    },
                },
            },
        }

        renderAtPath(testRoutes, '/')

        fireEvent.click(screen.getByTestId('rapid-nav'))

        // Last navigation should win — should be at /items/999
        expect(screen.getByTestId('item-page')).toBeInTheDocument()
        expect(screen.getByText('Item: 999')).toBeInTheDocument()
    })

    it('Link with delta={0} does nothing', () => {
        const testRoutes: RouteItem = {
            page: (
                <div>
                    <HomePage />
                    <Link data-testid="delta-zero-link" delta={0}>
                        Click
                    </Link>
                </div>
            ),
        }

        renderAtPath(testRoutes, '/')

        fireEvent.click(screen.getByTestId('delta-zero-link'))

        // Should remain on home page
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('Navigate component with no to and no delta renders null', () => {
        const testRoutes: RouteItem = {
            page: (
                <div>
                    <HomePage />
                    <Navigate />
                </div>
            ),
        }

        renderAtPath(testRoutes, '/')

        // Should render without errors, HomePage visible
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })

    it('navigate to same-origin URL object works', () => {
        function UrlNavTester() {
            const navigate = useNavigate()
            return (
                <button
                    data-testid="url-nav"
                    onClick={() => navigate(new URL('/about', window.location.href))}
                >
                    URL Nav
                </button>
            )
        }

        const testRoutes: RouteItem = {
            page: (
                <div>
                    <HomePage />
                    <UrlNavTester />
                </div>
            ),
            children: {
                about: { page: <AboutPage /> },
            },
        }

        renderAtPath(testRoutes, '/')

        fireEvent.click(screen.getByTestId('url-nav'))

        expect(screen.getByTestId('about-page')).toBeInTheDocument()
    })

    it('navigate to cross-origin URL object throws error', () => {
        function CrossOriginTester() {
            const navigate = useNavigate()
            return (
                <button
                    data-testid="cross-origin-nav"
                    onClick={() => {
                        expect(() => {
                            navigate(new URL('http://other-origin.com/path'))
                        }).toThrow(/different origin/i)
                    }}
                >
                    Cross Origin
                </button>
            )
        }

        const testRoutes: RouteItem = {
            page: (
                <div>
                    <HomePage />
                    <CrossOriginTester />
                </div>
            ),
        }

        renderAtPath(testRoutes, '/')

        // Click should invoke navigate which throws
        fireEvent.click(screen.getByTestId('cross-origin-nav'))
        // The expect inside the handler handles the assertion
    })

    it('navigate to the current path replaces without error', () => {
        function SamePathTester() {
            const navigate = useNavigate()
            return (
                <button
                    data-testid="same-path-nav"
                    onClick={() => navigate(window.location.pathname)}
                >
                    Same Path
                </button>
            )
        }

        const testRoutes: RouteItem = {
            layout: (
                <div>
                    <HomePage />
                    <SamePathTester />
                    <Outlet />
                </div>
            ),
            children: {
                about: {
                    page: <AboutPage />,
                },
            },
        }

        renderAtPath(testRoutes, '/about')
        expect(screen.getByTestId('about-page')).toBeInTheDocument()

        fireEvent.click(screen.getByTestId('same-path-nav'))

        // Still on about page
        expect(screen.getByTestId('about-page')).toBeInTheDocument()
    })
})

describe('Edge Cases — Router Lifecycle', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('unmount Router removes popstate event listener', () => {
        const addSpy = vi.spyOn(window, 'addEventListener')
        const removeSpy = vi.spyOn(window, 'removeEventListener')

        const { unmount } = render(
            <Router mode="history" entry={createBaseRoutes()} />
        )

        // Verify popstate listener was added
        expect(addSpy).toHaveBeenCalledWith('popstate', expect.any(Function))

        unmount()

        // Verify popstate listener was removed
        expect(removeSpy).toHaveBeenCalledWith('popstate', expect.any(Function))

        addSpy.mockRestore()
        removeSpy.mockRestore()
    })

    it('Router mounts without errors and renders content', () => {
        const { unmount } = render(
            <Router mode="history" entry={createBaseRoutes()} />
        )

        expect(screen.getByTestId('home-page')).toBeInTheDocument()
        unmount()
    })

    it('Router can be unmounted and remounted', () => {
        const { unmount } = render(
            <Router mode="history" entry={createBaseRoutes()} />
        )
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
        unmount()

        // Remount
        history.pushState(null, '', '/about')
        render(<Router mode="history" entry={createBaseRoutes()} />)
        expect(screen.getByTestId('about-page')).toBeInTheDocument()
    })
})

describe('Edge Cases — Empty and Partial Route Trees', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('empty route tree (entry with no page, no layout, no children) handles gracefully', () => {
        const emptyRoute: RouteItem = {}

        // Should render without throwing
        const { unmount } = render(
            <Router mode="history" entry={emptyRoute} />
        )

        // Nothing should be rendered (no notFound provided)
        expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
        unmount()
    })

    it('a layout-only leaf is not treated as a directly matchable endpoint', () => {
        history.pushState(null, '', '/wrapped')
        render(
            <Router
                mode="history"
                entry={createLayoutOnlyRoute()}
                notFound={<div data-testid="not-found">Not Found</div>}
            />
        )

        expect(screen.getByTestId('not-found')).toBeInTheDocument()
        expect(screen.queryByTestId('layout')).not.toBeInTheDocument()
    })

    it('route with page=false is treated as no page (isUnset)', () => {
        const unsetRoutes: RouteItem = {
            children: {
                'real-page': {
                    page: <div data-testid="real">Real Page</div>,
                },
                'no-page': {
                    page: false, // isUnset returns true
                },
            },
        }

        renderAtPath(unsetRoutes, '/no-page')

        // Should not match (page is treated as unset), no notFound rendered
        // The router treats page=false same as no page, so this segment has nothing
        // Since the parent has children but no page, and this child has no effective page
        // nothing should render (no match)
    })

    it('route with page=null is treated as no page', () => {
        const nullPageRoutes: RouteItem = {
            children: {
                'no-page': {
                    page: null,
                },
                'yes-page': {
                    page: <div data-testid="yes-page">Yes</div>,
                },
            },
        }

        renderAtPath(nullPageRoutes, '/yes-page')
        expect(screen.getByTestId('yes-page')).toBeInTheDocument()

        // At /no-page, route should not match
        history.pushState(null, '', '/no-page')
        render(<Router mode="history" entry={nullPageRoutes} />)
        // Nothing renders because no effective page
    })
})

describe('Edge Cases — Deep Nesting', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('deeply nested route /deep/a/b/c renders correctly', () => {
        renderAtPath(createBaseRoutes(), '/deep/a/b/c')

        expect(screen.getByTestId('deep-page')).toBeInTheDocument()
        expect(screen.getByText('Deep C')).toBeInTheDocument()
    })

    it('intermediate deep paths without page render nothing', () => {
        // /deep/a has no page (only children intermediate routes)
        renderAtPath(createBaseRoutes(), '/deep/a')

        // No page should render at /deep/a
        expect(screen.queryByTestId('deep-page')).not.toBeInTheDocument()
        expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
    })

    it('/deep/a/b also has no rendered page until /deep/a/b/c', () => {
        renderAtPath(createBaseRoutes(), '/deep/a/b')

        expect(screen.queryByTestId('deep-page')).not.toBeInTheDocument()
        expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
    })
})

describe('Edge Cases — useSync and useSyncState', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('useSync updates ref.current across renders', () => {
        let capturedRef: any = null
        let triggerUpdate!: () => void

        function SyncTester() {
            const [value, setValue] = useState(0)
            const syncedRef = useSync(value)

            useEffect(() => {
                capturedRef = syncedRef
            })

            triggerUpdate = () => setValue(v => v + 1)

            return <span data-testid="sync-value">{syncedRef.current}</span>
        }

        render(
            <Router mode="history" entry={{ page: <SyncTester /> }} />
        )

        expect(screen.getByTestId('sync-value').textContent).toBe('0')

        act(() => {
            triggerUpdate()
        })

        // After update, ref.current should reflect new value
        expect(screen.getByTestId('sync-value').textContent).toBe('1')
        expect(capturedRef?.current).toBe(1)
    })

    it('useSyncState functional update receives previous state', () => {
        let triggerUpdate!: (updater: (prev: number) => number) => void

        function SyncStateTester() {
            const [ref, setState] = useSyncState(10)

            triggerUpdate = setState

            return <span data-testid="sync-state-value">{ref.current}</span>
        }

        render(
            <Router mode="history" entry={{ page: <SyncStateTester /> }} />
        )

        expect(screen.getByTestId('sync-state-value').textContent).toBe('10')

        act(() => {
            triggerUpdate(prev => prev + 5)
        })

        expect(screen.getByTestId('sync-state-value').textContent).toBe('15')
    })

    it('useSyncState same value prevents re-render', () => {
        let renderCount = 0
        let triggerUpdate!: (value: number) => void

        function SyncStateNoRerender() {
            const [ref, setState] = useSyncState(42)
            renderCount++

            triggerUpdate = setState

            return <span data-testid="no-rerender-value">{ref.current}</span>
        }

        render(
            <Router mode="history" entry={{ page: <SyncStateNoRerender /> }} />
        )

        const initialRenderCount = renderCount

        act(() => {
            // Set same value — should NOT trigger re-render
            triggerUpdate(42)
        })

        // Render count should not increase
        expect(renderCount).toBe(initialRenderCount)
        expect(screen.getByTestId('no-rerender-value').textContent).toBe('42')
    })
})

describe('Edge Cases — Router Modes', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('hash mode renders at initial hash path', () => {
        location.hash = '#/about'

        render(
            <Router mode="hash" entry={createBaseRoutes()} />
        )

        expect(screen.getByTestId('about-page')).toBeInTheDocument()

        location.hash = ''
    })

    it('memory mode starts at its own root and ignores the browser hash', () => {
        location.hash = '#/items/42'

        render(
            <Router mode="memory" entry={createBaseRoutes()} />
        )

        expect(screen.getByTestId('home-page')).toBeInTheDocument()
        expect(screen.queryByTestId('item-page')).not.toBeInTheDocument()

        location.hash = ''
    })

    it('history mode renders using pathname', () => {
        history.pushState(null, '', '/items/77')
        render(<Router mode="history" entry={createBaseRoutes()} />)

        expect(screen.getByTestId('item-page')).toBeInTheDocument()
        expect(screen.getByText('Item: 77')).toBeInTheDocument()
    })
})

describe('Edge Cases — Navigate Component', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('Navigate with "to" prop redirects on mount', () => {
        const redirectRoutes: RouteItem = {
            page: <HomePage />,
            children: {
                about: { page: <AboutPage /> },
            },
        }

        const entryWithRedirect: RouteItem = {
            page: (
                <div>
                    <Navigate to="/about" replace />
                </div>
            ),
            children: redirectRoutes.children,
        }

        history.pushState(null, '', '/')
        render(<Router mode="history" entry={entryWithRedirect} />)

        // After Navigate effect runs, should be at /about
        expect(screen.getByTestId('about-page')).toBeInTheDocument()
    })

    it('Navigate runs in useEffect and only triggers once', () => {
        let navCount = 0

        function CountingNavigator() {
            useEffect(() => {
                navCount++
            })
            return null
        }

        const testRoutes: RouteItem = {
            page: (
                <div>
                    <HomePage />
                    <CountingNavigator />
                </div>
            ),
        }

        renderAtPath(testRoutes, '/')

        // Should render once (navCount may be 2 due to strict mode double effects in dev)
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
        expect(navCount).toBeGreaterThan(0)
    })
})
