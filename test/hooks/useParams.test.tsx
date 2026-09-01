import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import React from 'react'
import { Router, useRouter, useParams } from '../../src'
import type {Params, RouteItem} from '../../index'

describe('useParams', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/')
    })

    it('static route returns empty params', () => {
        let captured: Params | null = null
        const Reporter = () => {
            const { params } = useRouter()
            captured = params
            return <div data-testid="page">{JSON.stringify(params)}</div>
        }

        render(<Router entry={{ page: <Reporter /> }} />)
        expect(captured).toEqual({})
    })

    it('dynamic route ":id" at "/user/42" returns {id: "42"}', async () => {
        function UserReporter() {
            const params = useParams()
            return <div data-testid="user-page">{JSON.stringify(params)}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-user" onClick={() => navigate('/user/42')}>Go to User 42</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { user: { children: { ':id': { page: <UserReporter /> } } } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-user')))
        await waitFor(() => expect(screen.getByTestId('user-page')).toHaveTextContent('{"id":"42"}'))
    })

    it('multiple params "/:a/:b/:c" at "/x/y/z" returns {a:"x", b:"y", c:"z"}', async () => {
        function MultiReporter() {
            const params = useParams()
            return <div data-testid="multi-page">{JSON.stringify(params)}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-multi" onClick={() => navigate('/x/y/z')}>Go to /x/y/z</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { ':a': { children: { ':b': { children: { ':c': { page: <MultiReporter /> } } } } } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-multi')))
        await waitFor(() => expect(screen.getByTestId('multi-page')).toHaveTextContent('{"a":"x","b":"y","c":"z"}'))
    })

    it('* wildcard at "/docs/readme" on route "/docs/*" captures "readme"', async () => {
        function DocReporter() {
            const params = useParams()
            return <div data-testid="doc-page">{JSON.stringify(params)}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-doc" onClick={() => navigate('/docs/readme')}>Go to /docs/readme</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { docs: { children: { '*': { page: <DocReporter /> } } } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-doc')))
        await waitFor(() => expect(screen.getByTestId('doc-page')).toHaveTextContent('{"*":"readme"}'))
    })

    it('** catch-all at "/files/a/b" on route "/files/**" matches', async () => {
        function FilesReporter() {
            const { pathname } = useRouter()
            return <div data-testid="files-page">{pathname}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-files" onClick={() => navigate('/files/a/b')}>Go to /files/a/b</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { files: { children: { '**': { page: <FilesReporter /> } } } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-files')))
        await waitFor(() => expect(screen.getByTestId('files-page')).toHaveTextContent('/files/a/b'))
    })

    it('decodes percent-encoded params once and preserves encoded slash boundaries', () => {
        history.replaceState(null, '', '/device/%E4%B8%AD/a%2Fb/%252F')

        function Reporter() {
            return <div data-testid="decoded-params">{JSON.stringify(useParams())}</div>
        }

        render(<Router entry={{
            children: {
                device: {
                    children: {
                        ':name': {
                            children: {
                                ':path': {
                                    children: {':encoded': {page: <Reporter/>}},
                                },
                            },
                        },
                    },
                },
            },
        }}/>)

        expect(screen.getByTestId('decoded-params')).toHaveTextContent(
            '{"name":"中","path":"a/b","encoded":"%2F"}',
        )
    })

    describe('entry updates', () => {
        function ParamsProbe({testId = 'entry-params'}: {testId?: string}) {
            const routerParams = useRouter().params
            const params = useParams()
            return (
                <div
                    data-testid={testId}
                    data-context-equal={String(routerParams === params)}
                >
                    {JSON.stringify(params)}
                </div>
            )
        }

        it('clears dynamic params when the same pathname becomes static', () => {
            history.replaceState(null, '', '/value')
            const {rerender} = render(<Router entry={{
                children: {':id': {page: <ParamsProbe/>}},
            }}/>)

            expect(screen.getByTestId('entry-params')).toHaveTextContent('{"id":"value"}')

            rerender(<Router entry={{
                children: {value: {page: <ParamsProbe/>}},
            }}/>)

            expect(screen.getByTestId('entry-params')).toHaveTextContent('{}')
        })

        it('replaces params instead of merging them when a parameter is renamed', () => {
            history.replaceState(null, '', '/value')
            const {rerender} = render(<Router entry={{
                children: {':id': {page: <ParamsProbe/>}},
            }}/>)

            expect(screen.getByTestId('entry-params')).toHaveTextContent('{"id":"value"}')

            rerender(<Router entry={{
                children: {':slug': {page: <ParamsProbe/>}},
            }}/>)

            expect(screen.getByTestId('entry-params')).toHaveTextContent('{"slug":"value"}')
            expect(screen.getByTestId('entry-params')).not.toHaveTextContent('id')
        })

        it('provides empty params to notFound after a dynamic route is removed', () => {
            history.replaceState(null, '', '/value')
            const {rerender} = render(<Router
                entry={{children: {':id': {page: <ParamsProbe/>}}}}
                notFound={<ParamsProbe testId="not-found-params"/>}
            />)

            expect(screen.getByTestId('entry-params')).toHaveTextContent('{"id":"value"}')

            rerender(<Router
                entry={{children: {other: {page: <div>Other</div>}}}}
                notFound={<ParamsProbe testId="not-found-params"/>}
            />)

            expect(screen.getByTestId('not-found-params')).toHaveTextContent('{}')
        })

        it('updates params when both entries reuse the same ReactNode', () => {
            history.replaceState(null, '', '/value')
            const sharedPage = <ParamsProbe/>
            const {rerender} = render(<Router entry={{
                children: {':id': {page: sharedPage}},
            }}/>)

            expect(screen.getByTestId('entry-params')).toHaveTextContent('{"id":"value"}')

            rerender(<Router entry={{
                children: {':slug': {page: sharedPage}},
            }}/>)

            expect(screen.getByTestId('entry-params')).toHaveTextContent('{"slug":"value"}')
            expect(screen.getByTestId('entry-params')).toHaveAttribute('data-context-equal', 'true')
        })

        it('does not leak params across entry updates in StrictMode', () => {
            history.replaceState(null, '', '/value')
            const renderTree = (entry: RouteItem) => (
                <React.StrictMode>
                    <Router entry={entry}/>
                </React.StrictMode>
            )
            const {rerender} = render(renderTree({
                children: {':id': {page: <ParamsProbe/>}},
            }))

            expect(screen.getByTestId('entry-params')).toHaveTextContent('{"id":"value"}')

            rerender(renderTree({
                children: {value: {page: <ParamsProbe/>}},
            }))

            expect(screen.getByTestId('entry-params')).toHaveTextContent('{}')
            expect(screen.getByTestId('entry-params')).toHaveAttribute('data-context-equal', 'true')
        })
    })
})
