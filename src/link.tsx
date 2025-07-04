import React, {memo} from 'react'
import {LinkProps, To} from '..'
import {useRouter} from './router'
import {joinPath, resolvePath} from './utils'

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
            if (usingDelta) {
                navigate(delta)
            } else {
                if (typeof to === 'undefined') {
                    return
                }
                if (!e.ctrlKey) {
                    e.preventDefault()
                    navigate(to, {replace, scrollRestore, state})
                }
            }
        }
    }

    return <Component {...props} {...aProps}/>
})

export function useResolvePath(to?: To) {
    const {base, mode, pathname} = useRouter()
    if (!to) {
        return ''
    }
    const resolvedPath = resolvePath(to, pathname)
    if (mode === 'history') {
        return joinPath(base, resolvedPath)
    }
    return '#' + resolvedPath
}