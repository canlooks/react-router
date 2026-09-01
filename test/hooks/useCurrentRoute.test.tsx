import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import React from 'react'
import { Router, useRouter, useCurrentRoute } from '../../src'
import type {RouteItem} from '../../index'

describe('useCurrentRoute', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/')
    })

    it('at root page: current route has the page', () => {
        let captured: any = null
        const Reporter = () => {
            captured = useCurrentRoute()
            return <div data-testid="root-page">root</div>
        }

        render(<Router entry={{ page: <Reporter /> }} />)
        expect(captured).not.toBeNull()
        expect(captured).toHaveProperty('page')
    })

    it('at nested page: the leaf route page renders', async () => {
        function CurrentReporter() {
            const { pathname } = useRouter()
            return <div data-testid="leaf-page">{pathname}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-leaf" onClick={() => navigate('/mid/leaf')}>Go to leaf</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { mid: { children: { leaf: { page: <CurrentReporter /> } } } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-leaf')))
        await waitFor(() => expect(screen.getByTestId('leaf-page')).toHaveTextContent('/mid/leaf'))
    })

    it('custom metadata on RouteItem is accessible', async () => {
        function MetadataReporter() {
            const current = useCurrentRoute() as RouteItem<{title: string}>
            return <div data-testid="meta-page">{current?.title ?? 'no-title'}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-custom" onClick={() => navigate('/custom')}>Go to custom</button>
        }

        const entry: RouteItem<{title: string}> = {
            title: 'Root',
            page: <HomePage />,
            children: {
                custom: {title: 'Custom Page', page: <MetadataReporter />},
            },
        }

        render(<Router entry={entry}/>)

        act(() => fireEvent.click(screen.getByTestId('nav-custom')))
        await waitFor(() => expect(screen.getByTestId('meta-page')).toHaveTextContent('Custom Page'))
    })
})
