import {MatchedRouteItem, RouteItem, RouteProps, RoutesProps} from '..'
import {Children, createContext, isValidElement, ReactNode, useContext, useMemo} from 'react'
import {useRouter} from './router'
import {globToReg, insertPathParams, truncatePath, unifySlash} from './utils'
import {Outlet} from './outlet'

const routeStackContext = createContext([] as MatchedRouteItem[])

export function useRouteStack() {
    return useContext(routeStackContext)
}

export const routeStackIndexContext = createContext(-1)

export function useRouteStackIndex() {
    return useContext(routeStackIndexContext)
}

export function useCurrentRoute(): MatchedRouteItem | null {
    const stack = useRouteStack()
    const consumed = useRouteStackIndex()
    return stack[consumed] || null
}

export function Routes({routes, children}: RoutesProps) {
    const routesStructure = useMemo(() => {
        if (routes) {
            // return routes
            const fn = (routes: RouteItem[]) => {
                return routes.map(route => ({
                    path: typeof route.path === 'string' ? unifySlash(route.path) : route.path,
                    ...route
                }))
            }
            return fn(routes)
        }
        const fn = (children: ReactNode[]): RouteItem[] => {
            return children.flatMap(child => {
                if (!isValidElement(child)) {
                    return []
                }
                return [{
                    ...child.props,
                    path: typeof child.props.path === 'string' ? unifySlash(child.props.path) : child.props.path,
                    ...child.props.children && {
                        children: fn(child.props.children)
                    }
                }]
            })
        }
        return fn(Children.toArray(children))
    }, [routes, children])

    const {pathname, params} = useRouter()

    const parentRoute = useCurrentRoute()

    const currentPathname = parentRoute?.subPath ?? pathname

    const routeStack = useMemo(() => {
        const stack: MatchedRouteItem[] = []

        // currentPathname为null表示不在当前路由下
        if (currentPathname !== null) {
            const fn = (routes: RouteItem[], referencePath: string) => {
                let subPath: string | null = null
                const matchedRoute = routes.find(({path, children, extendable}) => {
                    let endWithAsterisk = false
                    if (typeof path === 'string') {
                        if (path[0] === '/') {
                            // "/"开头使用pathname匹配
                            referencePath = pathname!
                        }

                        if (path.includes(':')) {
                            // 路径中存在动态参数
                            const replacedPath = insertPathParams(params, path, referencePath)
                            if (replacedPath === null) {
                                return false
                            }
                            // 得到替换后的路径
                            path = replacedPath
                        } else if (/[*?]+/.test(path)) {
                            // 路径中存在通配符
                            endWithAsterisk = /\/\*+$/.test(path)
                            if (endWithAsterisk) {
                                // "/*"结尾，需暂时移除"/*"
                                path = path.replace(/\/\*+$/, '')
                            }
                            path = globToReg(path)
                        }
                    }

                    subPath = truncatePath(referencePath, path)
                    if (children?.length || extendable) {
                        // 有子路由，或可扩展的路由时，只要subPath不为null均可匹配成功
                        return subPath !== null
                    }
                    if (endWithAsterisk) {
                        // "/*"结尾，必须有剩余的subPath
                        return !!subPath
                    }
                    // 无子路由需精准匹配
                    return subPath === ''
                })
                if (matchedRoute) {
                    // 有element的路由均可入栈
                    typeof matchedRoute.element !== 'undefined' && stack.push({
                        ...matchedRoute,
                        subPath: subPath!
                    })
                    matchedRoute.children?.length && fn(matchedRoute.children, subPath!)
                }
            }
            fn(routesStructure, currentPathname)
        }

        return stack
    }, [currentPathname, routesStructure])

    return (
        <routeStackContext.Provider value={routeStack}>
            <routeStackIndexContext.Provider value={-1}>
                <Outlet/>
            </routeStackIndexContext.Provider>
        </routeStackContext.Provider>
    )
}

export function Route(props: RouteProps) {
    return props.children
}