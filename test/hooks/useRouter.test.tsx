import { render } from '@testing-library/react'
import React from 'react'
import { Router, useRouter } from '../../src'

describe('useRouter', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/')
    })

    function createContextReporter() {
        let captured: ReturnType<typeof useRouter> | null = null
        const Reporter = () => {
            captured = useRouter()
            return <div data-testid="page">Page</div>
        }
        return { Reporter, getContext: () => captured }
    }

    it('returns context with all expected keys', () => {
        const { Reporter, getContext } = createContextReporter()
        render(<Router entry={{ page: <Reporter /> }} />)

        const ctx = getContext()
        expect(ctx).not.toBeNull()
        expect(ctx).toHaveProperty('mode')
        expect(ctx).toHaveProperty('base')
        expect(ctx).toHaveProperty('location')
        expect(ctx).toHaveProperty('pathname')
        expect(ctx).toHaveProperty('params')
        expect(ctx).toHaveProperty('navigate')
        expect(ctx).toHaveProperty('replace')
        expect(ctx).toHaveProperty('back')
        expect(ctx).toHaveProperty('forward')
        expect(ctx).toHaveProperty('state')
        expect(ctx).toHaveProperty('setState')
    })

    it('mode defaults to "history"', () => {
        const { Reporter, getContext } = createContextReporter()
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(getContext()?.mode).toBe('history')
    })

    it('base defaults to "/" when not specified', () => {
        const { Reporter, getContext } = createContextReporter()
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(getContext()?.base).toBe('/')
    })

    it('base is a string starting with "/"', () => {
        const { Reporter, getContext } = createContextReporter()
        render(<Router entry={{ page: <Reporter /> }} />)
        const base = getContext()?.base
        expect(typeof base).toBe('string')
        expect(base!.startsWith('/')).toBe(true)
    })

    it('pathname reflects current URL path', () => {
        const { Reporter, getContext } = createContextReporter()
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(getContext()?.pathname).toBe('/')
    })

    it('navigate function is callable and does not throw', () => {
        const { Reporter, getContext } = createContextReporter()
        render(<Router entry={{ page: <Reporter /> }} />)

        const ctx = getContext()
        expect(typeof ctx?.navigate).toBe('function')
        expect(() => ctx?.navigate('/test')).not.toThrow()
    })

    it('back() does not throw', () => {
        const { Reporter, getContext } = createContextReporter()
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(() => getContext()?.back()).not.toThrow()
    })

    it('forward() does not throw', () => {
        const { Reporter, getContext } = createContextReporter()
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(() => getContext()?.forward()).not.toThrow()
    })

    it('state defaults to null', () => {
        const { Reporter, getContext } = createContextReporter()
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(getContext()?.state).toBeNull()
    })

    it('setState is a function', () => {
        const { Reporter, getContext } = createContextReporter()
        render(<Router entry={{ page: <Reporter /> }} />)
        expect(typeof getContext()?.setState).toBe('function')
    })
})
