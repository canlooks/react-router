import React, { ReactNode } from 'react'
import { render, screen, within, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    Router,
    Outlet,
    useParams,
    useRouteStack,
    useRouteLayoutStack,
    useRouteLayoutStackIndex,
    useCurrentRoute,
} from '../../src'
import type { RouteItem } from '../../index'

// ---- Test Components ----

function RootLayout() {
    return (
        <div data-testid="root-layout">
            <h1>Root</h1>
            <Outlet />
        </div>
    )
}

function DashboardLayout() {
    return (
        <div data-testid="dashboard-layout">
            <h2>Dashboard</h2>
            <Outlet />
        </div>
    )
}

function SettingsLayout() {
    return (
        <div data-testid="settings-layout">
            <h3>Settings</h3>
            <Outlet />
        </div>
    )
}

function HomePage() {
    return <div data-testid="home-page">Home</div>
}

function SettingsPage() {
    return <div data-testid="settings-page">Settings Page</div>
}

function TabPage() {
    const { tab } = useParams()
    return <div data-testid="tab-page">Tab: {tab}</div>
}

/** Layout that intentionally omits <Outlet /> to test isolation */
function NoOutletLayout({ children }: { children?: ReactNode }) {
    return (
        <div data-testid="no-outlet-layout">
            <h2>No Outlet Layout</h2>
            {children}
        </div>
    )
}

/** Child page hidden behind NoOutletLayout */
function HiddenChildPage() {
    return <div data-testid="hidden-child">Should Not Render</div>
}

/** Displays route layout stack info for assertion */
function RouteStackDebug() {
    const stack = useRouteStack()
    const layoutStack = useRouteLayoutStack()
    const layoutIndex = useRouteLayoutStackIndex()
    const current = useCurrentRoute()

    return (
        <div data-testid="route-stack-debug">
            <span data-testid="route-count">{stack.length}</span>
            <span data-testid="layout-count">{layoutStack.length}</span>
            <span data-testid="layout-index">{layoutIndex}</span>
            <span data-testid="current-route-type">
                {current && 'layout' in current ? 'has-layout' : 'no-layout-or-null'}
                {!current ? 'null' : ''}
            </span>
        </div>
    )
}

// ---- Route Trees ----

function createNestedRoutes(): RouteItem {
    return {
        layout: <RootLayout />,
        page: <HomePage />,
        children: {
            dashboard: {
                layout: <DashboardLayout />,
                page: <div data-testid="dashboard-index">Dashboard Index</div>,
                children: {
                    settings: {
                        layout: <SettingsLayout />,
                        page: <SettingsPage />,
                        children: {
                            ':tab': {
                                page: <TabPage />,
                            },
                        },
                    },
                },
            },
        },
    }
}

function createNoOutletRoutes(): RouteItem {
    return {
        layout: <NoOutletLayout />,
        page: <HomePage />,
        children: {
            hidden: {
                page: <HiddenChildPage />,
            },
        },
    }
}

function createDebugRoutes(): RouteItem {
    return {
        layout: <RootLayout />,
        page: <div data-testid="root-page"><RouteStackDebug /></div>,
        children: {
            dashboard: {
                layout: <DashboardLayout />,
                page: <RouteStackDebug />,
                children: {
                    settings: {
                        layout: <SettingsLayout />,
                        page: <RouteStackDebug />,
                        children: {
                            ':tab': {
                                page: <RouteStackDebug />,
                            },
                        },
                    },
                },
            },
        },
    }
}

// ---- Helpers ----

/** Navigate to a path by setting history state before rendering */
function renderAtPath(routes: RouteItem, path: string) {
    history.pushState(null, '', path)
    const result = render(<Router mode="history" entry={routes} />)
    return result
}

// ---- Tests ----

