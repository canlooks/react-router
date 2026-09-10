import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'
import type {RouteItem} from '../../index'
import {Outlet, Router, RouterContext, Routes, useParams} from '../../src'
import {mountRouter} from '../helpers/router'

function ParamsPage() {
    return <pre data-testid="params">{JSON.stringify(useParams())}</pre>
}

describe('C-ROUTES tree matching and not-found rendering', () => {
    it.each([
        ['/', 'Home'], ['/about', 'About'], ['/about/', 'About'], ['/about//', 'About'],
        ['/about?q=1#part', 'About'], ['/About', 'Missing'], ['/about/extra', 'Missing']
    ])('C-ROUTES-01 %s renders %s', (path, expected) => {
        history.replaceState(null, '', path)
        render(<Router entry={{page: 'Home', children: {about: {page: 'About'}}}} notFound="Missing"/>)
        expect(screen.getByText(expected)).toBeInTheDocument()
    })
    it('C-ROUTES-02 root page is replaced by the deepest matched child page', () => {
        history.replaceState(null, '', '/users/42/posts/7')
        render(<Router entry={{page: 'Home', children: {
            users: {page: 'Users', children: {':id': {page: 'User', children: {
                posts: {children: {':postId': {page: <ParamsPage/>}}}
            }}}}
        }}}/>)
        expect(screen.getByTestId('params')).toHaveTextContent('{"id":"42","postId":"7"}')
        expect(screen.queryByText('Home')).not.toBeInTheDocument()
        expect(screen.queryByText('Users')).not.toBeInTheDocument()
    })
    it.each([undefined, null, false])('C-ROUTES-03 page=%s is not a route endpoint', page => {
        render(<Router entry={{layout: <section>Shell<Outlet/></section>, page}} notFound="Missing"/>)
        expect(screen.getByText('Missing')).toBeInTheDocument()
        expect(screen.queryByText('Shell')).not.toBeInTheDocument()
    })
    it.each([0, ''])('C-ROUTES-04 page=%j is a valid matched endpoint', page => {
        const {container} = render(<Router entry={{layout: <main data-testid="shell"><Outlet/></main>, page}} notFound="Missing"/>)
        expect(screen.getByTestId('shell')).toHaveTextContent(String(page))
        expect(container).not.toHaveTextContent('Missing')
    })
    it('C-ROUTES-05 layout-only parents still wrap a matched descendant', () => {
        history.replaceState(null, '', '/section/leaf')
        render(<Router entry={{children: {section: {
            layout: <main data-testid="section"><Outlet/></main>, children: {leaf: {page: 'Leaf'}}
        }}}}/>)
        expect(screen.getByTestId('section')).toHaveTextContent('Leaf')
    })
    it('C-ROUTES-06 exact routes beat dynamic routes when declared first', () => {
        history.replaceState(null, '', '/new')
        render(<Router entry={{children: {new: {page: 'Create'}, ':id': {page: 'Dynamic'}}}}/>)
        expect(screen.getByText('Create')).toBeInTheDocument()
    })
    it.each([['/files', 'Catch-all'], ['/files/a/b', 'Catch-all'], ['/other', 'Missing']])(
        'C-ROUTES-07 wildcard fallback: %s -> %s', (path, expected) => {
            history.replaceState(null, '', path)
            render(<Router entry={{children: {files: {children: {'**': {page: 'Catch-all'}}}}}} notFound="Missing"/>)
            expect(screen.getByText(expected)).toBeInTheDocument()
        }
    )
    it('C-ROUTES-08 a group contributes layout but no URL segment', () => {
        history.replaceState(null, '', '/login')
        render(<Router entry={{children: {'#public': {
            layout: <section data-testid="public"><Outlet/></section>, children: {login: {page: 'Login'}}
        }}}}/>)
        expect(screen.getByTestId('public')).toHaveTextContent('Login')
    })
    it('C-ROUTES-09 nested groups can contain dynamic routes', () => {
        history.replaceState(null, '', '/team/42')
        render(<Router entry={{children: {'#one': {children: {'#two': {children: {
            team: {children: {':teamId': {page: <ParamsPage/>}}}
        }}}}}}}/>)
        expect(screen.getByTestId('params')).toHaveTextContent('{"teamId":"42"}')
    })
    it('C-ROUTES-10 unmatched routes render nothing when notFound is absent', () => {
        history.replaceState(null, '', '/missing')
        const {container} = render(<Router entry={{page: 'Home'}}/>)
        expect(container).toBeEmptyDOMElement()
    })
    it('C-ROUTES-11 replacing the entry tree rebuilds exact and dynamic maps', () => {
        history.replaceState(null, '', '/new')
        const {rerender} = render(<Router entry={{children: {':id': {page: 'Old dynamic'}}}}/>)
        expect(screen.getByText('Old dynamic')).toBeInTheDocument()
        rerender(<Router entry={{children: {new: {page: 'New exact'}}}}/>)
        expect(screen.getByText('New exact')).toBeInTheDocument()
        history.replaceState(null, '', '/unknown')
        // A remount avoids disguising changes to entry as browser navigation.
        rerender(<Router key="new" entry={{children: {new: {page: 'New exact'}}}} notFound="Missing"/>)
        expect(screen.getByText('Missing')).toBeInTheDocument()
    })
    it('C-ROUTES-12 duplicate group URLs use the first declared endpoint', () => {
        const entry: RouteItem = {children: {
            '#first': {children: {same: {page: 'First'}}},
            '#second': {children: {same: {page: 'Second'}}}
        }}
        history.replaceState(null, '', '/same')
        render(<Router entry={entry}/>)
        expect(screen.getByText('First')).toBeInTheDocument()
    })
    it('C-ROUTES-13 public Routes consumes an existing router context', () => {
        const harness = mountRouter()
        const context = harness.router
        harness.unmount()
        render(<RouterContext value={{...context, pathname: '/leaf', params: {}}}>
            <Routes entry={{children: {leaf: {page: 'Independent Routes'}}}}/>
        </RouterContext>)
        expect(screen.getByText('Independent Routes')).toBeInTheDocument()
    })
})
