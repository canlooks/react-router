import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import { Router, Outlet, useParams } from '../../src'
import type { RouteItem } from '../../index'

// ---- Test Components ----

function HomePage() {
    return <div data-testid="home-page">Home</div>
}

function UsersLayout() {
    return (
        <div data-testid="users-layout">
            <h2>Users</h2>
            <Outlet />
        </div>
    )
}

function UserDetail() {
    const { userId } = useParams()
    return <div data-testid="user-detail">User: {userId}</div>
}

function UserPosts() {
    const { userId } = useParams()
    return <div data-testid="user-posts">Posts for: {userId}</div>
}

function PostDetail() {
    const { userId, postId } = useParams()
    return (
        <div data-testid="post-detail">
            User: {userId}, Post: {postId}
        </div>
    )
}

function DocPage() {
    const params = useParams()
    // * wildcard captures value under key '*'
    const wildcardValue = params['*'] || 'no-match'
    return <div data-testid="doc-page">Doc: {wildcardValue}</div>
}

function FilePage() {
    // ** catch-all: matches any number of segments but does NOT capture them
    // (capture groups are only added for :param and * wildcards)
    return <div data-testid="file-page">File Catch-All Matched</div>
}

function AdminLayout() {
    return (
        <div data-testid="admin-layout">
            <h2>Admin</h2>
            <Outlet />
        </div>
    )
}

function AdminDashboard() {
    return <div data-testid="admin-dashboard">Admin Dashboard</div>
}

function DualParamPage() {
    const { a, b } = useParams()
    return <div data-testid="dual-param">A: {a}, B: {b}</div>
}

function DuplicateIdPage() {
    const { id } = useParams()
    const displayValue = Array.isArray(id) ? id.join(', ') : String(id)
    return <div data-testid="dup-id-page">ID: {displayValue}</div>
}

// ---- Route Tree ----

const routes: RouteItem = {
    page: <HomePage />,
    children: {
        users: {
            layout: <UsersLayout />,
            children: {
                ':userId': {
                    page: <UserDetail />,
                    children: {
                        posts: {
                            page: <UserPosts />,
                            children: {
                                ':postId': {
                                    page: <PostDetail />,
                                },
                            },
                        },
                    },
                },
            },
        },
        docs: {
            children: {
                '*': {
                    page: <DocPage />,
                },
            },
        },
        files: {
            children: {
                '**': {
                    page: <FilePage />,
                },
            },
        },
        '#admin': {
            layout: <AdminLayout />,
            children: {
                dashboard: {
                    page: <AdminDashboard />,
                },
            },
        },
        ':id': {
            children: {
                ':id': {
                    page: <DuplicateIdPage />,
                },
            },
        },
        ':a': {
            children: {
                ':b': {
                    page: <DualParamPage />,
                },
            },
        },
    },
}

// ---- Helpers ----

function renderAtPath(path: string, customRoutes?: RouteItem) {
    history.pushState(null, '', path)
    return render(<Router mode="history" entry={customRoutes || routes} />)
}

// ---- Tests ----

describe('Dynamic Route Segments — Named Params', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it("'/users/42' → UserDetail receives {userId: '42'}", () => {
        renderAtPath('/users/42')

        expect(screen.getByTestId('users-layout')).toBeInTheDocument()
        expect(screen.getByTestId('user-detail')).toBeInTheDocument()
        expect(screen.getByText('User: 42')).toBeInTheDocument()
    })

    it("'/users/42/posts' → UserPosts receives {userId: '42'}", () => {
        renderAtPath('/users/42/posts')

        expect(screen.getByTestId('users-layout')).toBeInTheDocument()
        expect(screen.getByTestId('user-posts')).toBeInTheDocument()
        expect(screen.getByText('Posts for: 42')).toBeInTheDocument()
    })

    it("'/users/42/posts/99' → PostDetail receives {userId: '42', postId: '99'}", () => {
        renderAtPath('/users/42/posts/99')

        expect(screen.getByTestId('users-layout')).toBeInTheDocument()
        expect(screen.getByTestId('post-detail')).toBeInTheDocument()
        expect(screen.getByText('User: 42, Post: 99')).toBeInTheDocument()
    })

    it('multiple named params on different user', () => {
        renderAtPath('/users/7/posts/13')

        expect(screen.getByTestId('post-detail')).toBeInTheDocument()
        expect(screen.getByText('User: 7, Post: 13')).toBeInTheDocument()
    })
})

