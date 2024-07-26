import React, {createContext, useContext} from 'react'
import {useMatchedRouteStack} from './routes'

export const consumeDepthContext = createContext(-1)

export function useConsumeDepth() {
    return useContext(consumeDepthContext)
}

export function useOutlet() {
    const stack = useMatchedRouteStack()

    const consumed = useConsumeDepth() + 1

    return (
        <consumeDepthContext.Provider value={consumed}>
            {stack[consumed]?.element}
        </consumeDepthContext.Provider>
    )
}

export function Outlet() {
    return useOutlet()
}