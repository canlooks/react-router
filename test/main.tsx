import {createRoot} from 'react-dom/client'
import {Outlet, Router, Routes, useParams} from '../src'
import {RouteItem, } from '../index'

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
    return (
        <>
            <h1>Authentication</h1>
            <Outlet/>
        </>
    )
}

function Layout() {
    return (
        <>
            <h1>Layout</h1>
            <Outlet/>
        </>
    )
}

function Index() {
    return (
        <>
            <h1>Index</h1>
        </>
    )
}

const routes: RouteItem = {
    children: {
        'login': {
            page: 'login'
        },
        '#authentication': {
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