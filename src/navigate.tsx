import {memo, useEffect, useRef} from 'react'
import {NavigateProps, RedirectProps} from '..'
import {useRouter} from './router'

export function useNavigate() {
    const {navigate} = useRouter()
    return navigate
}

export const Navigate = memo(({
    to,
    delta,
    replace,
    state,
    scrollRestore
}: NavigateProps) => {
    const navigate = useNavigate()
    const lastIntentRef = useRef<string | null>(null)
    const intentKey = typeof delta === 'number'
        ? `delta:${delta}`
        : typeof to !== 'undefined'
            ? `to:${to instanceof URL ? to.href : to}|replace:${Boolean(replace)}`
            : null

    useEffect(() => {
        if (intentKey === null || lastIntentRef.current === intentKey) {
            return
        }
        lastIntentRef.current = intentKey

        if (typeof delta === 'number') {
            navigate(delta)
        } else {
            navigate(to!, {replace, state, scrollRestore})
        }
    }, [intentKey, navigate, to, delta, replace, state, scrollRestore])

    return null
})

export function Redirect(props: RedirectProps) {
    return <Navigate {...props} replace/>
}
