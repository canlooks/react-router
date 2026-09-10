// @vitest-environment node
import {renderToString} from 'react-dom/server'
import {expect, it} from 'vitest'
import type {RouterContext} from '../../index'
import {Router, useRouter} from '../../src'

it('D-03 documented non-browser memory mode can render without window/location/history', () => {
    expect(typeof window).toBe('undefined')
    expect(() => renderToString(<Router mode="memory" entry={{page: <h1>Server home</h1>}}/>)).not.toThrow()
})

it.each(['/', '/app'])('D-03 memory SSR renders its own root under base %s and exposes usable methods', base => {
    let context!: RouterContext
    function Page() { context = useRouter(); return <h1>Server home {context.pathname}</h1> }
    const html = renderToString(<Router mode="memory" base={base} entry={{page: <Page/>}}/>)
    expect(html).toContain('Server home')
    expect(context.pathname).toBe('/')
    expect(context.location.pathname).toBe(base === '/' ? '/' : base + '/')
    expect(typeof location).toBe('undefined')
    expect(typeof history).toBe('undefined')
    const restored: unknown[] = []
    const observe = (previous: unknown) => { restored.push(previous); return previous }
    expect(() => {
        context.navigate('https://external.test/one', {state: 1})
        context.navigate(new URL('https://elsewhere.test/two'), {state: 2})
        context.back()
        context.setState(observe)
        context.replace('/replacement', {state: 3})
        context.forward()
        context.setState(observe)
        context.navigate(-1)
        context.setState(observe)
        context.navigate(0)
        context.navigate(-99)
    }).not.toThrow()
    expect(restored).toEqual([1, 2, 3])
})
