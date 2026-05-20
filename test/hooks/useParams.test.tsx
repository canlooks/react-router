import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import React from 'react'
import { Router, useRouter, useParams } from '../../src'

describe('useParams', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/')
    })

    it('static route returns empty params', () => {
        let captured: Record<string, string> | null = null
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
})
