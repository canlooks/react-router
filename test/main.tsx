import React, {lazy, memo, Suspense} from 'react'
import {createRoot} from 'react-dom/client'
import {Outlet, Router, Routes, useParams, useRouter} from '../src'
import {RouteItem} from '..'

createRoot(document.getElementById('app')!).render(<App />)

const L = lazy(() => import('./lazy'))

const routes: RouteItem[] = [
    // {path: '', element: 'Root'},
    {
        path: '/', element: <>Index+<Outlet /></>, children: [
            {
                path: ':page/:type', element: <A />, children: [
                    {
                        path: 'b', element: <B />, children: [
                            {path: 'c', element: 'CC'}
                        ]
                    }
                ]
            }
        ]
    }
]

function A() {
    console.log('params: ', useParams()) // XXX
    return (
        <>
            <div>
                A+<Outlet />
            </div>

        </>
    )
}

function B() {
    return (
        <>
            This is B
            <Outlet />
            <div>
                <Routes routes={[
                    {path: 'sub', element: 'SUB'}
                ]} />
            </div>
        </>
    )
}

function App() {
    return (
        <Router /* base="/base" */>
            <Index />
            <div>-------------------------------------------------------------------------</div>
            <Suspense>
                <Routes routes={routes} />
            </Suspense>
        </Router >
    )
}

function Index() {
    const router = useRouter()

    return (
        <>
            <button onClick={() => router.navigate('/')}>index</button>
            <button onClick={() => router.navigate('a/sub')}>a</button>
            <button onClick={() => router.navigate('/a/abc')}>Everything</button>
            <button onClick={() => router.navigate('../b')}>b</button>
            <button onClick={() => router.navigate('/c/d')}>c</button>
            <button onClick={() => router.navigate('/d?id=1')}>d</button>
            <button onClick={() => router.navigate('/d/e')}>e</button>
            <button onClick={() => router.navigate('/d/f')}>f</button>
            {/* TODO User 未正常 */}
            <button onClick={() => router.navigate('/d/f/user')}>user</button>
            {/* <button onClick={() => router.navigate('/d/f/post')}>Post</button> */}
            <a href="/d/f/post">Post</a>
            <button onClick={() => router.back()}>back</button>
            <button onClick={() => router.forward()}>forward</button>

        </>
    )
}

function HasOutlet() {
    return (
        <>
            <h1>This component has outlet</h1>
            <Outlet />
        </>
    )
}

const Post = memo(() => {
    return (
        <>
            <h3>Post in SubRoutes</h3>
            <Outlet />
        </>
    )
})

const subRoutes: RouteItem[] = [
    {element: 'Home'},
    {path: '*', element: 'User'},
    {
        path: 'post', element: <Post />, children: [
            {element: 'Post Detail'}
        ]
    }
]

function SubRoutes() {
    return (
        <>
            <h2>Here is sub routes</h2>
            <Routes routes={subRoutes} />
        </>
    )
}



function HasParams() {
    const params = useParams()
    console.log('params', params) // FIXME
    return (
        <>
            <h1>This component has params</h1>
            <p>{JSON.stringify(params)}</p>
        </>
    )
}