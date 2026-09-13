import {act, render, screen, waitFor} from '@testing-library/react'
import {useEffect} from 'react'
import {describe, expect, it} from 'vitest'
import type {RouterContext as Context} from '../../index'
import {Navigate, Outlet, Router, RouterContext, useOutlet, useRouter} from '../../src'
import {mountRouter} from '../helpers/router'
import {renderInContext} from '../helpers/context'

describe('X-NAV retained declarative navigation', () => {
  it('X-NAV-01 unchanged Navigate props must not navigate on unrelated rerender', () => {
    const {context,rerender}=renderInContext(<Navigate to="/about"/>)
    rerender(<RouterContext value={context}><Navigate to="/about"/></RouterContext>)
    expect(context.navigate).toHaveBeenCalledTimes(1)
  })
  it.each(['history','hash','memory'] as const)('X-NAV-02 %s retained layout Navigate must settle after one navigation', mode => {
    let calls=0
    function Shell(){
      const router=useRouter()
      // Safety fuse only stops the ninth write, so an actual loop cannot hang Vitest.
      const guarded={...router,navigate:(...args:any[])=>{calls++;if(calls<=8)(router.navigate as any)(...args)}}
      return <RouterContext value={guarded}><Navigate to="/about"/><Outlet/></RouterContext>
    }
    render(<Router mode={mode} entry={{layout:<Shell/>,page:'Home',children:{about:{page:'About'}}}}/>)
    expect(calls).toBe(1)
  })
})

describe('X-NEST parent to mounted child synchronization', () => {
  it.each(['history','hash'] as const)('X-NEST-01 %s parent push must refresh an existing child', async mode => {
    let parent!:Context,child!:Context
    function Child(){child=useRouter();return <output data-testid="child">{child.pathname}</output>}
    const childNode=<Router mode={mode} entry={{page:<Child/>,children:{'**':{page:<Child/>}}}}/>
    function Parent(){parent=useRouter();return childNode}
    render(<Router mode={mode} entry={{layout:<Parent/>,page:'Home',children:{'**':{page:'Any'}}}}/>)
    act(()=>parent.navigate('/about',{state:{step:1}}))
    await waitFor(()=>expect(child.pathname).toBe('/about'),{timeout:800})
    if (mode === 'history') expect(child.state).toEqual({step:1})
  })
  it.each(['history','hash'] as const)('X-NEST-02 %s parent replace must refresh an existing child', async mode => {
    let parent!:Context,child!:Context
    function Child(){child=useRouter();return <output>{child.pathname}</output>}
    const childNode=<Router mode={mode} entry={{page:<Child/>,children:{'**':{page:<Child/>}}}}/>
    function Parent(){parent=useRouter();return childNode}
    render(<Router mode={mode} entry={{layout:<Parent/>,page:'Home',children:{'**':{page:'Any'}}}}/>)
    act(()=>parent.replace('/about',{state:{step:2}}))
    await waitFor(()=>expect(child.pathname).toBe('/about'),{timeout:800})
    if (mode === 'history') expect(child.state).toEqual({step:2})
  })
  it('X-NEST-03 history parent setState must update child state on the same native entry', () => {
    let parent!:Context,child!:Context
    function Child(){child=useRouter();return null}
    const childNode=<Router entry={{page:<Child/>}}/>
    function Parent(){parent=useRouter();return childNode}
    render(<Router entry={{page:<Parent/>}}/>)
    act(()=>parent.setState({step:3}))
    expect(child.state).toEqual({step:3})
  })
})

describe.each(['history','hash','memory'] as const)('X-ENC %s URL encoding end to end', mode => {
  it.each(['中文','café','a b'])('X-ENC-01 raw static route segment %s is reachable by encoded URL', segment => {
    const app=mountRouter({mode,entry:{page:'Home',children:{[segment]:{page:<h1>Encoded target</h1>}}}})
    act(()=>app.router.navigate('/'+encodeURIComponent(segment)))
    expect(screen.queryByRole('heading',{name:'Encoded target'})).not.toBeNull()
  })
  it.each(['/应用','/my app'])('X-ENC-02 base %s matches its own navigation URL', base => {
    if(mode!=='memory')history.replaceState(null,'',mode==='hash'?'/#'+base:base)
    const app=mountRouter({mode,base})
    act(()=>app.router.navigate('/about'))
    expect(app.router.pathname).toBe('/about')
  })
  it('X-ENC-03 explicitly encoded route key works as a control', () => {
    const key=encodeURIComponent('中文')
    const app=mountRouter({mode,entry:{children:{[key]:{page:'Explicitly encoded'}}}})
    act(()=>app.router.navigate('/'+key))
    expect(screen.getByText('Explicitly encoded')).toBeInTheDocument()
  })
})

