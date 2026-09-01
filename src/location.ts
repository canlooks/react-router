import type {ILocation, Mode, To} from '..'
import {
    dropEndSlash,
    formatRouteLocation,
    getDocumentOrigin,
    INTERNAL_ORIGIN,
    isAbsoluteUrlInput,
    normalizeUrlPathname,
    resolveInternalLocation,
    routeLocationFromUrl
} from './utils'
import type {RouteLocation} from './utils'

export {
    formatRouteLocation,
    getDocumentOrigin,
    isAbsoluteUrlInput,
    normalizeUrlPathname,
    resolveInternalLocation,
    routeLocationFromUrl,
    safeDecodeSegment
} from './utils'
export type {RouteLocation} from './utils'

export type ResolvedNavigation = {
    /** Base-truncated location used by the route matcher. */
    internal: RouteLocation | null
    /** Location including the configured Router base. */
    external: RouteLocation | null
    /** Value suitable for an anchor href. */
    href: string
    /** True when the target must be handled by the browser instead of the Router. */
    externalTarget: boolean
    /** True when a same-origin absolute target is outside the configured base. */
    outsideBase: boolean
    absoluteInput: boolean
}

const encodedSegmentTokenPattern = /(?:%[0-9a-fA-F]{2})+|%|[^%]+/g

function canonicalizeUrlPathSegment(segment: string) {
    const tokens = Array.from(
        segment.matchAll(encodedSegmentTokenPattern),
        match => match[0]
    )
    return tokens.map(token => {
        if (token === '%') {
            return token
        }
        if (token.startsWith('%')) {
            try {
                return encodeURIComponent(decodeURIComponent(token))
            } catch {
                return token.replace(/%([0-9a-fA-F]{2})/g, (_, hex: string) => {
                    return '%' + hex.toUpperCase()
                })
            }
        }
        return encodeURIComponent(token)
    }).join('')
}

export function normalizeBase(base: string) {
    if (isAbsoluteUrlInput(base) || /[?#]/.test(base)) {
        throw new TypeError(`Router base must be a pathname, received "${base}".`)
    }

    const normalized = dropEndSlash(normalizeUrlPathname(base))
    if (!normalized) {
        return '/'
    }
    return normalized
        .split('/')
        .map((segment, index) => index === 0
            ? ''
            : canonicalizeUrlPathSegment(segment))
        .join('/')
}

export function stripBasePath(pathname: string, base: string) {
    pathname = normalizeUrlPathname(pathname)
    base = normalizeBase(base)

    if (base === '/') {
        return pathname
    }

    const keepTrailingSlash = pathname.length > 1 && pathname.endsWith('/')
    const pathnameSegments = pathname.split('/').filter(Boolean)
    const baseSegments = base.split('/').filter(Boolean)
    if (pathnameSegments.length < baseSegments.length ||
        baseSegments.some((segment, index) => {
            return canonicalizeUrlPathSegment(pathnameSegments[index]) !== segment
        })) {
        return null
    }

    const truncatedSegments = pathnameSegments.slice(baseSegments.length)
    if (truncatedSegments.length === 0) {
        return '/'
    }
    return '/' + truncatedSegments.join('/') + (keepTrailingSlash ? '/' : '')
}

export function addBasePath(pathname: string, base: string) {
    pathname = normalizeUrlPathname(pathname)
    base = normalizeBase(base)

    if (base === '/') {
        return pathname
    }
    return pathname === '/' ? base : base + pathname
}

export function toILocation(url: URL): ILocation {
    return {
        hash: url.hash,
        host: url.host,
        hostname: url.hostname,
        href: url.href,
        origin: url.origin,
        pathname: normalizeUrlPathname(url.pathname),
        port: url.port,
        protocol: url.protocol,
        search: url.search
    }
}

export function routeLocationFromHash(hash: string) {
    const value = hash.replace(/^#/, '') || '/'
    return routeLocationFromUrl(new URL(value, INTERNAL_ORIGIN + '/'))
}

export function resolveNavigation(
    to: To,
    from: RouteLocation,
    mode: Mode,
    base: string,
    documentOrigin = getDocumentOrigin()
): ResolvedNavigation {
    base = normalizeBase(base)
    const absoluteInput = to instanceof URL || isAbsoluteUrlInput(to)

    if (absoluteInput) {
        const url = to instanceof URL
            ? new URL(to.href)
            : new URL(to, documentOrigin)
        const externalTarget = !/^https?:$/.test(url.protocol) || url.origin !== documentOrigin
        const external = routeLocationFromUrl(url)
        const internalPathname = externalTarget
            ? null
            : stripBasePath(external.pathname, base)
        const outsideBase = !externalTarget && internalPathname === null
        const internal = internalPathname === null
            ? null
            : {...external, pathname: internalPathname}

        return {
            internal,
            external,
            href: mode === 'hash' && internal
                ? '#' + formatRouteLocation(external)
                : url.href,
            externalTarget,
            outsideBase,
            absoluteInput: true
        }
    }

    const internal = resolveInternalLocation(to, from)
    const external = {
        ...internal,
        pathname: addBasePath(internal.pathname, base)
    }
    const routeHref = formatRouteLocation(external)

    return {
        internal,
        external,
        href: mode === 'hash' ? '#' + routeHref : routeHref,
        externalTarget: false,
        outsideBase: false,
        absoluteInput: false
    }
}