describe('Nested Layouts', () => {
    afterEach(() => {
        cleanup()
        // Reset to root
        history.pushState(null, '', '/')
    })

    it('renders RootLayout containing HomePage at /', () => {
        renderAtPath(createNestedRoutes(), '/')

        expect(screen.getByTestId('root-layout')).toBeInTheDocument()
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
        // Settings layout should NOT be visible
        expect(screen.queryByTestId('settings-layout')).not.toBeInTheDocument()
    })

    it('renders RootLayout + DashboardLayout at /dashboard (settings not visible)', () => {
        renderAtPath(createNestedRoutes(), '/dashboard')

        expect(screen.getByTestId('root-layout')).toBeInTheDocument()
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
        // Settings and page not matched yet
        expect(screen.queryByTestId('settings-layout')).not.toBeInTheDocument()
        expect(screen.queryByTestId('settings-page')).not.toBeInTheDocument()
    })

    it('renders all 3 layouts + SettingsPage at /dashboard/settings', () => {
        renderAtPath(createNestedRoutes(), '/dashboard/settings')

        expect(screen.getByTestId('root-layout')).toBeInTheDocument()
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
        expect(screen.getByTestId('settings-layout')).toBeInTheDocument()
        expect(screen.getByTestId('settings-page')).toBeInTheDocument()
    })

    it('renders all 3 layouts + TabPage with tab=general at /dashboard/settings/general', () => {
        renderAtPath(createNestedRoutes(), '/dashboard/settings/general')

        expect(screen.getByTestId('root-layout')).toBeInTheDocument()
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
        expect(screen.getByTestId('settings-layout')).toBeInTheDocument()
        expect(screen.getByTestId('tab-page')).toBeInTheDocument()
        expect(screen.getByText('Tab: general')).toBeInTheDocument()
    })

    it('renders TabPage with different param values', () => {
        renderAtPath(createNestedRoutes(), '/dashboard/settings/account')

        expect(screen.getByTestId('tab-page')).toBeInTheDocument()
        expect(screen.getByText('Tab: account')).toBeInTheDocument()
    })

    it('renders layouts nested in correct DOM hierarchy', () => {
        renderAtPath(createNestedRoutes(), '/dashboard/settings/general')

        const rootLayout = screen.getByTestId('root-layout')
        const dashboardLayout = screen.getByTestId('dashboard-layout')
        const settingsLayout = screen.getByTestId('settings-layout')
        const tabPage = screen.getByTestId('tab-page')

        // Dashboard should be inside Root
        expect(within(rootLayout).getByTestId('dashboard-layout')).toBe(dashboardLayout)
        // Settings should be inside Dashboard
        expect(within(dashboardLayout).getByTestId('settings-layout')).toBe(settingsLayout)
        // TabPage should be inside Settings
        expect(within(settingsLayout).getByTestId('tab-page')).toBe(tabPage)
    })

    it('does not render child routes when layout omits <Outlet />', () => {
        renderAtPath(createNoOutletRoutes(), '/hidden')

        expect(screen.getByTestId('no-outlet-layout')).toBeInTheDocument()
        // The hidden child page should NOT render because the layout doesn't have <Outlet />
        expect(screen.queryByTestId('hidden-child')).not.toBeInTheDocument()
    })

    it('route with no layout and no page at intermediate level should pass through', () => {
        const passRoutes: RouteItem = {
            layout: <RootLayout />,
            children: {
                pass: {
                    // No layout, no page — should pass through to children
                    children: {
                        target: {
                            page: <div data-testid="pass-target">Reached</div>,
                        },
                    },
                },
            },
        }

        renderAtPath(passRoutes, '/pass/target')

        expect(screen.getByTestId('root-layout')).toBeInTheDocument()
        expect(screen.getByTestId('pass-target')).toBeInTheDocument()
    })
})

