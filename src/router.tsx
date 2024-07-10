import React, {useEffect, useState} from 'react'
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

    const [copiedLocation, setCopiedLocation] = useState(() => copyLocation())
    const updateLocation = () => {
        isLocationChanged(copiedLocation) && setCopiedLocation(copyLocation())
    }

    const [state, setReactState] = useState(null)
    const setState = (state: any) => {
        mode === 'history' && history.replaceState(state, '')
        setReactState(state)
    }

    const replace = (a: any, options: Omit<NavigateOptions, 'replace'> = {}) => {
        navigate(a, {
            ...options,
            replace: true
        })
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
            }
            updateLocation()
            setReactState(state)
        }
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
                mode, base, location: copiedLocation, state,
                replace, navigate, back, forward, setState
            }), [
                mode, base, copiedLocation, state,
            ])
        }>
            {children}
        </routerContext.Provider>
    )
}