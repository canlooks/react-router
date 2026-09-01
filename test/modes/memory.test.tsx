import { render, act, waitFor } from '@testing-library/react'
import React from 'react'
import { Router, useRouter } from '../../src'
import type { RouteItem } from '../../index'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Captures router context synchronously during render. */
function createCapture() {
    let captured: ReturnType<typeof useRouter> | null = null
    const Page = () => {
        captured = useRouter()
        return <div data-testid="tester">test</div>
    }
    return { Page, getRouter: () => captured! }
}

/** Entry with catch-all "**" so the page renders for ANY pathname. */
function makeEntry(Page: () => React.JSX.Element): RouteItem {
    return {
        children: {
            '**': { page: <Page /> }
        }
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Memory Mode', () => {
    let pushStateSpy: ReturnType<typeof vi.spyOn>
    let replaceStateSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        pushStateSpy = vi.spyOn(history, 'pushState')
        replaceStateSpy = vi.spyOn(history, 'replaceState')
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // ── no history API calls ──────────────────────────────────────────────

    it('navigate("/a") does NOT call history.pushState or replaceState', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a')
        })

        expect(pushStateSpy).not.toHaveBeenCalled()
        expect(replaceStateSpy).not.toHaveBeenCalled()
    })

    it('navigate("/a", { replace: true }) does NOT call history methods', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a', { replace: true })
        })

        expect(pushStateSpy).not.toHaveBeenCalled()
        expect(replaceStateSpy).not.toHaveBeenCalled()
    })

    it('navigate does NOT change the URL', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        const hrefBefore = window.location.href

        await act(async () => { getRouter().navigate('/a') })
        await act(async () => { getRouter().navigate('/b') })
        await act(async () => { getRouter().navigate('/c') })

        expect(window.location.href).toBe(hrefBefore)
    })

    it('navigate updates the memory pathname used for matching', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().navigate('/a?query=1#section')
        })

        expect(getRouter().pathname).toBe('/a')
        expect(getRouter().location.search).toBe('?query=1')
        expect(getRouter().location.hash).toBe('#section')
    })

    // ── state tracking ────────────────────────────────────────────────────

    it('navigate with state sets innerState on the router context', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a', { state: { key: 'value' } })
        })

        await waitFor(() => {
            expect(getRouter().state).toEqual({ key: 'value' })
        })
    })

    it('navigate updates state on each call', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/first', { state: 'first-state' })
        })

        await waitFor(() => {
            expect(getRouter().state).toBe('first-state')
        })

        await act(async () => {
            getRouter().navigate('/second', { state: 'second-state' })
        })

        await waitFor(() => {
            expect(getRouter().state).toBe('second-state')
        })
    })

    it('restores the state associated with each entry on back and forward', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)}/>)

        await act(async () => getRouter().navigate('/first', {state: {entry: 'first'}}))
        await act(async () => getRouter().navigate('/second', {state: {entry: 'second'}}))
        await act(async () => getRouter().back())

        expect(getRouter().pathname).toBe('/first')
        expect(getRouter().state).toEqual({entry: 'first'})

        await act(async () => getRouter().forward())
        expect(getRouter().pathname).toBe('/second')
        expect(getRouter().state).toEqual({entry: 'second'})
    })

    it('supports functional setState on the current memory entry', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)}/>)

        await act(async () => getRouter().setState({count: 1}))
        await act(async () => getRouter().setState((previous: {count: number}) => ({
            count: previous.count + 1,
        })))

        expect(getRouter().state).toEqual({count: 2})
    })

    // ── sequential navigation (no crashes, no side effects) ───────────────

    it('sequential navigation does not crash and has no URL side effects', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        const hrefBefore = window.location.href

        await act(async () => { getRouter().navigate('/b') })
        await act(async () => { getRouter().navigate('/c') })

        expect(pushStateSpy).not.toHaveBeenCalled()
        expect(window.location.href).toBe(hrefBefore)
    })

    // ── back & forward ────────────────────────────────────────────────────

    it('back() does not call history.back() (uses internal stack)', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => { getRouter().navigate('/a') })

        await act(async () => { getRouter().back() })

        // In memory mode, back() uses navigate(-1) internally, NOT history.back()
        expect(pushStateSpy).not.toHaveBeenCalled()
    })

    it('forward() does not cause URL change', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => { getRouter().navigate('/a') })
        await act(async () => { getRouter().navigate('/b') })
        await act(async () => { getRouter().back() })

        const hrefBefore = window.location.href

        await act(async () => { getRouter().forward() })

        // No URL change — memory mode uses internal stack only
        expect(window.location.href).toBe(hrefBefore)
    })

    // ── cross-origin URL ──────────────────────────────────────────────────

    it('navigate to cross-origin URL throws an error', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        // Cross-origin check happens before mode switch — applies to all modes
        await expect(
            act(async () => {
                getRouter().navigate(new URL('https://other-origin.com/path'))
            })
        ).rejects.toThrow(/Cannot navigate different origin/)
    })

    // ── delta navigation ──────────────────────────────────────────────────

    it('navigate(-2) (delta) does not call history.go', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => { getRouter().navigate('/a') })
        await act(async () => { getRouter().navigate('/b') })
        await act(async () => { getRouter().navigate('/c') })
        await act(async () => { getRouter().navigate(-2) })

        // Delta navigation uses internal stack, not history API
        expect(pushStateSpy).not.toHaveBeenCalled()
    })

    it('navigate(1) (delta forward) does not call history.go', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => { getRouter().navigate('/a') })
        await act(async () => { getRouter().navigate('/b') })
        await act(async () => { getRouter().navigate(-1) }) // back one
        await act(async () => { getRouter().navigate(1) })  // forward one

        expect(pushStateSpy).not.toHaveBeenCalled()
    })

    it('delta navigation beyond bounds does not crash', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => { getRouter().navigate('/a') })

        // Navigate way beyond stack bounds — should be silently ignored
        await act(async () => { getRouter().navigate(-100) })
        await act(async () => { getRouter().navigate(100) })

        // No crashes, no history API calls = passes
        expect(pushStateSpy).not.toHaveBeenCalled()
    })

    it('navigate(0) (delta zero) is a no-op', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a', { state: 'initial' })
        })
        await act(async () => {
            getRouter().navigate(0)
        })

        // navigate(0) returns early (no-op), no side effects
        expect(pushStateSpy).not.toHaveBeenCalled()
    })

    // ── no event listeners ────────────────────────────────────────────────

    it('does not register popstate listener in memory mode', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const { Page } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        const popstateCalls = addEventListenerSpy.mock.calls.filter(([event]) => event === 'popstate')
        expect(popstateCalls).toHaveLength(0)
    })

    it('does not register hashchange listener in memory mode', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const { Page } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        const hashchangeCalls = addEventListenerSpy.mock.calls.filter(([event]) => event === 'hashchange')
        expect(hashchangeCalls).toHaveLength(0)
    })

    it('ignores private browser snapshot synchronization in memory mode', () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)}/>)

        expect(getRouter().updateClonedLocation?.()).toBe(false)
        expect(getRouter().pathname).toBe('/')
    })

    // ── replace behavior ──────────────────────────────────────────────────

    it('navigate with replace: true does not call history.replaceState', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => { getRouter().navigate('/a') })
        await act(async () => { getRouter().navigate('/b', { replace: true }) })

        expect(replaceStateSpy).not.toHaveBeenCalled()
    })

    it('replace updates state correctly', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a', { state: 'first' })
        })

        await waitFor(() => {
            expect(getRouter().state).toBe('first')
        })

        await act(async () => {
            getRouter().navigate('/b', { state: 'replaced', replace: true })
        })

        await waitFor(() => {
            expect(getRouter().state).toBe('replaced')
        })
    })

    it('replace changes only the current entry and preserves earlier entries', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="memory" entry={makeEntry(Page)}/>)

        await act(async () => getRouter().navigate('/first'))
        await act(async () => getRouter().replace('/second'))
        await act(async () => getRouter().back())

        expect(getRouter().pathname).toBe('/')
    })
})
