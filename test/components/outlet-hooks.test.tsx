import {act, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {RouteItem} from '../../index'
import {
    Link, Outlet, Router, useCurrentRoute, useNavigate, useOutlet, useParams, useQuery,
    useResolvePath, useRouteLayoutStack, useRouteLayoutStackIndex, useRouter, useRouteStack, useSearchParams
} from '../../src'

type LabeledRoute = RouteItem<{label: string}>

describe('C-OUTLET nested rendering and route metadata hooks', () => {
    it('C-OUTLET-01 preserves layout nesting, full stack, filtered stack and per-level metadata', () => {
        const seen: Record<string, {index: number; current: RouteItem; full: RouteItem[]; layouts: RouteItem[]}> = {}
        function Observe({name, outlet = false}: {name: string; outlet?: boolean}) {
            seen[name] = {index: useRouteLayoutStackIndex(), current: useCurrentRoute(), full: useRouteStack(), layouts: useRouteLayoutStack()}
            return <section data-testid={name}>{name}{outlet && <Outlet/>}</section>
        }
        const leaf: LabeledRoute = {label: 'detail', layout: <Observe name="detail-layout" outlet/>, page: <Observe name="detail-page"/>}
        const group: LabeledRoute = {label: 'group', children: {':id': leaf}}
        const users: LabeledRoute = {label: 'users', layout: <Observe name="users" outlet/>, page: 'List', children: {'#group': group}}
        const entry: LabeledRoute = {label: 'root', layout: <Observe name="root" outlet/>, page: 'Home', children: {users}}
        history.replaceState(null, '', '/users/42')
        render(<Router entry={entry}/>)
        expect(screen.getByTestId('root')).toContainElement(screen.getByTestId('users'))
        expect(screen.getByTestId('users')).toContainElement(screen.getByTestId('detail-layout'))
        expect(screen.getByTestId('detail-layout')).toContainElement(screen.getByTestId('detail-page'))
        expect(seen.root).toEqual({index: 1, current: entry, full: [entry, users, group, leaf], layouts: [entry, users, leaf]})
        expect(seen.users.current).toBe(users)
        expect(seen.users.index).toBe(2)
        expect(seen['detail-layout'].current).toBe(leaf)
        expect(seen['detail-layout'].index).toBe(3)
        expect(seen['detail-page'].current).toBe(leaf)
        expect(seen['detail-page'].index).toBe(4)
        expect(screen.queryByText('List')).not.toBeInTheDocument()
    })
    it('C-OUTLET-02 useOutlet renders the child and a leaf Outlet renders no further content', () => {
        function Shell() { return <main>{useOutlet()}</main> }
        render(<Router entry={{layout: <Shell/>, page: <div>Leaf<Outlet/></div>}}/>)
        expect(screen.getByRole('main')).toHaveTextContent('Leaf')
        expect(screen.getAllByText('Leaf')).toHaveLength(1)
    })
    it('C-OUTLET-03 a layout must provide Outlet for its page to appear', () => {
        render(<Router entry={{layout: <main>Shell only</main>, page: 'Hidden page'}}/>)
        expect(screen.getByText('Shell only')).toBeInTheDocument()
        expect(screen.queryByText('Hidden page')).not.toBeInTheDocument()
    })
    it.each([undefined, null, false])('C-OUTLET-04 an unset leaf layout (%s) still renders its page and current route', layout => {
        let current: RouteItem | undefined
        function Page() { current = useCurrentRoute(); return <div>Leaf</div> }
        const entry = {layout, page: <Page/>}
        render(<Router entry={entry}/>)
        expect(screen.getByText('Leaf')).toBeInTheDocument()
        expect(current).toBe(entry)
    })
})

describe('H-QUERY and H-PARAM reactive URL hooks', () => {
    it('H-QUERY-01 exposes decoded, repeated, empty and missing query values; useQuery is equivalent', () => {
        history.replaceState(null, '', '/search?q=%E4%B8%AD%E6%96%87+hello&tag=a&tag=b&empty=&flag#part')
        let values: URLSearchParams | undefined
        function Page() {
            const search = useSearchParams()
            const query = useQuery()
            values = search
            expect([...query]).toEqual([...search])
            return <div>Search</div>
        }
        render(<Router entry={{children: {search: {page: <Page/>}}}}/>)
        expect(values).toBeInstanceOf(URLSearchParams)
        expect(values!.get('q')).toBe('中文 hello')
        expect(values!.getAll('tag')).toEqual(['a', 'b'])
        expect(values!.get('empty')).toBe('')
        expect(values!.get('flag')).toBe('')
        expect(values!.get('missing')).toBeNull()
    })
    it('H-PARAM-01 navigation refreshes params and query, then clears params on static and unmatched routes', () => {
        let navigate!: ReturnType<typeof useNavigate>
        function Page() {
            navigate = useNavigate()
            expect(navigate).toBe(useRouter().navigate)
            const params = useParams()
            const query = useSearchParams()
            return <output>{JSON.stringify({params, q: query.get('q')})}</output>
        }
        render(<Router entry={{page: <Page/>, children: {
            user: {children: {':id': {page: <Page/>}}}, about: {page: <Page/>}
        }}} notFound={<Page/>}/>)
        act(() => navigate('/user/42?q=one'))
        expect(screen.getByRole('status')).toHaveTextContent('{"params":{"id":"42"},"q":"one"}')
        act(() => navigate('/user/43?q=two'))
        expect(screen.getByRole('status')).toHaveTextContent('{"params":{"id":"43"},"q":"two"}')
        act(() => navigate('/about'))
        expect(screen.getByRole('status')).toHaveTextContent('{"params":{},"q":null}')
        act(() => navigate('/user/44'))
        act(() => navigate('/missing'))
        expect(screen.getByRole('status')).toHaveTextContent('{"params":{},"q":null}')
    })
    it('H-QUERY-02 changing only query rerenders hooks without losing dynamic params', () => {
        let navigate!: ReturnType<typeof useNavigate>
        function Page() {
            navigate = useNavigate()
            return <output>{useParams().id}:{useSearchParams().get('q')}</output>
        }
        history.replaceState(null, '', '/user/42?q=one')
        render(<Router entry={{children: {user: {children: {':id': {page: <Page/>}}}}}}/>)
        act(() => navigate('?q=two'))
        expect(screen.getByRole('status')).toHaveTextContent('42:two')
    })
    it('H-QUERY-03 mutating returned search params does not silently change the URL', () => {
        function Page() { useSearchParams().set('q', 'local'); return null }
        render(<Router entry={{page: <Page/>}}/>)
        expect(location.search).toBe('')
    })
})

describe('H-RESOLVE link destination hooks', () => {
    it.each([
        ['history', '/app/users/42', '/app', '/about', '/app/about'],
        ['history', '/app/users/42', '/app', '43', '/app/users/43'],
        ['history', '/app/users/42', '/app', '../about', '/app/about'],
        ['hash', '/#/users/42', '/', '/about', '#/about'],
        ['hash', '/#/users/42', '/', '43', '#/users/43'],
        ['memory', '/', '/', '/about', '#/about']
    ] as const)('H-RESOLVE-01 %s %s + %s + %s -> %s', (mode, initial, base, to, expected) => {
        history.replaceState(null, '', initial)
        function Page() { return <output>{useResolvePath(to)}</output> }
        render(<Router mode={mode} base={base} entry={{page: <Page/>, children: {'**': {page: <Page/>}}}}/>)
        expect(screen.getByRole('status')).toHaveTextContent(expected)
    })
    it.each([undefined, ''])('H-RESOLVE-02 absent destination %s produces an empty href', to => {
        render(<Router entry={{page: <Link to={to}>Empty</Link>}}/>)
        expect(screen.getByText('Empty')).toHaveAttribute('href', '')
    })
})
