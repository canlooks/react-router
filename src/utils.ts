import {ILocation, To} from '..'
import {Dispatch, RefObject, SetStateAction, useCallback, useRef, useState} from 'react'

/**
 * 将某个值使用ref同步，主要用于对付组件的闭包问题
 * @param value
 */
export function useSync<T>(value: T) {
    const ref = useRef<T>(value)
    ref.current = value
    return ref
}

/**
 * 同步的状态，state包裹在ref内，主要用于对付组件的闭包问题
 * @param initialState
 */
export function useSyncState<T>(initialState: T | (() => T)): [RefObject<T>, Dispatch<SetStateAction<T>>]
export function useSyncState<T = undefined>(): [RefObject<T | undefined>, Dispatch<SetStateAction<T | undefined>>]
export function useSyncState(initialState?: any): [RefObject<any>, Dispatch<SetStateAction<any>>] {
    const [state, setState] = useState(initialState)
    const synState = useSync(state)
    return [
        synState,
        useCallback(state => {
            const newState = typeof state === 'function' ? state(synState.current) : state
            synState.current !== newState && setState(synState.current = newState)
        }, [])
    ]
}

/**
 * 复制location对象，用于存储在react的state中以更新组件
 */
export function cloneLocation(): ILocation {
    const copied: any = {}
    for (const k in location) {
        const v = location[k as keyof Location]
        if (strOrNum(v)) {
            // 只保存字符串与数字类型的属性
            copied[k] = v
        }
    }
    return copied
}

/**
 * 判断值是否为字符串或数字
 * @param value
 */
export function strOrNum(value: any): value is string | number {
    return ({string: true, number: true} as any)[typeof value] || false
}

/**
 * 浅比较，判断location是否发生改变
 */
export function isLocationChanged(clonedLocation: ILocation) {
    for (const k in clonedLocation) {
        const v = clonedLocation[k as keyof ILocation]
        if (strOrNum(v) && v !== location[k as keyof ILocation]) {
            return true
        }
    }
    return false
}

/**
 * 统一使用"/"，并且排除"//"的情况
 * @param path
 */
export function unifySlash(path: string) {
    return path
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
}

/**
 * 去掉开头的"/"，执行该方法前需要先执行{@link unifySlash}
 * @param path
 */
export function dropStartSlash(path: string) {
    return path.replace(/^\/+/, '')
}

/**
 * 去掉末尾的"/"，执行该方法前需要先执行{@link unifySlash}
 * @param path
 */
export function dropEndSlash(path: string) {
    return path.replace(/\/+$/, '')
}

/**
 * 统一path格式，去掉前后的"/"
 * @param path
 */
export function unifyPath(path: string) {
    path = unifySlash(path)
    path = dropStartSlash(path)
    return dropEndSlash(path)
}

/**
 * 去掉路径的search和hash
 * @param path
 */
function dropSearchAndHash(path: string) {
    const drop = (path: string, symbol: '$' | '#') => {
        const index = path.indexOf(symbol)
        if (index > -1) {
            return path.slice(0, index)
        }
        return path
    }
    return drop(drop(path, '$'), '#')
}

/**
 * 去掉路径的最后一段，执行该方法前需要先执行{@link unifySlash}和{@link dropSearchAndHash}
 * @param path
 */
export function dropLastPortion(path: string) {
    return path.replace(/\/[^/]+\/*$/, '')
}

/**
 * 拼接路径
 * @param paths
 */
export function joinPath(...paths: string[]) {
    const fn = (prev: string, next: string) => {
        if (/^[a-zA-Z]+:/.test(next)) {
            return next
        }
        prev = unifySlash(prev)
        prev = dropSearchAndHash(prev)
        next = unifySlash(next)
        if (!prev) {
            return next
        }
        if (!next) {
            return prev
        }
        const [l] = next[0]
        // 特殊开头，开启新路径
        if (l === '/') {
            return next
        }
        // ".."或"../"开头，去掉prev的前一段后递归
        if (next.startsWith('..')) {
            return fn(
                dropLastPortion(prev),
                next.replace(/^\.\.\/?/, '')
            )
        }
        // "."或"./"开头，直接递归
        if (l === '.') {
            return fn(prev, next.replace(/^\.\/?/, ''))
        }
        return `${dropEndSlash(prev)}/${dropEndSlash(next)}`
    }
    return paths.reduce(fn)
}

/**
 * 生成跳转路径
 * @param to
 * @param fromPath
 */
export function resolvePath(to: To, fromPath?: string | null) {
    if (to instanceof URL) {
        return to.href
    }
    if (/^[a-zA-Z]+:/.test(to)) {
        return to
    }
    to = unifySlash(to)
    if (fromPath) {
        fromPath = dropSearchAndHash(fromPath)
    }
    const [l] = to
    if (!fromPath || l === '/') {
        return to
    }
    if (l !== '?' && l !== '#') {
        fromPath = dropLastPortion(fromPath)
    }
    return joinPath(fromPath, to)
}

/**
 * 从前端截断路径
 * @param referencePath
 * @param routePath
 * @returns {string} 返回截断后的子路径
 * @returns {null} 如果路径不匹配，返回null
 */
export function truncatePath(referencePath: string, routePath: string | RegExp | undefined): string | null {
    if (routePath instanceof RegExp) {
        routePath = routePath.source.replace(/^\^?/, '').replace(/\$?$/, '')
    }
    referencePath = unifyPath(referencePath)
    routePath = unifyPath(routePath || '')
    if (!routePath) {
        return referencePath
    }
    if (!RegExp(`^${routePath}(/[^/]+)*$`).test(referencePath)) {
        return null
    }
    return referencePath.replace(RegExp(`^${routePath}`), '')
}

/**
 * 读取动态路径参数，并得到替换后的路径
 * @param params
 * @param routePath
 * @param referencePath
 * @returns {string} 替换后的路径
 * @returns {null} 路径不匹配会得到null
 */
export function insertPathParams(params: Record<string, string>, routePath: string, referencePath: string): string | null {
    const paramKeys = unifyPath(routePath).split('/')
    const paramValues = unifyPath(referencePath).split('/')
    if (paramKeys.length > paramValues.length) {
        return null
    }
    for (let i = 0, {length} = paramKeys; i < length; i++) {
        const key = paramKeys[i]
        if (key[0] === ':') {
            // 保存动态参数并替换动态路径
            params[key.slice(1)] = paramKeys[i] = paramValues[i]
        }
    }
    return paramKeys.join('/')
}

/**
 * 将glob通配符转换为正则表达式（支持*与?）
 * @param glob
 */
export function globToReg(glob: string) {
    return glob === '*'
        // 只有一个"*"时，匹配所有
        ? RegExp('.*')
        : RegExp(
            glob
                // "**"匹配所有
                .replace(/\*\*/g, '.*')
                // "*"匹配任意多个非"/"字符
                .replace(/[^.]\*/g, $1 => $1[0] + '[^/]+')
                .replace(/\*/g, '[^/]+')
                // "?"匹配任意单个字符
                .replace(/\?/g, '.')
        )
}