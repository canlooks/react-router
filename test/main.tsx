import {createRoot} from 'react-dom/client'
import {Outlet, Router, useNavigate, useParams} from '../src'
import {RouteItem} from '../index'
import {memo, ReactNode, useEffect} from 'react'

createRoot(document.getElementById('app')!).render(<App/>)

const DefaultSlot = memo(() => {
    const {slot} = useParams()

    const navigate = useNavigate()

    useEffect(() => {
        !slot && navigate('/device/1', {replace: true})
    }, [])
    console.log(14, slot)

    return slot
        ? <Outlet/>
        : 'Placeholder'
})

const DefaultChip = memo((props: {
    children?: ReactNode
}) => {
    const {slot, chip} = useParams()
    console.log('DefaultChip', slot, chip)

    // const navigate = useNavigate()
    //
    // useEffect(() => {
    //     !chip && navigate(`/device/${slot}/0`, {replace: true})
    // }, [chip])

    // if (chip) {
        return /*props.children || */<Outlet/>
    // }
})

const routes: RouteItem<{ id: string }> = {
    id: 'root',
    children: {
        'device': {
            id: 'device',
            layout: <Device/>,
            page: <DefaultSlot/>,
            children: {
                ':slot': {
                    id: 'slot',
                    layout: <DefaultSlot/>,
                    page: <DefaultChip/>,
                    children: {
                        ':chip': {
                            id: 'chip',
                            page: 'default chip',
                            children: {
                                'register': {
                                    id: 'register',
                                    page: <Page/>
                                }
                            }
                        }
                    }
                }
            }
        }
        // '**': {
        //     page: <Redirect to="/device"/>
        // }
    }
}

function Device() {
    return (
        <>
            <h1>Device</h1>
            <Outlet/>
        </>
    )
}

function Page() {
    const {slot, chip} = useParams()

    console.log(32, slot, chip)

    return 'This is page'
}

function App() {
    return (
        <>
            <h1>App</h1>
            <Router entry={routes}/>
        </>
    )
}