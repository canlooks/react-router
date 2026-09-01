import {Params, To} from '..'
import {Dispatch, RefObject, SetStateAction, useCallback, useRef, useState} from 'react'

export type RouteLocation = {
    pathname: string
    search: string
    hash: string
}

export const INTERNAL_ORIGIN = 'http://react-router.invalid'
const absoluteUrlPattern = /^[a-zA-Z][a-zA-Z\d+.-]*:/

export function getDocumentOrigin() {
    return typeof location === 'undefined' || !location.origin
        ? INTERNAL_ORIGIN
        : location.origin
}

export function normalizeUrlPathname(pathname: string) {
    pathname = unifySlash(pathname)

    if (!pathname) {
        return '/'
    }
    return pathname.startsWith('/') ? pathname : '/' + pathname
}

export function formatRouteLocation(routeLocation: RouteLocation) {
    return `${normalizeUrlPathname(routeLocation.pathname)}${routeLocation.search}${routeLocation.hash}`
}

export function routeLocationFromUrl(url: URL): RouteLocation {
    return {
        pathname: normalizeUrlPathname(url.pathname),
        search: url.search,
        hash: url.hash
    }
}

export function resolveInternalLocation(to: string, from: RouteLocation): RouteLocation {
    const fromUrl = new URL(formatRouteLocation(from), INTERNAL_ORIGIN)
    const resolved = new URL(to, fromUrl)
    return routeLocationFromUrl(resolved)
}

export function isAbsoluteUrlInput(to: string) {
    return absoluteUrlPattern.test(to) || to.startsWith('//')
}

export function safeDecodeSegment(value: string) {
    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}

/**
 * 将某个值使用ref同步，主要用于对付组件的闭包问题
 * @param value
 */
export function useSync<T>(value: T) {
    const ref = useRef<T>(value)
    ref.current = value
    return ref
}

/**
 * 同步的状态，state包裹在ref内，主要用于对付组件的闭包问题
 * @param initialState
 */
export function useSyncState<T>(initialState: T | (() => T)): [RefObject<T>, Dispatch<SetStateAction<T>>]
export function useSyncState<T = undefined>(): [RefObject<T | undefined>, Dispatch<SetStateAction<T | undefined>>]
export function useSyncState(initialState?: any): [RefObject<any>, Dispatch<SetStateAction<any>>] {
    const [state, setState] = useState(initialState)
    const synState = useSync(state)
    return [
        synState,
        useCallback(state => {
            const newState = typeof state === 'function' ? state(synState.current) : state
            synState.current !== newState && setState(synState.current = newState)
        }, [])
    ]
}

/**
 * 判断某个类型为`ReactNode`的变量是否"无法渲染"
 * @param it
 */
export function isUnset(it: any): it is undefined | null | false {
    return typeof it === 'undefined' || it === null || it === false
}

/**
 * 统一使用"/"，并且排除"//"的情况
 * @param path
 */
export function unifySlash(path: string) {
    return path
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
}

/**
 * 去掉开头的"/"，执行该方法前需要先执行{@link unifySlash}
 * @param path
 */
export function dropStartSlash(path: string) {
    return path.replace(/^\/+/, '')
}

/**
 * 去掉末尾的"/"，执行该方法前需要先执行{@link unifySlash}
 * @param path
 */
export function dropEndSlash(path: string) {
    return path.replace(/\/+$/, '')
}

/**
 * 统一path格式，去掉前后的"/"
 * @param path
 */
export function unifyPath(path: string) {
    path = unifySlash(path)
    path = dropStartSlash(path)
    return dropEndSlash(path)
}

/**
 * 去掉路径的search和hash
 * @param path
 */
function dropSearchAndHash(path: string) {
    const drop = (path: string, symbol: '?' | '#') => {
        const index = path.indexOf(symbol)
        if (index > -1) {
            return path.slice(0, index)
        }
        return path
    }
    path = drop(path, '?')
    return drop(path, '#')
}

function assertHierarchicalUrlBase(url: URL) {
    try {
        new URL('.', url)
    } catch {
        throw new TypeError(
            `Cannot join a relative reference to URL protocol "${url.protocol}".`
        )
    }
}

/**
 * 拼接路径
 * @param paths
 */
