import React, {memo} from 'react'
import {LinkProps, To} from '..'
import {useRouter} from './router'
import {resolveNavigation} from './location'

function useResolvedNavigation(to?: To) {
    const {base, mode, pathname, location} = useRouter()
    if (typeof to === 'undefined') {
        return null
    }
    return resolveNavigation(to, {
        pathname: pathname || '/',
        search: location.search,
        hash: location.hash
    }, mode, base)
}

export const Link = memo(({
    component: Component = 'a',
    to,
    delta,
    replace,
    scrollRestore,
    state,
    ...props
}: LinkProps) => {
    const {navigate} = useRouter()
    const resolved = useResolvedNavigation(to)
    const resolvedPath = resolved?.href ?? ''

    const usingDelta = typeof delta === 'number'

    const aProps = {
        ...!usingDelta && {href: resolvedPath},
        onClick(e: React.MouseEvent<HTMLAnchorElement>) {
            props.onClick?.(e)

            if (e.defaultPrevented ||
                e.button !== 0 ||
                e.ctrlKey ||
                e.metaKey ||
                e.shiftKey ||
                e.altKey) {
                return
            }

            const target = e.currentTarget.getAttribute('target')
            if ((target && target.toLowerCase() !== '_self') ||
                e.currentTarget.hasAttribute('download') ||
                e.currentTarget.getAttribute('rel')?.toLowerCase().split(/\s+/).includes('external')) {
                return
            }

            if (usingDelta) {
                navigate(delta)
            } else {
                if (typeof to === 'undefined' || !resolved ||
                    resolved.externalTarget || resolved.outsideBase) {
                    return
                }
                e.preventDefault()
                navigate(to, {replace, scrollRestore, state})
            }
        }
    }

    return <Component {...props} {...aProps}/>
})

export function useResolvePath(to?: To) {
    const resolved = useResolvedNavigation(to)
    return resolved?.href ?? ''
}
