import {createRoot} from 'react-dom/client'
import {useRouter, Router, Routes, Outlet} from '../src'
import {RouteItem} from '../index'
import {useEffect} from 'react'

createRoot(document.getElementById('app')!).render(<App/>)

const routes: RouteItem[] = [
    {
        path: '/',
        element: <Layout/>,
        children: [
            {
                path: 'a/b/c',
                element: <div>page a</div>
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
        <Router>
            <Routes routes={routes}/>
        </Router>
    )
}

function Layout() {
    useEffect(() => {
        console.log('layout re-render')

        document.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', e => {
                // e.preventDefault()
                console.log(e, a.getAttribute('href'))
            })
        })
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
                <a href="/a">a</a>
                <a href="/b">b</a>
            </div>
        </>
    )
}