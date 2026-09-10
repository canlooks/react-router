import {act, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {StrictMode} from 'react'
import type {Mode, RouteItem, RouterContext as Context, To} from '../../index'
import {Link, Outlet, Router, RouterContext, Routes, useParams, useRouter} from '../../src'
import {clickLink, renderInContext} from '../helpers/context'
import {hashNavigate, mountRouter, receivePopstate} from '../helpers/router'

describe('Known defects: navigation and route contracts', () => {
    it('D-01 memory navigation changes the rendered route without touching the browser URL', () => {
        const app = mountRouter({mode: 'memory'})
        const url = location.href
        act(() => app.router.navigate('/about'))
        expect(location.href).toBe(url)
        expect(app.router.pathname).toBe('/about')
        expect(screen.getByRole('heading')).toHaveTextContent('About')
    })
    it('D-01 memory push/back/forward/replace traverses its own route stack', () => {
        const app = mountRouter({mode: 'memory'})
        act(() => app.router.navigate('/about'))
        act(() => app.router.navigate('/users/1'))
        act(() => app.router.back())
        expect(app.router.pathname).toBe('/about')
        act(() => app.router.forward())
        expect(app.router.pathname).toBe('/users/1')
        act(() => app.router.replace('/users/2'))
        expect(app.router.pathname).toBe('/users/2')
        act(() => app.router.back())
        expect(app.router.pathname).toBe('/about')
    })
    it('D-02 memory initial route is independent of the host browser hash', () => {
        history.replaceState(null, '', '/host#/unrelated-host-route')
        const app = mountRouter({mode: 'memory'})
        expect(app.router.pathname).toBe('/')
    })
    it('D-04 hash replace keeps earlier route entries available for back', async () => {
        const app = mountRouter({mode: 'hash'})
        await hashNavigate(app, '/about')
        await hashNavigate(app, '/users/1')
        await hashNavigate(app, '/users/2', true)
        act(() => app.router.back())
        expect(location.hash).toBe('#/about')
    })
    it('D-04 hash replace does not append a native browser history entry', async () => {
        const app = mountRouter({mode: 'hash'})
        await hashNavigate(app, '/about')
        const length = history.length
        await hashNavigate(app, '/users/2', true)
        expect(history.length).toBe(length)
    })
    it('D-05 hash absolute navigation applies base before matching', () => {
        history.replaceState(null, '', '/#/app')
        const app = mountRouter({mode: 'hash', base: '/app'})
        act(() => app.router.navigate('/about'))
        expect(location.hash).toBe('#/app/about')
    })
    it('D-05 hash Link href includes the configured base', () => {
        history.replaceState(null, '', '/#/app')
        render(<Router mode="hash" base="/app" entry={{page: <Link to="/about">About</Link>}}/>)
        expect(screen.getByRole('link')).toHaveAttribute('href', '#/app/about')
    })
    it('D-06 history context initializes from existing native history.state', () => {
        history.replaceState({from: 'reload'}, '', '/')
        const app = mountRouter()
        expect(app.router.state).toEqual({from: 'reload'})
    })
    it('D-06 popstate restores state belonging to the destination entry', () => {
        const app = mountRouter()
        act(() => app.router.navigate('/about', {state: {page: 'about'}}))
        receivePopstate('/', {page: 'home'})
        expect(app.router.pathname).toBe('/')
        expect(app.router.state).toEqual({page: 'home'})
    })
    it('D-07 functional setState stores the computed state in native history', () => {
        const app = mountRouter()
        act(() => app.router.setState({count: 1}))
        act(() => app.router.setState((previous: {count: number}) => ({count: previous.count + 1})))
        expect(app.router.state).toEqual({count: 2})
        expect(history.state).toEqual({count: 2})
    })
    it.each([':id', '*', '**'])('D-08 static sibling wins even when %s is declared first', pattern => {
        history.replaceState(null, '', '/new')
        render(<Router entry={{children: {[pattern]: {page: 'Dynamic'}, new: {page: 'Create'}}}}/>)
        expect(screen.queryByText('Create')).toBeInTheDocument()
    })
    it('D-09 changing entry from dynamic to static clears previously captured params', () => {
        function Page() { return <output>{JSON.stringify(useParams())}</output> }
        history.replaceState(null, '', '/42')
        const {rerender} = render(<Router entry={{children: {':id': {page: <Page/>}}}}/>)
        expect(screen.getByRole('status')).toHaveTextContent('{"id":"42"}')
        rerender(<Router entry={{children: {'42': {page: <Page/>}}}}/>)
        expect(screen.getByRole('status').textContent).toBe('{}')
    })
    it('D-09 changing the dynamic parameter name removes the old name', () => {
        function Page() { return <output>{JSON.stringify(useParams())}</output> }
        history.replaceState(null, '', '/42')
        const {rerender} = render(<Router entry={{children: {':id': {page: <Page/>}}}}/>)
        rerender(<Router entry={{children: {':slug': {page: <Page/>}}}}/>)
        expect(screen.getByRole('status').textContent).toBe('{"slug":"42"}')
    })
    it('D-17 same-origin absolute URL strings navigate like URL objects', () => {
        const app = mountRouter()
        act(() => app.router.navigate('https://router.test/about'))
        expect(location.href).toBe('https://router.test/about')
        expect(app.router.pathname).toBe('/about')
    })
    it('D-18 hash back restores the earlier navigation state', async () => {
        const app = mountRouter({mode: 'hash'})
        act(() => app.router.navigate('/about', {state: {page: 'about'}}))
        await waitFor(() => expect(app.router.pathname).toBe('/about'))
        act(() => app.router.navigate('/users/1', {state: {page: 'user'}}))
        await waitFor(() => expect(app.router.pathname).toBe('/users/1'))
        act(() => app.router.back())
        await waitFor(() => expect(app.router.pathname).toBe('/about'))
        expect(app.router.state).toEqual({page: 'about'})
    })
    it('D-19 changing mode releases the old subscription and installs the new one', () => {
        const add = vi.spyOn(window, 'addEventListener')
        const remove = vi.spyOn(window, 'removeEventListener')
        const entry = {page: 'Home', children: {about: {page: 'About'}}}
        const {rerender} = render(<Router mode="history" entry={entry}/>)
        const originalHandler = add.mock.calls.find(([name]) => name === 'popstate')?.[1]
        expect(originalHandler).toBeTypeOf('function')
        rerender(<Router mode="hash" entry={entry}/>)
        expect(remove).toHaveBeenCalledWith('popstate', originalHandler)
        expect(add).toHaveBeenCalledWith('hashchange', expect.any(Function))
    })

    it('D-08 groups keep static siblings exact and descendants inherit dynamic ancestors', () => {
        function Page() { return <output>{JSON.stringify(useParams())}</output> }
        history.replaceState(null, '', '/new')
        const view = render(<Router entry={{children: {'#group': {children: {
            ':id': {page: 'Dynamic', children: {detail: {page: <Page/>}}},
            new: {page: 'Static'}, '*': {page: 'Later wildcard'}
        }}}}}/>)
        expect(screen.getByText('Static')).toBeInTheDocument()
        receivePopstate('/42/detail')
        expect(screen.getByRole('status').textContent).toBe('{"id":"42"}')
        receivePopstate('/other')
        expect(screen.getByText('Dynamic')).toBeInTheDocument()
        view.unmount()
    })
    it('D-09 same-URL entry replacement clears params even on notFound', () => {
        function Page() { return <output>{JSON.stringify(useParams())}</output> }
        history.replaceState(null, '', '/42')
        const view = render(<Router entry={{children: {':id': {page: <Page/>}}}} notFound={<Page/>}/>)
        expect(screen.getByRole('status').textContent).toBe('{"id":"42"}')
        view.rerender(<Router entry={{children: {other: {page: 'Other'}}}} notFound={<Page/>}/>)
        expect(screen.getByRole('status').textContent).toBe('{}')
    })
    it('D-09 standalone Routes clears and refills the same params object for every match exit', () => {
        const params = {}
        function Page() { return <output>{JSON.stringify(useParams())}</output> }
        const {context, rerender} = renderInContext(<Routes entry={{children: {':id': {page: <Page/>}}}}/>, {pathname: '/42', params})
        expect(params).toEqual({id: '42'})
        const entries: RouteItem[] = [{children: {'42': {page: <Page/>}}}, {children: {':slug': {page: <Page/>}}}, {page: 'Home'}]
        for (const entry of entries) {
            rerender(<RouterContext value={context}><Routes entry={entry} notFound={<Page/>}/></RouterContext>)
            expect(context.params).toBe(params)
            expect(params).toEqual(':slug' in (entry.children ?? {}) ? {slug: '42'} : {})
        }
        rerender(<RouterContext value={{...context, pathname: null}}><Routes entry={{page: 'Home'}} notFound={<Page/>}/></RouterContext>)
        expect(params).toEqual({})
    })
    it('D-09 query-only and state-only updates preserve captured params', () => {
        history.replaceState(null, '', '/users/42?q=keep')
        const app = mountRouter()
        const params = app.router.params
        act(() => app.router.navigate('?q=new'))
        expect(app.router.params).toEqual({id: '42'})
        act(() => app.router.setState({edited: true}))
        expect(app.router.params).toBe(params)
        expect(params).toEqual({id: '42'})
    })
    it('D-06 native back and forward restore different states at the same URL', async () => {
        const app = mountRouter()
        act(() => {
            app.router.navigate('/about', {state: {version: 1}})
            app.router.navigate('/about', {state: {version: 2}})
        })
        act(() => app.router.back())
        await waitFor(() => expect(app.router.state).toEqual({version: 1}))
        expect(app.router.pathname).toBe('/about')
        act(() => app.router.forward())
        await waitFor(() => expect(app.router.state).toEqual({version: 2}))
    })
    it('D-06 nested history routers synchronize same-URL navigation and setState', () => {
        let child!: Context
        let parent!: Context
        function Child() { child = useRouter(); return <span>Child</span> }
        function Parent() { parent = useRouter(); return <Outlet/> }
        render(<Router entry={{layout: <Parent/>, page: <Router entry={{page: <Child/>}}/>}}/>)
        act(() => child.navigate('/', {state: {version: 1}}))
        expect(parent.state).toEqual({version: 1})
        act(() => child.setState({version: 2}))
        expect(parent.state).toEqual({version: 2})
        expect(child.state).toEqual({version: 2})
    })
    it('D-07 two functional updates in one batch compute once each from the latest state', () => {
        const app = mountRouter()
        const first = vi.fn((previous: {count: number} | null) => ({count: (previous?.count ?? 0) + 1}))
        const second = vi.fn((previous: {count: number}) => ({count: previous.count + 1}))
        const replace = vi.spyOn(history, 'replaceState')
        act(() => { app.router.setState(first); app.router.setState(second) })
        expect(first).toHaveBeenCalledExactlyOnceWith(null)
        expect(second).toHaveBeenCalledExactlyOnceWith({count: 1})
        expect(replace).toHaveBeenCalledTimes(2)
        expect(history.state).toEqual({count: 2})
        expect(app.router.state).toEqual({count: 2})
    })
    it('D-07 native setState failure leaves context and URL untouched', () => {
        const app = mountRouter()
        act(() => app.router.setState({count: 1}))
        const before = app.router
        const replace = vi.spyOn(history, 'replaceState').mockImplementation(() => { throw new DOMException('cannot clone', 'DataCloneError') })
        const action = vi.fn(() => ({count: 2}))
        expect(() => act(() => app.router.setState(action))).toThrow('cannot clone')
        expect(action).toHaveBeenCalledTimes(1)
        expect(app.router).toBe(before)
        expect(history.state).toEqual({count: 1})
        expect(location.pathname).toBe('/')
        replace.mockRestore()
        act(() => app.router.setState((previous: {count: number}) => ({count: previous.count + 1})))
        expect(app.router.state).toEqual({count: 2})
    })
    it.each([false, true])('D-17 failed native navigation replace=%s commits no local changes or scroll policy', replace => {
        const app = mountRouter()
        const before = app.router
        const length = history.length
        vi.spyOn(history, replace ? 'replaceState' : 'pushState').mockImplementation(() => { throw new Error('write rejected') })
        expect(() => act(() => app.router.navigate('/about', {replace, state: {changed: true}, scrollRestore: false}))).toThrow('write rejected')
        expect(app.router).toBe(before)
        expect(location.pathname).toBe('/')
        expect(history.length).toBe(length)
        expect(history.scrollRestoration).toBe('auto')
    })
    it.each(['history', 'hash'] as const)('D-17 %s rejects cross-origin strings before any navigation side effects', mode => {
        const app = mountRouter({mode})
        const before = app.router
        const url = location.href
        const length = history.length
        expect(() => act(() => app.router.navigate('https://other.test/a', {state: 1, scrollRestore: false}))).toThrow(/different origin/)
        expect(app.router).toBe(before)
        expect(location.href).toBe(url)
        expect(history.length).toBe(length)
        expect(history.scrollRestoration).toBe('auto')
    })
    it('D-01/D-02 two memory routers isolate locations, bases, history and state from the host', () => {
        history.replaceState({host: true}, '', '/host?q=outer#/host-route')
        const url = location.href
        const contexts: Context[] = []
        function Page({index}: {index: number}) { contexts[index] = useRouter(); return <output>{contexts[index].pathname}</output> }
        const push = vi.spyOn(history, 'pushState')
        const replace = vi.spyOn(history, 'replaceState')
        render(<>{['/app', '/other'].map((base, index) => <Router key={base} mode="memory" base={base} entry={{
            page: <Page index={index}/>, children: {'**': {page: <Page index={index}/>}}
        }}/>)}</>)
        expect(contexts.map(context => context.pathname)).toEqual(['/', '/'])
        expect(contexts.map(context => context.location.pathname)).toEqual(['/app/', '/other/'])
        act(() => contexts[0].navigate('/users/42', {state: {instance: 0}}))
        act(() => contexts[1].navigate(new URL('https://elsewhere.test/other/about?q=1#part'), {state: 1}))
        expect(contexts.map(context => context.pathname)).toEqual(['/users/42', '/about'])
        act(() => contexts[0].back())
        expect(contexts[0].pathname).toBe('/')
        expect(contexts[0].state).toBeNull()
        expect(contexts[1].state).toBe(1)
        expect(location.href).toBe(url)
        expect(history.state).toEqual({host: true})
        expect(push).not.toHaveBeenCalled()
        expect(replace).not.toHaveBeenCalled()
    })
    it('D-03 a nested memory router never notifies its browser parent', () => {
        let memory!: Context
        function Page() { memory = useRouter(); return null }
        const notify = vi.fn()
        renderInContext(<Router mode="memory" entry={{page: <Page/>, children: {'**': {page: <Page/>}}}}/>, {
            updateClonedLocation: notify, updateHash: notify
        })
        act(() => { memory.navigate('/about'); memory.setState(1); memory.back(); memory.forward(); memory.replace('/') })
        expect(notify).not.toHaveBeenCalled()
    })
    it.each(['hash', 'memory'] as const)('D-01/D-04/D-18 %s replace in the middle keeps both neighboring entries and state', mode => {
        const app = mountRouter({mode})
        act(() => {
            app.router.navigate('/about', {state: 'B'})
            app.router.navigate('/users/1', {state: 'C'})
            app.router.back()
            app.router.replace('/users/2', {state: 'B2'})
        })
        expect(app.router).toMatchObject({pathname: '/users/2', state: 'B2'})
        act(() => app.router.forward())
        expect(app.router).toMatchObject({pathname: '/users/1', state: 'C'})
        act(() => app.router.navigate(-2))
        expect(app.router).toMatchObject({pathname: '/', state: null})
        act(() => app.router.forward())
        expect(app.router).toMatchObject({pathname: '/users/2', state: 'B2'})
        act(() => app.router.navigate('/about'))
        act(() => app.router.forward())
        expect(app.router).toMatchObject({pathname: '/about', state: null})
    })
    it.each(['hash', 'memory'] as const)('D-18 %s same-URL entries and setState restore independently after queued events', async mode => {
        const app = mountRouter({mode})
        act(() => {
            app.router.navigate('/about', {state: {count: 1}})
            app.router.navigate('/about', {state: {count: 2}})
            app.router.setState((previous: {count: number}) => ({count: previous.count + 1}))
            app.router.back()
        })
        expect(app.router.state).toEqual({count: 1})
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })
        expect(app.router.state).toEqual({count: 1})
        act(() => app.router.forward())
        expect(app.router.state).toEqual({count: 3})
        act(() => app.router.navigate('/users/1'))
        expect(app.router.state).toBeNull()
        act(() => app.router.back())
        expect(app.router.state).toEqual({count: 3})
    })
    it('D-04 hash child replace preserves outer URL, native state and length and refreshes its parent', () => {
        history.replaceState('host state', '', '/host?outer=1#/about')
        let child!: Context
        let parent!: Context
        function Child() { child = useRouter(); return <output data-testid="child">{child.pathname}</output> }
        function Parent() { parent = useRouter(); return <Outlet/> }
        const childNode = <Router mode="hash" entry={{children: {'**': {page: <Child/>}}}}/>
        render(<Router mode="hash" entry={{layout: <Parent/>, children: {'**': {page: childNode}}}}/>)
        const length = history.length
        const replace = vi.spyOn(history, 'replaceState')
        act(() => child.replace('/users/42', {state: {inner: true}}))
        expect(location.pathname + location.search + location.hash).toBe('/host?outer=1#/users/42')
        expect(history.state).toBe('host state')
        expect(history.length).toBe(length)
        expect(replace).toHaveBeenCalledTimes(1)
        expect(child.state).toEqual({inner: true})
        expect(parent.pathname).toBe('/users/42')
        expect(screen.getByTestId('child')).toHaveTextContent('/users/42')
    })
    it('D-04 failed hash replace preserves its current entry and forward history', () => {
        const app = mountRouter({mode: 'hash'})
        act(() => { app.router.navigate('/about', {state: 'B'}); app.router.navigate('/users/1', {state: 'C'}); app.router.back() })
        const replace = vi.spyOn(history, 'replaceState').mockImplementation(() => { throw new Error('rejected') })
        expect(() => act(() => app.router.replace('/users/2', {state: 'failed'}))).toThrow('rejected')
        expect(location.hash).toBe('#/about')
        expect(app.router).toMatchObject({pathname: '/about', state: 'B'})
        replace.mockRestore()
        act(() => app.router.forward())
        expect(app.router).toMatchObject({pathname: '/users/1', state: 'C'})
    })
    it('D-19 StrictMode mode changes use current sources, reset local histories and pair all listeners', () => {
        let context!: Context
        function Page() { context = useRouter(); return <output>{context.pathname}</output> }
        const entry = {page: <Page/>, children: {'**': {page: <Page/>}}}
        const add = vi.spyOn(window, 'addEventListener')
        const remove = vi.spyOn(window, 'removeEventListener')
        const tree = (mode: Mode) => <StrictMode><Router mode={mode} base="/app" entry={entry} notFound={<Page/>}/></StrictMode>
        history.replaceState({native: 1}, '', '/app/history#/app/hash')
        const view = render(tree('history'))
        expect(context).toMatchObject({pathname: '/history', state: {native: 1}})
        view.rerender(tree('hash'))
        expect(context).toMatchObject({pathname: '/hash', state: null})
        act(() => {
            history.replaceState({native: 2}, '', '/app/history#/app/external')
            dispatchEvent(new HashChangeEvent('hashchange'))
        })
        expect(context.pathname).toBe('/external')
        view.rerender(tree('memory'))
        expect(context).toMatchObject({pathname: '/', state: null})
        act(() => context.navigate('/about', {state: 1}))
        act(() => {
            history.replaceState({native: 3}, '', '/app/updated#/app/new-hash')
            dispatchEvent(new PopStateEvent('popstate'))
            dispatchEvent(new HashChangeEvent('hashchange'))
        })
        expect(context).toMatchObject({pathname: '/about', state: 1})
        view.rerender(tree('history'))
        expect(context).toMatchObject({pathname: '/updated', state: {native: 3}})
        receivePopstate('/app/popped', {native: 4})
        expect(context).toMatchObject({pathname: '/popped', state: {native: 4}})
        view.rerender(tree('memory'))
        expect(context).toMatchObject({pathname: '/', state: null})
        view.rerender(tree('hash'))
        expect(context.state).toBeNull()
        act(() => context.back())
        expect(context.pathname).toBeNull()
        view.unmount()
        const subscriptions = add.mock.calls.filter(([name]) => name === 'popstate' || name === 'hashchange')
        const removals = remove.mock.calls.filter(([name]) => name === 'popstate' || name === 'hashchange')
        expect(removals).toHaveLength(subscriptions.length)
        for (const [event, handler] of subscriptions) expect(remove).toHaveBeenCalledWith(event, handler)
        const before = context
        act(() => { dispatchEvent(new PopStateEvent('popstate')); dispatchEvent(new HashChangeEvent('hashchange')) })
        expect(context).toBe(before)
    })
})