export function joinPath(...paths: string[]) {
    if (paths.length === 0) {
        return ''
    }
    if (paths.length === 1) {
        let [path] = paths
        if (isAbsoluteUrlInput(path)) {
            return new URL(path, getDocumentOrigin()).href
        }
        path = unifySlash(path)
        return dropEndSlash(path)
    }
    const fn = (prev: string, next: string) => {
        if (isAbsoluteUrlInput(next)) {
            return new URL(next, getDocumentOrigin()).href
        }

        const previousIsUrl = isAbsoluteUrlInput(prev)
        const previousUrl = previousIsUrl ? new URL(prev) : null
        const previousPath = previousUrl
            ? previousUrl.pathname
            : dropSearchAndHash(unifySlash(prev))

        next = unifySlash(next)
        if (!previousPath) {
            return next
        }
        if (!next) {
            if (previousUrl) {
                previousUrl.pathname = dropEndSlash(previousUrl.pathname) || '/'
                previousUrl.search = ''
                previousUrl.hash = ''
                return previousUrl.href
            }
            return dropEndSlash(previousPath)
        }

        if (previousUrl) {
            assertHierarchicalUrlBase(previousUrl)
        }

        if (next.startsWith('?') || next.startsWith('#')) {
            const base = previousUrl || new URL(
                (previousPath.startsWith('/') ? previousPath : '/' + previousPath),
                INTERNAL_ORIGIN
            )
            const resolved = new URL(next, base)
            if (previousUrl) {
                return resolved.href
            }
            const path = formatRouteLocation(resolved)
            return previousPath.startsWith('/') ? path : dropStartSlash(path)
        }

        if (next.startsWith('/')) {
            if (!previousUrl) {
                return dropEndSlash(next)
            }
            previousUrl.pathname = next
            previousUrl.search = ''
            previousUrl.hash = ''
            return previousUrl.href
        }

        const pathHasLeadingSlash = previousPath.startsWith('/')
        const directory = dropEndSlash(previousPath) + '/'
        const base = previousUrl
            ? new URL(directory, previousUrl)
            : new URL(
                pathHasLeadingSlash ? directory : '/' + directory,
                INTERNAL_ORIGIN
            )
        const resolved = new URL(next, base)
        resolved.pathname = dropEndSlash(resolved.pathname) || '/'

        if (previousUrl) {
            return resolved.href
        }
        const output = formatRouteLocation(resolved)
        return pathHasLeadingSlash ? output : dropStartSlash(output)
    }
    return paths.reduce(fn)
}

/**
 * 生成跳转路径
 * @param to
 * @param fromPath
 */
export function resolvePath(to: To, fromPath?: string | null) {
    if (to instanceof URL) {
        return to.href
    }
    if (isAbsoluteUrlInput(to)) {
        return new URL(to, getDocumentOrigin()).href
    }
    if (!fromPath) {
        return unifySlash(to)
    }

    const from = routeLocationFromUrl(new URL(
        fromPath.startsWith('/') ? fromPath : '/' + fromPath,
        INTERNAL_ORIGIN
    ))
    return formatRouteLocation(resolveInternalLocation(to, from))
}

/**
 * 从前端截断路径
 * @param pathname
 * @param scissor
 * @returns {string} 返回截断后的子路径
 * @returns {null} 如果路径不匹配，返回null
 */
export function truncatePath(pathname: string, scissor: string | RegExp | undefined): string | null {
    if (scissor instanceof RegExp) {
        const normalizedPathname = '/' + unifyPath(pathname)
        const flags = scissor.flags.replace(/[gy]/g, '')
        const match = normalizedPathname.match(new RegExp(scissor.source, flags))
        if (!match || typeof match.index !== 'number' || match.index > 1) {
            return null
        }
        const rest = normalizedPathname.slice(match.index + match[0].length)
        if (rest && !rest.startsWith('/')) {
            return null
        }
        return unifyPath(rest)
    }
    pathname = unifyPath(pathname)
    scissor = unifyPath(scissor || '')
    if (!scissor) {
        return pathname
    }
    if (pathname === scissor) {
        return ''
    }
    return pathname.startsWith(scissor + '/')
        ? pathname.slice(scissor.length + 1)
        : null
}

/** 判断路由段的匹配优先级。 */
export function segmentRank(segment: string) {
    if (segment === '**') {
        return 1
    }
    if (segment === '*') {
        return 2
    }
    if (segment.startsWith(':') && segment.length > 1) {
        return 3
    }
    return 4
}

/**
 * 匹配路径并获得路径中的参数
 * @param pathname
 * @param routePath
 * @returns {Record<string, string>} 返回匹配的参数
 * @returns {null} 如果路径不匹配，返回null
 */
export function matchPath(pathname: string, routePath: string) {
    const pathnameSegments = unifyPath(dropSearchAndHash(pathname))
        .split('/')
        .filter(Boolean)
    const routeSegments = unifyPath(routePath)
        .split('/')
        .filter(Boolean)

    const appendParam = (params: Params, name: string, value: string) => {
        const existing = params[name]
        if (typeof existing === 'string') {
            params[name] = [existing, value]
        } else if (Array.isArray(existing)) {
            params[name] = [...existing, value]
        } else {
            params[name] = value
        }
    }

    const recurse = (pathIndex: number, routeIndex: number, params: Params): Params | null => {
        if (routeIndex === routeSegments.length) {
            return pathIndex === pathnameSegments.length ? params : null
        }

        const routeSegment = routeSegments[routeIndex]
        const rank = segmentRank(routeSegment)
        if (rank === 1) {
            for (let nextPathIndex = pathnameSegments.length; nextPathIndex >= pathIndex; nextPathIndex--) {
                const matched = recurse(nextPathIndex, routeIndex + 1, {...params})
                if (matched) {
                    return matched
                }
            }
            return null
        }

        if (pathIndex >= pathnameSegments.length) {
            return null
        }

        const pathnameSegment = safeDecodeSegment(pathnameSegments[pathIndex])
        const nextParams = {...params}
        if (rank === 2) {
            appendParam(nextParams, '*', pathnameSegment)
        } else if (rank === 3) {
            appendParam(nextParams, routeSegment.slice(1), pathnameSegment)
        } else if (safeDecodeSegment(routeSegment) !== pathnameSegment) {
            return null
        }

        return recurse(pathIndex + 1, routeIndex + 1, nextParams)
    }

    return recurse(0, 0, {})
}
