import {createRoot} from 'react-dom/client'
import {Router, Routes, Outlet, useParams} from '../src'
import {RouteItem} from '../index'

createRoot(document.getElementById('app')!).render(<App/>)

const routes: RouteItem[] = [
    {
        path: '/',
        element: <Layout/>,
        children: [
            {
                path: 'device',
                element: <Device/>,
                children: [
                    {
                        path: ':slot',
                        element: <Slot/>,
                        children: [
                            {
                                path: 'register',
                                element: <Register/>
                            }
                        ]
                    }
                ]
            }
        ]
    }
]

function Layout() {
    const params = useParams()
    console.log(34, params)

    return (
        <>
            <h1>Layout</h1>
            <Outlet/>
        </>
    )
}

function Device() {
    return (
        <>
            <h1>Device</h1>
            <Outlet/>
        </>
    )
}

function Slot() {
    const params = useParams()
    console.log(34, params)
    return (
        <>
            <h1>Slot</h1>
            <Outlet/>
        </>
    )
}

function Register() {
    const params = useParams()
    console.log(34, params)
    return (
        <>
            <h1>Register</h1>
            <Outlet/>
        </>
    )
}

function App() {
    return (
        <>
            <h1>App</h1>
            <Router>
                <Routes routes={routes}/>
            </Router>
        </>
    )
}