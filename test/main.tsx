import {createRoot} from 'react-dom/client'
import {useRouter, Router, Routes, Outlet, useParams, useNavigate, useQuery} from '../src'
import {useEffect} from 'react'
import {RouteItem} from '../index'

createRoot(document.getElementById('app')!).render(<App/>)

const routes: RouteItem[] = [
    {
        path: '/:name',
        element: <Entry/>,
        children: [
            {
                path: '*',
                element: <Layout/>
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

function Entry() {
    const {name} = useParams()

    console.log(name)

    return (
        <>
            <Outlet/>
        </>
    )
}

function Layout() {
    const query = useQuery()
    const navigate = useNavigate()
    const {pathname} = useRouter()

    useEffect(() => {
        if (query.get('a') === '1') {
            // navigate(pathname, {replace: true})
            navigate('/change', {replace: true})
        }
    }, [])
    return (
        <>
            <Router base="/%E7%A2%B3%E5%8C%96%E7%A1%85%E7%94%9F%E4%BA%A7%E5%95%86">
                <Routes routes={[
                    {
                        path: '/ok',
                        element: <Ok/>
                    },
                    {
                        path: '/notOk',
                        element: (
                            <>
                                <h1>notOk</h1>
                                <button onClick={() => navigate(-1)}>back</button>
                            </>
                        )
                    }
                ]}/>
            </Router>
        </>
    )
}

function Ok() {
    const navigate = useNavigate()

    return (
        <>
            <h1>OJBK</h1>
            <button onClick={() => navigate('/notOk')}>goto notOk</button>
        </>
    )
}