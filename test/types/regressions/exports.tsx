import {useContext} from 'react'
import {Routes, RouterContext, RouteStack, RouteLayoutStackIndex, isStartWithProtocol} from '@canlooks/react-router'
import type {RouteItem} from '@canlooks/react-router'

// Every symbol here is exported at runtime by src/index.ts.
export const exportedValues = [Routes, RouterContext, RouteStack, RouteLayoutStackIndex, isStartWithProtocol]

export function Consumer() {
    const router: RouterContext = useContext(RouterContext)
    const stack: RouteItem[] = useContext(RouteStack)
    const index: number = useContext(RouteLayoutStackIndex)
    const protocol: boolean = isStartWithProtocol('https://router.test')
    void protocol
    return <RouterContext.Provider value={router}>
        <RouteStack.Provider value={stack}><RouteLayoutStackIndex.Provider value={index}>
            <Routes entry={{page: 'Home'}} notFound={<h1>404</h1>}/>
        </RouteLayoutStackIndex.Provider></RouteStack.Provider>
    </RouterContext.Provider>
}

// @ts-expect-error RouterContext requires a complete router value.
export const invalidRouter = <RouterContext.Provider value={{mode: 'memory'}}/>
// @ts-expect-error RouteStack contains route objects rather than strings.
export const invalidStack = <RouteStack.Provider value={['invalid']}/>
// @ts-expect-error Layout depth is numeric.
export const invalidIndex = <RouteLayoutStackIndex.Provider value="0"/>
