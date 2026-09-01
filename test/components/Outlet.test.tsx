import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React, { createElement as h } from 'react'
import { Outlet, RouteStack, RouteLayoutStackIndex } from '../../src'
import type { RouteItem } from '../../index'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Renders Outlet with a given route stack and layout-stack index.
 */
function renderOutlet(stack: RouteItem[], index: number) {
    return render(
        h(RouteStack.Provider, { value: stack },
            h(RouteLayoutStackIndex.Provider, { value: index },
                h(Outlet),
            ),
        ),
    )
}

// ── Route fixtures ───────────────────────────────────────────────────────────

const layoutAndPage: RouteItem = {
    layout: h('div', { 'data-testid': 'layout-root' }, 'Root Layout'),
    page: h('div', { 'data-testid': 'page-root' }, 'Root Page'),
}

const layoutOnly: RouteItem = {
    layout: h('div', { 'data-testid': 'layout-only' }, 'Layout Only'),
}

const pageOnly: RouteItem = {
    page: h('div', { 'data-testid': 'page-only' }, 'Page Only'),
}

const nestedRoutes: RouteItem[] = [
    {
        layout: h('div', { 'data-testid': 'layout-0' }, 'Layout 0'),
        page: h('div', { 'data-testid': 'page-0' }, 'Page 0'),
    },
    {
        layout: h('div', { 'data-testid': 'layout-1' }, 'Layout 1'),
        page: h('div', { 'data-testid': 'page-1' }, 'Page 1'),
    },
    {
        page: h('div', { 'data-testid': 'page-2' }, 'Page 2'),
    },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Outlet', () => {
    afterEach(() => {
        cleanup()
        vi.restoreAllMocks()
    })

    it('should render layout when index=0 for route with layout and page', () => {
        renderOutlet([layoutAndPage], 0)

        expect(screen.getByTestId('layout-root')).toBeInTheDocument()
        // At index 0, only layout should render; page at higher index
        expect(screen.queryByTestId('page-root')).not.toBeInTheDocument()
    })

    it('should render page when index=1 for route with layout and page', () => {
        renderOutlet([layoutAndPage], 1)

        // At index 1, the page should be rendered (wrapped with index+1 context)
        expect(screen.getByTestId('page-root')).toBeInTheDocument()
        expect(screen.queryByTestId('layout-root')).not.toBeInTheDocument()
    })

    it('should render layout for route with only layout (no page)', () => {
        renderOutlet([layoutOnly], 0)

        expect(screen.getByTestId('layout-only')).toBeInTheDocument()
    })

    it('should render page for route with only page (no layout)', () => {
        renderOutlet([pageOnly], 0)

        expect(screen.getByTestId('page-only')).toBeInTheDocument()
    })

    it('should cascade layouts correctly in deep nesting', () => {
        // Stack: [route0(layout+page), route1(layout+page), route2(page-only)]
        // Index 0 → renders layout-0
        // Index 1 → renders layout-1
        // Index 2 → renders page-2
        renderOutlet(nestedRoutes, 0)
        expect(screen.getByTestId('layout-0')).toBeInTheDocument()
        expect(screen.queryByTestId('layout-1')).not.toBeInTheDocument()
        expect(screen.queryByTestId('page-2')).not.toBeInTheDocument()

        cleanup()

        renderOutlet(nestedRoutes, 1)
        expect(screen.getByTestId('layout-1')).toBeInTheDocument()
        expect(screen.queryByTestId('layout-0')).not.toBeInTheDocument()

        cleanup()

        renderOutlet(nestedRoutes, 2)
        expect(screen.getByTestId('page-2')).toBeInTheDocument()
        expect(screen.queryByTestId('layout-0')).not.toBeInTheDocument()
        expect(screen.queryByTestId('layout-1')).not.toBeInTheDocument()
    })

    it('should render nothing when the outlet index is beyond the layout stack', () => {
        const {container} = renderOutlet([pageOnly], 2)

        expect(container).toBeEmptyDOMElement()
    })

    it('should render nothing for an empty route stack', () => {
        const {container} = renderOutlet([], 0)

        expect(container).toBeEmptyDOMElement()
    })
})
