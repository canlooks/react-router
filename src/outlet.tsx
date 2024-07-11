import React, {createContext, useContext} from 'react'
import {useRouteStack} from './routes'

const consumeDepthContext = createContext(-1)

export function useConsumeDepth() {
    return useContext(consumeDepthContext)
}

export function useOutlet() {
    const routeStack = useRouteStack()

    const parentConsumed = useConsumeDepth() + 1

    return (
        <consumeDepthContext.Provider value={parentConsumed}>
            {routeStack[parentConsumed]?.element}
        </consumeDepthContext.Provider>
    )
}

export function Outlet() {
    return useOutlet()
}