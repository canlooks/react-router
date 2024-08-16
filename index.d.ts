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

    function useRouteStack(): MatchedRouteItem[]

    /**
     * ---------------------------------------------------------------
     * Route
     */

    interface RouteItem extends Record<any, any> {
        path?: string | RegExp
        element?: ReactNode
        children?: RouteItem[]
        /** Whether extenading sub routes is allowed @default false */
        extendable?: boolean
    }

    interface MatchedRouteItem extends RouteItem {
        truncatedPath: string
    }

    interface RouteProps extends Omit<RouteItem, 'children'> {
        children?: ReactNode
    }

    function Route(props: RouteProps): ReactElement

    /**
     * ---------------------------------------------------------------
     * outlet
     */

    function useOutlet(): ReactElement | null

    function Outlet(): ReactElement

    /** get current matched route item {@link MatchedRouteItem} */
    function useCurrentRoute(): MatchedRouteItem | null

    /** get route path from {@link RouterProps.base} to current matched */
    function useCurrentBase(): string | null

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
     * @alias {@link Navigate} but with replace
     * @param props 
     */
    function Redirect(props: RedirectProps): ReactElement


    /**
     * ---------------------------------------------------------------
     * link
     */

    interface LinkProps extends NavigateProps, Partial<JSX.IntrinsicElements['a']> {
        children?: ReactNode
    }

    /**
     * ---------------------------------------------------------------
     * utils
     */

    /**
     * 统一path格式，以"/"开头，且结尾没有"/"
     * @param path 
     * @param startWithSlash 是否以"/"开头 @default true
     */
    export function standardPath(path: string, startWithSlash?: boolean): string

    /**
     * 拼接路径
     * @param paths
     */
    function joinPath(...paths: (string | undefined)[]): string

    /**
     * 获得跳转后的新路径，用于非history模式的路由跳转
     * @param currentPath 
     * @param navigateTo 
     */
    function navigatePath(currentPath: string, navigateTo: string): string

    /**
     * 截断路径
     * @param path 
     * @param truncate 
     * @returns null: 不匹配，string: 截断后的路径，''：精准匹配
     */
    function truncatePath(path: string, truncate: string | RegExp): string | null

    /**
     * 读取动态路径参数
     * @param routePath 
     * @param referencePath 
     * @returns 
     */
    function getPathParams(routePath: string, referencePath: string): Record<string, string>
}

export = Router