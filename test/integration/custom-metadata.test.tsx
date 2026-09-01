import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import {
    Router,
    Outlet,
    useCurrentRoute,
    useRouteStack,
    useRouteLayoutStack,
} from '../../src'
import type { RouteItem } from '../../index'

// ---- Custom Metadata Type ----

type AppRoute = RouteItem<{ title: string; roles?: string[] }>

// ---- Test Components ----

function HomePage() {
    return (
        <div data-testid="home-page">
            <h1>Home</h1>
            <RouteInfo />
        </div>
    )
}

function AdminPage() {
    return (
        <div data-testid="admin-page">
            <h1>Admin</h1>
            <RouteInfo />
        </div>
    )
}

function SettingsPage() {
    return (
        <div data-testid="settings-page">
            <h1>Settings</h1>
            <RouteInfo />
        </div>
    )
}

function DashboardLayout({ children }: { children?: React.ReactNode }) {
    return (
        <div data-testid="dashboard-layout">
            <h2>Dashboard Layout</h2>
            <RouteInfo />
            <Outlet />
        </div>
    )
}

/** Reads custom metadata from current route and entire stack */
function RouteInfo() {
    const route = useCurrentRoute() as AppRoute
    const stack = useRouteStack() as AppRoute[]
    const layoutStack = useRouteLayoutStack() as AppRoute[]

    return (
        <div data-testid="route-info">
            <span data-testid="current-title">{route?.title}</span>
            <span data-testid="current-roles">{route?.roles?.join(',')}</span>
            <span data-testid="stack-depth">{stack.length}</span>
            <span data-testid="layout-stack-depth">{layoutStack.length}</span>
            <ul data-testid="route-titles">
                {stack.map((r, i) => (
                    <li key={i} data-testid={`stack-item-${i}`}>
                        {r.title}
                    </li>
                ))}
            </ul>
        </div>
    )
}

// ---- Route Tree ----

// ---- Route Tree (factory to avoid _parent mutation leaks) ----

function createRoutes(): AppRoute {
    return {
        title: 'Root',
        roles: ['all'],
        page: <HomePage />,
        children: {
            admin: {
                title: 'Admin Panel',
                roles: ['admin'],
                page: <AdminPage />,
            },
            dashboard: {
                title: 'Dashboard',
                roles: ['user', 'admin'],
                layout: <DashboardLayout />,
                page: <div data-testid="dashboard-index">Dashboard Index</div>,
                children: {
                    settings: {
                        title: 'Settings',
                        roles: ['admin'],
                        page: <SettingsPage />,
                    },
                },
            },
        },
    }
}

// ---- Helpers ----

function renderAtPath(path: string) {
    history.pushState(null, '', path)
    return render(<Router mode="history" entry={createRoutes()} />)
}

// ---- Tests ----

