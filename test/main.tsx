import {createRoot} from 'react-dom/client'
import {useRouter, Router, Routes, Outlet, Link} from '../src'
import {RouteItem} from '../index'
import {useEffect} from 'react'

createRoot(document.getElementById('app')!).render(<App/>)

const routes: RouteItem[] = [
    {
        path: '/',
        element: <Layout/>,
        children: [
            {
                path: '',
                element: <div>index</div>
            },
            {
                path: 'b',
                element: <div>page b</div>,
            }
        ]
    }
]

function App() {
    return (
        <Router mode="hash">
            <Routes routes={routes}/>
        </Router>
    )
}

function Layout() {
    useEffect(() => {
        console.log('layout re-render')
    }, [])

    const {navigate} = useRouter()

    return (
        <>
            <Outlet/>
            <div>
                <button onClick={() => navigate('a')}>a</button>
                <button onClick={() => navigate('b')}>b</button>
            </div>
            <div>
                <Link to="/">a</Link>
                <Link to="b">b</Link>
            </div>
        </>
    )
}