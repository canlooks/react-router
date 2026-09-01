import {
    createContext,
    memo,
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore
} from 'react'
import {NavigateOptions, Params, RouterContext as IRouterContext, RouterProps, To} from '..'
import {
    addBasePath,
    formatRouteLocation,
    getDocumentOrigin,
    normalizeBase,
    resolveNavigation,
    RouteLocation,
    routeLocationFromHash,
    stripBasePath,
    toILocation
} from './location'
import {Routes} from './routes'
import {dropEndSlash, useSync, useSyncState} from './utils'

type RouterEntry = {
    location: RouteLocation
    state: any
    key: string
}

type MemoryHistory = {
    entries: RouterEntry[]
    index: number
}

type BrowserSnapshot = {
    href: string
    state: any
    revision: number
}

type BrowserMode = Exclude<RouterProps['mode'], 'memory' | undefined>
type BrowserChangeSource = 'navigation' | 'traversal'
type BrowserSubscriber = (source: BrowserChangeSource) => void

const memoryBrowserSnapshot: BrowserSnapshot = {
    href: '',
    state: null,
    revision: 0
}

let sharedBrowserSnapshot: BrowserSnapshot | undefined
const browserSubscribers = new Map<BrowserSubscriber, BrowserMode>()
let hashSubscriberCount = 0

let entrySequence = 0

function createEntryKey() {
    entrySequence += 1
    return `router-${entrySequence}`
}

function readBrowserLocation(mode: BrowserMode, href: string) {
    const browserUrl = new URL(href)
    if (mode === 'hash') {
        const routeLocation = routeLocationFromHash(browserUrl.hash)
        return toILocation(new URL(formatRouteLocation(routeLocation), browserUrl.origin))
    }
    return toILocation(browserUrl)
}

function readHistoryState() {
    return history.state
}

function getBrowserSnapshot() {
    if (!sharedBrowserSnapshot) {
        sharedBrowserSnapshot = {
            href: window.location.href,
            state: readHistoryState(),
            revision: 0
        }
    }
    return sharedBrowserSnapshot
}

function publishBrowserLocation(
    state: any,
    source: BrowserChangeSource,
    force = false
) {
    const previous = getBrowserSnapshot()
    const href = window.location.href
    if (!force && previous.href === href && Object.is(previous.state, state)) {
        return false
    }

    sharedBrowserSnapshot = {
        href,
        state,
        revision: previous.revision + 1
    }
    for (const subscriber of browserSubscribers.keys()) {
        subscriber(source)
    }
    return true
}

function onBrowserPopState(event: PopStateEvent) {
    publishBrowserLocation(event.state, 'traversal')
}

function onBrowserHashChange() {
    if (getBrowserSnapshot().href === window.location.href) {
        return
    }
    publishBrowserLocation(readHistoryState(), 'traversal')
}

function subscribeBrowserLocation(mode: BrowserMode, subscriber: BrowserSubscriber) {
    const firstBrowserSubscriber = browserSubscribers.size === 0
    browserSubscribers.set(subscriber, mode)
    if (firstBrowserSubscriber) {
        window.addEventListener('popstate', onBrowserPopState)
    }
    if (mode === 'hash') {
        hashSubscriberCount += 1
        if (hashSubscriberCount === 1) {
            window.addEventListener('hashchange', onBrowserHashChange)
        }
    }

    return () => {
        browserSubscribers.delete(subscriber)
        if (mode === 'hash') {
            hashSubscriberCount -= 1
            if (hashSubscriberCount === 0) {
                window.removeEventListener('hashchange', onBrowserHashChange)
            }
        }
        if (browserSubscribers.size === 0) {
            window.removeEventListener('popstate', onBrowserPopState)
            sharedBrowserSnapshot = undefined
        }
    }
}

export const RouterContext = createContext({} as IRouterContext)

const EMPTY_PARAMS = Object.freeze({}) as Params

export function useRouter() {
    return useContext(RouterContext)
}

