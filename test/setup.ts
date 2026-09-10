import '@testing-library/jest-dom/vitest'
import {cleanup} from '@testing-library/react'
import {afterEach, beforeEach, vi} from 'vitest'

beforeEach(() => {
    if (typeof window !== 'undefined') {
        history.replaceState(null, '', '/')
        history.scrollRestoration = 'auto'
    }
})

afterEach(async () => {
    cleanup()
    // Let already queued jsdom hashchange events finish after listeners unmount.
    if (typeof window !== 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 0))
    }
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    if (typeof window !== 'undefined') history.replaceState(null, '', '/')
})
