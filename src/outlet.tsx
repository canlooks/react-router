import {createContext, ReactNode, useContext} from 'react'

export const outletContext = createContext<ReactNode>(null)

export function useOutlet() {
    return useContext(outletContext)
}

export function Outlet() {
    return useOutlet()
}