export const Router = memo(({
    mode = 'history',
    base = '/',
    entry,
    notFound
}: RouterProps) => {
    base = normalizeBase(base)

    const modeRef = useSync(mode)
    const baseRef = useSync(base)

    const pendingScrollResetRef = useRef(false)
    const [scrollRevision, setScrollRevision] = useState(0)

    const subscribeToBrowserLocation = useCallback((notify: () => void) => {
        if (mode === 'memory') {
            return () => undefined
        }
        return subscribeBrowserLocation(mode, source => {
            if (source === 'traversal') {
                pendingScrollResetRef.current = false
            }
            notify()
        })
    }, [mode])
    const getCurrentBrowserSnapshot = useCallback(() => {
        return mode === 'memory' ? memoryBrowserSnapshot : getBrowserSnapshot()
    }, [mode])
    const browserSnapshot = useSyncExternalStore(
        subscribeToBrowserLocation,
        getCurrentBrowserSnapshot,
        getCurrentBrowserSnapshot
    )

    const [memoryHistoryRef, setMemoryHistory] = useSyncState<MemoryHistory>(() => ({
        entries: [{
            location: {pathname: '/', search: '', hash: ''},
            state: null,
            key: createEntryKey()
        }],
        index: 0
    }))

    const memoryHistory = memoryHistoryRef.current
    const memoryEntry = memoryHistory.entries[memoryHistory.index]

    const locationInMode = useMemo(() => {
        if (mode !== 'memory') {
            return readBrowserLocation(mode, browserSnapshot.href)
        }

        const externalLocation = {
            ...memoryEntry.location,
            pathname: addBasePath(memoryEntry.location.pathname, base)
        }
        return toILocation(new URL(formatRouteLocation(externalLocation), getDocumentOrigin()))
    }, [mode, base, browserSnapshot.href, browserSnapshot.revision, memoryEntry])

    const state = mode === 'memory' ? memoryEntry.state : browserSnapshot.state

    const pathname = useMemo(() => {
        const truncated = stripBasePath(locationInMode.pathname, base)
        if (truncated === null) {
            return null
        }
        return dropEndSlash(truncated) || '/'
    }, [locationInMode.pathname, base])

    const currentInternalLocation = useMemo<RouteLocation>(() => ({
        pathname: pathname || '/',
        search: locationInMode.search,
        hash: locationInMode.hash
    }), [pathname, locationInMode.search, locationInMode.hash])
    const currentInternalLocationRef = useSync(currentInternalLocation)

    const scheduleScrollReset = useCallback(() => {
        pendingScrollResetRef.current = true
        setScrollRevision(revision => revision + 1)
    }, [])

    useLayoutEffect(() => {
        if (!pendingScrollResetRef.current) {
            return
        }
        pendingScrollResetRef.current = false
        if (typeof window.scrollTo === 'function') {
            window.scrollTo({left: 0, top: 0, behavior: 'auto'})
        }
    }, [scrollRevision, locationInMode.href])

    const navigate = useCallback((to: To | number, options: NavigateOptions = {}) => {
        const currentMode = modeRef.current
        if (typeof to === 'number') {
            if (!to) {
                return
            }
            pendingScrollResetRef.current = false
            if (currentMode === 'memory') {
                setMemoryHistory(current => {
                    const targetIndex = current.index + to
                    if (targetIndex < 0 || targetIndex >= current.entries.length) {
                        return current
                    }
                    return {...current, index: targetIndex}
                })
            } else {
                history.go(to)
            }
            return
        }

        const {
            replace = false,
            state: nextState = null,
            scrollRestore = true
        } = options
        const resolved = resolveNavigation(
            to,
            currentInternalLocationRef.current,
            currentMode,
            baseRef.current
        )

        if (resolved.externalTarget) {
            throw new Error(
                `Cannot navigate different origin from "${getDocumentOrigin()}" to "${resolved.href}".`
            )
        }
        if (resolved.outsideBase || !resolved.internal || !resolved.external) {
            throw new Error(
                `Cannot navigate outside Router base "${baseRef.current}" to "${resolved.href}".`
            )
        }

        if (currentMode === 'memory') {
            const nextEntry: RouterEntry = {
                location: resolved.internal,
                state: nextState,
                key: createEntryKey()
            }
            setMemoryHistory(current => {
                if (replace) {
                    const entries = [...current.entries]
                    entries[current.index] = nextEntry
                    return {...current, entries}
                }
                const entries = current.entries.slice(0, current.index + 1)
                entries.push(nextEntry)
                return {entries, index: entries.length - 1}
            })
        } else {
            const method = replace ? history.replaceState : history.pushState
            method.call(history, nextState, '', resolved.href)
            publishBrowserLocation(nextState, 'navigation', true)
        }

        if (!scrollRestore) {
            scheduleScrollReset()
        }
    }, [scheduleScrollReset])

    const replace = useCallback((to: To, options: Omit<NavigateOptions, 'replace'> = {}) => {
        navigate(to, {...options, replace: true})
    }, [navigate])

    const back = useCallback(() => {
        if (modeRef.current === 'memory') {
            navigate(-1)
        } else {
            pendingScrollResetRef.current = false
            history.back()
        }
    }, [navigate])

    const forward = useCallback(() => {
        if (modeRef.current === 'memory') {
            navigate(1)
        } else {
            pendingScrollResetRef.current = false
            history.forward()
        }
    }, [navigate])

    const setState = useCallback((action: any) => {
        const currentState = modeRef.current === 'memory'
            ? memoryHistoryRef.current.entries[memoryHistoryRef.current.index].state
            : getBrowserSnapshot().state
        const nextState = typeof action === 'function'
            ? action(currentState)
            : action

        if (modeRef.current === 'memory') {
            setMemoryHistory(current => {
                const entries = [...current.entries]
                entries[current.index] = {...entries[current.index], state: nextState}
                return {...current, entries}
            })
            return
        }

        history.replaceState(nextState, '')
        publishBrowserLocation(nextState, 'navigation', true)
    }, [])

    const updateClonedLocation = useCallback(() => {
        if (modeRef.current === 'memory') {
            return false
        }
        return publishBrowserLocation(readHistoryState(), 'navigation', true)
    }, [])

    const contextValue = useMemo<IRouterContext>(() => ({
        mode,
        base,
        location: locationInMode,
        params: EMPTY_PARAMS,
        pathname,
        replace,
        navigate,
        back,
        forward,
        state,
        setState,
        updateClonedLocation
    }), [
        mode,
        base,
        locationInMode,
        pathname,
        replace,
        navigate,
        back,
        forward,
        state,
        setState,
        updateClonedLocation
    ])

    return (
        <RouterContext value={contextValue}>
            <Routes entry={entry} notFound={notFound}/>
        </RouterContext>
    )
})

export function useSearchParams() {
    const {location: {search}} = useRouter()
    return useMemo(() => new URLSearchParams(search), [search])
}

export function useQuery() {
    return useSearchParams()
}

export function useParams() {
    const {params} = useRouter()
    return params
}
