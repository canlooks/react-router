import {render, act, waitFor} from '@testing-library/react'
import React, {JSX} from 'react'
import {Router, useRouter} from '../../src'
import type {RouteItem} from '../../index'
import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'


// ── Helpers ──────────────────────────────────────────────────────────────────

/** Captures router context synchronously during render. */
function createCapture() {
    let captured: ReturnType<typeof useRouter> | null = null
    const Page = () => {
        captured = useRouter()
        return <div data-testid="tester">test</div>
    }
    return {Page, getRouter: () => captured!}
}

/** Entry with catch-all "**" so the page renders for ANY pathname. */
function makeEntry(Page: () => JSX.Element): RouteItem {
    return {
        children: {
            '**': {page: <Page/>}
        }
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('History Mode', () => {
    beforeEach(() => {
        history.replaceState(null, '', '/')
        vi.spyOn(history, 'pushState').mockImplementation(() => {
        })
        vi.spyOn(history, 'replaceState').mockImplementation(() => {
        })
        vi.spyOn(history, 'back').mockImplementation(() => {
        })
        vi.spyOn(history, 'forward').mockImplementation(() => {
        })
        vi.spyOn(window, 'scrollTo').mockImplementation(() => {
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // ── navigation calls ──────────────────────────────────────────────────

    it('navigate("/a") calls history.pushState with state, "", and the resolved URL', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().navigate('/a')
        })

        expect(history.pushState).toHaveBeenCalledWith(null, '', '/a')
    })

    it('navigate("/a", { state: "foo" }) passes state to pushState', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().navigate('/a', {state: 'foo'})
        })

        expect(history.pushState).toHaveBeenCalledWith('foo', '', '/a')
    })

    it('navigate("/a", { replace: true }) calls history.replaceState', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().navigate('/a', {replace: true})
        })

        expect(history.replaceState).toHaveBeenCalledWith(null, '', '/a')
        expect(history.pushState).not.toHaveBeenCalled()
    })

    it('navigate with scrollRestore: false resets scroll after the route commit', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().navigate('/a', {scrollRestore: false})
        })

        expect(window.scrollTo).toHaveBeenCalledWith({left: 0, top: 0, behavior: 'auto'})
    })

    it('navigate with scrollRestore: true preserves scroll and does not mutate browser restoration', async () => {
        history.scrollRestoration = 'manual'
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().navigate('/a', {scrollRestore: true})
        })

        expect(window.scrollTo).not.toHaveBeenCalled()
        expect(history.scrollRestoration).toBe('manual')
    })

    // ── setState ──────────────────────────────────────────────────────────

    it('setState(data) calls history.replaceState with data and ""', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().setState({key: 'value'})
        })

        expect(history.replaceState).toHaveBeenCalledWith({key: 'value'}, '')
    })

    it('keeps the deprecated browser synchronization shim as a successful publication', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        let published: boolean | undefined
        await act(async () => {
            published = getRouter().updateClonedLocation?.()
        })

        expect(published).toBe(true)
    })

    it('initializes router state from the current history entry', () => {
        vi.mocked(history.replaceState).mockRestore()
        history.replaceState({entry: 'initial'}, '', '/')
        const {Page, getRouter} = createCapture()

        render(<Router mode="history" entry={makeEntry(Page)}/>)

        expect(getRouter().state).toEqual({entry: 'initial'})
    })

    it('supports functional setState without writing the updater function', async () => {
        vi.mocked(history.replaceState).mockRestore()
        history.replaceState({count: 1}, '', '/')
        const replaceState = vi.spyOn(history, 'replaceState')
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().setState((previous: {count: number}) => ({count: previous.count + 1}))
        })

        expect(replaceState).toHaveBeenLastCalledWith({count: 2}, '')
        expect(history.state).toEqual({count: 2})
        expect(getRouter().state).toEqual({count: 2})
    })

    it('composes consecutive functional setState calls before React rerenders', async () => {
        vi.mocked(history.replaceState).mockRestore()
        history.replaceState({count: 1}, '', '/')
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().setState((previous: {count: number}) => ({count: previous.count + 1}))
            getRouter().setState((previous: {count: number}) => ({count: previous.count + 1}))
        })

        expect(history.state).toEqual({count: 3})
        expect(getRouter().state).toEqual({count: 3})
    })

    it('restores state from popstate event entries', async () => {
        vi.mocked(history.pushState).mockRestore()
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            history.pushState({entry: 'first'}, '', '/first')
            window.dispatchEvent(new PopStateEvent('popstate', {state: {entry: 'first'}}))
        })

        await waitFor(() => {
            expect(getRouter().pathname).toBe('/first')
            expect(getRouter().state).toEqual({entry: 'first'})
        })
    })

    it('leaves React state unchanged when history rejects an uncloneable value', () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)
        vi.mocked(history.replaceState).mockImplementation(() => {
            throw new DOMException('not cloneable', 'DataCloneError')
        })

        expect(() => getRouter().setState(() => 'next')).toThrowError(DOMException)
        expect(getRouter().state).toBeNull()
    })

    // ── back & forward ────────────────────────────────────────────────────

    it('back() calls history.back()', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().back()
        })

        expect(history.back).toHaveBeenCalled()
    })

    it('forward() calls history.forward()', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().forward()
        })

        expect(history.forward).toHaveBeenCalled()
    })

    // ── popstate listener ─────────────────────────────────────────────────

    it('popstate event listener is registered on mount', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const {Page} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function))
    })

    it('popstate listener is removed on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
        const {Page} = createCapture()
        const {unmount} = render(<Router mode="history" entry={makeEntry(Page)}/>)

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function))
    })

    it('popstate event triggers location change detection', async () => {
        // Restore pushState mock so we can actually change the URL
        vi.mocked(history.pushState).mockRestore()
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

        const {Page, getRouter} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function))

        // Change URL via real pushState and dispatch popstate
        await act(async () => {
            history.pushState({}, '', '/new-path')
            window.dispatchEvent(new PopStateEvent('popstate'))
        })

        // After popstate handler runs + React re-renders, pathname should reflect new URL
        await waitFor(() => {
            expect(getRouter().pathname).toBe('/new-path')
        })
    })

    // ── no hashchange in history mode ─────────────────────────────────────

    it('does not register hashchange listener in history mode', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const {Page} = createCapture()
        render(<Router mode="history" entry={makeEntry(Page)}/>)

        const hashCalls = addEventListenerSpy.mock.calls.filter(([event]) => event === 'hashchange')
        expect(hashCalls).toHaveLength(0)
    })
})
