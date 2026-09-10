import {createContext, memo, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {NavigateOptions, Params, RouterContext as IRouterContext, RouterProps, To} from '..'
import {cloneLocation, isLocationChanged, isStartWithProtocol, joinPath, resolvePath, truncatePath, unifyPath, useSync, useSyncState} from './utils'
import {Routes} from './routes'

export const RouterContext = createContext({} as IRouterContext)

export function useRouter() {
    return useContext(RouterContext)
}

type LocalEntry = {url: string; state: any}
type LocalHistory = {entries: LocalEntry[]; index: number}
const memoryOrigin = 'https://router.invalid/'

export const Router = memo(({
    mode = 'history',
    base = '/',
    entry,
    notFound
}: RouterProps) => {
    base = unifyPath(base)
    if (!isStartWithProtocol(base)) {
        base = '/' + base
    }

    const parentRouter = useRouter()

    const createLocalHistory = (): LocalHistory => ({
        entries: [{url: mode === 'hash' ? location.hash.slice(1) || '/' : base === '/' ? '/' : base + '/', state: null}],
        index: 0
    })
    const [localHistory, setLocalHistory] = useSyncState(createLocalHistory)
    const [clonedLocation, setClonedLocation] = useSyncState(() => mode === 'memory' ? undefined : cloneLocation())
    const [innerState, setInnerState] = useSyncState<any>(() => mode === 'history' ? history.state : null)
    const [activeMode, setActiveMode] = useState(mode)

    // Reset before rendering children so a mode change never exposes the previous mode's source.
    if (activeMode !== mode) {
        setActiveMode(mode)
        setLocalHistory(createLocalHistory())
        setClonedLocation(mode === 'memory' ? undefined : cloneLocation())
        setInnerState(() => mode === 'history' ? history.state : null)
    }

    const locationChange = () => {
        if (mode === 'memory') return false
        let changed = false
        if (isLocationChanged(clonedLocation.current!)) {
            setClonedLocation(cloneLocation())
            changed = true
        }
        if (mode === 'history' && innerState.current !== history.state) {
            setInnerState(() => history.state)
            changed = true
        }
        return changed
    }

    const updateClonedLocation = () => {
        locationChange() && parentRouter.updateClonedLocation?.()
    }

    const latestLocationChange = useSync(locationChange)
    useEffect(() => {
        if (mode === 'memory') return
        const handler = () => { latestLocationChange.current() }
        const event = mode === 'history' ? 'popstate' : 'hashchange'
        handler()
        addEventListener(event, handler)
        return () => removeEventListener(event, handler)
    }, [mode])

    const getLocationInMode = () => mode === 'history'
        ? clonedLocation.current!
        : mode === 'hash'
            ? new URL(clonedLocation.current!.hash.slice(1) || '/', clonedLocation.current!.origin)
            : new URL(localHistory.current.entries[localHistory.current.index].url, memoryOrigin)

    // 不同模式下的location对象
    const locationInMode = useMemo(getLocationInMode, [clonedLocation.current, localHistory.current, mode])

    // 提供给context的方法
    const setState = (action: any) => {
        const next = typeof action === 'function' ? action(innerState.current) : action
        // Native serialization may throw. Commit local values only after it succeeds.
        if (mode === 'history') {
            history.replaceState(next, '')
        } else {
            const {entries, index} = localHistory.current
            const updated = entries.slice()
            updated[index] = {...entries[index], state: next}
            setLocalHistory({entries: updated, index})
        }
        setInnerState(() => next)
        if (mode === 'history') parentRouter.updateClonedLocation?.()
    }

    const params = useRef<Params>({})

    // 截断base后的pathname
    const pathname = useMemo(() => {
        const truncated = truncatePath(locationInMode.pathname, base)
        return truncated === null ? null : joinPath('/', truncated)
    }, [locationInMode.pathname, base])

    /**
     * ------------------------------------------------------------------
     * 路由跳转方法
     */

    const commitLocalHistory = (next: LocalHistory, replace = false) => {
        const entry = next.entries[next.index]
        if (mode === 'hash') {
            if (replace) {
                const outerURL = new URL(location.href)
                outerURL.hash = entry.url
                history.replaceState(history.state, '', outerURL)
            } else {
                location.hash = entry.url
            }
        }
        setLocalHistory(next)
        setInnerState(() => entry.state)
        updateClonedLocation()
    }

    const navigate = (to: To | number, {
        replace,
        state = null,
        scrollRestore = true
    }: NavigateOptions = {}) => {
        if (typeof to === 'number') {
            if (!to) {
                return
            }
            if (mode === 'history') {
                history.go(to)
            } else {
                // mode === 'hash' || mode === 'memory'
                const {entries, index} = localHistory.current
                const targetIndex = index + to
                if (entries[targetIndex]) {
                    commitLocalHistory({entries, index: targetIndex})
                }
            }
        } else {
            // typeof a === 'string' || a instanceof URL
            const absolute = to instanceof URL ? to : isStartWithProtocol(to) ? new URL(to) : null
            if (mode !== 'memory' && absolute && absolute.origin !== location.origin) {
                throw Error(`Cannot navigate different origin from "${location.origin}" to "${absolute.origin}".`)
            }

            const current = getLocationInMode()
            let destination: string
            if (absolute) {
                destination = mode === 'history' ? absolute.href : absolute.pathname + absolute.search + absolute.hash
            } else {
                const path = resolvePath(to)
                destination = resolvePath(path[0] === '/' && base !== '/' ? base + path : path,
                    current.pathname + current.search + current.hash)
            }

            if (mode === 'history') {
                const method = replace ? history.replaceState : history.pushState
                method.call(history, state, '', destination)
                history.scrollRestoration = scrollRestore ? 'auto' : 'manual'
                updateClonedLocation()
            } else {
                // mode === 'hash' || mode === 'memory'
                const {entries, index} = localHistory.current
                const updated = replace ? entries.slice() : entries.slice(0, index + 1)
                const nextIndex = replace ? index : updated.length
                updated[nextIndex] = {url: destination, state}
                commitLocalHistory({entries: updated, index: nextIndex}, replace)
            }
        }
    }

    const replace = (a: To, options: Omit<NavigateOptions, 'replace'> = {}) => {
        navigate(a, {
            ...options,
            replace: true
        })
    }

    const back = () => {
        mode === 'history'
            ? history.back()
            : navigate(-1)
    }

    const forward = () => {
        mode === 'history'
            ? history.forward()
            : navigate(1)
    }

    return (
        <RouterContext value={{
            mode,
            base,
            location: locationInMode,
            params: params.current,
            pathname,
            replace,
            navigate,
            back,
            forward,
            state: innerState.current,
            setState,

            updateClonedLocation,
            // A child has already written the hash; parent notifications only refresh snapshots.
            updateHash: updateClonedLocation
        }}>
            <Routes entry={entry} notFound={notFound}/>
        </RouterContext>
    )
})

export function useSearchParams() {
    const {location: {search}} = useRouter()
    return new URLSearchParams(search)
}

export function useQuery() {
    return useSearchParams()
}

export function useParams() {
    const {params} = useRouter()
    return params
}
