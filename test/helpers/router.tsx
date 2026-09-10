import {act, render, waitFor} from '@testing-library/react'
import type {RouterContext as Context, RouterProps} from '../../index'
import {Outlet, Router, useRouter} from '../../src'

/** Navigation fixture only. Layout/stack tests render their own unmodified route tree. */
export function mountRouter(props: Partial<RouterProps> = {}) {
    let context: Context | undefined
    function Capture() {
        context = useRouter()
        return null
    }
    const original: RouterProps['entry'] = props.entry ?? {
        page: <h1>Home</h1>,
        children: {
            about: {page: <h1>About</h1>},
            users: {children: {':id': {page: <h1>User</h1>}}},
            '**': {page: <h1>Fallback</h1>}
        }
    }
    const entry = {
        ...original,
        layout: <><Capture/>{original.layout ?? <Outlet/>}</>
    }
    const view = render(
        <Router {...props} entry={entry} notFound={<><Capture/>{props.notFound ?? <h1>Missing</h1>}</>}/>
    )
    return {
        ...view,
        get router(): Context {
            if (!context) throw new Error('Router context was not rendered')
            return context
        }
    }
}

export async function hashNavigate(harness: ReturnType<typeof mountRouter>, to: string, replace = false) {
    act(() => harness.router.navigate(to, {replace}))
    await waitFor(() => {
        if (harness.router.location.pathname !== new URL(to, 'https://router.test/').pathname) {
            throw new Error(`Waiting for hash route: ${to}`)
        }
    })
}

/** Simulates receipt of a browser event; does not claim to exercise history traversal. */
export function receivePopstate(path: string, state: unknown = null) {
    act(() => {
        history.replaceState(state, '', path)
        dispatchEvent(new PopStateEvent('popstate', {state}))
    })
}
