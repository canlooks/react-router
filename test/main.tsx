import React from 'react'
import {createRoot} from 'react-dom/client'
import {Outlet, Route, Router, Routes, useQuery, useRouter} from '../src'
import {RouteItem} from '..'

createRoot(document.getElementById('app')!).render(<App />)

function App() {
    return (
        <Router>
            <Index />
            <div>-------------------------------------------------------------------------</div>
            <Routes>
                <Route path="/" element="Index" />
                <Route path="/a" element="A">
                    <Route path="sub" element="Sub" />
                </Route>
                <Route path="/b">
                    <Route element="B" />
                </Route>
                <Route path="/c">
                    <Route path="d" element="C" />
                </Route>
                <Route path="/d" element={<HasOutlet />}>
                    <Route element="Outlet Index" />
                    <Route path="e" element="Outlet E" />
                    <Route path="f" element={<SubRoutes />} />
                </Route>
            </Routes>
        </Router >
    )
}

function Index() {
    const router = useRouter()

    return (
        <>
            <button onClick={() => router.navigate('/')}>index</button>
            <button onClick={() => router.navigate('/a')}>a</button>
            <button onClick={() => router.navigate('/b')}>b</button>
            <button onClick={() => router.navigate('/c/d')}>c</button>
            <button onClick={() => router.navigate('/d?id=1')}>d</button>
            <button onClick={() => router.navigate('/d/e')}>e</button>
            <button onClick={() => router.navigate('/d/f')}>f</button>
            {/* TODO User 未正常 */}
            <button onClick={() => router.navigate('/d/f/user')}>user</button>
        </>
    )
}

function HasOutlet() {
    const query = useQuery()

    console.log(55, query.entries())

    return (
        <>
            <h1>This component has outlet</h1>
            <Outlet />
        </>
    )
}

const subRoutes: RouteItem[] = [
    {element: 'Home'},
    {path: 'user', element: 'User'},
    {path: 'post', element: 'Post'}
]

function SubRoutes() {
    return (
        <>
            <h2>Here is sub routes</h2>
            <Routes routes={subRoutes} />
        </>
    )
}