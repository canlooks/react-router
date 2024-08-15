import React, {useEffect, useRef, useState} from 'react'
import {createContext, useContext, useMemo} from 'react'
import {NavigateOptions, RouterContext, RouterProps} from '..'
import {truncatePath, cloneLocation, isLocationChanged, joinPath, navigatePath, standardPath} from './utils'

const routerContext = createContext({} as RouterContext)

export function useRouter() {
    return useContext(routerContext)
}

export function Router({
    mode = 'history',
    base = '/',
    children
}: RouterProps) {
    base = standardPath(base)

    const [memoryHash, setMemoryHash] = useState(() => mode === 'hash'
        ? location.hash.replace(/^#/, '') || '/'
        : ''
    )

    const [memorisedStack, setMemorisedStack] = useState<string[]>(() => mode === 'hash'
        ? [memoryHash]
        : []
    )

    const [memoryStackIndex, setMemoryStackIndex] = useState(0)

    const [clonedLocation, setClonedLocation] = useState(() => cloneLocation())
    const syncLocation = useRef(clonedLocation)
    syncLocation.current = clonedLocation
    const updateLocation = () => {
        isLocationChanged(syncLocation.current) && setClonedLocation(cloneLocation())
    }

    const params = useRef<Record<string, string>>({})

    const locationUseInMode = useMemo(() => {
        // location改变需要清空params
        params.current = {}
        return mode === 'history'
            ? clonedLocation
            : new URL(memoryHash, clonedLocation.origin)
    }, [clonedLocation, memoryHash, mode])

    // 截断base，真正用于路由匹配的路径
    const routePath = useMemo(() => {
        return truncatePath(locationUseInMode.pathname, base)
    }, [locationUseInMode, base])

    const [state, setReactState] = useState(null)
    const setState = (state: any) => {
        mode === 'history' && history.replaceState(state, '')
        setReactState(state)
    }

    useEffect(() => {
        if (mode === 'history') {
            addEventListener('popstate', updateLocation)
            return () => {
                removeEventListener('popstate', updateLocation)
            }
        }
    }, [mode])

    /**
     * ------------------------------------------------------------------
     * 路由跳转方法
     */

    const navigate = (a: any, options?: NavigateOptions) => {
        if (typeof a === 'number') {
            if (mode === 'history') {
                history.go(a)
            } else if (!a) {
                return
            }
            // mode === 'hash' || mode === 'memory'
            const targetIndex = memoryStackIndex + a
            const targetHash = memorisedStack[targetIndex]
            if (typeof targetHash === 'string') {
                setMemoryStackIndex(targetIndex)
                updateMemoryHash(targetHash)
            }
        } else {
            const {replace, state = null} = options || {}
            if (mode === 'history') {
                history.scrollRestoration = options?.scrollRestore === false ? 'manual' : 'auto'
                const destination = a[0] === '/'
                    // "/"开头需拼接base
                    ? joinPath(base, a.slice(1))
                    : a
                console.log(95, destination) // XXX
                replace
                    ? history.replaceState(state, '', destination)
                    : history.pushState(state, '', destination)
                updateLocation()
            } else {
                // mode === 'hash' || mode === 'memory'
                const destination = navigatePath(memoryHash, a)
                const newStack = replace
                    ? []
                    : memorisedStack.slice(0, memoryStackIndex + 1)
                newStack.push(destination)
                setMemorisedStack(newStack)
                setMemoryStackIndex(newStack.length - 1)
                updateMemoryHash(destination)
            }
            setReactState(state)
        }

        function updateMemoryHash(hash: string) {
            if (mode === 'hash') {
                location.hash = hash
                updateLocation()
            }
            setMemoryHash(hash)
        }
    }

    const replace = (a: any, options: Omit<NavigateOptions, 'replace'> = {}) => {
        navigate(a, {
            ...options,
            replace: true
        })
    }

    const back = () => {
        if (mode === 'history') {
            history.back()
        } else {
            navigate(-1)
        }
    }

    const forward = () => {
        if (mode === 'history') {
            history.forward()
        } else {
            navigate(1)
        }
    }

    return (
        <routerContext.Provider value={
            useMemo(() => ({
                mode, base, location: locationUseInMode, routePath, state, params: params.current,
                replace, navigate, back, forward, setState
            }), [
                mode, base, locationUseInMode, state, params.current
            ])
        }>
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