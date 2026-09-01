import {memo, ReactNode, useMemo} from 'react'
import type {Params, RouteItem, RouterContext as IRouterContext} from '../index'
import {RouterContext, useRouter} from './router'
import {isUnset, matchPath, segmentRank} from './utils'
import {Outlet, RouteLayoutStackIndex, RouteStack} from './outlet'

type CompiledRoute = {
    path: string
    routeStack: RouteItem[]
    ranks: number[]
    order: number
}

type CompiledRoutes = {
    exact: Map<string, CompiledRoute>
    dynamic: CompiledRoute[]
}

type RouteMatch = {
    routeStack?: RouteItem[]
    params: Params
}

const EMPTY_ROUTE_STACK: RouteItem[] = []

function isDynamicSegment(segment: string) {
    return segmentRank(segment) < 4
}

function compareCompiledRoutes(a: CompiledRoute, b: CompiledRoute) {
    const sharedLength = Math.min(a.ranks.length, b.ranks.length)
    for (let index = 0; index < sharedLength; index++) {
        if (a.ranks[index] !== b.ranks[index]) {
            return b.ranks[index] - a.ranks[index]
        }
    }
    if (a.ranks.length !== b.ranks.length) {
        return b.ranks.length - a.ranks.length
    }
    return a.order - b.order
}

function compileRoutes(entry: RouteItem): CompiledRoutes {
    const exact = new Map<string, CompiledRoute>()
    const dynamic: CompiledRoute[] = []
    let order = 0

    const recurse = (
        route: RouteItem,
        paths: string[] = [],
        routeStack: RouteItem[] = [],
        parentIsDynamic = false
    ) => {
        const currentStack = [...routeStack, route]
        if (!isUnset(route.page)) {
            const path = '/' + paths.join('/')
            const compiled = {
                path,
                routeStack: currentStack,
                ranks: paths.map(segmentRank),
                order: order++
            }

            if (parentIsDynamic) {
                dynamic.push(compiled)
            } else if (!exact.has(path)) {
                exact.set(path, compiled)
            }
        }

        if (!route.children) {
            return
        }

        for (const path in route.children) {
            const child = route.children[path]
            const grouping = path.startsWith('#')
            const childIsDynamic = parentIsDynamic || (!grouping && isDynamicSegment(path))
            recurse(
                child,
                grouping ? paths : [...paths, path],
                currentStack,
                childIsDynamic
            )
        }
    }

    recurse(entry)
    dynamic.sort(compareCompiledRoutes)
    return {exact, dynamic}
}

function matchCompiledRoutes(
    pathname: string | null,
    compiledRoutes: CompiledRoutes
): RouteMatch {
    if (pathname === null) {
        return {params: {}}
    }

    const exact = compiledRoutes.exact.get(pathname)
    if (exact) {
        return {routeStack: exact.routeStack, params: {}}
    }

    for (const route of compiledRoutes.exact.values()) {
        const matched = matchPath(pathname, route.path)
        if (matched) {
            return {routeStack: route.routeStack, params: matched}
        }
    }

    for (const route of compiledRoutes.dynamic) {
        const matched = matchPath(pathname, route.path)
        if (matched) {
            return {routeStack: route.routeStack, params: matched}
        }
    }

    return {params: {}}
}

export const Routes = memo(({entry, notFound}: {
    entry: RouteItem
    notFound?: ReactNode
}) => {
    const router = useRouter()
    const {pathname} = router

    const compiledRoutes = useMemo(() => compileRoutes(entry), [entry])

    const match = useMemo(
        () => matchCompiledRoutes(pathname, compiledRoutes),
        [pathname, compiledRoutes]
    )
    const matchedRouter = useMemo<IRouterContext>(() => ({
        ...router,
        params: match.params
    }), [router, match.params])
    const {routeStack} = match

    return (
        <RouterContext value={matchedRouter}>
            <RouteStack value={routeStack ?? EMPTY_ROUTE_STACK}>
                <RouteLayoutStackIndex value={0}>
                    {routeStack ? <Outlet/> : notFound}
                </RouteLayoutStackIndex>
            </RouteStack>
        </RouterContext>
    )
})
