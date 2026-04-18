import {createRoot} from 'react-dom/client'
import {Outlet, Redirect, Router, Routes, useCurrentRoute, useParams} from '../src'
import {RouteItem} from '../index'

createRoot(document.getElementById('app')!).render(<App/>)

const routes: RouteItem = {
    children: {
        'index': {
            children: {
                'device': {
                    page: 'device page'
                },
                '**': {
                    page: <Redirect to="/index/device"/>
                }
            }
        },
        '**': {
            page: <Redirect to="/index"/>
        }
    }
}

function App() {
    return (
        <>
            <h1>App</h1>
            <Router entry={routes}/>
        </>
    )
}