import {Dispatch, RefObject, ReactElement, ReactNode, SetStateAction, ElementType, ComponentPropsWithRef} from 'react'

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

    type Params = Record<string, string | string[]>

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

        params: Params

        /** @deprecated Browser routers synchronize automatically. @private */
        updateClonedLocation?(): boolean
        /** @private */
        updateHash?(hash: string): void
    }

    type RouterProps = {
        /** default is `history` */
        mode?: Mode
        /** Pathname-only base. Unicode and percent-encoded segments are matched canonically. Default is `/`. */
        base?: string
        entry: RouteItem
        /** Render inside an empty route-stack context when no route matches. */
        notFound?: ReactNode
    }

    type RouteItem<T extends Record<any, any> = {}> = T & {
        layout?: ReactNode
        page?: ReactNode
        children?: Record<string, RouteItem<T>>
    }

    function Router(props: RouterProps): ReactElement

    function useRouter(): RouterContext

    function useSearchParams(): URLSearchParams

    /** @alias {@link useSearchParams} */
    function useQuery(): URLSearchParams

    function useParams(): Params

    /**
     * ---------------------------------------------------------------
     * outlet
     */

    function useRouteStack<T extends RouteItem = RouteItem>(): T[]

    function useRouteLayoutStack<T extends RouteItem = RouteItem>(): T[]

    function useRouteLayoutStackIndex(): number

    function useCurrentRoute<T extends RouteItem = RouteItem>(): T | undefined

    function useOutlet(): ReactElement | null

    function Outlet(): ReactElement | null


    /**
     * ---------------------------------------------------------------
     * navigate
     */

    function useNavigate(): RouterContext['navigate']

    interface NavigateProps extends NavigateOptions {
        to?: To
        delta?: number
    }

    function Navigate(props: NavigateProps): ReactElement | null

    type RedirectProps = Omit<NavigateProps, 'replace'>

    /**
     * @alias {@link Navigate} but with replace
     * @param props
     */
    function Redirect(props: RedirectProps): ReactElement | null


    /**
     * ---------------------------------------------------------------
     * link
     */

    type MergeProps<P1, P2> = P1 & Omit<P2, keyof P1>

    type LinkProps<C extends ElementType = 'a'> = { component?: C } & MergeProps<NavigateProps, ComponentPropsWithRef<C>>

    function Link<C extends ElementType = 'a'>(props: LinkProps<C>): ReactElement

    /**
     * Resolve a destination in the current Router mode and base.
     * `undefined` returns `''`; an empty string is a valid URL reference and
     * resolves to the current pathname/query without the current hash.
     */
    function useResolvePath(to?: To): string

    /**
     * ---------------------------------------------------------------
     * utils
     */

    /**
     * @private 将某个值使用ref同步，主要用于对付组件的闭包问题
     * @param value
     */
    function useSync<T>(value: T): RefObject<T>

    /**
     * 同步的状态，state包裹在ref内，主要用于对付组件的闭包问题
     * @param initialState
     */
    function useSyncState<T>(initialState: T | (() => T)): [RefObject<T>, Dispatch<SetStateAction<T>>]
    function useSyncState<T = undefined>(): [RefObject<T | undefined>, Dispatch<SetStateAction<T | undefined>>]

    /**
     * @private 全部统一使用"/"
     * @param path
     */
    function unifySlash(path: string): string

    /**
     * 去掉开头的"/"，执行该方法前需要先执行{@link unifySlash}
     * @param path
     */
    function dropStartSlash(path: string): string

    /**
     * 去掉末尾的"/"，执行该方法前需要先执行{@link unifySlash}
     * @param path
     */
    function dropEndSlash(path: string): string

    /**
     * 统一path格式，去掉前后的"/"
     * @param path
     */
    function unifyPath(path: string): string

    /**
     * 拼接路径。完整 URL 会保留 username/password/host/port；相对引用要求
     * 前一个 URL 使用分层协议，mailto/data 等不透明 URL 会抛出 TypeError。
     * @param paths
     */
    function joinPath(...paths: string[]): string

    /**
     * 生成跳转路径
     * @param to
     * @param fromPath
     */
    function resolvePath(to: To, fromPath?: string | null): string

    /**
     * 从前端截断路径
     * @param referencePath
     * @param routePath
     * @returns {string} 返回截断后的子路径
     * @returns {null} 如果路径不匹配，返回null
     */
    function truncatePath(referencePath: string, routePath: string | RegExp | undefined): string | null

    /**
     * 匹配路径并获得路径中的参数
     * @param pathname
     * @param routePath
     * @returns {Params} 返回匹配的参数
     * @returns {null} 如果路径不匹配，返回null
     */
    function matchPath(pathname: string, routePath: string): Params | null
}

export = Router
