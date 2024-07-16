import React, {useEffect, useRef, useState} from 'react'
import {createContext, useContext, useMemo} from 'react'
import {NavigateOptions, RouterContext, RouterProps} from '..'
import {copyLocation, isLocationChanged, joinPath, navigatePath} from './utils'

const routerContext = createContext({} as RouterContext)

export function useRouter() {
    return useContext(routerContext)
}

export function Router({
    mode = 'history',
    base = '/',
    children
}: RouterProps) {
    if (base[0] !== '/') {
        // base必须以"/"开头
        base = '/' + base
    }

    const [memoryHash, setMemoryHash] = useState(() => mode === 'hash'
        ? location.hash.replace(/^#/, '') || '/'
        : ''
    )

    const [memorisedStack, setMemorisedStack] = useState<string[]>(() => mode === 'hash'
        ? [memoryHash]
        : []
    )

    const [memoryStackIndex, setMemoryStackIndex] = useState(0)

    const params = useRef({})

    const [copiedLocation, setCopiedLocation] = useState(() => copyLocation())
    const updateLocation = () => {
        if (isLocationChanged(copiedLocation)) {
            params.current = {}
            setCopiedLocation(copyLocation())
        }
    }

    const locationUseByMode = useMemo(() => {
        return mode === 'history'
            ? copiedLocation
            : new URL(memoryHash, copiedLocation.origin)
    }, [mode, copiedLocation, memoryHash])

    const [state, setReactState] = useState(null)
    const setState = (state: any) => {
        mode === 'history' && history.replaceState(state, '')
        setReactState(state)
    }

    const navigate = (a: any, options?: NavigateOptions) => {
        if (typeof a === 'number') {
            if (mode === 'history') {
                history.go(a)
            } else if (!a) {
                return
            }
            // TODO mode === 'hash' || mode === 'memory'
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
                    // "/"开头拼接base
                    ? joinPath(base, a.slice(1))
                    // 非"/"开头直接交给History API处理
                    : a
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

    useEffect(() => {
        if (mode === 'history') {
            const popState = () => {
                updateLocation()
            }
            addEventListener('popstate', popState)
            return () => {
                removeEventListener('popstate', popState)
            }
        }
    }, [mode])

    return (
        <routerContext.Provider value={
            useMemo(() => ({
                mode, base, location: locationUseByMode, state, params: params.current,
                replace, navigate, back, forward, setState
            }), [
                mode, base, locationUseByMode, state, params.current
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