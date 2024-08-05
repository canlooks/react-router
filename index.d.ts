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
        // Whether to restore the location to which the user has scrolled
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
        /** The path used to match routes(excluding {@link RouterContext.base}) */
        routePath: string | null

        replace(to: To, options?: Omit<NavigateOptions, 'replace'>): void

        navigate(to: To, options?: NavigateOptions): void
        navigate(delta: number): void

        back(): void
        forward(): void

        state: any
        setState: Dispatch<SetStateAction<any>>

        params: Record<string, string>
    }

    type RouterProps = {
        mode?: Mode
        /** @default '/' */
        base?: string
        children?: ReactNode
    }

    function Router(props: RouterProps): ReactElement

    function useRouter(): RouterContext

    function useQuery(): URLSearchParams

    function useParams(): Record<string, string>

    /**
     * ---------------------------------------------------------------
     * Routes
     */

    type RoutesProps = {
        /** suggest to use routes */
        routes?: RouteItem[]
        /** JSX style routes definition */
        children?: ReactElement | ReactElement[]
    }

    function Routes(props: RoutesProps): ReactElement

    /**
     * ---------------------------------------------------------------
     * Route
     */

    type RouteItem = {
        path?: string | RegExp
        element?: ReactNode
        children?: RouteItem[]
        /** Whether extenading sub routes is allowed @default false */
        extendable?: boolean
    }

    interface RouteProps extends Omit<RouteItem, 'children'> {
        children?: ReactNode
    }

    function Route(props: RouteProps): ReactElement

    /**
     * ---------------------------------------------------------------
     * outlet
     */

    function useOutlet(): ReactElement

    function Outlet(): ReactElement

    /**
     * ---------------------------------------------------------------
     * navigate
     */

    function useNavigate(): RouterContext['navigate']

    interface NavigateProps extends NavigateOptions {
        to?: To
        delta?: number
    }

    function Navigate(props: NavigateProps): ReactElement

    type RedirectProps = Omit<NavigateProps, 'replace'>

    /**
     * ---------------------------------------------------------------
     * link
     */

    interface LinkProps extends NavigateProps, Partial<JSX.IntrinsicElements['a']> {
        children?: ReactNode
    }
}

export = Router