import {StrictMode, useState, type FormEvent} from 'react'
import {createRoot} from 'react-dom/client'
import type {Mode, RouteItem} from '../../index'
import {
    Link, Outlet, Redirect, Router, useCurrentRoute, useNavigate, useParams,
    useRouter, useRouteStack, useSearchParams
} from '../../src'
import './style.css'

const settingsKey = 'canlooks-router-test-settings'
type Settings = {mode: Mode; base: string}
function initialSettings(): Settings {
    try {
        const saved = JSON.parse(sessionStorage.getItem(settingsKey) || 'null')
        if (['history', 'hash', 'memory'].includes(saved?.mode) && typeof saved.base === 'string') return saved
    } catch { /* A fresh session uses the default deployment. */ }
    return {mode: 'history', base: '/'}
}

function Inspector() {
    const router = useRouter()
    const [to, setTo] = useState('/users/42?tab=profile')
    const [replace, setReplace] = useState(false)
    const [scrollRestore, setScrollRestore] = useState(true)
    const [stateText, setStateText] = useState('{"from":"test-console"}')
    const [error, setError] = useState('')
    function invoke(action: () => void) {
        try { action(); setError('') } catch (failure) { setError(String(failure)) }
    }
    function navigate(event: FormEvent) {
        event.preventDefault()
        invoke(() => router.navigate(to, {replace, scrollRestore, state: JSON.parse(stateText)}))
    }
    return <section aria-label="路由控制台" className="panel">
        <h2>路由控制台</h2>
        <form onSubmit={navigate}>
            <label>目标路径<input value={to} onChange={event => setTo(event.target.value)}/></label>
            <label>导航 state（JSON）<input value={stateText} onChange={event => setStateText(event.target.value)}/></label>
            <label><input type="checkbox" checked={replace} onChange={event => setReplace(event.target.checked)}/> replace</label>
            <label><input type="checkbox" checked={scrollRestore} onChange={event => setScrollRestore(event.target.checked)}/> scrollRestore</label>
            <button type="submit">执行导航</button>
        </form>
        <div className="actions">
            <button onClick={() => invoke(router.back)}>router.back()</button>
            <button onClick={() => invoke(router.forward)}>router.forward()</button>
            <button onClick={() => invoke(() => history.back())}>native history.back()</button>
            <button onClick={() => invoke(() => history.forward())}>native history.forward()</button>
            <button onClick={() => invoke(() => router.navigate(-2))}>navigate(-2)</button>
            <button onClick={() => invoke(() => router.setState(JSON.parse(stateText)))}>setState(JSON)</button>
            <button onClick={() => invoke(() => router.setState((previous: {count?: number} | null) => ({count: (previous?.count || 0) + 1})))}>函数式 state +1</button>
            <button onClick={() => invoke(() => router.setState(() => ({uncloneable: () => 1})))}>不可克隆 state（应报错）</button>
        </div>
        {error && <p role="alert">{error}</p>}
        <pre data-testid="router-state">{JSON.stringify({
            browserURL: location.href, mode: router.mode, base: router.base, pathname: router.pathname,
            routeURL: router.location.pathname + router.location.search + router.location.hash,
            search: router.location.search, hash: router.location.hash, params: router.params,
            state: router.state, nativeState: history.state, historyLength: history.length, scrollRestoration: history.scrollRestoration
        }, null, 2)}</pre>
    </section>
}

