import {render, screen} from '@testing-library/react'
import {createRef, type ComponentPropsWithRef} from 'react'
import {describe, expect, it, vi} from 'vitest'
import {Link, Navigate, Redirect, Router, RouterContext} from '../../src'
import {clickLink, renderInContext} from '../helpers/context'

// Consumers compile against index.d.ts, including its polymorphic Link signature.
const ConsumerLink = Link as typeof import('../../index').Link

describe('C-LINK presentation and navigation intent', () => {
    it('C-LINK-01 renders href, content, accessible attributes and forwards ref', () => {
        const ref = createRef<HTMLAnchorElement>()
        renderInContext(<Link to="/about" title="More" aria-label="About us" className="nav" ref={ref}>About</Link>, {base: '/app'})
        const link = screen.getByRole('link', {name: 'About us'})
        expect(link).toHaveAttribute('href', '/app/about')
        expect(link).toHaveAttribute('title', 'More')
        expect(link).toHaveClass('nav')
        expect(ref.current).toBe(link)
        expect(link).not.toHaveAttribute('to')
        expect(link).not.toHaveAttribute('scrollRestore')
    })
    it('C-LINK-02 ordinary click prevents browser navigation and forwards navigation options', () => {
        const onClick = vi.fn()
        const {context} = renderInContext(<Link to="/about" replace scrollRestore={false} state={{from: 'home'}} onClick={onClick}>About</Link>)
        expect(clickLink(screen.getByRole('link')).preventedByLink).toBe(true)
        expect(onClick).toHaveBeenCalledTimes(1)
        expect(context.navigate).toHaveBeenCalledExactlyOnceWith('/about', {replace: true, scrollRestore: false, state: {from: 'home'}})
    })
    it('C-LINK-03 Ctrl-click leaves default browser handling intact', () => {
        const {context} = renderInContext(<Link to="/about">About</Link>)
        expect(clickLink(screen.getByRole('link'), {ctrlKey: true}).preventedByLink).toBe(false)
        expect(context.navigate).not.toHaveBeenCalled()
    })
    it.each([-1, 0, 2])('C-LINK-04 delta=%i takes precedence over to and omits href', delta => {
        const {context} = renderInContext(<Link to="/about" delta={delta}>Move</Link>)
        const link = screen.getByText('Move')
        expect(link).not.toHaveAttribute('href')
        clickLink(link)
        expect(context.navigate).toHaveBeenCalledExactlyOnceWith(delta)
    })
    it('C-LINK-05 absent to calls user handler but does not navigate', () => {
        const handler = vi.fn()
        const {context} = renderInContext(<Link onClick={handler}>Empty</Link>)
        clickLink(screen.getByText('Empty'))
        expect(handler).toHaveBeenCalledTimes(1)
        expect(context.navigate).not.toHaveBeenCalled()
    })
    it('C-LINK-06 supports a button and a custom component', () => {
        function Custom(props: ComponentPropsWithRef<'a'>) { return <a {...props} data-custom="yes"/> }
        const {context} = renderInContext(<>
            <ConsumerLink component="button" type="button" to="/settings">Settings</ConsumerLink>
            <ConsumerLink component={Custom} to="/about">About</ConsumerLink>
        </>)
        clickLink(screen.getByRole('button', {name: 'Settings'}))
        expect(context.navigate).toHaveBeenCalledWith('/settings', expect.any(Object))
        expect(screen.getByRole('link', {name: 'About'})).toHaveAttribute('data-custom', 'yes')
    })
    it('C-LINK-07 performs a real Router transition from click to rendered destination', () => {
        render(<Router entry={{page: <Link to="/about">Go</Link>, children: {about: {page: <h1>About page</h1>}}}}/>)
        clickLink(screen.getByRole('link', {name: 'Go'}))
        expect(location.pathname).toBe('/about')
        expect(screen.getByRole('heading')).toHaveTextContent('About page')
    })
})

describe('C-NAVIGATE and C-REDIRECT effect navigation', () => {
    it('C-NAVIGATE-01 renders no DOM and forwards destination/options on mount', () => {
        const {container, context} = renderInContext(<Navigate to="/about" state={{from: 'home'}} scrollRestore={false}/>)
        expect(container).toBeEmptyDOMElement()
        expect(context.navigate).toHaveBeenCalledExactlyOnceWith('/about', {state: {from: 'home'}, scrollRestore: false})
    })
    it.each([-1, 0, 2])('C-NAVIGATE-02 delta=%i takes precedence', delta => {
        const {context} = renderInContext(<Navigate to="/about" delta={delta}/>)
        expect(context.navigate).toHaveBeenCalledExactlyOnceWith(delta)
    })
    it('C-NAVIGATE-03 no destination means no navigation', () => {
        const {context} = renderInContext(<Navigate/>)
        expect(context.navigate).not.toHaveBeenCalled()
    })
    it('C-NAVIGATE-04 changed destination navigates on the next render', () => {
        const {context, rerender} = renderInContext(<Navigate to="/one"/>)
        rerender(<RouterContext value={context}><Navigate to="/two"/></RouterContext>)
        expect(context.navigate).toHaveBeenLastCalledWith('/two', {})
        expect(context.navigate).toHaveBeenCalledTimes(2)
    })
    it('C-REDIRECT-01 Redirect always supplies replace=true', () => {
        const {context} = renderInContext(<Redirect to="/login" state={{returnTo: '/'}}/>)
        expect(context.navigate).toHaveBeenCalledExactlyOnceWith('/login', {state: {returnTo: '/'}, replace: true})
    })
    it('C-REDIRECT-02 a route redirect replaces the current URL and renders its destination', () => {
        const length = history.length
        render(<Router entry={{page: <Redirect to="/login"/>, children: {login: {page: <h1>Login</h1>}}}}/>)
        expect(location.pathname).toBe('/login')
        expect(history.length).toBe(length)
        expect(screen.getByRole('heading')).toHaveTextContent('Login')
    })
})