describe.each(['history', 'hash', 'memory'] as const)('D-05/D-10/D-17 %s href and navigation alignment', mode => {
    it.each(['/', '/app'])('all target classes use full physical location with base=%s', base => {
        const prefix = base === '/' ? '' : base
        const from = `${prefix}/items/?q=keep`
        if (mode !== 'memory') history.replaceState(null, '', mode === 'history' ? from : `/host?outer=1#${from}`)
        let context!: Context
        const cases: [To, string][] = [
            ['next', `${prefix}/items/next`], ['?q=new', `${prefix}/items/?q=new`],
            ['#detail', `${prefix}/items/?q=keep#detail`], ['../../../../next', '/next'],
            ['/about', `${prefix}/about`], ['/app/details', `${prefix}/app/details`],
            ['next$//中文/%2F?q=/a//b/$#part//', `${prefix}/items/next$/%E4%B8%AD%E6%96%87/%2F?q=/a//b/$#part//`],
            [`https://router.test${prefix}/about?q=//#part`, `${prefix}/about?q=//#part`],
            [new URL(`https://router.test${prefix}/about?q=//#part`), `${prefix}/about?q=//#part`]
        ]
        function Page() {
            context = useRouter()
            return <>{cases.map(([to], index) => <Link key={index} to={to}>Target {index}</Link>)}</>
        }
        const view = render(<Router mode={mode} base={base} entry={{page: <Page/>, children: {'**': {page: <Page/>}}}} notFound={<Page/>}/>)
        for (const [index, [to, expected]] of cases.entries()) {
            act(() => context.replace(new URL(`https://router.test${from}`)))
            const link = screen.getByRole('link', {name: `Target ${index}`})
            const absolute = to instanceof URL || (typeof to === 'string' && to.startsWith('https://'))
            expect(link).toHaveAttribute('href', mode === 'history' ? (absolute ? `https://router.test${expected}` : expected) : '#' + expected)
            const hostBefore = location.href
            clickLink(link)
            expect(context.location.pathname + context.location.search + context.location.hash).toBe(expected)
            expect(context.pathname).toBe(prefix && !expected.startsWith(prefix + '/') ? null : new URL(expected, 'https://router.test').pathname.slice(prefix.length).replace(/\/+$/, '') || '/')
            if (mode === 'history') expect(location.pathname + location.search + location.hash).toBe(expected)
            if (mode === 'hash') expect(location.pathname + location.search + location.hash).toBe('/host?outer=1#' + expected)
            if (mode === 'memory') expect(location.href).toBe(hostBefore)
        }
        view.unmount()
    })
    it('consecutive relative navigations in one batch use the latest directory', () => {
        const app = mountRouter({mode})
        act(() => { app.router.navigate('/items/'); app.router.navigate('nested/'); app.router.navigate('leaf') })
        expect(app.router.location.pathname).toBe('/items/nested/leaf')
    })
})
