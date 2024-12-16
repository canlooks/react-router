import {createRoot} from 'react-dom/client'
import {Outlet, Router, Routes, useCurrentRoute, useRouter} from '../src'

createRoot(document.getElementById('app')!).render(<App/>)

function App() {
    return (
        <Router base="/base">
            <Routes routes={[
                {
                    path: '/',
                    element: <Index/>,
                    children: [
                        {
                            path: 'about/*',
                            element: <About/>
                        }
                    ]
                }
            ]}/>
        </Router>
    )
}

function Index() {
    return (
        <div>
            <h1>Index</h1>
            <Outlet/>
        </div>
    )
}

function About() {
    const {pathname} = useRouter()
    const currentRoute = useCurrentRoute()
    console.log(36, pathname, currentRoute)

    return (
        <h1>About</h1>
    )
}