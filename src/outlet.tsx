import React, {createContext, useContext} from 'react'
import {useRouteStack} from './routes'
import {useRouter} from './router'
import {MatchedRouteItem} from '..'

export const consumeDepthContext = createContext(-1)

export function useConsumeDepth() {
    return useContext(consumeDepthContext)
}

export function useCurrentRoute(): MatchedRouteItem | null {
    const stack = useRouteStack()
    const consumed = useConsumeDepth()
    return stack[consumed] || null
}

export function useCurrentBase() {
    const currentRoute = useCurrentRoute()
    const {routePath} = useRouter()
    if (currentRoute?.truncatedPath && routePath !== null) {
        return routePath.replace(RegExp(`${currentRoute.truncatedPath}$`), '')
    }
    return routePath
}

export function useOutlet() {
    const stack = useRouteStack()
    const consumed = useConsumeDepth() + 1
    const element = stack[consumed]?.element

    return element
        ? <consumeDepthContext.Provider value={consumed}>
            {element}
        </consumeDepthContext.Provider>
        : null

}

export function Outlet() {
    return useOutlet()
}