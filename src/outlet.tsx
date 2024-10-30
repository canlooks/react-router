import {routeStackIndexContext, useCurrentRoute, useRouteStack, useRouteStackIndex} from './routes'
import {useRouter} from './router'

export function useOutlet() {
    const stack = useRouteStack()
    const stackIndex = useRouteStackIndex() + 1
    const element = stack[stackIndex]?.element
    return element
        ? <routeStackIndexContext.Provider value={stackIndex}>
            {element}
        </routeStackIndexContext.Provider>
            : null
}

export function Outlet() {
    return useOutlet()
}

export function useCurrentBase() {
    const {pathname} = useRouter()
    const currentRoute = useCurrentRoute()
    if (currentRoute?.subPath && pathname !== null) {
        return pathname.replace(RegExp(`${currentRoute.subPath}$`), '')
    }
    return pathname
}