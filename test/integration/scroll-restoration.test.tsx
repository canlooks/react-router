import {act, cleanup, render} from '@testing-library/react'
import React from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {Router, useRouter} from '../../src'
import type {Mode, RouteItem} from '../../index'

function createCapture() {
    let router: ReturnType<typeof useRouter> | null = null
    function Page() {
        router = useRouter()
        return <div>page</div>
    }
    const entry: RouteItem = {children: {'**': {page: <Page/>}}}
    return {entry, getRouter: () => router!}
}

describe('scroll restoration navigation option', () => {
    beforeEach(() => {
        history.replaceState(null, '', '/')
        vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    })

    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
        history.replaceState(null, '', '/')
    })

    it.each<Mode>(['history', 'hash', 'memory'])(
        'resets scroll after a %s navigation when scrollRestore is false',
        async mode => {
            const {entry, getRouter} = createCapture()
            render(<Router mode={mode} entry={entry}/>)

            await act(async () => getRouter().navigate('/next', {scrollRestore: false}))

            expect(window.scrollTo).toHaveBeenCalledWith({
                left: 0,
                top: 0,
                behavior: 'auto',
            })
        },
    )

    it('preserves scroll by default and leaves history.scrollRestoration untouched', async () => {
        history.scrollRestoration = 'manual'
        const {entry, getRouter} = createCapture()
        render(<Router mode="history" entry={entry}/>)

        await act(async () => getRouter().navigate('/next'))

        expect(window.scrollTo).not.toHaveBeenCalled()
        expect(history.scrollRestoration).toBe('manual')
    })
})
