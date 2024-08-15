import React, {createContext, useContext} from 'react'
import {useRouteStack} from './routes'

export const consumeDepthContext = createContext(-1)

export function useConsumeDepth() {
    return useContext(consumeDepthContext)
}

export function useCurrentRoute() {
    const stack = useRouteStack()

    const consumed = useConsumeDepth()

    return stack[consumed] || null
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