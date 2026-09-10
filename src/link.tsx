import React, {memo} from 'react'
import {LinkProps, To} from '..'
import {useRouter} from './router'
import {isStartWithProtocol, resolvePath} from './utils'

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

    const resolvedPath = useResolvePath(to)

    const usingDelta = typeof delta === 'number'

    const aProps = {
        ...!usingDelta && {href: resolvedPath},
        onClick(e: React.MouseEvent<HTMLAnchorElement>) {
            props.onClick?.(e)
            if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
                return
            }
            const element = e.currentTarget
            if (element.tagName === 'A') {
                const target = element.getAttribute('target')
                if ((target && target.toLowerCase() !== '_self') || element.hasAttribute('download')) {
                    return
                }
            }
            if (usingDelta) {
                e.preventDefault()
                navigate(delta)
            } else {
                if (typeof to === 'undefined') {
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
    const {base, mode, location} = useRouter()
    if (!to) {
        return ''
    }
    const absolute = to instanceof URL ? to : isStartWithProtocol(to) ? new URL(to) : null
    let resolvedPath: string
    if (absolute) {
        resolvedPath = mode === 'history' ? absolute.href : absolute.pathname + absolute.search + absolute.hash
    } else {
        const path = resolvePath(to)
        resolvedPath = resolvePath(path[0] === '/' && base !== '/' ? base + path : path,
            location.pathname + location.search + location.hash)
    }
    return mode === 'history' ? resolvedPath : '#' + resolvedPath
}
