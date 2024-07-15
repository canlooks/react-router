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
        ? location.hash.replace(/^#/, '')
        : ''
    )

    const memoryStack = useRef<string[]>([])

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
            }
        } else {
            const {replace, state = null} = options || {}
            if (mode === 'history') {
                // history模式下，非"/"开头的路径直接交给History API处理
                const destination = a[0] === '/'
                    ? joinPath(base, a.slice(1))
                    : a
                replace
                    ? history.replaceState(state, '', destination)
                    : history.pushState(state, '', destination)
            } else {
                // mode === 'hash' || mode === 'memory'
                const destination = navigatePath(memoryHash, a)
                if (replace) {
                    memoryStack.current! = []
                }
                memoryStack.current!.push(destination)
                if (mode === 'hash') {
                    location.hash = destination
                }
                setMemoryHash(destination)
            }
            updateLocation()
            setReactState(state)
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
        }
    }

    const forward = () => {
        if (mode === 'history') {
            history.forward()
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