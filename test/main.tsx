import {createRoot} from 'react-dom/client'
import {Outlet, Router, Routes, useCurrentRoute, useParams} from '../src'
import {RouteItem} from '../index'

createRoot(document.getElementById('app')!).render(<App/>)

function AppLayout() {
    const params = useParams()

    console.log('params', params)
    return (
        <>
            <h1>app layout</h1>
            <Outlet/>
        </>
    )
}

function GroupLayout() {
    return (
        <>
            <h1>group layout</h1>
            <Outlet/>
        </>
    )
}

function IndexLayout() {
    return (
        <>
            <h1>index layout</h1>
            <Outlet/>
        </>
    )
}

function SubLayout() {
    const params = useParams()

    console.log('params', params)

    return (
        <>
            <h1>sub layout</h1>
            <Outlet/>
        </>
    )
}

function AboutLayout() {
    return (
        <>
            <h1>about layout</h1>
            <Outlet/>
        </>
    )
}

function Group2Layout() {
    return (
        <>
            <h1>group 2 layout</h1>
            <Outlet/>
        </>
    )
}

function Authentication() {
    const currentRoute = useCurrentRoute()
    console.log('Authentication', currentRoute)
    return (
        <>
            <h1>Authentication</h1>
            <Outlet/>
        </>
    )
}

function Layout() {
    const currentRoute = useCurrentRoute()
    console.log('Layout', currentRoute)

    return (
        <>
            <h1>Layout</h1>
            <Outlet/>
        </>
    )
}

function Index() {
    const currentRoute = useCurrentRoute()
    console.log('Index', currentRoute)

    return (
        <>
            <h1>Index</h1>
        </>
    )
}

const routes: RouteItem<{ id?: string }> = {
    children: {
        'login': {
            page: 'login'
        },
        '#authentication': {
            id: '',
            layout: <Authentication/>,
            children: {
                '#indexLayout': {
                    layout: <Layout/>,
                    page: <Index/>
                }
            }
        }
    }
}
//
// const routes: RouteItem = {
//     layout: <AppLayout/>,
//     // page: 'app page',
//     children: {
//         '#group': {
//             layout: <GroupLayout/>,
//             children: {
//                 'index': {
//                     layout: <IndexLayout/>,
//                     page: 'index page',
//                     children: {
//                         ':name': {
//                             layout: <SubLayout/>,
//                             children: {
//                                 'about': {
//                                     layout: <AboutLayout/>,
//                                     page: 'about page'
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 // '**': {
//                 //     page: 'redirect page'
//                 // }
//             }
//         },
//         '#group2': {
//             layout: <Group2Layout/>,
//             children: {
//                 '#group2-1': {
//                     page: 'group2-1 page'
//                 },
//                 'sub': {
//                     page: 'sub page'
//                 }
//             }
//         }
//     }
// }

function App() {
    return (
        <>
            <h1>App</h1>
            <Router entry={routes}/>
        </>
    )
}