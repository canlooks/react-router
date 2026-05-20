import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import React from 'react'
import { Router, useRouter, useRouteStack } from '../../src'

describe('useRouteStack', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/')
    })

    it('root route only: stack has 1 item', () => {
        let captured: any[] | null = null
        const Reporter = () => {
            captured = useRouteStack()
            return <div data-testid="root-page">root</div>
        }

        render(<Router entry={{ page: <Reporter /> }} />)
        expect(captured).toHaveLength(1)
        expect(captured![0]).toHaveProperty('page')
    })

    it('nested routes: path "/a/b" matches chain [root, a, b] — 3 items', async () => {
        function StackReporter() {
            const stack = useRouteStack()
            return <div data-testid="stack-page">{stack.length}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-a-b" onClick={() => navigate('/a/b')}>Go</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { a: { children: { b: { page: <StackReporter /> } } } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-a-b')))
        await waitFor(() => expect(screen.getByTestId('stack-page')).toHaveTextContent('3'))
    })

    it('# grouped route: stack includes the # group item but excluded from URL path', async () => {
        function StackReporter() {
            const stack = useRouteStack()
            const { pathname } = useRouter()
            return <div data-testid="group-page">{stack.length} | {pathname}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-child" onClick={() => navigate('/child')}>Go</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { '#': { children: { child: { page: <StackReporter /> } } } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-child')))
        await waitFor(() => {
            const el = screen.getByTestId('group-page')
            expect(el).toHaveTextContent('3')
            expect(el).toHaveTextContent('/child')
        })
    })

    it('match at known child route returns non-empty stack', async () => {
        function StackReporter() {
            const stack = useRouteStack()
            return <div data-testid="match-page">{stack.length}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-about" onClick={() => navigate('/about')}>Go to About</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { about: { page: <StackReporter /> } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-about')))
        await waitFor(() => expect(screen.getByTestId('match-page')).toBeInTheDocument())
    })
})