describe('X-TYPE public hook result contract', () => {
  it('X-TYPE-01 leaf useOutlet must return null when it has no child, per index.d.ts', () => {
    let actual:unknown='not rendered'
    function Page(){actual=useOutlet();return <h1>Leaf</h1>}
    render(<Router mode="memory" entry={{page:<Page/>}}/>)
    expect(actual).toBeNull()
  })
})

describe('X-COMBINATION cross-cutting router boundaries', () => {
  it('a persistent Navigate follows declaration changes without following its own location', () => {
    const {context, rerender} = renderInContext(<Navigate to="/a" />)
    rerender(<RouterContext value={context}><Navigate to="/b" /></RouterContext>)
    rerender(<RouterContext value={context}><Navigate to="/a" /></RouterContext>)
    rerender(<RouterContext value={context}><Navigate /></RouterContext>)
    rerender(<RouterContext value={context}><Navigate to="/a" /></RouterContext>)
    expect(context.navigate).toHaveBeenCalledTimes(4)
  })

  it('a URL object with an unchanged href does not repeat a declaration', () => {
    const first = new URL('https://router.test/about')
    const {context, rerender} = renderInContext(<Navigate to={first} />)
    rerender(<RouterContext value={context}><Navigate to={new URL(first.href)} /></RouterContext>)
    expect(context.navigate).toHaveBeenCalledTimes(1)
  })

  it('copies encoded static descendants below a dynamic route and preserves captures', () => {
    let seen: Record<string, string | string[]> | undefined
    function Page() { seen = useRouter().params; return <h1>Unicode child</h1> }
    const app = mountRouter({entry: {children: {':id': {children: {'café': {page: <Page/>}}}}}})
    act(() => app.router.navigate('/one/caf%C3%A9'))
    expect(screen.getByRole('heading', {name: 'Unicode child'})).toBeInTheDocument()
    expect(seen).toEqual({id: 'one'})
  })

  it('copies an encoded static ancestor into a dynamic descendant path', () => {
    let seen: Record<string, string | string[]> | undefined
    function Page() { seen = useRouter().params; return <h1>Static ancestor</h1> }
    const app = mountRouter({entry: {children: {'中文': {children: {':id': {page: <Page/>}}}}}})
    act(() => app.router.navigate('/%E4%B8%AD%E6%96%87/value%2Fpart'))
    expect(screen.getByRole('heading', {name: 'Static ancestor'})).toBeInTheDocument()
    expect(seen).toEqual({id: 'value%2Fpart'})
  })

  it('retains a special parameter through Router matching and clears it on a static route', () => {
    let router!: ReturnType<typeof useRouter>
    function Capture() { router = useRouter(); return <output>{JSON.stringify(router.params)}</output> }
    render(<Router mode="memory" entry={{page: <Capture/>, children: {':__proto__': {page: <Capture/>}, about: {page: <Capture/>}}}} />)
    act(() => router.navigate('/value'))
    expect(Object.hasOwn(router.params, '__proto__')).toBe(true)
    expect(Object.getPrototypeOf(router.params)).toBe(Object.prototype)
    act(() => router.navigate('/about'))
    expect(router.params).toEqual({})
    expect(Object.getPrototypeOf(router.params)).toBe(Object.prototype)
  })

  it('keeps a child Router instance mounted while a browser parent changes location', async () => {
    let parent!: Context
    let child!: Context
    let mounts = 0
    function Child() {
      child = useRouter()
      useEffect(() => { mounts++ }, [])
      return <output data-testid="stable-child">{child.pathname}</output>
    }
    const childNode = <Router mode="history" entry={{page: <Child/>, children: {'**': {page: <Child/>}}}}/>
    function Parent() { parent = useRouter(); return childNode }
    render(<Router mode="history" entry={{layout: <Parent/>, page: 'Home', children: {'**': {page: 'Any'}}}}/>)
    act(() => parent.navigate('/about'))
    await waitFor(() => expect(child.pathname).toBe('/about'))
    expect(mounts).toBe(1)
  })
})
