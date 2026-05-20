import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import React from 'react'
import { Router, useRouter, useNavigate } from '../../src'

describe('useNavigate', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/')
    })

    it('navigate("/path") changes the current pathname', async () => {
        function TargetReporter() {
            const { pathname } = useRouter()
            return <div data-testid="target">{pathname}</div>
        }

        function HomePage() {
            const navigate = useNavigate()
            return <button data-testid="nav-btn" onClick={() => navigate('/about')}>Go</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { about: { page: <TargetReporter /> } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-btn')))
        await waitFor(() => expect(screen.getByTestId('target')).toHaveTextContent('/about'))
    })

    it('navigate with replace option', async () => {
        function HomePage() {
            const navigate = useNavigate()
            return <button data-testid="nav-first" onClick={() => navigate('/first')}>First</button>
        }

        function FirstPage() {
            const navigate = useNavigate()
            return (
                <div>
                    <div data-testid="first-page">First</div>
                    <button data-testid="nav-second-replace" onClick={() => navigate('/second', { replace: true })}>Second (replace)</button>
                </div>
            )
        }

        function SecondPage() {
            return <div data-testid="second-page">Second</div>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: {
                    first: { page: <FirstPage /> },
                    second: { page: <SecondPage /> },
                },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-first')))
        await waitFor(() => expect(screen.getByTestId('first-page')).toBeInTheDocument())

        act(() => fireEvent.click(screen.getByTestId('nav-second-replace')))
        await waitFor(() => expect(screen.getByTestId('second-page')).toBeInTheDocument())
    })

    it('navigate with state option', async () => {
        function TargetReporter() {
            const { state } = useRouter()
            return <div data-testid="target-state">{JSON.stringify(state)}</div>
        }

        function HomePage() {
            const navigate = useNavigate()
            return <button data-testid="nav-state" onClick={() => navigate('/state-test', { state: { key: 'value' } })}>Go with state</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { 'state-test': { page: <TargetReporter /> } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-state')))
        await waitFor(() => expect(screen.getByTestId('target-state')).toHaveTextContent('{"key":"value"}'))
    })

    it('navigate(-1) goes back in history', async () => {
        function HomePage() {
            const navigate = useNavigate()
            return <button data-testid="nav-first" onClick={() => navigate('/first')}>First</button>
        }

        function FirstPage() {
            const navigate = useNavigate()
            return (
                <div>
                    <div data-testid="first-page">First</div>
                    <button data-testid="nav-second" onClick={() => navigate('/second')}>Second</button>
                </div>
            )
        }

        function SecondPage() {
            const navigate = useNavigate()
            return (
                <div>
                    <div data-testid="second-page">Second</div>
                    <button data-testid="nav-back" onClick={() => navigate(-1)}>Back</button>
                </div>
            )
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: {
                    first: { page: <FirstPage /> },
                    second: { page: <SecondPage /> },
                },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-first')))
        await waitFor(() => expect(screen.getByTestId('first-page')).toBeInTheDocument())

        act(() => fireEvent.click(screen.getByTestId('nav-second')))
        await waitFor(() => expect(screen.getByTestId('second-page')).toBeInTheDocument())

        act(() => fireEvent.click(screen.getByTestId('nav-back')))
        await waitFor(() => expect(screen.getByTestId('first-page')).toBeInTheDocument())
    })

    it('navigate(0) is a no-op', async () => {
        function HomePage() {
            const navigate = useNavigate()
            return <button data-testid="nav-somewhere" onClick={() => navigate('/somewhere')}>Go</button>
        }

        function SomewherePage() {
            const navigate = useNavigate()
            const { pathname } = useRouter()
            return (
                <div>
                    <div data-testid="somewhere-page">{pathname}</div>
                    <button data-testid="nav-zero" onClick={() => navigate(0)}>No-op</button>
                </div>
            )
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { somewhere: { page: <SomewherePage /> } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-somewhere')))
        await waitFor(() => expect(screen.getByTestId('somewhere-page')).toBeInTheDocument())

        act(() => fireEvent.click(screen.getByTestId('nav-zero')))
        await waitFor(() => expect(screen.getByTestId('somewhere-page')).toHaveTextContent('/somewhere'))
    })

    it('cross-origin URL navigate throws Error', () => {
        function createReporter() {
            let captured: any = null
            const Reporter = () => {
                captured = useRouter()
                return <div data-testid="page">Page</div>
            }
            return { Reporter, getContext: () => captured }
        }

        const { Reporter, getContext } = createReporter()
        render(<Router entry={{ page: <Reporter /> }} />)

        const ctx = getContext()
        expect(() => ctx?.navigate(new URL('http://other-origin.com/path'))).toThrow('Cannot navigate different origin')
    })

    it('navigate with URL object of same origin works', () => {
        function createReporter() {
            let captured: any = null
            const Reporter = () => {
                captured = useRouter()
                return <div data-testid="page">Page</div>
            }
            return { Reporter, getContext: () => captured }
        }

        const { Reporter, getContext } = createReporter()
        render(<Router entry={{ page: <Reporter /> }} />)

        const ctx = getContext()
        expect(() => ctx?.navigate(new URL('/same-origin', window.location.origin))).not.toThrow()
    })
})
