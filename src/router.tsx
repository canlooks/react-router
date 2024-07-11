import React, {useEffect, useRef, useState} from 'react'
import {createContext, useContext, useMemo} from 'react'
import {NavigateOptions, RouterContext, RouterProps} from '..'
import {copyLocation, isLocationChanged} from './util'

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

    const params = useRef({})

    const [copiedLocation, setCopiedLocation] = useState(() => copyLocation())
    const updateLocation = () => {
        if (isLocationChanged(copiedLocation)) {
            params.current = {}
            setCopiedLocation(copyLocation())
        }
    }

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
                replace
                    ? history.replaceState(state, '', a)
                    : history.pushState(state, '', a)
            } else {
                // TODO mode === 'memory'
                if (mode === 'hash') {
                    /**
                     * 做到这里，非history模式，需要手动处理路径，包括../等
                     */
                }
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
                mode, base, location: copiedLocation, state, params: params.current,
                replace, navigate, back, forward, setState
            }), [
                mode, base, copiedLocation, state, params.current
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