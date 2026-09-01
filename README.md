# @canlooks/react-router

A lightweight, tree-structured routing framework for React. Define your routes as nested objects — no flat arrays, no JSX route declarations, just a natural tree that mirrors your component hierarchy.

## Features

- **Tree-based route configuration** — Routes are defined as a nested object tree, not a flat array. The structure naturally mirrors your UI hierarchy.
- **Three router modes** — `history`, `hash`, and `memory` modes supported out of the box.
- **Nested layouts** — Each route segment can declare its own `layout` (shell/wrapper) and `page` (leaf content). Layouts nest automatically.
- **Dynamic route segments** — Use `:param` for named parameters, `*` for single-segment wildcards, and `**` for catch-all routes.
- **Type-safe** — Written in TypeScript with full type declarations. Route items can be extended with custom metadata via generics.
- **Small footprint** — Minimal API surface with zero external runtime dependencies (only `tslib`).
- **React 19 compatible** — Built for modern React.

## Installation

```bash
npm i @canlooks/react-router
```

The package ships explicit CommonJS and ESM entry points and supports Node.js 18 or newer.

## Quick Start

```tsx
import { Router, Outlet, Link, useParams } from '@canlooks/react-router'
import type { RouteItem } from '@canlooks/react-router'

// 1. Define your route tree
const routes: RouteItem = {
    layout: <AppLayout />,
    page: <HomePage />,
    children: {
        'about': {
            page: <AboutPage />
        },
        'user': {
            layout: <UserLayout />,
            page: <UserListPage />,
            children: {
                ':userId': {
                    page: <UserDetailPage />
                }
            }
        }
    }
}

// 2. Mount the Router
export default function App() {
    return <Router entry={routes} />
}

// 3. Use navigation and route params in your components
function UserDetailPage() {
    const { userId } = useParams()
    return <div>User: {userId}</div>
}
```

## Route Configuration

### The `RouteItem` Type

```ts
type RouteItem<T = {}> = T & {
    layout?: ReactNode     // Wrapper component (shell, sidebar, header, etc.)
    page?: ReactNode       // Leaf content rendered inside the layout
    children?: Record<string, RouteItem<T>>  // Nested child routes
}
```

The generic parameter `T` allows you to attach custom metadata to each route:

```tsx
type MyRoute = RouteItem<{ title: string; requiresAuth: boolean }>

const routes: MyRoute = {
    title: 'App',
    requiresAuth: false,
    layout: <AppLayout />,
    page: <Home />,
    children: {
        'dashboard': {
            title: 'Dashboard',
            requiresAuth: true,
            page: <Dashboard />
        }
    }
}
```

### How Routes are Rendered

For a matched route chain, the framework collects all route entries and renders them as nested layouts:

```
URL: /user/123
Matched chain: [root, user, :userId]

Rendered output:
  <root.layout>
    <user.layout>
      <userId.page />
    </user.layout>
  </root.layout>
```

- **`layout`**: A wrapper component for the route. It **must** render an `<Outlet />` if it has children that should appear inside it.
- **`page`**: The leaf content for the route. If a route has both `layout` and `page`, the `layout` renders first, wrapping the `page`.
- **`children`**: Nested sub-routes, keyed by path segment.

### Route Path Types

| Pattern | Description | Example |
|---------|-------------|---------|
| `'about'` | Static segment — exact match | `/about` |
| `':id'` | Dynamic segment — captures as param | `/user/123` → `{ id: '123' }` |
| `'*'` | Single-segment wildcard | `/docs/*` matches `/docs/any` but not `/docs/a/b` |
| `'**'` | Catch-all — matches any remaining path | `/files/**` matches `/files/a/b/c` |
| `'#group'` | Grouping — excluded from URL path | Used to organize children without affecting the URL |

#### Grouping with `#`

The `#` prefix on a child key excludes that segment from the URL path. This is useful for organizing routes logically without changing the URL structure:

```tsx
const routes: RouteItem = {
    children: {
        '#public': {
            layout: <PublicLayout />,
            children: {
                'login': { page: <LoginPage /> },
                'register': { page: <RegisterPage /> }
            }
        },
        '#protected': {
            layout: <AuthGuard />,
            children: {
                'dashboard': { page: <Dashboard /> },
                'settings': { page: <Settings /> }
            }
        }
    }
}
// URL: /login, /register, /dashboard, /settings
// (no /public or /protected in the URL)
```

