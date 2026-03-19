import {MatchedRouteItem, RouteItem, RoutesProps} from '..'
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
    const index = useRouteStackIndex()
    return stack[index] || null
}

export function Routes({routes, children}: RoutesProps) {
    const routesObject = useMemo(() => {
        if (routes) {
            const recurse = (routes: RouteItem[]): RouteItem[] => {
                return routes.map(route => ({
                    ...route,
                    path: typeof route.path === 'string' ? unifySlash(route.path) : route.path,
                    ...route.children && {
                        children: recurse(route.children)
                    }
                }))
            }
            return recurse(routes)
        }
        const recurse = (children: ReactNode): RouteItem[] => {
            return Children.toArray(children).flatMap(child => {
                if (!isValidElement(child)) {
                    return []
                }
                const {props} = child as ReactElement<RouteItem & { children?: ReactNode }>
                return {
                    ...props,
                    path: typeof props.path === 'string' ? unifySlash(props.path) : props.path,
                    ...props.children && {
                        children: recurse(props.children)
                    }
                }
            })
        }
        return recurse(children)
    }, [routes, children])

    const {pathname, params} = useRouter()

    const parentRoute = useCurrentRoute()

    const currentPathname = parentRoute?._subPath ?? pathname

    const routeStack = useMemo(() => {
        // currentPathname为null表示不在当前路由下
        if (currentPathname === null) {
            return []
        }

        const stack: MatchedRouteItem[] = []
        const recuse = (routes: RouteItem[], referencePath: string) => {
            for (let i = 0, {length} = routes; i < length; i++) {
                const route = routes[i]
                let {path, pattern, children} = route

                if (typeof path === 'string') {
                    if (path[0] === '/') {
                        // "/"开头使用pathname匹配
                        referencePath = pathname
                    }

                    // 路径中存在动态参数
                    if (path.includes(':')) {
                        const replacedPath = insertPathParams(params, path, referencePath)
                        if (replacedPath === null) {
                            continue
                        }
                        // 得到替换后的路径
                        path = replacedPath
                    } else if (/[*?]+/.test(path)) {
                        // 路径中存在通配符
                        pattern = globToReg(path)
                    }
                }

                const subPath = truncatePath(referencePath, pattern || path)
                if (subPath === null) {
                    continue
                }

                stack.push({
                    ...route,
                    _subPath: subPath
                })
                children?.length && recuse(children, subPath)

                break
            }
        }
        recuse(routesObject, currentPathname)
        return stack
    }, [currentPathname, routesObject])

    return (
        <RouteStackContext value={routeStack}>
            <RouteStackIndexContext value={-1}>
                <Outlet/>
            </RouteStackIndexContext>
        </RouteStackContext>
    )
}