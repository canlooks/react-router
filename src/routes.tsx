import React, {Children, createContext, isValidElement, ReactElement, useContext, useMemo} from 'react'
import {RouteItem} from '..'
import {useRouter} from './router'
import {outletContext} from './outlet'
import {joinPath} from './util'

const subPathContext = createContext('')

export function Routes({
    routes,
    children
}: {
    routes?: RouteItem[]
    children?: ReactElement | ReactElement[]
}) {
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
        location: {pathname}
    } = useRouter()

    const parentPath = useContext(subPathContext)

    const splitPath = useMemo(() => {
        const joinedBase = joinPath(base, parentPath)
        if (!RegExp('^' + joinedBase).test(pathname)) {
            return null
        }
        return pathname
            .replace(joinedBase, '')
            // 清除开头的'/'，避免split的结果第一个为空字符串
            .replace(/^\/+/, '')
            .split('/')
    }, [pathname, base, parentPath])

    const {matchedElement, outlet, subPath} = useMemo(() => {
        let matchedElement = null,
            outlet = null,
            subPath = ''

        if (splitPath) {
            let splitIndex = 0,
                routes = structuredRoutes
            const {length} = splitPath
            while (splitIndex <= length) {
                // 遍历比长度多一次，最后一次只查找无path的子路由
                const currentFragment = splitPath[splitIndex]

                const route = routes.find(({path = ''}) => {
                    if (path[0] === '/') {
                        return currentFragment === path.slice(1)
                    }
                    if (splitIndex === length) {
                        return !path
                    }
                    return currentFragment === path
                })
                if (!route) {
                    outlet = null
                    break
                }
                if (typeof route.element !== 'undefined') {
                    if (matchedElement) {
                        // 第二次匹配当作outlet，并终止循环
                        outlet = (
                            <subPathContext.Provider value={splitPath.slice(0, splitIndex + 1).join('/')}>
                                {route.element}
                            </subPathContext.Provider>
                        )
                        break
                    }
                    // 把第一次匹配当作返回结果，但继续尝试匹配
                    matchedElement = route.element
                    subPath = splitPath.slice(0, splitIndex + 1).join('/')
                }
                if (!route.children?.length) {
                    outlet = null
                    break
                }
                routes = route.children
                splitIndex++
            }
        }

        return {matchedElement, outlet, subPath}
    }, [structuredRoutes, splitPath])

    return (
        <subPathContext.Provider value={subPath}>
            <outletContext.Provider value={outlet}>
                {matchedElement}
            </outletContext.Provider>
        </subPathContext.Provider>
    )
}