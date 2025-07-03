import {MatchedRouteItem, RouteItem, RouteProps, RoutesProps} from '..'
import {Children, createContext, isValidElement, ReactElement, ReactNode, useContext, useMemo} from 'react'
import {useRouter} from './router'
import {globToReg, insertPathParams, truncatePath, unifySlash} from './utils'
import {Outlet} from './outlet'

const RouteStackContext = createContext([] as MatchedRouteItem[])

export function useRouteStack() {
    return useContext(RouteStackContext)
}

export function useRouteElementStack() {
    return useRouteStack().filter(route => typeof route.element !== 'undefined')
}

export const RouteStackIndexContext = createContext(-1)

export function useRouteStackIndex() {
    return useContext(RouteStackIndexContext)
}

export function useCurrentRoute(): MatchedRouteItem | null {
    const stack = useRouteElementStack()
    const consumed = useRouteStackIndex()
    return stack[consumed] || null
}

export function Routes({routes, children}: RoutesProps) {
    const routesStructure = useMemo(() => {
        if (routes) {
            const recurve = (routes: RouteItem[]): RouteItem[] => {
                return routes.map(route => ({
                    path: typeof route.path === 'string' ? unifySlash(route.path) : route.path,
                    ...route
                }))
            }
            return recurve(routes)
        }
        const recurve = (children: ReactNode): RouteItem[] => {
            return Children.toArray(children).flatMap(child => {
                if (!isValidElement(child)) {
                    return []
                }
                const {props} = child as ReactElement<RouteItem & {children?: ReactNode}>
                return {
                    ...props,
                    path: typeof props.path === 'string' ? unifySlash(props.path) : props.path,
                    ...props.children && {
                        children: recurve(props.children)
                    }
                }
            })
        }
        return recurve(children)
    }, [routes, children])

    const {pathname, params} = useRouter()

    const parentRoute = useCurrentRoute()

    const currentPathname = parentRoute?._subPath ?? pathname

    const routeStack = useMemo(() => {
        // currentPathname为null表示不在当前路由下
        if (currentPathname === null) {
            return []
        }

        const recurve = (routes = routesStructure, referencePath = currentPathname, parentStack: MatchedRouteItem[] = []): MatchedRouteItem[] | null => {
            let currentStack: MatchedRouteItem[] | null = null
            const matched = routes.some(routeItem => {
                let {path, pattern, children, extendable} = routeItem

                let endWithAsterisk = false
                if (typeof path === 'string') {
                    if (path[0] === '/') {
                        // "/"开头使用pathname匹配
                        referencePath = pathname!
                    }

                    // 路径中存在动态参数
                    if (path.includes(':')) {
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
                            // "/*"结尾，用endWithAsterisk记录后移除"/*"
                            path = path.replace(/\/\*+$/, '')
                        }
                        pattern = globToReg(path)
                    }
                }

                const subPath = truncatePath(referencePath, pattern || path)
                if (subPath === null) {
                    return false
                }

                const next = () => {
                    currentStack = [...parentStack]
                    if (children?.length) {
                        currentStack = recurve(children, subPath, currentStack)
                        if (!currentStack) {
                            return false
                        }
                    }
                    currentStack.unshift({
                        ...routeItem,
                        _subPath: subPath!
                    })
                    return true
                }

                // 有子路由，或可扩展的路由时，继续查找
                if (children?.length || extendable) {
                    return next()
                }

                if (endWithAsterisk && subPath) {
                    // "/*"结尾，若有剩余的subPath则继续
                    return next()
                }

                // 还有剩余subPath，表示不匹配
                return subPath ? false : next()
            })

            return matched ? currentStack : null
        }
        return recurve() || []
    }, [currentPathname, routesStructure])

    return (
        <RouteStackContext value={routeStack}>
            <RouteStackIndexContext value={-1}>
                <Outlet/>
            </RouteStackIndexContext>
        </RouteStackContext>
    )
}

export function Route(props: RouteProps) {
    return props.children
}