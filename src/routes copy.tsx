import React, {Children, createContext, isValidElement, memo, ReactElement, ReactNode, useContext, useMemo, useRef} from 'react'
import {RouteItem, RouteProps, RoutesProps} from '..'
import {useRouter} from './router'
import {joinPath} from './utils'
import {Outlet, useConsumeDepth} from './outlet'

interface CachedRouteItem extends RouteItem {
    cacheChildren?: Map<string, CachedRouteItem>
}

type RouteStackContext = {
    element: ReactNode
    path: string
}[]

const routeStackContext = createContext([] as RouteStackContext)

export function useRouteStack() {
    return useContext(routeStackContext)
}

export const Routes = memo(({
    routes,
    children
}: RoutesProps) => {
    const cachedRoutes = useRef<Map<string, CachedRouteItem>>()

    const structuredRoutes = useMemo(() => {
        // 路由结构变化需要清空缓存
        cachedRoutes.current = new Map()
        if (routes) {
            return routes
        }
        const fn = (children: ReactElement[]): RouteItem[] => {
            return children.flatMap(c => {
                if (!isValidElement(c)) {
                    return []
                }
                return {
                    ...c.props as any,
                    ...(c.props as any).children && {
                        children: fn(Children.toArray((c.props as any).children) as ReactElement[])
                    }
                }
            })
        }
        return fn(Children.toArray(children) as ReactElement[])
    }, [routes, children])

    const {
        base,
        location: {pathname},
        params
    } = useRouter()

    const parentRouteStack = useRouteStack()
    const consumeDepth = useConsumeDepth()
    const parentPath = parentRouteStack[consumeDepth]?.path || ''

    const splitPath = useMemo(() => {
        const joinedBase = joinPath(base, parentPath)
        if (!RegExp('^' + joinedBase).test(pathname)) {
            // pathname开头与joinedBase不匹配，说明不在当前路由下
            return null
        }
        return pathname
            .replace(joinedBase, '')
            // 清除开头的'/'，避免split的结果第一个为空字符串
            .replace(/^\/+/, '')
            .split('/')
    }, [pathname, base, parentPath])

    const routeStack = useMemo(() => {
        if (!splitPath) {
            return parentRouteStack
        }
        const routeStack = [...parentRouteStack]
        let cacheNode = cachedRoutes.current
        let routes: RouteItem[] | undefined = structuredRoutes
        for (let i = 0, {length} = splitPath; routes?.length && i <= length; i++) {
            // 遍历比长度多一次，最后一次只查找无path的子路由
            const currentFragment = splitPath[i]
            const route: RouteItem | undefined = cacheNode?.get(currentFragment) || routes.find(route => {
                let {path = ''} = route
                if (i === length) {
                    return !path
                }

                // ":"开头的不定路径，存入params
                if (path[0] === ':') {
                    const paramName = path.slice(1)
                    if (paramName) {
                        params[paramName] = currentFragment
                        return true
                    }
                }

                // 路径中存在"*"
                path = path.replace(/^\/+/, '')
                if (path.includes('*')) {
                    return RegExp(`^${path.replace(/\*+/g, '.*')}$`).test(currentFragment)
                }

                // 确定的路径，写入缓存
                cacheNode?.set(path, {...route, cacheChildren: new Map()})
                return currentFragment === path
            })
            if (typeof route?.element !== 'undefined') {
                routeStack.push({
                    element: route.element,
                    path: splitPath.slice(0, i + 1).join('/')
                })
            }
            routes = route?.children
            cacheNode = route?.path ? cacheNode?.get(route?.path)?.cacheChildren : void 0
        }
        return routeStack
    }, [parentRouteStack, structuredRoutes, splitPath])

    return (
        <routeStackContext.Provider value={routeStack}>
            <Outlet />
        </routeStackContext.Provider>
    )
})

export function Route(props: RouteProps) {
    return props.children
}