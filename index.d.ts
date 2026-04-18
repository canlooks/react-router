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
        pathname: string

        replace(to: To, options?: Omit<NavigateOptions, 'replace'>): void

        navigate(to: To, options?: NavigateOptions): void
        navigate(delta: number): void

        back(): void
        forward(): void

        state: any
        setState: Dispatch<SetStateAction<any>>

        params: Params

        /** @private */
        updateClonedLocation?(): void
        /** @private */
        updateHash?(hash: string): void
    }

    type RouterProps = {
        /** default is `history` */
        mode?: Mode
        /** default is `/` */
        base?: string
        entry: RouteItem
        /** Render when all routes not match. */
        notFound?: ReactNode
    }

    type RouteItem<T extends Record<any, any> = {}> = T & {
        layout?: ReactNode
        page?: ReactNode
        children?: Record<string, RouteItem<T>>
        /** @private */
        _parent?: RouteItem<T>
    }

    function Router(props: RouterProps): ReactElement

    function useRouter(): RouterContext

    function useSearchParams(): URLSearchParams

    /** @alias {@link useSearchParams} */
    function useQuery(): URLSearchParams

    function useParams(): Record<string, string>

    /**
     * ---------------------------------------------------------------
     * outlet
     */

    function useRouteStack<T extends RouteItem = RouteItem>(): T[]

    function useRouteLayoutStack<T extends RouteItem = RouteItem>(): T[]

    function useRouteLayoutStackIndex(): number

    function useCurrentRoute<T extends RouteItem = RouteItem>(): T

    function useOutlet(): ReactElement | null

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
     * @alias {@link Navigate} but with replace
     * @param props
     */
    function Redirect(props: RedirectProps): ReactElement


    /**
     * ---------------------------------------------------------------
     * link
     */

    type MergeProps<P1, P2> = P1 & Omit<P2, keyof P1>

    type LinkProps<C extends ElementType = 'a'> = { component?: C } & MergeProps<NavigateProps, ComponentPropsWithRef<C>>

    function Link<C extends ElementType = 'a'>(props: LinkProps<C>): ReactElement

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
     * @private 复制location对象，用于存储在react的state中以更新组件
     */
    function cloneLocation(): ILocation

    /**
     * @private 判断值是否为字符串或数字
     * @param value
     */
    function strOrNum(value: any): value is string | number

    /**
     * @private 浅比较，判断location是否发生改变
     */
    function isLocationChanged(clonedLocation: ILocation): boolean

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
     * 去掉路径的最后一段，执行该方法前需要先执行{@link unifySlash}
     * @param path
     */
    function dropLastPortion(path: string): string

    /**
     * 拼接路径
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