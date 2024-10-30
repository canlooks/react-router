import {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {NavigateOptions, RouterContext, RouterProps, To} from '..'
import {cloneLocation, isLocationChanged, navigatePath, unifyPath, unifySlash, useSync} from './utils'
import path from 'path-browserify'

export const routerContext = createContext({} as RouterContext)

export function useRouter() {
    return useContext(routerContext)
}

export function Router({
    mode = 'history',
    base = '/',
    children
}: RouterProps) {
    base ??= unifyPath(base || '/')

    const [clonedLocation, setClonedLocation] = useState(() => cloneLocation())

    const syncClonedLocation = useSync(clonedLocation)

    const updateClonedLocation = () => {
        // 该方法会在useEffect中调用，因此需要useSync来同步
        isLocationChanged(syncClonedLocation.current) && setClonedLocation(cloneLocation())
    }

    useEffect(() => {
        if (mode === 'history') {
            addEventListener('popstate', updateClonedLocation)
            return () => {
                removeEventListener('popstate', updateClonedLocation)
            }
        }
        return
    }, [])

    const [hash, setHash] = useState(() => mode === 'hash'
        ? location.hash.replace(/^#/, '') || '/'
        : ''
    )

    const [stack, setStack] = useState(() => mode === 'hash'
        ? [hash]
        : []
    )

    const [stackIndex, setStackIndex] = useState(0)

    const updateHash = (hash: string) => {
        if (mode === 'hash') {
            location.hash = hash
            updateClonedLocation()
        }
        setHash(hash)
    }

    const locationOfEachMode = useMemo(() => {
        return mode === 'history'
            ? clonedLocation
            : new URL(hash, clonedLocation.origin)
    }, [clonedLocation, hash, mode])

    const [innerState, setInnerState] = useState<any>(null)

    /**
     * 提供给context的方法
     * @param state
     */
    const setState = (state: any) => {
        mode === 'history' && history.replaceState(state, '')
        setInnerState(state)
    }

    const params = useRef<Record<string, string>>({})

    useMemo(() => {
        params.current = {}
    }, [locationOfEachMode])

    const pathname = useMemo(() => {
        const relative = path.relative(base, locationOfEachMode.pathname)
        if (relative[0] === '.') {
            return null
        }
        return '/' + relative
    }, [locationOfEachMode, base])

    /**
     * ------------------------------------------------------------------
     * 路由跳转方法
     */

    const navigate = (a: To | number, options?: NavigateOptions) => {
        if (typeof a === 'number') {
            if (!a) {
                return
            }
            if (mode === 'history') {
                history.go(a)
            } else {
                // mode === 'hash' || mode === 'memory'
                const targetIndex = stackIndex + a
                const targetHash = stack[targetIndex]
                if (typeof targetHash !== 'undefined') {
                    setStackIndex(targetIndex)
                    updateHash(targetHash)
                }
            }
        } else {
            // typeof a === 'string' || a instanceof URL
            const {
                replace,
                state = null,
                scrollRestore = true
            } = options || {}

            if (mode === 'history') {
                history.scrollRestoration = scrollRestore ? 'auto' : 'manual'
                const method = replace ? history.replaceState : history.pushState
                if (typeof a === 'string') {
                    a = unifySlash(a)
                    method.call(history, state, '', a[0] === '/'
                        // "/"开头需拼接base
                        ? path.join(base, a)
                        : a
                    )
                } else {
                    method.call(history, state, '', a)
                }
                updateClonedLocation()
            } else {
                // mode === 'hash' || mode === 'memory'
                const destination = navigatePath(hash, a, base)
                const newStack = replace
                    ? []
                    : stack.slice(0, stackIndex + 1)
                newStack.push(destination)
                setStack(newStack)
                setStackIndex(newStack.length - 1)
                updateHash(destination)
            }

            setInnerState(state)
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
        <routerContext.Provider value={{
            mode,
            base,
            location: locationOfEachMode,
            params: params.current,
            pathname,
            replace,
            navigate,
            back,
            forward,
            state: innerState,
            setState
        }}>
            {children}
        </routerContext.Provider>
    )
}

export function useQuery() {
    const {location: {search}} = useRouter()
    return new URLSearchParams(search)
}

export function useParams() {
    const {params} = useRouter()
    return params
}