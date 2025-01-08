import {createRoot} from 'react-dom/client'
import {useRouteStack, Router, Routes} from '../src'
import {RouteItem, Outlet} from '../index'

createRoot(document.getElementById('app')!).render(<App/>)

const routes: RouteItem[] = [
    {
        path: '/',
        element: <Layout/>,
        extendable: true
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
    const stack = useRouteStack()

    console.log(50, stack)

    return <Outlet/>
}