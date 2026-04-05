import {memo, useEffect} from 'react'
import {NavigateProps, RedirectProps} from '..'
import {useRouter} from './router'

export function useNavigate() {
    const {navigate} = useRouter()
    return navigate
}

export const Navigate = memo(({to, delta, ...props}: NavigateProps) => {
    const navigate = useNavigate()

    useEffect(() => {
        typeof delta === 'number'
            ? navigate(delta)
            : typeof to !== 'undefined' && navigate(to, props)
    })

    return null
})

export function Redirect(props: RedirectProps) {
    return <Navigate {...props} replace/>
}