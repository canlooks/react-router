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
function makeEntry(Page: () => JSX.Element): RouteItem {
    return {
        children: {
            '**': { page: <Page /> }
        }
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Hash Mode', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        // Reset hash after each test
        window.location.hash = ''
    })

    // ── initial state ─────────────────────────────────────────────────────

    it('initial hash empty → defaults to "/" in hash', () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        expect(getRouter().pathname).toBe('/')
        expect(getRouter().location.hash).toBe('')
    })

    it('initial hash value: when page loads with "#/users", pathname reflects "/users"', () => {
        window.location.hash = '#/users'

        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        expect(getRouter().pathname).toBe('/users')
    })

    // ── navigation changes hash ───────────────────────────────────────────

    it('navigate("/about") → hash becomes "#/about"', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/about')
        })

        expect(window.location.hash).toBe('#/about')
    })

    it('navigate("/about") updates pathname to "/about"', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/about')
            // Manually dispatch hashchange — jsdom may not fire it synchronously
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        // After hashchange handler + React re-render, pathname should update
        await waitFor(() => {
            expect(getRouter().pathname).toBe('/about')
        })
    })

    // ── navigate with replace ─────────────────────────────────────────────

    it('navigate("/about", { replace: true }) → stack replaced, hash updated', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/first')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        expect(window.location.hash).toBe('#/first')

        await act(async () => {
            getRouter().navigate('/about', { replace: true })
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        expect(window.location.hash).toBe('#/about')

        await waitFor(() => {
            expect(getRouter().pathname).toBe('/about')
        })
    })

    // ── back & forward ────────────────────────────────────────────────────

    it('back() → stack index decremented, hash set to previous stack entry', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/first')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await act(async () => {
            getRouter().navigate('/second')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        expect(window.location.hash).toBe('#/second')

        await act(async () => {
            getRouter().back()
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        await waitFor(() => {
            expect(window.location.hash).toBe('#/first')
            expect(getRouter().pathname).toBe('/first')
        })
    })

    it('forward() → stack index incremented, hash set to next stack entry', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/first')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await act(async () => {
            getRouter().navigate('/second')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        await act(async () => {
            getRouter().back()
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        await waitFor(() => { expect(window.location.hash).toBe('#/first') })

        await act(async () => {
            getRouter().forward()
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        await waitFor(() => {
            expect(window.location.hash).toBe('#/second')
            expect(getRouter().pathname).toBe('/second')
        })
    })

    // ── delta navigation ──────────────────────────────────────────────────

    it('navigate(-2) goes back two entries', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await act(async () => {
            getRouter().navigate('/b')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await act(async () => {
            getRouter().navigate('/c')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        expect(window.location.hash).toBe('#/c')

        await act(async () => {
            getRouter().navigate(-2)
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        await waitFor(() => {
            expect(window.location.hash).toBe('#/a')
        })
    })

    it('navigate(1) goes forward one entry after going back', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await act(async () => {
            getRouter().navigate('/b')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        await act(async () => {
            getRouter().navigate(-1)
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        await waitFor(() => { expect(window.location.hash).toBe('#/a') })

        await act(async () => {
            getRouter().navigate(1)
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        await waitFor(() => {
            expect(window.location.hash).toBe('#/b')
        })
    })

    it('delta beyond bounds is silently ignored (no hash change)', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await act(async () => {
            getRouter().navigate('/b')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        const hashBefore = window.location.hash

        await act(async () => {
            getRouter().navigate(-10)
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        // Hash should remain unchanged (out of bounds silently ignored)
        expect(window.location.hash).toBe(hashBefore)
    })

    it('navigate(0) is a no-op', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        const hashBefore = window.location.hash

        await act(async () => {
            getRouter().navigate(0)
        })

        expect(window.location.hash).toBe(hashBefore)
    })

    // ── hashchange listener ───────────────────────────────────────────────

    it('hashchange event listener registered on mount', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const { Page } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        expect(addEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function))
    })

    it('hashchange event listener removed on unmount', () => {
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
        const { Page } = createCapture()
        const { unmount } = render(<Router mode="hash" entry={makeEntry(Page)} />)

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function))
    })

    // ── no popstate in hash mode ──────────────────────────────────────────

    it('does not register popstate listener in hash mode', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
        const { Page } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        const popstateCalls = addEventListenerSpy.mock.calls.filter(([event]) => event === 'popstate')
        expect(popstateCalls).toHaveLength(0)
    })

    // ── stack behavior on sequential navigation ───────────────────────────

    it('sequential navigation builds stack (push adds entries)', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/first')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await act(async () => {
            getRouter().navigate('/second')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await act(async () => {
            getRouter().navigate('/third')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        // Going back should traverse all entries
        await act(async () => {
            getRouter().back()
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await waitFor(() => { expect(window.location.hash).toBe('#/second') })

        await act(async () => {
            getRouter().back()
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await waitFor(() => { expect(window.location.hash).toBe('#/first') })
    })

    it('replace clears all history and keeps only the new entry', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        // Build stack: /first → /second → /third
        await act(async () => {
            getRouter().navigate('/first')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await act(async () => {
            getRouter().navigate('/second')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })
        await act(async () => {
            getRouter().navigate('/third')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        // Replace at /third → clears all history, only /replaced remains
        await act(async () => {
            getRouter().navigate('/replaced', { replace: true })
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        expect(window.location.hash).toBe('#/replaced')

        // back() should be no-op (stack has only 1 entry, index 0)
        const hashBeforeBack = window.location.hash
        await act(async () => {
            getRouter().back()
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        // hash unchanged because targetIndex -1 is out of bounds
        expect(window.location.hash).toBe(hashBeforeBack)
    })

    it('replaces current entry when at top of stack', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/replaced', { replace: true })
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        expect(window.location.hash).toBe('#/replaced')
    })

    it('goes back to the beginning and cannot go beyond start', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        // Go back to initial position (stack entry '/', hash becomes '#/')
        await act(async () => {
            getRouter().back()
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        await waitFor(() => {
            // Initial hash '' maps to stack entry '/', so back() sets hash to '#/'
            expect(window.location.hash).toBe('#/')
            expect(getRouter().pathname).toBe('/')
        })

        // Try to go back beyond start — should be no-op
        const hashBefore = window.location.hash
        await act(async () => {
            getRouter().back()
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        expect(window.location.hash).toBe(hashBefore)
    })

    it('cannot go forward beyond the end of stack', async () => {
        const { Page, getRouter } = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)} />)

        await act(async () => {
            getRouter().navigate('/a')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        // Already at end of stack; forward should be no-op
        const hashBefore = window.location.hash
        await act(async () => {
            getRouter().forward()
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        expect(window.location.hash).toBe(hashBefore)
    })
})
