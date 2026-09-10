import {screen} from '@testing-library/react'
import type {ComponentPropsWithRef} from 'react'
import {describe, expect, it, vi} from 'vitest'
import {Link} from '../../src'
import {clickLink, renderInContext} from '../helpers/context'

describe('Known defects: native link semantics', () => {
    it.each([
        {name: 'Meta', options: {metaKey: true}},
        {name: 'Shift', options: {shiftKey: true}},
        {name: 'Alt', options: {altKey: true}}
    ])('D-20 $name modified click preserves browser handling', ({options}) => {
        const {context} = renderInContext(<Link to="/about">About</Link>)
        const event = clickLink(screen.getByRole('link'), options)
        expect(context.navigate).not.toHaveBeenCalled()
        expect(event.preventedByLink).toBe(false)
    })
    it('D-21 a user onClick handler can cancel router navigation', () => {
        const {context} = renderInContext(<Link to="/about" onClick={event => event.preventDefault()}>About</Link>)
        clickLink(screen.getByRole('link'))
        expect(context.navigate).not.toHaveBeenCalled()
    })
    it.each([
        {name: 'new tab', props: {target: '_blank'}},
        {name: 'download', props: {download: 'about.html'}}
    ])('D-22 $name links preserve native handling', ({props}) => {
        const {context} = renderInContext(<Link to="/about" {...props}>About</Link>)
        const event = clickLink(screen.getByRole('link'))
        expect(context.navigate).not.toHaveBeenCalled()
        expect(event.preventedByLink).toBe(false)
    })
    it.each([1, 2])('D-20 button=%i does not trigger router navigation', button => {
        const {context} = renderInContext(<Link to="/about">About</Link>)
        expect(clickLink(screen.getByRole('link'), {button}).preventedByLink).toBe(false)
        expect(context.navigate).not.toHaveBeenCalled()
    })
    it('D-21 cancellation happens before the delta branch and calls the user only once', () => {
        const handler = vi.fn((event: React.MouseEvent) => event.preventDefault())
        const {context} = renderInContext(<Link delta={-1} to="/about" onClick={handler}>Back</Link>)
        clickLink(screen.getByText('Back'))
        expect(handler).toHaveBeenCalledTimes(1)
        expect(context.navigate).not.toHaveBeenCalled()
    })
    it.each([{target: 'named-window'}, {download: ''}])('D-22 actual anchor attributes %j retain browser handling', props => {
        const {context} = renderInContext(<Link to="/about" {...props}>About</Link>)
        expect(clickLink(screen.getByRole('link')).preventedByLink).toBe(false)
        expect(context.navigate).not.toHaveBeenCalled()
    })
    it.each(['_self', '_SELF', ''])('D-22 target=%j retains ordinary activation including keyboard-generated clicks', target => {
        const {context} = renderInContext(<Link to="/about" target={target}>About</Link>)
        expect(clickLink(screen.getByRole('link'), {detail: 0}).preventedByLink).toBe(true)
        expect(context.navigate).toHaveBeenCalledTimes(1)
    })
    it('D-22 custom anchors are checked using their final DOM attributes', () => {
        const ConsumerLink = Link as typeof import('../../index').Link
        function Custom(props: ComponentPropsWithRef<'a'>) { return <a {...props} target="named-window"/> }
        function WithoutDownload({download: _download, ...props}: ComponentPropsWithRef<'a'>) { return <a {...props}/> }
        const {context} = renderInContext(<>
            <ConsumerLink component={Custom} to="/about">Custom target</ConsumerLink>
            <ConsumerLink component={WithoutDownload} download="" to="/about">No download</ConsumerLink>
        </>)
        expect(clickLink(screen.getByRole('link', {name: 'Custom target'})).preventedByLink).toBe(false)
        expect(context.navigate).not.toHaveBeenCalled()
        expect(clickLink(screen.getByRole('link', {name: 'No download'})).preventedByLink).toBe(true)
        expect(context.navigate).toHaveBeenCalledTimes(1)
    })
})
