import {fireEvent, render} from '@testing-library/react'
import type {ReactNode} from 'react'
import {vi} from 'vitest'
import type {RouterContext as Context} from '../../index'
import {cloneLocation, RouterContext} from '../../src'

export function renderInContext(content: ReactNode, overrides: Partial<Context> = {}) {
    const context: Context = {
        mode: 'history', base: '/', pathname: '/', location: cloneLocation(), params: {}, state: null,
        navigate: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), setState: vi.fn(),
        ...overrides
    }
    const view = render(<RouterContext value={context}>{content}</RouterContext>)
    return {...view, context}
}

/** Record Link's default handling, then stop jsdom from attempting a full-page navigation. */
export function clickLink(element: HTMLElement, options: MouseEventInit = {}) {
    let preventedByLink = false
    document.addEventListener('click', event => {
        preventedByLink = event.defaultPrevented
        event.preventDefault()
    }, {once: true})
    fireEvent.click(element, options)
    return {preventedByLink}
}
