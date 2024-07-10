import {Dispatch, ReactElement, ReactNode, SetStateAction} from 'react'

declare namespace Router {
    /**
     * ---------------------------------------------------------------
     * Router
     */

    /** @default 'history' */
    type Mode = 'history' | 'hash' | 'memory'

    type To = string | URL

    type NavigateOptions = {
        state?: any
        replace?: boolean
        // TODO Whether to restore the location to which the user has scrolled
        scrollRestore?: boolean
    }

    type ILocation = {
        hash: string
        host: string
        hostname: string
        href: string
        origin: string
        pathname: string
        port: string
        protocol: string
        search: string
    }

    type RouterContext = {
        mode: Mode

        base: string

        location: ILocation

        replace(to: To, options?: Omit<NavigateOptions, 'replace'>): void

        navigate(to: To, options?: NavigateOptions): void
        navigate(delta: number): void

        back(): void
        forward(): void

        state: any
        setState: Dispatch<SetStateAction<any>>
    }

    type RouterProps = {
        mode?: Mode
        /** @default '/' */
        base?: string
        children?: ReactNode
    }

    function Router(props: RouterProps): ReactElement

    function useRouter(): RouterContext

    /**
     * ---------------------------------------------------------------
     * Route
     */

    type RouteItem = {
        path?: string
        element?: ReactNode
        children?: RouteItem[]
    }

    interface RouteProps extends Omit<RouteItem, 'children'> {
        children?: ReactNode
    }

    // type RouteCommonProps ={
    //     path?: string
    // }

    // interface RouteContext extends RouteCommonProps {

    // }

    // interface RouteProps extends RouteCommonProps {
    //     element?: ReactNode
    //     children?: ReactNode
    // }
}

export = Router