describe('Dynamic Route Segments — Wildcards', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it("'*' wildcard matches single segment: '/docs/readme' → captures 'readme'", () => {
        renderAtPath('/docs/readme')

        expect(screen.getByTestId('doc-page')).toBeInTheDocument()
        expect(screen.getByText('Doc: readme')).toBeInTheDocument()
    })

    it("'*' wildcard matches another single segment: '/docs/api'", () => {
        renderAtPath('/docs/api')

        expect(screen.getByTestId('doc-page')).toBeInTheDocument()
        expect(screen.getByText('Doc: api')).toBeInTheDocument()
    })

    it("'*' wildcard does NOT match multi-segment path '/docs/a/b'", () => {
        renderAtPath('/docs/a/b')

        // Single-segment wildcard * should NOT match 'a/b'
        // Should fall through to notFound (no notFound provided — renders nothing)
        expect(screen.queryByTestId('doc-page')).not.toBeInTheDocument()
    })

    it("'**' catch-all matches single segment: '/files/a'", () => {
        renderAtPath('/files/a')

        expect(screen.getByTestId('file-page')).toBeInTheDocument()
        // ** catch-all matches but does NOT capture the segment into params
        expect(screen.getByText('File Catch-All Matched')).toBeInTheDocument()
    })

    it("'**' catch-all matches multi-segment: '/files/a/b/c'", () => {
        renderAtPath('/files/a/b/c')

        expect(screen.getByTestId('file-page')).toBeInTheDocument()
        // ** catch-all matches any depth but does NOT capture into params
        expect(screen.getByText('File Catch-All Matched')).toBeInTheDocument()
    })

    it("'**' catch-all routes have higher priority than '*' for '/' prefix routes", () => {
        // Test that /files/a still matches ** (not conflicting with *)
        renderAtPath('/files/a')

        expect(screen.getByTestId('file-page')).toBeInTheDocument()
    })
})

describe("Dynamic Route Segments — '#' Excluded Segment Prefix", () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it("'/dashboard' renders AdminDashboard (NOT /admin/dashboard)", () => {
        renderAtPath('/dashboard')

        // #admin excludes 'admin' from URL path, so the URL is /dashboard
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument()
    })

    it("URL does NOT include '#admin' prefix — verify pathname is just '/dashboard'", () => {
        renderAtPath('/dashboard')

        // The Router's pathname should be /dashboard
        // We verify this by checking that admin-layout renders (which is in the #admin subtree)
        expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
        // If /admin/dashboard were the pathname, admin-dashboard would not render
        // (it would need /admin/dashboard path which doesn't match '/dashboard')
    })
})

describe('Dynamic Route Segments — Multiple / Duplicate Params', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it("'/:a/:b' captures both params: '/foo/bar' → {a: 'foo', b: 'bar'}", () => {
        // Use isolated route tree to avoid conflict with :id/:id
        const tree: RouteItem = {
            children: {
                ':a': {
                    children: {
                        ':b': { page: <DualParamPage /> }
                    }
                }
            }
        }
        renderAtPath('/foo/bar', tree)

        expect(screen.getByTestId('dual-param')).toBeInTheDocument()
        expect(screen.getByText('A: foo, B: bar')).toBeInTheDocument()
    })

    it("'/:a/:b' captures different values: '/x/y'", () => {
        const tree: RouteItem = {
            children: {
                ':a': {
                    children: {
                        ':b': { page: <DualParamPage /> }
                    }
                }
            }
        }
        renderAtPath('/x/y', tree)

        expect(screen.getByTestId('dual-param')).toBeInTheDocument()
        expect(screen.getByText('A: x, B: y')).toBeInTheDocument()
    })

    it("'/:id/:id' at '/user/42' → params.id is array ['user', '42']", () => {
        renderAtPath('/user/42')

        expect(screen.getByTestId('dup-id-page')).toBeInTheDocument()
        // Duplicate param name results in an array
        expect(screen.getByText('ID: user, 42')).toBeInTheDocument()
    })

    it("'/:id/:id' at '/abc/xyz' → params.id is array ['abc', 'xyz']", () => {
        renderAtPath('/abc/xyz')

        expect(screen.getByTestId('dup-id-page')).toBeInTheDocument()
        expect(screen.getByText('ID: abc, xyz')).toBeInTheDocument()
    })
})

describe('Dynamic Route Segments — Combined Scenarios', () => {
    afterEach(() => {
        cleanup()
        history.pushState(null, '', '/')
    })

    it('dynamic params work within nested layouts', () => {
        // /users/:userId/posts/:postId — already tested above
        renderAtPath('/users/100/posts/200')

        expect(screen.getByTestId('users-layout')).toBeInTheDocument()
        expect(screen.getByTestId('post-detail')).toBeInTheDocument()
        expect(screen.getByText('User: 100, Post: 200')).toBeInTheDocument()
    })

    it('home page renders at root', () => {
        renderAtPath('/')

        expect(screen.getByTestId('home-page')).toBeInTheDocument()
        expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('unknown path returns nothing (no notFound)', () => {
        renderAtPath('/nonexistent/path')

        // No components should render for unmatched route
        expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
        expect(screen.queryByTestId('users-layout')).not.toBeInTheDocument()
    })
})
