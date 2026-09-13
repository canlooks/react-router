import type {ReactElement} from 'react'
import {Navigate, Outlet, Redirect, useOutlet} from '@canlooks/react-router'

export function OutletConsumer() {
    const outlet: ReactElement | null = useOutlet()
    const rendered: ReactElement | null = Outlet()
    const navigateResult: null = Navigate({to: '/about'})
    const redirectResult: ReactElement = Redirect({to: '/login'})
    void [outlet, rendered, navigateResult, redirectResult]
    return null
}