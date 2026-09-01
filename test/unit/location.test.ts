import {describe, expect, it, vi} from 'vitest'
import {
    addBasePath,
    formatRouteLocation,
    getDocumentOrigin,
    isAbsoluteUrlInput,
    normalizeBase,
    normalizeUrlPathname,
    resolveInternalLocation,
    resolveNavigation,
    routeLocationFromHash,
    routeLocationFromUrl,
    safeDecodeSegment,
    stripBasePath,
    toILocation,
} from '../../src/location'

const root = {pathname: '/', search: '', hash: ''}

describe('location primitives', () => {
    it('normalizes empty, relative, repeated, and backslash pathnames', () => {
        expect(normalizeUrlPathname('')).toBe('/')
        expect(normalizeUrlPathname('a\\b//c')).toBe('/a/b/c')
        expect(normalizeUrlPathname('/ready')).toBe('/ready')
    })

    it('normalizes and encodes pathname-only bases', () => {
        expect(normalizeBase('')).toBe('/')
        expect(normalizeBase('/')).toBe('/')
        expect(normalizeBase('app/')).toBe('/app')
        expect(normalizeBase('/应用')).toBe('/%E5%BA%94%E7%94%A8')
        expect(normalizeBase('/%e5%ba%94%e7%94%a8')).toBe('/%E5%BA%94%E7%94%A8')
        expect(normalizeBase('/%E5%ba%94%e7%94%A8')).toBe('/%E5%BA%94%E7%94%A8')
    })

    it.each(['https://example.com/app', '//example.com/app', '/app?q=1', '/app#hash'])(
        'rejects non-pathname base %s',
        base => expect(() => normalizeBase(base)).toThrow(TypeError),
    )

    it('adds and strips bases only on segment boundaries', () => {
        expect(stripBasePath('/app', '/app')).toBe('/')
        expect(stripBasePath('/app/users', '/app')).toBe('/users')
        expect(stripBasePath('/app/users/', '/app')).toBe('/users/')
        expect(stripBasePath('/application', '/app')).toBeNull()
        expect(stripBasePath('/users', '/')).toBe('/users')
        expect(stripBasePath('/users/', '/')).toBe('/users/')
        expect(addBasePath('/', '/app')).toBe('/app')
        expect(addBasePath('/users', '/app')).toBe('/app/users')
        expect(addBasePath('/users', '/')).toBe('/users')
    })

    it('matches literal and percent-encoded Unicode bases canonically', () => {
        expect(stripBasePath('/%e5%ba%94%e7%94%a8/home', '/应用')).toBe('/home')
        expect(stripBasePath('/%E5%BA%94%E7%94%A8/home/', '/应用')).toBe('/home/')
        expect(stripBasePath('/应用/home', '/%e5%ba%94%e7%94%a8')).toBe('/home')
    })

    it('preserves encoded path boundaries while matching bases', () => {
        expect(stripBasePath('/a%2fb/home', '/a%2Fb')).toBe('/home')
        expect(stripBasePath('/a/b/home', '/a%2Fb')).toBeNull()
    })

    it('normalizes malformed percent sequences without losing Unicode text', () => {
        expect(normalizeBase('/坏%2')).toBe('/%E5%9D%8F%2')
        expect(stripBasePath('/%e5%9d%8f%2/home', '/坏%2')).toBe('/home')
        expect(normalizeBase('/%ff')).toBe('/%FF')
        expect(stripBasePath('/%ff/home', '/%FF')).toBe('/home')
    })

    it('matches encoded unreserved characters while retaining ASCII case sensitivity', () => {
        expect(stripBasePath('/%61pp/home', '/app')).toBe('/home')
        expect(stripBasePath('/App/home', '/app')).toBeNull()
    })

    it('formats and parses route locations without mixing path, search, and hash', () => {
        const route = {pathname: '/a', search: '?q=1', hash: '#part'}
        expect(formatRouteLocation(route)).toBe('/a?q=1#part')
        expect(routeLocationFromHash('#/a?q=1#part')).toEqual(route)
        expect(routeLocationFromHash('')).toEqual(root)
        expect(routeLocationFromUrl(new URL('https://example.com/a?q=1#part'))).toEqual(route)
        expect(toILocation(new URL('https://example.com:8443/a?q=1#part'))).toMatchObject({
            protocol: 'https:',
            hostname: 'example.com',
            port: '8443',
            pathname: '/a',
            search: '?q=1',
            hash: '#part',
        })
    })

    it('resolves relative path, search, and hash using URL semantics', () => {
        const from = {pathname: '/a/b', search: '?old=1', hash: '#old'}
        expect(resolveInternalLocation('../c', from)).toEqual({pathname: '/c', search: '', hash: ''})
        expect(resolveInternalLocation('?new=1', from)).toEqual({pathname: '/a/b', search: '?new=1', hash: ''})
        expect(resolveInternalLocation('#new', from)).toEqual({pathname: '/a/b', search: '?old=1', hash: '#new'})
    })

    it('recognizes schemes and network-path URL inputs', () => {
        expect(isAbsoluteUrlInput('https://example.com')).toBe(true)
        expect(isAbsoluteUrlInput('mailto:test@example.com')).toBe(true)
        expect(isAbsoluteUrlInput('//example.com/path')).toBe(true)
        expect(isAbsoluteUrlInput('/local')).toBe(false)
    })

    it('resolves route strings for history and hash modes with base', () => {
        expect(resolveNavigation('/next', root, 'history', '/app', 'https://example.com')).toMatchObject({
            internal: {pathname: '/next', search: '', hash: ''},
            external: {pathname: '/app/next', search: '', hash: ''},
            href: '/app/next',
            externalTarget: false,
        })
        expect(resolveNavigation('/next', root, 'hash', '/app', 'https://example.com').href)
            .toBe('#/app/next')
    })

    it('treats an empty navigation target as the current path without its hash', () => {
        const current = {pathname: '/current', search: '?x=1', hash: '#old'}

        expect(resolveNavigation('', current, 'history', '/').href).toBe('/current?x=1')
        expect(resolveNavigation('', current, 'hash', '/app').href).toBe('#/app/current?x=1')
    })

    it('resolves same-origin absolute URLs, including hash mode', () => {
        const url = new URL('https://example.com/app/next?q=1#part')
        expect(resolveNavigation(url, root, 'history', '/app', url.origin)).toMatchObject({
            internal: {pathname: '/next', search: '?q=1', hash: '#part'},
            href: url.href,
            externalTarget: false,
            outsideBase: false,
        })
        expect(resolveNavigation(url.href, root, 'hash', '/app', url.origin).href)
            .toBe('#/app/next?q=1#part')
    })

    it('classifies cross-origin, non-http, and outside-base targets', () => {
        expect(resolveNavigation(
            new URL('https://other.example/path'), root, 'history', '/', 'https://example.com',
        ).externalTarget).toBe(true)
        expect(resolveNavigation(
            'mailto:test@example.com', root, 'history', '/', 'https://example.com',
        ).externalTarget).toBe(true)
        expect(resolveNavigation(
            new URL('https://example.com/outside'), root, 'history', '/app', 'https://example.com',
        )).toMatchObject({internal: null, outsideBase: true})
    })

    it('returns the active document origin and safely decodes segments', () => {
        expect(getDocumentOrigin()).toBe(location.origin)
        expect(safeDecodeSegment('%E4%B8%AD')).toBe('中')
        expect(safeDecodeSegment('bad%2')).toBe('bad%2')
    })

    it('uses a deterministic fallback origin when no document location exists', () => {
        const currentLocation = globalThis.location
        vi.stubGlobal('location', undefined)
        expect(getDocumentOrigin()).toBe('http://react-router.invalid')
        vi.stubGlobal('location', currentLocation)
    })
})
