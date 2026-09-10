/** Compile-only consumer acceptance: npm run test:types. Never executed in a browser. */
import {createRef} from 'react'
import {
    Router, Outlet, Link, Navigate, Redirect, useRouter, useNavigate, useParams,
    useSearchParams, useQuery, useRouteStack, useRouteLayoutStack, useRouteLayoutStackIndex,
    useCurrentRoute, useOutlet, useResolvePath, useSyncState, matchPath
} from '@canlooks/react-router'
import type {RouteItem, Params, Mode, To, NavigateOptions, RouterProps} from '@canlooks/react-router'

type AppRoute = RouteItem<{title: string; requiresAuth: boolean}>
const entry: AppRoute = {
    title: 'App', requiresAuth: false, layout: <Outlet/>, page: 'Home', children: {
        dashboard: {title: 'Dashboard', requiresAuth: true, page: 'Dashboard'}
    }
}

export function ValidConsumer() {
    const context = useRouter()
    const navigate = useNavigate()
    const to: To = new URL('https://router.test/dashboard')
    const options: NavigateOptions = {replace: true, state: {from: 'home'}, scrollRestore: false}
    navigate(to, options)
    navigate(-1)
    context.replace('/dashboard', {state: 1})
    context.back()
    context.forward()
    context.setState((previous: number) => previous + 1)
    const mode: Mode = context.mode
    const params: Params = {id: ['one', 'two']}
    const id = useParams().id
    const firstId: string = Array.isArray(id) ? id[0] : id
    const query: URLSearchParams = useSearchParams()
    const alias: URLSearchParams = useQuery()
    const stack: AppRoute[] = useRouteStack<AppRoute>()
    const layouts: AppRoute[] = useRouteLayoutStack<AppRoute>()
    const route: AppRoute = useCurrentRoute<AppRoute>()
    const depth: number = useRouteLayoutStackIndex()
    const href: string = useResolvePath('../dashboard')
    const [ref, setValue] = useSyncState(0)
    setValue(value => value + 1)
    const [optional] = useSyncState<string>()
    const captures: Params | null = matchPath('/one/two', '/:id/:id')
    const anchor = createRef<HTMLAnchorElement>()
    const button = createRef<HTMLButtonElement>()
    void [mode, params, firstId, query, alias, stack, layouts, route, depth, href, ref, optional, captures]
    return <>
        <Router mode="memory" entry={entry} notFound={<h1>404</h1>}/>
        <Link to="/dashboard" ref={anchor} aria-label="Dashboard"/>
        <Link component="button" type="button" disabled ref={button} to="/dashboard"/>
        <Navigate to="/dashboard" {...options}/><Navigate delta={-1}/><Redirect to="/dashboard"/>
        {useOutlet()}
    </>
}

export function InvalidConsumerContracts() {
    // @ts-expect-error RouterProps requires an entry tree.
    const missingEntry: RouterProps = {mode: 'history'}
    // @ts-expect-error Only the three documented modes are allowed.
    const mode: Mode = 'browser'
    // @ts-expect-error Route metadata is required on descendants too.
    const route: AppRoute = {title: 'Root', requiresAuth: false, children: {bad: {title: 'Bad'}}}
    // @ts-expect-error Booleans are not navigation destinations.
    const to: To = false
    // @ts-expect-error Anchor-only href is not a prop of a button Link.
    const button = <Link component="button" href="/about"/>
    // @ts-expect-error Redirect fixes replace=true, so callers cannot override it.
    const redirect = <Redirect to="/about" replace={false}/>
    const navigate = useNavigate()
    // @ts-expect-error Duplicate parameters may be arrays and must be narrowed first.
    const id: string = useParams().id
    // @ts-expect-error Numeric navigation does not accept path navigation options.
    navigate(-1, {replace: true})
    void [missingEntry, mode, route, to, button, redirect]
    return null
}
