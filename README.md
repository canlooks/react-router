# @canlooks/react-router

This is a simple route manager based on my habits.

## Installation

```bash
npm i @canlooks/react-router
```

## Usage

```tsx
import {Router, RouteItem, Routes} from '@canlooks/react-router'

const routes: RouteItem[] = [
    {path: '/', element: <Home />},
    {path: '/about', element: <About />},
    {path: '/user', element: <User />, children: [
        {path: ':id', element: <UserInfo />}
    ]}
]

function App() {
    return (
        <Router>
            <Routes routes={routes}/>
        </Router>
    )
}
```

or "JSX" style syntax

```tsx
function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/user" element={<User />}>
                    <Route path=":id" element={<UserInfo />} />
                </Route>
            </Routes>
        </Router>
    )
}
```

## API

### Router

- mode `"history" | "hash" | "memory"`, default "history"
- base `string`

### Routes

- routes `Route[]`

### Route

- path `string`
- element `ReactNode`
- children `Route[]`

### Outlet

Insert matched child route element into the parent component.

```tsx
function User() {
    return (
        <>
            {/* This is matched child route element, such as  <UserInfo /> as in the case above,*/}
            <Outlet /> 
        </>
    )
}
```

### useQuery()

Get search params from the URL. It will return a `URLSearchParams` object.

### useParams()

Get dynamic path from the URL. Such as `:id` in the path `/user/:id`.

### useRouter()

return `RouterContext`

```tsx
type RouterContext = {
    mode: Mode
    base: string
    location: ILocation
    /** The path used to match routes(truncated by {@link base}) */
    pathname: string | null

    replace(to: To, options?: Omit<NavigateOptions, 'replace'>): void

    navigate(to: To, options?: NavigateOptions): void
    navigate(delta: number): void

    back(): void
    forward(): void

    state: any
    setState: Dispatch<SetStateAction<any>>

    params: Record<string, string>
}
```