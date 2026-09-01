import React from 'react'
import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
    Router,
    useCurrentRoute,
    useNavigate,
    useRouteLayoutStack,
    useRouteLayoutStackIndex,
    useRouteStack,
    useRouter,
} from '../../src'
import type {RouteItem} from '../../index'

type BrowserMode = 'history' | 'hash'

function replaceBrowserLocation(mode: BrowserMode, pathname: string, state: unknown = null) {
    history.replaceState(state, '', mode === 'hash' ? `/#${pathname}` : pathname)
}

function stateSource(state: unknown) {
    return state && typeof state === 'object' && 'source' in state
        ? String((state as {source: unknown}).source)
        : 'none'
}

function createChildRoutes(): RouteItem {
    function ChildPage({name}: {name: 'a' | 'b'}) {
        const navigate = useNavigate()
        const {pathname, state} = useRouter()
        return (
            <div data-testid={`child-${name}`}>
                <span data-testid="child-pathname">{pathname}</span>
                <span data-testid="child-state">{stateSource(state)}</span>
                {name === 'a' && (
                    <button onClick={() => navigate('/b', {state: {source: 'child'}})}>
                        Open child B
                    </button>
                )}
            </div>
        )
    }

    return {
        children: {
            a: {page: <ChildPage name="a"/>},
            b: {page: <ChildPage name="b"/>},
        },
    }
}

function ParentPage({mode}: {mode: BrowserMode}) {
    const {pathname, state} = useRouter()
    const navigate = useNavigate()
    return (
        <div data-testid="parent-page">
            <span data-testid="parent-pathname">{pathname}</span>
            <span data-testid="parent-state">{stateSource(state)}</span>
            <button onClick={() => navigate('/shell/b', {state: {source: 'parent'}})}>
                Open child B from parent
            </button>
            <button onClick={() => navigate('/shell/b', {replace: true, state: {source: 'replace'}})}>
                Replace child B from parent
            </button>
            <Router mode={mode} base="/shell" entry={createChildRoutes()}/>
        </div>
    )
}

function createParentRoutes(mode: BrowserMode): RouteItem {
    return {
        children: {
            '**': {page: <ParentPage mode={mode}/>},
        },
    }
}

function renderNestedRouter(mode: BrowserMode) {
    replaceBrowserLocation(mode, '/shell/a')
    return render(<Router mode={mode} entry={createParentRoutes(mode)}/>)
}

function createSiblingRoutes(id: string, showButton: boolean): RouteItem {
    function Page({name}: {name: 'a' | 'b'}) {
        const {pathname, state} = useRouter()
        const navigate = useNavigate()
        return (
            <section data-testid={`${id}-panel`}>
                <span data-testid={`${id}-pathname`}>{pathname}</span>
                <span data-testid={`${id}-state`}>{stateSource(state)}</span>
                {showButton && name === 'a' && (
                    <button onClick={() => navigate('/b', {state: {source: id}})}>
                        Navigate first router
                    </button>
                )}
            </section>
        )
    }

    return {
        children: {
            a: {page: <Page name="a"/>},
            b: {page: <Page name="b"/>},
        },
    }
}