## Router Modes

The `Router` component supports three modes via the `mode` prop:

```tsx
// History mode (default) — uses the History API, clean URLs
<Router mode="history" entry={routes} />

// Hash mode — uses the URL hash, no server config needed
<Router mode="hash" entry={routes} />

// Memory mode — URL is not persisted, for non-browser environments
<Router mode="memory" entry={routes} />
```

`history` and `hash` modes use the browser history as their source of truth, including the
`state` associated with each entry. `memory` mode starts at `/`, keeps its own entries and
state, and never reads or changes the browser URL.

You can also set a `base` path for the router:

```tsx
<Router base="/app" mode="history" entry={routes} />
// All routes are now relative to /app
```

`base` is a pathname-only, literal prefix. Characters such as `.` are not interpreted as
regular expressions. String destinations are resolved inside this base; a same-origin `URL`
object is treated as an absolute browser URL and must already be inside the base. Literal
Unicode and equivalent percent-encoded segments are normalized before matching, while an
encoded slash (`%2F`) remains inside its original segment.

## API Reference

### Components

#### `<Router>`

The root component. Provides router context to all descendants.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'history' \| 'hash' \| 'memory'` | `'history'` | Router mode |
| `base` | `string` | `'/'` | Base path for all routes |
| `entry` | `RouteItem` | *required* | Root route configuration |
| `notFound` | `ReactNode` | — | Content rendered when no route matches |

#### `<Link>`

Navigation link. Renders as an `<a>` tag by default.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `to` | `string \| URL` | — | Destination path |
| `delta` | `number` | — | Navigate by history delta (e.g., `-1` for back) |
| `replace` | `boolean` | — | Replace current history entry instead of pushing |
| `scrollRestore` | `boolean` | `true` | Whether to restore scroll position |
| `state` | `any` | — | State to associate with the new history entry |
| `component` | `ElementType` | `'a'` | Custom element type to render |

```tsx
<Link to="/about">About</Link>
<Link to="/user/42" replace>User 42</Link>
<Link to="/dashboard" state={{ from: 'home' }}>Dashboard</Link>
<Link component="button" to="/settings">Settings</Link>
```

Only an unmodified primary-button click targeting the current window is handled as SPA
navigation. Ctrl/Cmd/Shift/Alt clicks, middle clicks, downloads, external links,
`target="_blank"`, `rel="external"`, and events cancelled by a consumer `onClick` keep their
native browser behavior.

#### `<Navigate>`

Imperative navigation that triggers on render.

```tsx
<Navigate to="/login" />
<Navigate to="/dashboard" replace />
<Navigate delta={-1} />
```

Within one mounted component instance, the same navigation intent is executed once. This
keeps `<Navigate>` and `<Redirect>` idempotent under React Strict Mode and parent rerenders.
Change the destination, or remount with a different React `key`, to issue a new intent.

#### `<Redirect>`

Shorthand for `<Navigate replace />`.

```tsx
<Redirect to="/dashboard" />
```

#### `<Outlet>`

Renders the matched child route content. Use inside `layout` components to produce nested UI.

```tsx
function AppLayout() {
    return (
        <div>
            <Header />
            <Sidebar />
            <main>
                <Outlet />  {/* child route content renders here */}
            </main>
        </div>
    )
}
```

### Hooks

#### `useRouter()`

Returns the full router context object.

```ts
const router = useRouter()
// router.mode       — Router mode
// router.base       — Base path
// router.location   — Current location object
// router.pathname   — Path used for route matching (base-truncated)
// router.params     — Current route parameters
// router.state      — Current history state
// router.navigate() — Navigate function
// router.replace()  — Replace navigation
// router.back()     — Go back
// router.forward()  — Go forward
```

#### `useNavigate()`

Returns the navigate function.

```ts
const navigate = useNavigate()
navigate('/dashboard')
navigate('/profile', { state: { from: 'home' }, replace: true })
navigate(-1)  // go back
```

#### `useParams()`

Returns matched route parameters as a plain object.

```tsx
// Route: /user/:userId/post/:postId
// URL: /user/42/post/101
const { userId, postId } = useParams()
// userId = '42', postId = '101'
```

Path parameters are percent-decoded exactly once after segment matching. Encoded slashes such
as `%2F` remain within one matched segment and are returned as `/`; malformed percent encoding
is returned unchanged instead of throwing during render. Repeated parameter names return a
`string[]`.

#### `useSearchParams()` / `useQuery()`

Returns the URL search params as a `URLSearchParams` instance.

```tsx
// URL: /search?q=react&page=1
const searchParams = useSearchParams()
searchParams.get('q')    // 'react'
searchParams.get('page') // '1'
```

#### `useRouteStack()`

Returns the full matched route chain (from root to leaf).

```ts
const stack = useRouteStack()
// [rootRoute, userRoute, userIdRoute]
```

#### `useRouteLayoutStack()`

Returns routes from the stack that have a `layout` (or the last route). Useful for building breadcrumbs or nested layout metadata.

```ts
const layouts = useRouteLayoutStack()
```

#### `useRouteLayoutStackIndex()`

Returns the current layout depth index.

#### `useCurrentRoute()`

Returns the currently active route item from the layout stack.

#### `useResolvePath(to)`

Resolves a relative path against the current router context (accounting for `base` and `mode`).

```ts
const resolvedPath = useResolvePath('../settings')
```

Relative paths use standard URL resolution. Query-only and hash-only destinations replace the
corresponding URL component without inserting an extra slash. Complete cross-origin URLs are
returned unchanged and are not intercepted by `Link`. `undefined` means “no destination” and
returns an empty string; `''` is a valid empty URL reference and resolves to the current pathname
and query with the current hash removed.

#### URL Path Utilities

`joinPath` preserves the complete authority of an absolute URL, including username, password,
host and port. Relative references are supported for hierarchical URLs such as HTTP(S), FTP and
file URLs. Joining a relative reference to an opaque URL such as `mailto:` or `data:` throws a
`TypeError`; a later absolute URL still replaces the earlier value.

## Advanced Usage

### Nested Routers

You can nest `<Router>` components. All mounted `history` and `hash` routers subscribe to the
same browser-location store, so a push, replace, state update or browser traversal from a parent,
child or sibling router updates every browser router automatically. Each router still applies its
own `base` when deriving its internal pathname. `memory` routers use private histories and are not
affected by browser-router updates.

### Custom Route Metadata

Extend `RouteItem` with your own metadata using the generic type parameter:

```tsx
import type { RouteItem } from '@canlooks/react-router'

