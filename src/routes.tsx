import React, {Children, createContext, isValidElement, memo, useContext, useMemo} from 'react'
import {RouteItem, RouteProps, RoutesProps} from '..'
import {useRouter} from './router'
import {truncatePath, clearEndSlash} from './utils'
import {consumeDepthContext, Outlet, useConsumeDepth} from './outlet'

interface MatchedRouteItem extends RouteItem {
    truncatedPath: string
}

const matchedRouteStackContext = createContext([] as MatchedRouteItem[])

export function useMatchedRouteStack() {
    return useContext(matchedRouteStackContext)
}

export const Routes = memo(({
    routes,
    children
}: RoutesProps) => {
    // 统一使用对象结构的路由
    const structuredRoutes = useMemo(() => {
        if (routes) {
            return routes
        }
        const fn = (children: any[]): RouteItem[] => {
            return children.flatMap(c => {
                if (!isValidElement(c)) {
                    return []
                }
                return {
                    ...c.props as any,
                    ...(c.props as any).children && {
                        children: fn(Children.toArray((c.props as any).children))
                    }
                }
            })
        }
        return fn(Children.toArray(children))
    }, [routes, children])

    const {routePath, params} = useRouter()

    const parentStack = useMatchedRouteStack()
    const consumed = useConsumeDepth()

    const currentRoutePath = parentStack[consumed]?.truncatedPath ?? routePath

    const matchedRouteStack = useMemo(() => {
        if (currentRoutePath === null) {
            // 不在当前路由下，直接返回父栈
            return parentStack
        }
        const stack: MatchedRouteItem[] = []
        const fn = (routes: RouteItem[], referencePath: string) => {
            referencePath = referencePath.replace(/^\/+/, '')
            let childPath: string | null
            const matchedRoute = routes.find(({path = '', children}) => {
                const startWithSlash = path[0] === '/'
                path = clearEndSlash(path)
                if (startWithSlash) {
                    // 以"/"开头使用routePath匹配
                    referencePath = routePath!
                    // 经过clearEndSlash方法，path可能会变成空字符串，需使用"/"作为默认值
                    path ||= '/'
                }

                if (path.includes(':')) {
                    // 路径中存在动态参数
                    const paramKeys = path.split('/')
                    const paramValues = referencePath.split('/')
                    if (paramKeys.length > paramValues.length) {
                        return false
                    }
                    for (let i = 0, {length} = paramKeys; i < length; i++) {
                        const key = paramKeys[i]
                        const value = paramValues[i]
                        if (key[0] === ':') {
                            // 保存动态参数并替换动态路径
                            params[key.slice(1)] = paramKeys[i] = value
                        }
                    }
                    path = paramKeys.join('/')
                }

                const hasChildren = children?.length
                const regular = path.includes('*')
                let allowAllChildren = false
                if (regular) {
                    if (allowAllChildren = /\/\*+$/.test(path)) {
                        // 以"/*"结尾的通配符，表示匹配所有子路由
                        path = path.replace(/\/\*+$/, '')
                    }
                    path = path.replace(/\*+/g, '[^\/]+')
                }

                childPath = truncatePath(referencePath, path, regular)
                if (hasChildren || allowAllChildren) {
                    // 有子路由，需判断能否截断
                    return childPath !== null
                }

                // 无子路由需精准匹配
                return regular
                    ? RegExp(path).test(referencePath)
                    : referencePath === path
            })
            if (matchedRoute) {
                // 有element表示配对成功，可入栈
                typeof matchedRoute.element !== 'undefined' && stack.push({
                    ...matchedRoute,
                    truncatedPath: childPath!
                })
                matchedRoute.children?.length && fn(matchedRoute.children, childPath!)
            }
        }
        fn(structuredRoutes, currentRoutePath)
        return stack
    }, [structuredRoutes, currentRoutePath, parentStack])

    return (
        <matchedRouteStackContext.Provider value={matchedRouteStack}>
            <consumeDepthContext.Provider value={-1}>
                <Outlet />
            </consumeDepthContext.Provider>
        </matchedRouteStackContext.Provider>
    )
})

export function Route(props: RouteProps) {
    return props.children
}