import React, {Children, createContext, isValidElement, memo, useContext, useMemo} from 'react'
import {RouteItem, RouteProps, RoutesProps} from '..'
import {useRouter} from './router'
import {consumeDepthContext, Outlet, useConsumeDepth} from './outlet'
import {globToReg, truncatePath} from './utils'

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
        const stack: MatchedRouteItem[] = []
        if (currentRoutePath === null) {
            // 不在当前路由下
            return stack
        }
        const fn = (routes: RouteItem[], referencePath: string) => {
            let subPath: string | null
            const matchedRoute = routes.find(({path = '', children, extendable}) => {
                if (String(path)[0] === '/') {
                    // 以"/"开头使用invokePath匹配
                    referencePath = routePath!
                }

                let endWithStar = false
                if (typeof path === 'string') {
                    if (path.includes(':')) {
                        // 路径中存在动态参数
                        const paramKeys = path.split('/')
                        const paramValues = referencePath.split('/')
                        if (paramKeys.length > paramValues.length) {
                            return null
                        }
                        for (let i = 0, {length} = paramKeys; i < length; i++) {
                            const key = paramKeys[i]
                            const value = paramValues[i]
                            if (key[0] === ':') {
                                // 保存动态参数并替换动态路径
                                params[key.slice(1)] = paramKeys[i] = value
                            }
                        }
                        // 得到替换后的路径
                        path = paramKeys.join('/')
                    } else if (/(\*|\?)+/.test(path)) {
                        // 路径中存在通配符
                        endWithStar = /\/\*+$/.test(path)
                        path = globToReg(path)
                    }
                }

                subPath = truncatePath(referencePath, path)
                if (children?.length || extendable || endWithStar) {
                    // 有子路由，或可扩展的路由，或以"/*"结尾的路由
                    return subPath !== null
                }
                // 无子路由需精准匹配
                return subPath === ''
            })
            if (matchedRoute) {
                // 有element表示配对成功，可入栈
                typeof matchedRoute.element !== 'undefined' && stack.push({
                    ...matchedRoute,
                    truncatedPath: subPath!
                })
                matchedRoute.children?.length && fn(matchedRoute.children, subPath!)
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