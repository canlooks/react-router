import React, {Children, createContext, isValidElement, ReactElement, ReactNode, useContext, useMemo} from 'react'
import {RouteItem, RouteProps, RoutesProps} from '..'
import {useRouter} from './router'
import {joinPath} from './utils'
import {Outlet, useConsumeDepth} from './outlet'

type RouteStackContext = {
    element: ReactNode
    path: string
}[]

const routeStackContext = createContext([] as RouteStackContext)

export function useRouteStack() {
    return useContext(routeStackContext)
}

export function Routes({
    routes,
    children
}: RoutesProps) {
    const structuredRoutes = useMemo(() => {
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
        let splitIndex = 0
        let routes: RouteItem[] | undefined = structuredRoutes
        const {length} = splitPath
        while (routes?.length && splitIndex <= length) {
            // 遍历比长度多一次，最后一次只查找无path的子路由
            const currentFragment = splitPath[splitIndex]
            const route: RouteItem | undefined = routes.find(({path = ''}) => {
                if (splitIndex === length) {
                    return !path
                }
                if (path[0] === ':') {
                    const paramName = path.slice(1)
                    if (paramName) {
                        params[paramName] = currentFragment
                        return true
                    }
                }
                path = path.replace(/^\/+/, '')
                if (path.includes('*')) {
                    return RegExp(`^${path.replace(/\*+/g, '.*')}$`).test(currentFragment)
                }
                return currentFragment === path
            })
            if (typeof route?.element !== 'undefined') {
                routeStack.push({
                    element: route.element,
                    path: splitPath.slice(0, splitIndex + 1).join('/')
                })
            }
            routes = route?.children
            splitIndex++
        }
        return routeStack
    }, [parentRouteStack, structuredRoutes, splitPath])

    return (
        <routeStackContext.Provider value={routeStack}>
            <Outlet />
        </routeStackContext.Provider>
    )
}

export function Route(props: RouteProps) {
    return props.children
}