import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import React from 'react'
import { Router, useRouter, useSearchParams, useQuery } from '../../src'

describe('useSearchParams', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/')
    })

    it('URL with query string "?q=react" → get("q") === "react"', async () => {
        function SearchReporter() {
            const params = useSearchParams()
            return <div data-testid="search-result">{params.get('q') ?? 'null'}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-search" onClick={() => navigate('/search?q=react')}>Search</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { search: { page: <SearchReporter /> } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-search')))
        await waitFor(() => expect(screen.getByTestId('search-result')).toHaveTextContent('react'))
    })

    it('URL with multiple params "?q=react&page=1" → both accessible', async () => {
        function SearchReporter() {
            const params = useSearchParams()
            return <div data-testid="multi-search">{params.get('q')},{params.get('page')}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-multi" onClick={() => navigate('/search?q=react&page=1')}>Multi search</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { search: { page: <SearchReporter /> } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-multi')))
        await waitFor(() => expect(screen.getByTestId('multi-search')).toHaveTextContent('react,1'))
    })

    it('URL without query → .toString() is ""', () => {
        let captured: URLSearchParams | null = null
        const Reporter = () => {
            captured = useSearchParams()
            return <div data-testid="empty-search">empty</div>
        }

        render(<Router entry={{ page: <Reporter /> }} />)
        expect(captured?.toString()).toBe('')
    })

    it('useQuery is alias for useSearchParams → both return same result', async () => {
        function DualReporter() {
            const searchParams = useSearchParams()
            const query = useQuery()
            return <div data-testid="dual-result">{searchParams.get('q')},{query.get('q')}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-dual" onClick={() => navigate('/search?q=react')}>Go</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { search: { page: <DualReporter /> } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-dual')))
        await waitFor(() => expect(screen.getByTestId('dual-result')).toHaveTextContent('react,react'))
    })
})
