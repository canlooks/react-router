import {isUnset} from './utils'
import {createContext, useContext} from 'react'
import {RouteItem} from '../index'

export const RouteStack = createContext<RouteItem[]>([])

export function useRouteStack() {
    return useContext(RouteStack)
}


export function useRouteLayoutStack() {
    return useRouteStack().filter((route, index, stack) => {
        return !isUnset(route.layout) || index === stack.length - 1
    })
}

export const RouteLayoutStackIndex = createContext(0)

export function useRouteLayoutStackIndex() {
    return useContext(RouteLayoutStackIndex)
}

export function useOutlet() {
    const index = useRouteLayoutStackIndex()
    const layoutStack = useRouteLayoutStack()

    if (index < layoutStack.length - 1) {
        return (
            <RouteLayoutStackIndex value={index + 1}>
                {layoutStack[index].layout}
            </RouteLayoutStackIndex>
        )
    }

    if (index === layoutStack.length - 1) {
        const {layout, page} = layoutStack[index]
        return (
            <RouteLayoutStackIndex value={index + 1}>
                {layout || page}
            </RouteLayoutStackIndex>
        )
    }

    if (index === layoutStack.length) {
        return (
            <RouteLayoutStackIndex value={index + 1}>
                {layoutStack[index - 1].page}
            </RouteLayoutStackIndex>
        )
    }
}

export function Outlet() {
    return useOutlet()
}