function AppLayout() {
    const [count, setCount] = useState(0)
    return <>
        <nav aria-label="测试路由">
            <Link to="/">首页</Link><Link to="/about">About</Link><Link to="/users/new">静态 new</Link>
            <Link to="/users/42?tab=profile">用户 42</Link><Link to="/docs/intro">单段通配</Link>
            <Link to="/files/a/b/c">多段通配</Link><Link to="/private">鉴权重定向</Link><Link to="/missing">404</Link>
        </nav>
        <button onClick={() => setCount(count + 1)}>布局计数 {count}</button>
        <Inspector/>
        <section className="panel" aria-label="当前页面"><Outlet/></section>
        <section className="panel" aria-label="原生链接行为">
            <h2>链接交互</h2>
            <Link to="/about" target="_blank">新标签打开 About</Link>{' · '}
            <Link to="/about" onClick={event => event.preventDefault()}>已取消的 About 链接</Link>{' · '}
            <Link to="/about" download="about.html">下载链接</Link>
            <p>使用普通点击、Tab / Enter、Ctrl、Meta、Shift、Alt 和鼠标中键检查链接默认行为。</p>
        </section>
    </>
}

function Page({title}: {title: string}) {
    const current = useCurrentRoute() as RouteItem<{title: string}>
    const stack = useRouteStack() as RouteItem<{title: string}>[]
    return <><h2>{title}</h2><p>当前路由元数据：{current?.title}</p>
        <pre>{JSON.stringify({params: useParams(), query: [...useSearchParams()], breadcrumb: stack.map(route => route.title)}, null, 2)}</pre>
    </>
}

function LongPage() {
    const navigate = useNavigate()
    return <><Page title="About 长页面"/><div className="long-page">向下滚动至页面底部，观察导航和返回后的滚动位置。</div>
        <button onClick={() => navigate('/users/42', {scrollRestore: false})}>底部导航（scrollRestore=false）</button></>
}

const entry: RouteItem<{title: string}> = {
    title: 'App', layout: <AppLayout/>, page: <Page title="首页"/>, children: {
        about: {title: 'About', page: <LongPage/>},
        users: {title: 'Users', layout: <section><h2>Users 布局</h2><Outlet/></section>, children: {
            new: {title: 'Create user', page: <Page title="新建用户"/>},
            ':id': {title: 'User detail', page: <Page title="用户详情"/>}
        }},
        docs: {title: 'Docs', children: {'*': {title: 'Document', page: <Page title="文档"/>}}},
        files: {title: 'Files', children: {'**': {title: 'File tree', page: <Page title="文件树"/>}}},
        '#public': {title: 'Public group', children: {login: {title: 'Login', page: <Page title="登录"/>}}},
        '#protected': {title: 'Protected group', layout: <Redirect to="/login" state={{returnTo: '/private'}}/>, children: {
            private: {title: 'Private', page: <Page title="受保护页面"/>}
        }}
    }
}

function TestApp() {
    const [settings, setSettings] = useState(initialSettings)
    const [mode, setMode] = useState(settings.mode)
    const [base, setBase] = useState(settings.base)
    const [generation, setGeneration] = useState(0)
    function apply(event: FormEvent) {
        event.preventDefault()
        const next = {mode, base: '/' + base.replace(/^\/+|\/+$/g, '')}
        sessionStorage.setItem(settingsKey, JSON.stringify(next))
        history.replaceState(null, '', mode === 'history' ? next.base : mode === 'hash' ? `/#${next.base}` : '/')
        setSettings(next)
        setGeneration(value => value + 1)
    }
    return <><header><h1>@canlooks/react-router 测试台</h1>
        <p>用于 TEST_PLAN.md 的手工用例。页面展示当前源码的实际行为；验收预期以测试计划为准。</p></header>
        <form className="panel" onSubmit={apply} aria-label="运行配置">
            <label>模式<select value={mode} onChange={event => setMode(event.target.value as Mode)}>
                <option value="history">history</option><option value="hash">hash</option><option value="memory">memory</option>
            </select></label>
            <label>base<input value={base} onChange={event => setBase(event.target.value)}/></label>
            <button type="submit">应用并重建路由</button><button type="button" onClick={() => location.reload()}>刷新当前深链接</button>
        </form>
        <Router key={generation} {...settings} entry={entry} notFound={<><Inspector/><h2>404：未找到页面或超出 base</h2></>}/>
    </>
}

createRoot(document.getElementById('root')!).render(<StrictMode><TestApp/></StrictMode>)
