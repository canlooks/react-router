import {RouteStackIndexContext, useCurrentRoute, useRouteElementStack, useRouteStackIndex} from './routes'
import {useRouter} from './router'

export function useOutlet() {
    const stack = useRouteElementStack()
    const stackIndex = useRouteStackIndex() + 1
    const element = stack[stackIndex]?.element
    return element
        ? <RouteStackIndexContext value={stackIndex}>
            {element}
        </RouteStackIndexContext>
            : null
}

export function Outlet() {
    return useOutlet()
}

export function useCurrentBase() {
    const {pathname} = useRouter()
    const currentRoute = useCurrentRoute()
    if (currentRoute?.subPath) {
        return pathname.replace(RegExp(`${currentRoute.subPath}$`), '')
    }
    return pathname
}