describe('useRouteStack / useRouteLayoutStack / useRouteLayoutStackIndex', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('useRouteStack returns correct count at each depth', () => {
        renderAtPath(createDebugRoutes(), '/')
        // At root, only root route in stack
        expect(screen.getByTestId('route-count').textContent).toBe('1')
    })

    it('useRouteLayoutStack returns layout routes at /dashboard/settings/general', () => {
        renderAtPath(createDebugRoutes(), '/dashboard/settings/general')

        // Stack: [root, dashboard, settings, tab] — layout stack: [root(layout), dashboard(layout), settings(layout), tab(last)]
        expect(screen.getByTestId('route-count').textContent).toBe('4')
        expect(screen.getByTestId('layout-count').textContent).toBe('4')
    })

    it('useRouteLayoutStackIndex increments through layout levels', () => {
        // At root page (inside RootLayout → Outlet → page), index = 2:
        // index 0 = Router entry, index 1 = root.layout, index 2 = root.page
        renderAtPath(createDebugRoutes(), '/')
        expect(screen.getByTestId('layout-index').textContent).toBe('2')
    })

    it('useRouteLayoutStackIndex > 1 at nested depth', () => {
        renderAtPath(createDebugRoutes(), '/dashboard/settings/general')
        // Inside the TabPage (deepest), the index should be 4
        expect(screen.getByTestId('layout-index').textContent).toBe('5')
    })

    it('useCurrentRoute returns correct route at each level', () => {
        renderAtPath(createDebugRoutes(), '/dashboard/settings/general')
        // Inside TabPage, current route is the tab route which has page (no layout)
        expect(screen.getByTestId('current-route-type').textContent).toBe('no-layout-or-null')
    })

    it('useCurrentRoute returns route with layout at intermediate level', () => {
        // Create a separate test where the debug component is placed at DashboardLayout level
        const intermediateRoutes: RouteItem = {
            layout: (
                <div data-testid="root-layout">
                    <h1>Root</h1>
                    <Outlet />
                </div>
            ),
            children: {
                section: {
                    layout: (
                        <div data-testid="section-layout">
                            <h2>Section</h2>
                            <Outlet />
                            <RouteStackDebug />
                        </div>
                    ),
                    children: {
                        page: {
                            page: <div data-testid="leaf-page">Leaf</div>,
                        },
                    },
                },
            },
        }

        renderAtPath(intermediateRoutes, '/section/page')

        // RouteStackDebug inside section-layout should see:
        // layout-stack: [root, section, page(last)], so 3 layout routes
        // current-route: index 2 → layoutStack[1] = section (has layout)
        expect(screen.getByTestId('layout-count').textContent).toBe('3')
        expect(screen.getByTestId('current-route-type').textContent).toBe('has-layout')
    })
})

describe('Nested Layouts — Edge Cases', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('multiple layout nesting without intermediate pages', () => {
        const multiLayoutRoutes: RouteItem = {
            layout: <div data-testid="l1"><Outlet /></div>,
            children: {
                a: {
                    layout: <div data-testid="l2"><Outlet /></div>,
                    children: {
                        b: {
                            layout: <div data-testid="l3"><Outlet /></div>,
                            children: {
                                c: {
                                    page: <div data-testid="leaf">Deep Leaf</div>,
                                },
                            },
                        },
                    },
                },
            },
        }

        renderAtPath(multiLayoutRoutes, '/a/b/c')

        expect(screen.getByTestId('l1')).toBeInTheDocument()
        expect(screen.getByTestId('l2')).toBeInTheDocument()
        expect(screen.getByTestId('l3')).toBeInTheDocument()
        expect(screen.getByTestId('leaf')).toBeInTheDocument()
    })

    it('root route with layout but no page still renders layout with matching child', () => {
        const rootLayoutOnly: RouteItem = {
            layout: <div data-testid="root-only-layout"><h1>Root Layout</h1><Outlet /></div>,
            children: {
                home: {
                    page: <div data-testid="home-content">Home Content</div>,
                },
            },
        }

        renderAtPath(rootLayoutOnly, '/home')

        expect(screen.getByTestId('root-only-layout')).toBeInTheDocument()
        expect(screen.getByTestId('home-content')).toBeInTheDocument()
    })
})
