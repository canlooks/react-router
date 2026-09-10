import {act, render, screen, waitFor} from '@testing-library/react'
import {StrictMode, useState} from 'react'
import {describe, expect, it} from 'vitest'
import type {RouterContext, RouteItem} from '../../index'
import {Link, Outlet, Redirect, Router, useCurrentRoute, useRouter, useRouteStack, useSearchParams} from '../../src'
import {clickLink} from '../helpers/context'

describe('I-JOURNEY representative application flows', () => {
    it('I-JOURNEY-01 navigates a grouped application with metadata, layout persistence, query and notFound', () => {
        function Layout() {
            const [count, setCount] = useState(0)
            return <main><button onClick={() => setCount(count + 1)}>Count {count}</button>
                <Link to="/users/42?tab=profile">User 42</Link><Link to="/missing">Missing link</Link><Outlet/>
            </main>
        }
        function Detail() {
            const labels = (useRouteStack() as RouteItem<{label: string}>[]).map(route => route.label)
            const current = useCurrentRoute() as RouteItem<{label: string}>
            return <article><h1>{current.label}</h1><output>{labels.join(' > ')} | {useSearchParams().get('tab')}</output></article>
        }
        const entry: RouteItem<{label: string}> = {
            label: 'App', layout: <Layout/>, page: 'Home', children: {'#public': {
                label: 'Public', children: {users: {label: 'Users', children: {':id': {label: 'Detail', page: <Detail/>}}}}
            }}
        }
        history.replaceState(null, '', '/app')
        render(<Router base="/app" entry={entry} notFound={<h1>404</h1>}/>)
        clickLink(screen.getByRole('button', {name: 'Count 0'}))
        clickLink(screen.getByRole('link', {name: 'User 42'}))
        expect(location.pathname + location.search).toBe('/app/users/42?tab=profile')
        expect(screen.getByRole('heading')).toHaveTextContent('Detail')
        expect(screen.getByRole('status')).toHaveTextContent('App > Public > Users > Detail | profile')
        expect(screen.getByRole('button', {name: 'Count 1'})).toBeInTheDocument()
        clickLink(screen.getByRole('link', {name: 'Missing link'}))
        expect(screen.getByRole('heading')).toHaveTextContent('404')
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
    it('I-JOURNEY-02 a guard layout redirects an unauthenticated deep link and carries return state', () => {
        function Guard() { return <Redirect to="/login" state={{returnTo: '/private'}}/> }
        function Login() { return <h1>Login: {useRouter().state?.returnTo}</h1> }
        history.replaceState(null, '', '/private')
        render(<Router entry={{children: {
            login: {page: <Login/>}, '#protected': {layout: <Guard/>, children: {private: {page: 'Private content'}}}
        }}}/>)
        expect(location.pathname).toBe('/login')
        expect(screen.getByRole('heading')).toHaveTextContent('Login: /private')
        expect(screen.queryByText('Private content')).not.toBeInTheDocument()
    })
    it('I-JOURNEY-03 nested history routers update child and parent after child navigation', () => {
        let child!: RouterContext
        function ChildShell() { child = useRouter(); return <Outlet/> }
        function ParentShell() { return <><output data-testid="parent">{useRouter().pathname}</output><Outlet/></> }
        const childTree = {layout: <ChildShell/>, page: 'Child home', children: {about: {page: 'Child about'}}}
        const childNode = <Router base="/app" entry={childTree}/>
        history.replaceState(null, '', '/app')
        render(<Router entry={{layout: <ParentShell/>, children: {app: {page: childNode, children: {'**': {page: childNode}}}}}}/>)
        act(() => child.navigate('/about'))
        expect(location.pathname).toBe('/app/about')
        expect(screen.getByTestId('parent')).toHaveTextContent('/app/about')
        expect(screen.getByText('Child about')).toBeInTheDocument()
    })
    it('I-JOURNEY-04 separate memory routers keep their state independent', () => {
        const contexts: RouterContext[] = []
        function Page({index}: {index: number}) { contexts[index] = useRouter(); return <output data-testid={`router-${index}`}>{JSON.stringify(contexts[index].state)}</output> }
        render(<><Router mode="memory" entry={{page: <Page index={0}/>}}/><Router mode="memory" entry={{page: <Page index={1}/>}}/></>)
        act(() => contexts[0].setState({instance: 0}))
        expect(screen.getByTestId('router-0')).toHaveTextContent('{"instance":0}')
        expect(screen.getByTestId('router-1')).toHaveTextContent('null')
    })
    it('I-JOURNEY-05 StrictMode mounts, navigates and unmounts without duplicate page content', async () => {
        const view = render(<StrictMode><Router mode="hash" entry={{page: <Link to="/about">Go</Link>, children: {about: {page: <h1>About</h1>}}}}/></StrictMode>)
        clickLink(screen.getByRole('link', {name: 'Go'}))
        await waitFor(() => expect(screen.getAllByRole('heading', {name: 'About'})).toHaveLength(1))
        view.unmount()
        expect(view.container).toBeEmptyDOMElement()
    })
    it('I-JOURNEY-06 nested hash routers stay synchronized after child navigation', async () => {
        let child!: RouterContext
        function Child() { child = useRouter(); return <output data-testid="child">{child.pathname}</output> }
        function ParentShell() { return <><output data-testid="parent">{useRouter().pathname}</output><Outlet/></> }
        const childNode = <Router mode="hash" entry={{page: <Child/>, children: {'**': {page: <Child/>}}}}/>
        render(<Router mode="hash" entry={{layout: <ParentShell/>, page: childNode, children: {'**': {page: childNode}}}}/>)
        act(() => child.navigate('/about'))
        await waitFor(() => expect(screen.getByTestId('child')).toHaveTextContent('/about'))
        expect(screen.getByTestId('parent')).toHaveTextContent('/about')
    })
})
