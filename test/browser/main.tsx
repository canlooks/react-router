import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import type {RouteItem, Mode} from '../../index'
import {
    Link,
    Navigate,
    Outlet,
    Router,
    useNavigate,
    useParams,
    useRouter,
    useSearchParams
} from '../../src'
import './styles.css'

function Page({name}: {name: string}) {
    return <h2 data-testid="page">{name}</h2>
}

function UnicodePage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const {location} = useRouter()

    return (
        <section>
            <h2 data-testid="page">unicode</h2>
            <output data-testid="params">{JSON.stringify(params)}</output>
            <output data-testid="query">{searchParams.get('q') || ''}</output>
            <output data-testid="hash">{location.hash}</output>
        </section>
    )
}

function LongPage() {
    return (
        <section className="long-page">
            <h2 data-testid="page">long</h2>
            <p>Scroll fixture</p>
        </section>
    )
}

function Shell() {
    const router = useRouter()
    const navigate = useNavigate()

    return (
        <main>
            <nav aria-label="browser regression controls">
                <Link data-testid="link-next" to="/next">Next</Link>
                <Link component={'button' as any} data-testid="button-next" to="/next">Button next</Link>
                <Link data-testid="link-query" to="?page=2">Query</Link>
                <Link data-testid="link-hash" to="#details">Hash</Link>
                <Link data-testid="link-blank" to="/next" target="_blank">New tab</Link>
                <Link data-testid="link-download" to="/next" download="next.html">Download</Link>
                <Link data-testid="link-external" to="https://example.com/route">External</Link>
                <Link
                    data-testid="link-outside-base"
                    to={`${window.location.origin}/outside`}
                >Outside base</Link>
                <Link
                    data-testid="link-cancelled"
                    to="/next"
                    onClick={event => event.preventDefault()}
                >Cancelled</Link>
                <button
                    data-testid="state-first"
                    onClick={() => navigate('/first', {state: {entry: 'first'}})}
                >First state</button>
                <button
                    data-testid="state-second"
                    onClick={() => navigate('/second', {state: {entry: 'second'}})}
                >Second state</button>
                <button
                    data-testid="replace-second"
                    onClick={() => navigate('/second', {
                        replace: true,
                        state: {entry: 'second-replaced'}
                    })}
                >Replace state</button>
                <button data-testid="back" onClick={router.back}>Back</button>
                <button data-testid="forward" onClick={router.forward}>Forward</button>
            </nav>
            <output data-testid="pathname">{router.pathname}</output>
            <output data-testid="state">{JSON.stringify(router.state)}</output>
            <Link
                className="scroll-link scroll-reset"
                data-testid="scroll-reset"
                to="/next"
                scrollRestore={false}
            >Reset scroll</Link>
            <Link
                className="scroll-link scroll-preserve"
                data-testid="scroll-preserve"
                to="/next"
            >Preserve scroll</Link>
            <Outlet/>
        </main>
    )
}

const nestedEntry: RouteItem = {
    page: <Page name="nested-root"/>,
    children: {
        child: {
            page: (
                <section>
                    <Page name="nested-child"/>
                    <Link data-testid="nested-link" to="/sibling">Nested sibling</Link>
                </section>
            )
        },
        sibling: {page: <Page name="nested-sibling"/>}
    }
}

function NestedRouter() {
    const {mode, base} = useRouter()
    const navigate = useNavigate()
    const nestedBase = base === '/' ? '/nested' : `${base}/nested`

    return (
        <section>
            <button
                data-testid="nested-parent-link"
                onClick={() => navigate('/nested/sibling', {state: {source: 'parent'}})}
            >Parent to nested sibling</button>
            <Router mode={mode} base={nestedBase} entry={nestedEntry}/>
        </section>
    )
}

const entry: RouteItem = {
    layout: <Shell/>,
    page: <Page name="home"/>,
    children: {
        first: {page: <Page name="first"/>},
        second: {page: <Page name="second"/>},
        next: {page: <Page name="next"/>},
        target: {page: <Page name="target"/>},
        strict: {page: <Navigate to="/target" state={{entry: 'strict'}}/>},
        long: {page: <LongPage/>},
        unicode: {
            children: {
                ':slot': {
                    children: {
                        ':chip': {page: <UnicodePage/>}
                    }
                }
            }
        },
        nested: {
            children: {
                '**': {page: <NestedRouter/>}
            }
        }
    }
}

function getRouterConfiguration(): {mode: Mode, base: string} {
    if (window.location.pathname.startsWith('/hash')) {
        return {mode: 'hash', base: '/app'}
    }
    if (window.location.pathname.startsWith('/memory')) {
        return {mode: 'memory', base: '/'}
    }
    return {mode: 'history', base: '/history'}
}

const configuration = getRouterConfiguration()

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <Router {...configuration} entry={entry} notFound={<Page name="not-found"/>}/>
    </StrictMode>
)
