import React, {cloneElement, isValidElement, memo, ReactElement} from 'react'
import {LinkProps} from '..'
import {useRouter} from './router'

export const Link = memo(({
    to,
    delta,
    replace,
    scrollRestore,
    state,
    children,
    ...props
}: LinkProps) => {
    const {navigate} = useRouter()

    const onClick = () => {
        typeof delta === 'number'
            ? navigate(delta)
            : typeof to !== 'undefined' && navigate(to, {replace, scrollRestore, state})
    }

    return children
        ? isValidElement(children)
            ? cloneElement(children as ReactElement<JSX.IntrinsicElements['a']>, {
                onClick(e: React.MouseEvent<HTMLAnchorElement>) {
                    children.props.onClick?.(e)
                    props.onClick?.(e)
                    onClick()
                }
            })
            : children
        : <a
            {...props}
            onClick={e => {
                props.onClick?.(e)
                onClick()
            }}
        />
})
