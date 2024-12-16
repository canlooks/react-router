import React, {Dispatch, RefObject, ReactElement, ReactNode, SetStateAction} from 'react'

declare namespace Router {
    /**
     * ---------------------------------------------------------------
     * Router
     */

    type Mode = 'history' | 'hash' | 'memory'

    type To = string | URL

    type NavigateOptions = {
        state?: any
        replace?: boolean
        /** Whether to restore the location to which the user has scrolled */
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
        /** The path used to match routes(truncated by {@link base}) */
        pathname: string | null

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
        /** default `history` */
        mode?: Mode
        /** default `/` */
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

    function useRouteStackIndex(): number

    /** Get current matched route item. */
    function useCurrentRoute(): MatchedRouteItem | null

    /**
     * ---------------------------------------------------------------
     * Route
     */

    interface RouteItem extends Record<any, any> {
        path?: string | RegExp
        element?: ReactNode
        children?: RouteItem[]
        /** Whether extending sub routes is allowed {@default false} */
        extendable?: boolean
    }

    interface MatchedRouteItem extends RouteItem {
        subPath: string
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

    /** Get route path from {@link RouterProps.base} to current matched. */
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

    interface LinkProps extends NavigateProps, Partial<React.JSX.IntrinsicElements['a']> {
        children?: ReactNode
    }

    /**
     * ---------------------------------------------------------------
     * utils
     */

    /**
     * 将某个值使用ref同步，主要用于对付组件的闭包问题
     * @param value
     */
    function useSync<T>(value: T): RefObject<T>

    /**
     * 复制location对象，用于存储在react的state中以更新组件
     */
    function cloneLocation(): ILocation

    /**
     * 判断值是否为字符串或数字
     * @param value
     */
    function strOrNum(value: any): value is string | number

    /**
     * 浅比较，判断location是否发生改变
     */
    function isLocationChanged(clonedLocation: ILocation): boolean

    /**
     * 全部统一使用"/"
     * @param path
     */
    function unifySlash(path: string): string

    /**
     * 统一path格式，统一使用"/"；选择性以"/"开头，且末尾无"/"
     * @param path
     * @param endWithSlash {@default true} 是否以"/"开头
     */
    function unifyPath(path: string, endWithSlash?: boolean): string

    /**
     * 获得跳转后的新路径，用于非history模式的路由跳转
     * @param currentPath
     * @param navigateTo
     * @param base
     */
    function navigatePath(currentPath: string, navigateTo: string | URL, base: string): string

    /**
     * 从前端截断路径
     * @param fullPath
     * @param truncation
     * @returns {string} 返回截断后的子路径
     * @returns {null} 如果路径不匹配，返回null
     */
    function truncatePath(fullPath: string, truncation: string | RegExp | undefined): string | null

    /**
     * 读取动态路径参数，并得到替换后的路径
     * @param params
     * @param routePath {@link RouteItem.path}
     * @param referencePath
     * @returns {string} 替换后的路径
     * @returns {null} 路径不匹配会得到null
     */
    function insertPathParams(params: Record<string, string>, routePath: string, referencePath: string): string | null

    /**
     * 将glob通配符转换为正则表达式（支持*与?）
     * @param glob
     */
    function globToReg(glob: string): RegExp
}

export = Router