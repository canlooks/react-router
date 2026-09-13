import {memo, useEffect, useRef} from 'react'
import {NavigateProps, RedirectProps} from '..'
import {useRouter} from './router'
import {useSync} from './utils'

export function useNavigate() {
    const {navigate} = useRouter()
    return navigate
}

export const Navigate = memo(({to, delta, ...props}: NavigateProps) => {
    const {navigate, mode, base} = useRouter()
    const latestNavigate = useSync(navigate)
    const lastDeclaration = useRef<Declaration | null>(null)

    const declaration: Declaration | null = typeof delta === 'number'
        ? {kind: 'delta', delta, mode}
        : typeof to === 'undefined'
            ? null
            : {
                kind: 'to',
                to: to instanceof URL ? to.href : to,
                state: props.state ?? null,
                replace: props.replace ?? false,
                scrollRestore: props.scrollRestore ?? true,
                mode,
                base
            }

    useEffect(() => {
        if (declaration === null) {
            lastDeclaration.current = null
            return
        }
        if (sameDeclaration(lastDeclaration.current, declaration)) {
            return
        }

        if (declaration.kind === 'delta') {
            latestNavigate.current(declaration.delta)
        } else {
            latestNavigate.current(to!, props)
        }
        // A failed navigation deliberately leaves this unset so the error is
        // retried only when React retries the effect with the same declaration.
        lastDeclaration.current = declaration
    }, [declaration])

    return null
})

type Declaration =
    | {kind: 'delta'; delta: number; mode: string}
    | {kind: 'to'; to: string | URL; state: any; replace: boolean; scrollRestore: boolean; mode: string; base: string}

function sameDeclaration(previous: Declaration | null, next: Declaration) {
    if (!previous || previous.kind !== next.kind) return false
    if (next.kind === 'delta' && previous.kind === 'delta') {
        return previous.delta === next.delta && previous.mode === next.mode
    }
    if (next.kind === 'to' && previous.kind === 'to') {
        return previous.to === next.to
            && Object.is(previous.state, next.state)
            && previous.replace === next.replace
            && previous.scrollRestore === next.scrollRestore
            && previous.mode === next.mode
            && previous.base === next.base
    }
    return false
}

export function Redirect(props: RedirectProps) {
    return <Navigate {...props} replace/>
}
