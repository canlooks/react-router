import React from 'react'
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {Router, matchPath, useNavigate, useRouter} from '../../src'
import type {RouteItem} from '../../index'

describe('documented contract — regressions', () => {
    beforeEach(() => {
        history.replaceState(null, '', '/')
    })

    afterEach(() => {
        cleanup()
        history.replaceState(null, '', '/')
    })

    it('[KNOWN-001] memory navigation should update the matched route without changing the browser URL', () => {
        function Home() {
            const navigate = useNavigate()
            return <button onClick={() => navigate('/next')}>Next</button>
        }

        const entry: RouteItem = {
            page: <Home/>,
            children: {
                next: {page: <div data-testid="memory-next">Next page</div>},
            },
        }
        const hrefBefore = location.href
        render(<Router mode="memory" entry={entry}/>)

        act(() => {
            fireEvent.click(screen.getByRole('button', {name: 'Next'}))
        })

        expect(location.href).toBe(hrefBefore)
        expect(screen.getByTestId('memory-next')).toBeInTheDocument()
    })

    it('[KNOWN-002] an exact route should beat a dynamic sibling regardless of declaration order', () => {
        history.replaceState(null, '', '/settings')
        const entry: RouteItem = {
            children: {
                ':id': {page: <div data-testid="dynamic-page">Dynamic</div>},
                settings: {page: <div data-testid="settings-page">Settings</div>},
            },
        }

        render(<Router mode="history" entry={entry}/>)

        expect(screen.getByTestId('settings-page')).toBeInTheDocument()
        expect(screen.queryByTestId('dynamic-page')).not.toBeInTheDocument()
    })

    it('[KNOWN-003] hash replace should preserve entries before the replaced entry', async () => {
        history.replaceState(null, '', '/#/start')
        let router: ReturnType<typeof useRouter> | undefined
        function Capture() {
            router = useRouter()
            return <div>Capture</div>
        }
        const entry: RouteItem = {
            children: {
                '**': {page: <Capture/>},
            },
        }
        render(<Router mode="hash" entry={entry}/>)

        act(() => {
            router!.navigate('/first')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        act(() => {
            router!.replace('/second')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        act(() => {
            router!.back()
        })

        await waitFor(() => expect(location.hash).toBe('#/start'))
    })

    it('[KNOWN-004] hash navigation should keep the configured base prefix', () => {
        history.replaceState(null, '', '/#/app/home')
        function Home() {
            const navigate = useNavigate()
            return <button onClick={() => navigate('/next')}>Next in base</button>
        }
        const entry: RouteItem = {
            children: {
                home: {page: <Home/>},
                next: {page: <div data-testid="hash-base-next">Next page</div>},
            },
        }
        render(<Router mode="hash" base="/app" entry={entry}/>)

        act(() => {
            fireEvent.click(screen.getByRole('button', {name: 'Next in base'}))
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        expect(location.hash).toBe('#/app/next')
        expect(screen.getByTestId('hash-base-next')).toBeInTheDocument()
    })

    it('[KNOWN-005] static route text should be treated literally by matchPath', () => {
        expect(matchPath('/release/v1x0', '/release/v1.0')).toBeNull()
    })
})
