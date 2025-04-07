import {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {NavigateOptions, RouterContext as IRouterContext, RouterProps, To} from '..'
import {cloneLocation, isLocationChanged, joinPath, resolvePath, truncatePath, unifyPath, unifySlash, useSyncState} from './utils'

export const RouterContext = createContext({} as IRouterContext)

export function useRouter() {
    return useContext(RouterContext)
}

export function Router({
    mode = 'history',
    base = '/',
    children
}: RouterProps) {
    base = '/' + unifyPath(base)

    const [clonedLocation, setClonedLocation] = useSyncState(() => cloneLocation())

    const updateClonedLocation = () => {
        isLocationChanged(clonedLocation.current) && setClonedLocation(cloneLocation())
    }

    useEffect(() => {
        if (mode !== 'history') {
            return
        }
        addEventListener('popstate', updateClonedLocation)
        return () => {
            removeEventListener('popstate', updateClonedLocation)
        }
    }, [])

    const [hash, setHash] = useState(() => mode === 'hash'
        ? location.hash.slice(1) || '/'
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

    // 不同模式下的location对象
    const locationInMode = useMemo(() => {
        return mode === 'history'
            ? clonedLocation.current
            : new URL(hash, clonedLocation.current.origin)
    }, [clonedLocation.current, hash, mode])

    const [innerState, setInnerState] = useState<any>(null)

    // 提供给context的方法
    const setState = (state: any) => {
        mode === 'history' && history.replaceState(state, '')
        setInnerState(state)
    }

    const params = useRef<Record<string, string>>({})

    useMemo(() => {
        params.current = {}
    }, [locationInMode])

    // 截断base后的pathname
    const pathname = useMemo(() => {
        return '/' + truncatePath(locationInMode.pathname, base)
    }, [locationInMode, base])

    /**
     * ------------------------------------------------------------------
     * 路由跳转方法
     */

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
                const targetIndex = stackIndex + to
                const targetHash = stack[targetIndex]
                if (typeof targetHash !== 'undefined') {
                    setStackIndex(targetIndex)
                    updateHash(targetHash)
                }
            }
        } else {
            // typeof a === 'string' || a instanceof URL
            if (to instanceof URL && to.origin !== location.origin) {
                throw Error(`Cannot navigate different origin from "${location.origin}" to "${to.origin}".`)
            }
            if (mode === 'history') {
                history.scrollRestoration = scrollRestore ? 'auto' : 'manual'
                const method = replace ? history.replaceState : history.pushState
                if (typeof to === 'string') {
                    to = unifySlash(to)
                    method.call(history, state, '', to[0] === '/'
                        // "/"开头需拼接base
                        ? joinPath(base, to)
                        : to
                    )
                } else {
                    // to instanceof URL
                    method.call(history, state, '', to)
                }
                updateClonedLocation()
            } else {
                // mode === 'hash' || mode === 'memory'
                const destination = resolvePath(to, hash)
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
            state: innerState,
            setState
        }}>
            {children}
        </RouterContext>
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