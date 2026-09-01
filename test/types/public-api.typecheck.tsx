import React from 'react'
import RouterApi from '../..'

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
    (<T>() => T extends B ? 1 : 2) ? true : false
type Expect<T extends true> = T

type ParamsReturnMatchesRuntime = Expect<Equal<
    ReturnType<typeof RouterApi.useParams>,
    RouterApi.Params
>>
type CurrentRouteCanBeMissing = Expect<Equal<
    ReturnType<typeof RouterApi.useCurrentRoute>,
    RouterApi.RouteItem | undefined
>>
type NavigateCanRenderNothing = Expect<Equal<
    ReturnType<typeof RouterApi.Navigate>,
    React.ReactElement | null
>>
type OutletCanRenderNothing = Expect<Equal<
    ReturnType<typeof RouterApi.Outlet>,
    React.ReactElement | null
>>

type AppMetadata = {
    title: string
    requiresAuth: boolean
}

const routes: RouterApi.RouteItem<AppMetadata> = {
    title: 'Root',
    requiresAuth: false,
    page: <div>Home</div>,
    children: {
        dashboard: {
            title: 'Dashboard',
            requiresAuth: true,
            page: <div>Dashboard</div>,
        },
    },
}

const routerElement: React.ReactElement = <RouterApi.Router entry={routes}/>
const anchorLink: React.ReactElement = <RouterApi.Link to="/dashboard">Dashboard</RouterApi.Link>
const buttonLink: React.ReactElement = (
    <RouterApi.Link component="button" to="/dashboard" type="button">
        Dashboard
    </RouterApi.Link>
)
const redirectElement: React.ReactElement = <RouterApi.Redirect to="/dashboard" state={{from: '/'}}/>

const navigate: RouterApi.RouterContext['navigate'] = (_to: RouterApi.To | number) => undefined
navigate('/dashboard', {replace: true, state: {from: '/'}, scrollRestore: false})
navigate(-1)

const params: RouterApi.Params = {
    userId: '42',
    repeated: ['first', 'second'],
}

// @ts-expect-error unsupported router modes must be rejected
const invalidMode: RouterApi.Mode = 'pathname'

// @ts-expect-error metadata is required for every node in a typed route tree
const invalidRoute: RouterApi.RouteItem<AppMetadata> = {
    page: <div>Missing metadata</div>,
}

void [
    routerElement,
    anchorLink,
    buttonLink,
    redirectElement,
    params,
    invalidMode,
    invalidRoute,
]

void (null as unknown as ParamsReturnMatchesRuntime)
void (null as unknown as CurrentRouteCanBeMissing)
void (null as unknown as NavigateCanRenderNothing)
void (null as unknown as OutletCanRenderNothing)