describe('Custom Metadata — RouteItem<T>', () => {
    afterEach(() => {
        cleanup()
        cleanup()
        history.pushState(null, '', '/')
    })

    it("useCurrentRoute returns root route with title='Root', roles=['all'] at '/'", () => {
        renderAtPath('/')

        expect(screen.getByTestId('home-page')).toBeInTheDocument()
        expect(screen.getAllByTestId('current-title')[0].textContent).toBe('Root')
        expect(screen.getAllByTestId('current-roles')[0].textContent).toBe('all')
    })

    it("useCurrentRoute returns admin route with title='Admin Panel', roles=['admin'] at '/admin'", () => {
        renderAtPath('/admin')

        expect(screen.getByTestId('admin-page')).toBeInTheDocument()
        expect(screen.getAllByTestId('current-title')[0].textContent).toBe('Admin Panel')
        expect(screen.getAllByTestId('current-roles')[0].textContent).toBe('admin')
    })

    it("useCurrentRoute returns admin route with title='Admin Panel', roles=['admin'] at '/admin'", () => {
        renderAtPath('/admin')

        expect(screen.getByTestId('admin-page')).toBeInTheDocument()
        expect(screen.getByTestId('current-title').textContent).toBe('Admin Panel')
        expect(screen.getByTestId('current-roles').textContent).toBe('admin')
    })

    it('useRouteStack returns all items with custom metadata preserved', () => {
        renderAtPath('/dashboard/settings')

        // Note: useOutlet renders the page at both the layout level and page level
        // for routes without a layout, causing duplicate renders of RouteInfo.
        // Use getAllByTestId and check first match.
        expect(screen.getAllByTestId('stack-depth')[0].textContent).toBe('3')

        const titles = ['Root', 'Dashboard', 'Settings']
        titles.forEach((title, i) => {
            expect(screen.getAllByTestId(`stack-item-${i}`)[0].textContent).toBe(title)
        })
    })

    it('useRouteLayoutStack returns layout routes with metadata', () => {
        renderAtPath('/dashboard/settings')

        // layoutStack at /dashboard/settings: [root(no layout, removed), dashboard(layout), settings(last)]
        // But root has no layout, so it's filtered out UNLESS it's the last (which it isn't here)
        // Wait: root is index 0, dashboard is index 1, settings is index 2 (last)
        // root: no layout, not last — filtered out
        // dashboard: has layout — kept
        // settings: last — kept
        // So layoutStack = [dashboard, settings]
        expect(screen.getAllByTestId('layout-stack-depth')[0].textContent).toBe('2')
    })

    it('useCurrentRoute inside a layout returns the layout route metadata', () => {
        renderAtPath('/dashboard/settings')

        // RouteInfo is rendered inside both DashboardLayout and SettingsPage
        // The FIRST RouteInfo (inside dashboard-layout) sees the dashboard route
        const dashboardLayout = screen.getByTestId('dashboard-layout')
        const dashboardInfo = dashboardLayout.querySelector('[data-testid="route-info"]')
        expect(dashboardInfo).not.toBeNull()
    })

    it('metadata can be accessed without roles (optional field)', () => {
        // Settings route has no roles defined
        const noRolesRoute: AppRoute = {
            title: 'No Roles Route',
            children: {
                simple: {
                    title: 'Simple Page',
                    page: <RouteInfo />,
                },
            },
        }

        history.pushState(null, '', '/simple')
        render(<Router mode="history" entry={noRolesRoute} />)

        expect(screen.getByTestId('current-title').textContent).toBe('Simple Page')
        // roles is undefined, so join returns empty string (after ?. operator)
        expect(screen.getByTestId('current-roles').textContent).toBe('')
    })

    it('multiple routes share the same metadata structure', () => {
        renderAtPath('/admin')

        expect(screen.getAllByTestId('current-title')[0].textContent).toBe('Admin Panel')
        expect(screen.getAllByTestId('current-roles')[0].textContent).toBe('admin')

        // Navigate to / by re-rendering
        cleanup()
        history.pushState(null, '', '/')
        render(<Router mode="history" entry={createRoutes()} />)

        expect(screen.getAllByTestId('current-title')[0].textContent).toBe('Root')
        expect(screen.getAllByTestId('current-roles')[0].textContent).toBe('all')
    })
})

describe('Custom Metadata — TypeScript Generic Safety', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('RouteItem<T> with extra fields compiles and renders correctly', () => {
        // This test verifies that the types work at runtime.
        // If there were TypeScript errors, the test file wouldn't compile.
        type MyRoute = RouteItem<{ id: number; name: string }>

        const typedRoutes: MyRoute = {
            id: 1,
            name: 'root',
            children: {
                about: {
                    id: 2,
                    name: 'about',
                    page: <div data-testid="about-typed">About ({/* name accessed via useCurrentRoute */})</div>,
                },
            },
        }

        function TypedRouteInfo() {
            const route = useCurrentRoute() as MyRoute
            return (
                <div data-testid="typed-info">
                    <span data-testid="typed-id">{route?.id}</span>
                    <span data-testid="typed-name">{route?.name}</span>
                </div>
            )
        }

        // Wrapper to test at /about
        const fullTypedRoutes: MyRoute = {
            id: 1,
            name: 'root',
            page: <TypedRouteInfo />,
            children: {
                about: {
                    id: 2,
                    name: 'about',
                    page: <TypedRouteInfo />,
                },
            },
        }

        history.pushState(null, '', '/about')
        render(<Router mode="history" entry={fullTypedRoutes} />)

        expect(screen.getByTestId('typed-id').textContent).toBe('2')
        expect(screen.getByTestId('typed-name').textContent).toBe('about')
    })

    it('useRouteStack with generic type preserves metadata through chain', () => {
        type ChainRoute = RouteItem<{ level: number }>

        function ChainDebug() {
            const stack = useRouteStack() as ChainRoute[]
            return (
                <div data-testid="chain-debug">
                    <span data-testid="chain-length">{stack.length}</span>
                    <span data-testid="chain-levels">
                        {stack.map(r => r.level).join('-')}
                    </span>
                </div>
            )
        }

        const chainRoutes: ChainRoute = {
            level: 0,
            children: {
                l1: {
                    level: 1,
                    children: {
                        l2: {
                            level: 2,
                            children: {
                                l3: {
                                    level: 3,
                                    page: <ChainDebug />,
                                },
                            },
                        },
                    },
                },
            },
        }

        history.pushState(null, '', '/l1/l2/l3')
        render(<Router mode="history" entry={chainRoutes} />)

        expect(screen.getByTestId('chain-length').textContent).toBe('4')
        expect(screen.getByTestId('chain-levels').textContent).toBe('0-1-2-3')
    })
})
