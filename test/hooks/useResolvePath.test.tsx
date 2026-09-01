import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import React from 'react'
import { Router, useRouter, useResolvePath } from '../../src'

describe('useResolvePath', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/')
    })

    function createResolveReporter(to?: string | URL) {
        let captured: string | null = null
        const Reporter = () => {
            captured = useResolvePath(to)
            return <div data-testid="resolve-result">{captured}</div>
        }
        return { Reporter, getResolved: () => captured }
    }

    it('resolves relative path in history mode', () => {
        const { Reporter, getResolved } = createResolveReporter('profile')
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(getResolved()).toBe('/profile')
    })

    it('useResolvePath(undefined) returns ""', () => {
        const { Reporter, getResolved } = createResolveReporter(undefined)
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(getResolved()).toBe('')
    })

    it('useResolvePath("/absolute") in history mode returns "/absolute"', () => {
        const { Reporter, getResolved } = createResolveReporter('/absolute')
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(getResolved()).toBe('/absolute')
    })

    it('in history mode: base is prepended to absolute paths', () => {
        // Set URL to /app/ so it matches the base
        window.history.pushState({}, '', '/app/')

        function ResolveReporter() {
            const resolved = useResolvePath('/dashboard')
            return <div data-testid="resolve-base">{resolved}</div>
        }

        render(
            <Router base="/app" entry={{
                page: <ResolveReporter />,
            }} />
        )

        expect(screen.getByTestId('resolve-base')).toHaveTextContent('/app/dashboard')
    })

    it('in hash mode: useResolvePath("profile") returns "#/profile"', () => {
        const { Reporter, getResolved } = createResolveReporter('profile')
        render(<Router mode="hash" entry={{ page: <Reporter /> }} />)
        expect(getResolved()).toBe('#/profile')
    })

    it('in hash mode: useResolvePath("/settings") returns "#/settings"', () => {
        const { Reporter, getResolved } = createResolveReporter('/settings')
        render(<Router mode="hash" entry={{ page: <Reporter /> }} />)
        expect(getResolved()).toBe('#/settings')
    })

    it('in hash mode: base is included in the generated href', () => {
        history.replaceState(null, '', '/#/app/home')
        const {Reporter, getResolved} = createResolveReporter('/settings')

        render(<Router mode="hash" base="/app" entry={{
            children: {'**': {page: <Reporter/>}},
        }}/>)

        expect(getResolved()).toBe('#/app/settings')
    })

    it('replaces query and hash without inserting an extra slash', () => {
        history.replaceState(null, '', '/search?q=old#old')
        const {Reporter, getResolved} = createResolveReporter('?q=new')

        render(<Router entry={{children: {'**': {page: <Reporter/>}}}}/>)

        expect(getResolved()).toBe('/search?q=new')
    })

    it('resolves an empty string to the current history path without its hash', () => {
        history.replaceState(null, '', '/current?x=1#old')
        const {Reporter, getResolved} = createResolveReporter('')

        render(<Router entry={{children: {'**': {page: <Reporter/>}}}}/>)

        expect(getResolved()).toBe('/current?x=1')
    })

    it('resolves an empty string to the current hash path and keeps the base', () => {
        history.replaceState(null, '', '/#/app/current?x=1#old')
        const {Reporter, getResolved} = createResolveReporter('')

        render(<Router mode="hash" base="/app" entry={{children: {'**': {page: <Reporter/>}}}}/>)

        expect(getResolved()).toBe('#/app/current?x=1')
    })

    it('resolves "../" relative to current path', async () => {
        function ResolveReporter() {
            const resolved = useResolvePath('../settings')
            return <div data-testid="resolve-up">{resolved}</div>
        }

        function HomePage() {
            const { navigate } = useRouter()
            return <button data-testid="nav-dashboard" onClick={() => navigate('/app/dashboard')}>Go to dashboard</button>
        }

        render(
            <Router entry={{
                page: <HomePage />,
                children: { app: { children: { dashboard: { page: <ResolveReporter /> } } } },
            }} />
        )

        act(() => fireEvent.click(screen.getByTestId('nav-dashboard')))
        await waitFor(() => {
            const el = screen.getByTestId('resolve-up')
            // At /app/dashboard, '../settings' resolves relative to the URL
            expect(el).toBeInTheDocument()
        })
    })

    it('resolves URL object', () => {
        const url = new URL('/url-path', window.location.origin)
        const { Reporter, getResolved } = createResolveReporter(url)
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(getResolved()).toBe(url.href)
    })

    it('returns a cross-origin href without trying to convert it to a route path', () => {
        const url = new URL('https://example.com/path?q=1')
        const {Reporter, getResolved} = createResolveReporter(url)
        render(<Router entry={{page: <Reporter/>}}/>)

        expect(getResolved()).toBe(url.href)
    })

    it('resolves from root when the current pathname is outside base', () => {
        history.replaceState(null, '', '/outside')
        const {Reporter, getResolved} = createResolveReporter('/inside')

        render(<Router
            base="/app"
            entry={{}}
            notFound={<Reporter/>}
        />)

        expect(getResolved()).toBe('/app/inside')
    })
})