describe('browser Router synchronization', () => {
    afterEach(() => {
        cleanup()
        history.replaceState(null, '', '/')
        vi.restoreAllMocks()
    })

    describe.each<BrowserMode>(['history', 'hash'])('%s mode', mode => {
        it('should render a child router relative to its own base', () => {
            renderNestedRouter(mode)

            expect(screen.getByTestId('child-a')).toBeInTheDocument()
            expect(screen.getByTestId('child-pathname')).toHaveTextContent('/a')
            expect(screen.getByTestId('parent-pathname')).toHaveTextContent('/shell/a')
        })

        it('should synchronize child navigation, location state, and the parent router', async () => {
            renderNestedRouter(mode)

            act(() => fireEvent.click(screen.getByRole('button', {name: 'Open child B'})))

            await waitFor(() => {
                expect(screen.getByTestId('child-b')).toBeInTheDocument()
                expect(screen.getByTestId('child-pathname')).toHaveTextContent('/b')
                expect(screen.getByTestId('parent-pathname')).toHaveTextContent('/shell/b')
                expect(screen.getByTestId('child-state')).toHaveTextContent('child')
                expect(screen.getByTestId('parent-state')).toHaveTextContent('child')
            })
        })

        it('should synchronize parent navigation and replacement into the child router', async () => {
            const replaceState = vi.spyOn(history, 'replaceState')
            renderNestedRouter(mode)

            act(() => fireEvent.click(screen.getByRole('button', {name: 'Open child B from parent'})))

            await waitFor(() => {
                expect(screen.getByTestId('child-b')).toBeInTheDocument()
                expect(screen.getByTestId('child-state')).toHaveTextContent('parent')
                expect(screen.getByTestId('parent-state')).toHaveTextContent('parent')
            })

            act(() => fireEvent.click(screen.getByRole('button', {name: 'Replace child B from parent'})))

            await waitFor(() => {
                expect(screen.getByTestId('child-state')).toHaveTextContent('replace')
                expect(screen.getByTestId('parent-state')).toHaveTextContent('replace')
            })
            expect(replaceState).toHaveBeenCalled()
        })

        it('should synchronize browser traversal into both nested routers', async () => {
            renderNestedRouter(mode)
            const state = {source: 'traversal'}
            const href = mode === 'hash' ? '/#/shell/b' : '/shell/b'

            act(() => {
                history.pushState(state, '', href)
                window.dispatchEvent(new PopStateEvent('popstate', {state}))
            })

            await waitFor(() => {
                expect(screen.getByTestId('child-b')).toBeInTheDocument()
                expect(screen.getByTestId('child-state')).toHaveTextContent('traversal')
                expect(screen.getByTestId('parent-state')).toHaveTextContent('traversal')
            })
        })
    })

    it('should synchronize sibling browser routers without an explicit parent callback', async () => {
        history.replaceState(null, '', '/a')
        render(
            <>
                <Router mode="history" entry={createSiblingRoutes('first', true)}/>
                <Router mode="history" entry={createSiblingRoutes('second', false)}/>
            </>,
        )

        act(() => fireEvent.click(screen.getByRole('button', {name: 'Navigate first router'})))

        await waitFor(() => {
            expect(screen.getByTestId('first-pathname')).toHaveTextContent('/b')
            expect(screen.getByTestId('second-pathname')).toHaveTextContent('/b')
            expect(screen.getByTestId('first-state')).toHaveTextContent('first')
            expect(screen.getByTestId('second-state')).toHaveTextContent('first')
        })
    })

    it('should keep memory routers isolated from browser router publications', async () => {
        history.replaceState(null, '', '/a')
        render(
            <>
                <Router mode="history" entry={createSiblingRoutes('browser', true)}/>
                <Router mode="memory" entry={{page: <MemoryProbe/>}}/>
            </>,
        )

        act(() => fireEvent.click(screen.getByRole('button', {name: 'Navigate first router'})))

        await waitFor(() => expect(screen.getByTestId('browser-pathname')).toHaveTextContent('/b'))
        expect(screen.getByTestId('memory-pathname')).toHaveTextContent('/')
        expect(screen.getByTestId('memory-state')).toHaveTextContent('none')
    })
})

function MemoryProbe() {
    const {pathname, state} = useRouter()
    return (
        <div>
            <span data-testid="memory-pathname">{pathname}</span>
            <span data-testid="memory-state">{stateSource(state)}</span>
        </div>
    )
}

function NestedNotFoundProbe() {
    const routeStack = useRouteStack()
    const layoutStack = useRouteLayoutStack()
    const layoutIndex = useRouteLayoutStackIndex()
    const currentRoute = useCurrentRoute()
    const {base, pathname} = useRouter()
    return (
        <div data-testid="nested-not-found">
            <span data-testid="nested-not-found-routes">{routeStack.length}</span>
            <span data-testid="nested-not-found-layouts">{layoutStack.length}</span>
            <span data-testid="nested-not-found-index">{layoutIndex}</span>
            <span data-testid="nested-not-found-current">{currentRoute ? 'set' : 'unset'}</span>
            <span data-testid="nested-not-found-base">{base}</span>
            <span data-testid="nested-not-found-pathname">{pathname ?? 'null'}</span>
        </div>
    )
}

describe('nested Router notFound context', () => {
    afterEach(() => {
        cleanup()
        history.replaceState(null, '', '/')
    })

    it('should expose the child router context with an empty route stack', () => {
        history.replaceState(null, '', '/outside')
        const ParentWithUnmatchedChild = () => (
            <Router
                mode="history"
                base="/shell"
                entry={{page: <div>inside</div>}}
                notFound={<NestedNotFoundProbe/>}
            />
        )

        render(<Router entry={{children: {'**': {page: <ParentWithUnmatchedChild/>}}}}/>)

        expect(screen.getByTestId('nested-not-found-routes')).toHaveTextContent('0')
        expect(screen.getByTestId('nested-not-found-layouts')).toHaveTextContent('0')
        expect(screen.getByTestId('nested-not-found-index')).toHaveTextContent('0')
        expect(screen.getByTestId('nested-not-found-current')).toHaveTextContent('unset')
        expect(screen.getByTestId('nested-not-found-base')).toHaveTextContent('/shell')
        expect(screen.getByTestId('nested-not-found-pathname')).toHaveTextContent('null')
    })
})
