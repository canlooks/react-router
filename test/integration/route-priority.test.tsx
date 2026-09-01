import {cleanup, render, screen} from '@testing-library/react'
import React from 'react'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {Router} from '../../src'
import type {RouteItem} from '../../index'

function permutations<T>(values: T[]): T[][] {
    if (values.length <= 1) {
        return [values]
    }
    return values.flatMap((value, index) => permutations([
        ...values.slice(0, index),
        ...values.slice(index + 1),
    ]).map(rest => [value, ...rest]))
}

describe('deterministic route priority', () => {
    beforeEach(() => history.replaceState(null, '', '/'))
    afterEach(() => cleanup())

    it.each(permutations(['static', 'param', 'star', 'catchAll']).map(order => [order] as const))(
        'static route wins for sibling order %j',
        order => {
            const definitions: Record<string, [string, RouteItem]> = {
                static: ['settings', {page: <div data-testid="static">static</div>}],
                param: [':id', {page: <div data-testid="param">param</div>}],
                star: ['*', {page: <div data-testid="star">star</div>}],
                catchAll: ['**', {page: <div data-testid="catch-all">catch-all</div>}],
            }
            const children = Object.fromEntries(order.map(name => definitions[name]))
            history.replaceState(null, '', '/settings')

            render(<Router entry={{children}}/>)

            expect(screen.getByTestId('static')).toBeInTheDocument()
            expect(screen.queryByTestId('param')).not.toBeInTheDocument()
        },
    )

    it.each(permutations(['param', 'star', 'catchAll']).map(order => [order] as const))(
        'named param wins over wildcards for sibling order %j',
        order => {
            const definitions: Record<string, [string, RouteItem]> = {
                param: [':id', {page: <div data-testid="param">param</div>}],
                star: ['*', {page: <div data-testid="star">star</div>}],
                catchAll: ['**', {page: <div data-testid="catch-all">catch-all</div>}],
            }
            const children = Object.fromEntries(order.map(name => definitions[name]))
            history.replaceState(null, '', '/value')

            render(<Router entry={{children}}/>)

            expect(screen.getByTestId('param')).toBeInTheDocument()
        },
    )

    it('a static child below a dynamic parent beats a dynamic sibling', () => {
        history.replaceState(null, '', '/account/settings')
        const entry: RouteItem = {
            children: {
                ':section': {
                    children: {
                        ':id': {page: <div data-testid="dynamic-child">dynamic</div>},
                        settings: {page: <div data-testid="static-child">static</div>},
                    },
                },
            },
        }

        render(<Router entry={entry}/>)

        expect(screen.getByTestId('static-child')).toBeInTheDocument()
        expect(screen.queryByTestId('dynamic-child')).not.toBeInTheDocument()
    })

    it('a catch-all with a static suffix beats a shorter bare catch-all', () => {
        history.replaceState(null, '', '/files/archive/final')
        const entry: RouteItem = {
            children: {
                files: {
                    children: {
                        '**': {
                            page: <div data-testid="bare-catch-all">bare</div>,
                            children: {
                                final: {
                                    page: <div data-testid="suffix-catch-all">suffix</div>
                                }
                            }
                        }
                    }
                }
            }
        }

        render(<Router entry={entry}/>)

        expect(screen.getByTestId('suffix-catch-all')).toBeInTheDocument()
        expect(screen.queryByTestId('bare-catch-all')).not.toBeInTheDocument()
    })

    it.each(['v1.0', 'v1[0]', '中文'])(
        'matches the static route segment "%s" literally after URL encoding',
        segment => {
            history.replaceState(null, '', '/' + encodeURIComponent(segment))

            render(<Router entry={{
                children: {
                    [segment]: {page: <div data-testid="literal-route">literal</div>},
                    ':value': {page: <div data-testid="dynamic-route">dynamic</div>},
                },
            }}/>)

            expect(screen.getByTestId('literal-route')).toBeInTheDocument()
            expect(screen.queryByTestId('dynamic-route')).not.toBeInTheDocument()
        },
    )

    it('uses declaration order for duplicate literal paths created by groups', () => {
        render(<Router entry={{
            children: {
                '#first': {page: <div data-testid="first-group">first</div>},
                '#second': {page: <div data-testid="second-group">second</div>},
            },
        }}/>)

        expect(screen.getByTestId('first-group')).toBeInTheDocument()
        expect(screen.queryByTestId('second-group')).not.toBeInTheDocument()
    })
})
