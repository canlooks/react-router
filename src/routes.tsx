import {memo, ReactNode, useMemo, useRef} from 'react'
import {RouteItem} from '../index'
import {useRouter} from './router'
import {isUnset, matchPath} from './utils'
import {Outlet, RouteLayoutStackIndex, RouteStack} from './outlet'

const parentMap = new WeakMap<RouteItem, RouteItem>()

export const Routes = memo(({entry, notFound}: {
    entry: RouteItem
    notFound?: ReactNode
}) => {
    const {pathname, params} = useRouter()

    const dynamicRoutesMap = useRef(new Map<string, RouteItem>())

    const exactRoutesMap = useMemo(() => {
        dynamicRoutesMap.current.clear()
        const exactMap = new Map<string, RouteItem>()

        const recurse = (route: RouteItem, paths: string[] = [], isDynamic?: boolean) => {
            if (!isUnset(route.page)) {
                const map = isDynamic ? dynamicRoutesMap.current : exactMap
                const path = '/' + paths.join('/')

                !map.has(path) && map.set(path, route)
            }

            const {children} = route
            if (!children) {
                return
            }

            for (const path in children) {
                const child = children[path]
                const [p] = path
                parentMap.set(child, route)
                isDynamic ||= p === ':' || path === '*' || path === '**'

                recurse(
                    child,
                    p === '#' ? paths : [...paths, path],
                    isDynamic
                )
            }
        }
        recurse(entry)

        return exactMap
    }, [entry])

    const routeStack = useMemo(() => {
        if (pathname === null) {
            return
        }

        const combineStack = (route: RouteItem) => {
            const stack = []
            stack.push(route)
            while (parentMap.has(route)) {
                route = parentMap.get(route)!
                stack.push(route)
            }
            return stack.reverse()
        }

        const exact = exactRoutesMap.get(pathname)
        if (exact) {
            return combineStack(exact)
        }

        for (const [path, route] of dynamicRoutesMap.current) {
            const matched = matchPath(pathname, path)
            if (matched) {
                for (const k in matched) {
                    params[k] = matched[k]
                }
                return combineStack(route)
            }
        }
    }, [pathname, exactRoutesMap, params])

    if (!routeStack) {
        return notFound
    }

    return (
        <RouteStack value={routeStack}>
            <RouteLayoutStackIndex value={0}>
                <Outlet/>
            </RouteLayoutStackIndex>
        </RouteStack>
    )
})