type AppRoute = RouteItem<{
    icon?: string
    label?: string
    roles?: string[]
}>

const routes: AppRoute = {
    label: 'Root',
    children: {
        'admin': {
            label: 'Admin',
            roles: ['admin'],
            page: <AdminPage />
        }
    }
}

function Breadcrumbs() {
    const stack = useRouteStack<AppRoute>()
    return (
        <nav>
            {stack.map(route => (
                <span key={route.label}>{route.label}</span>
            ))}
        </nav>
    )
}
```

### Scroll Restoration

The router supports scroll position restoration via the `scrollRestore` option on navigation:

```tsx
// Preserve the current scroll position (default)
navigate('/page', { scrollRestore: true })

// Reset to the top after the destination route has committed
navigate('/page', { scrollRestore: false })
```

The router does not mutate the global `history.scrollRestoration` setting. Browser back and
forward traversal therefore continues to use the browser or application's configured policy.

### Not Found Handling

Provide a `notFound` prop to the `Router` to render custom content when no route matches:

```tsx
<Router entry={routes} notFound={<NotFoundPage />} />
```

`notFound` renders inside the unmatched Router's context with an empty route stack and layout
index `0`. In a nested Router it therefore does not inherit the parent Router's route or layout
stack; `useCurrentRoute()` returns `undefined` there.

Or define a catch-all route as the last child:

```tsx
const routes: RouteItem = {
    page: <Home />,
    children: {
        'about': { page: <About /> },
        '**': { page: <NotFoundPage /> }
    }
}
```

## License

MIT
