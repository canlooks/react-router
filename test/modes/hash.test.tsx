import {act, cleanup, render, screen, waitFor} from '@testing-library/react'
import React from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {Router, useRouter} from '../../src'
import type {RouteItem} from '../../index'

function createCapture() {
    let captured: ReturnType<typeof useRouter> | null = null
    const Page = () => {
        captured = useRouter()
        return <div data-testid="tester">test</div>
    }
    return {Page, getRouter: () => captured!}
}

function makeEntry(Page: () => React.JSX.Element): RouteItem {
    return {children: {'**': {page: <Page/>}}}
}

describe('Hash Mode', () => {
    beforeEach(() => {
        history.replaceState(null, '', '/')
    })

    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
        history.replaceState(null, '', '/')
    })

    it('treats an empty hash as the root route', () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)}/>)

        expect(getRouter().pathname).toBe('/')
        expect(getRouter().location.hash).toBe('')
    })

    it('reads the initial route from the hash', () => {
        history.replaceState(null, '', '/#/users?tab=all#list')
        const {Page, getRouter} = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)}/>)

        expect(getRouter().pathname).toBe('/users')
        expect(getRouter().location.search).toBe('?tab=all')
        expect(getRouter().location.hash).toBe('#list')
    })

    it('pushes a browser history entry and updates the route snapshot', async () => {
        const pushState = vi.spyOn(history, 'pushState')
        const {Page, getRouter} = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)}/>)

        await act(async () => getRouter().navigate('/about?from=home#title', {
            state: {entry: 'about'},
        }))

        expect(pushState).toHaveBeenCalledWith(
            {entry: 'about'},
            '',
            '#/about?from=home#title',
        )
        expect(location.hash).toBe('#/about?from=home#title')
        expect(getRouter().pathname).toBe('/about')
        expect(getRouter().state).toEqual({entry: 'about'})
    })

    it('replace changes the current browser entry without changing history length', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)}/>)
        await act(async () => getRouter().navigate('/first'))
        const lengthAfterPush = history.length
        const replaceState = vi.spyOn(history, 'replaceState')

        await act(async () => getRouter().replace('/second', {state: 'second'}))

        expect(replaceState).toHaveBeenLastCalledWith('second', '', '#/second')
        expect(history.length).toBe(lengthAfterPush)
        expect(location.hash).toBe('#/second')
        expect(getRouter().state).toBe('second')
    })

    it('applies base to the external hash and strips it for matching', async () => {
        history.replaceState(null, '', '/#/app/home')
        const {Page, getRouter} = createCapture()
        render(<Router mode="hash" base="/app" entry={makeEntry(Page)}/>)

        await act(async () => getRouter().navigate('/next'))

        expect(location.hash).toBe('#/app/next')
        expect(getRouter().pathname).toBe('/next')
    })

    it('back and forward delegate to native browser history', () => {
        const back = vi.spyOn(history, 'back').mockImplementation(() => undefined)
        const forward = vi.spyOn(history, 'forward').mockImplementation(() => undefined)
        const {Page, getRouter} = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)}/>)

        getRouter().back()
        getRouter().forward()

        expect(back).toHaveBeenCalledOnce()
        expect(forward).toHaveBeenCalledOnce()
    })

    it('delta navigation delegates to history.go and zero remains a no-op', () => {
        const go = vi.spyOn(history, 'go').mockImplementation(() => undefined)
        const {Page, getRouter} = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)}/>)

        getRouter().navigate(-2)
        getRouter().navigate(0)

        expect(go).toHaveBeenCalledTimes(1)
        expect(go).toHaveBeenCalledWith(-2)
    })

    it('synchronizes a manual hash change', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)}/>)

        await act(async () => {
            history.replaceState({manual: true}, '', '/#/manual')
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        await waitFor(() => {
            expect(getRouter().pathname).toBe('/manual')
            expect(getRouter().state).toEqual({manual: true})
        })
    })

    it('restores state supplied by popstate', async () => {
        const {Page, getRouter} = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)}/>)

        await act(async () => {
            history.replaceState({entry: 'first'}, '', '/#/first')
            window.dispatchEvent(new PopStateEvent('popstate', {state: {entry: 'first'}}))
        })

        await waitFor(() => {
            expect(getRouter().pathname).toBe('/first')
            expect(getRouter().state).toEqual({entry: 'first'})
        })
    })

    it('updates state on the current hash entry with functional setState', async () => {
        history.replaceState({count: 1}, '', '/#/counter')
        const {Page, getRouter} = createCapture()
        render(<Router mode="hash" entry={makeEntry(Page)}/>)

        await act(async () => {
            getRouter().setState((previous: {count: number}) => ({count: previous.count + 1}))
        })

        expect(history.state).toEqual({count: 2})
        expect(getRouter().state).toEqual({count: 2})
    })

    it('registers and removes popstate and hashchange listeners', () => {
        const add = vi.spyOn(window, 'addEventListener')
        const remove = vi.spyOn(window, 'removeEventListener')
        const {Page} = createCapture()
        const {unmount} = render(<Router mode="hash" entry={makeEntry(Page)}/>)

        expect(add).toHaveBeenCalledWith('popstate', expect.any(Function))
        expect(add).toHaveBeenCalledWith('hashchange', expect.any(Function))

        unmount()
        expect(remove).toHaveBeenCalledWith('popstate', expect.any(Function))
        expect(remove).toHaveBeenCalledWith('hashchange', expect.any(Function))
    })

    it('shares one popstate and one hashchange listener across multiple hash routers', () => {
        const add = vi.spyOn(window, 'addEventListener')
        const remove = vi.spyOn(window, 'removeEventListener')
        const first = createCapture()
        const second = createCapture()
        const {unmount} = render(
            <>
                <Router mode="hash" entry={makeEntry(first.Page)}/>
                <Router mode="hash" entry={makeEntry(second.Page)}/>
            </>,
        )

        expect(add.mock.calls.filter(([event]) => event === 'popstate')).toHaveLength(1)
        expect(add.mock.calls.filter(([event]) => event === 'hashchange')).toHaveLength(1)

        unmount()

        expect(remove.mock.calls.filter(([event]) => event === 'popstate')).toHaveLength(1)
        expect(remove.mock.calls.filter(([event]) => event === 'hashchange')).toHaveLength(1)
    })

    it('deduplicates popstate and hashchange notifications for the same snapshot', async () => {
        let renderCount = 0
        const Page = () => {
            renderCount += 1
            const {pathname} = useRouter()
            return <div data-testid="deduplicated-pathname">{pathname}</div>
        }
        render(<Router mode="hash" entry={makeEntry(Page)}/>)
        const initialRenderCount = renderCount

        await act(async () => {
            history.replaceState(null, '', '/#/same-snapshot')
            window.dispatchEvent(new PopStateEvent('popstate', {state: null}))
        })
        const countAfterPopState = renderCount

        await act(async () => {
            window.dispatchEvent(new PopStateEvent('popstate', {state: null}))
            window.dispatchEvent(new HashChangeEvent('hashchange'))
        })

        expect(countAfterPopState).toBeGreaterThan(initialRenderCount)
        expect(renderCount).toBe(countAfterPopState)
        expect(screen.getByTestId('deduplicated-pathname')).toHaveTextContent('/same-snapshot')
    })
})
