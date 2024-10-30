import {ILocation} from '../index'
import {useRef} from 'react'
import path from 'path-browserify'

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
 * 全部统一使用"/"
 * @param path
 */
export function unifySlash(path: string) {
    return path.replace(/\\/g, '/')
}

/**
 * 统一path格式，统一使用"/"；选择性以"/"开头，且末尾无"/"
 * @param path
 * @param endWithSlash 是否以"/"开头，默认为true
 */
export function unifyPath(path: string, endWithSlash = true) {
    return unifySlash(path)
        // 去掉末尾的"/"
        .replace(/\/+$/, '')
        // 如果没有以"/"开头，则选择性加上"/"
        .replace(/^\/*/, endWithSlash ? '/' : '')
}

/**
 * 获得跳转后的新路径，用于非history模式的路由跳转
 * @param currentPath
 * @param navigateTo
 * @param base
 */
export function navigatePath(currentPath: string, navigateTo: string | URL, base: string) {
    if (typeof navigateTo === 'string') {
        navigateTo = unifySlash(navigateTo)
    } else {
        // navigateTo instanceof URL
        if (navigateTo.origin !== location.origin) {
            throw Error(`Cannot navigate different origin from "${location.origin}" to "${navigateTo.origin}".`)
        }
        navigateTo = navigateTo.pathname + navigateTo.search
    }

    if (navigateTo[0] === '/') {
        // "/"开头需从头base重新开始路径
        return path.join(base, navigateTo)
    }

    return path.join(
        // 清除currentPath的最后一段，再进行拼接
        currentPath.replace(/\/[^\/]+$/, ''),
        navigateTo
    )
}

/**
 * 从前端截断路径
 * @param fullPath
 * @param truncation
 * @returns {string} 返回截断后的子路径
 * @returns {null} 如果路径不匹配，返回null
 */
export function truncatePath(fullPath: string, truncation: string | RegExp | undefined): string | null {
    if (truncation instanceof RegExp) {
        truncation = truncation.source.replace(/^\^?/, '').replace(/\$?$/, '')
    }
    fullPath = unifyPath(fullPath)
    truncation = unifyPath(truncation || '')
    // truncation为undefined、空字符串或'/'时无需截断
    if (truncation === '/') {
        // 特殊情况，当fullPath为"/"时匹配了undefined或空字符串，会得到空字符串
        return fullPath === '/' ? '' : fullPath
    }
    if (!RegExp(`^${truncation}(/[^/]+)*$`).test(fullPath)) {
        return null
    }

    return fullPath.replace(RegExp(`^${truncation}`), '')
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
    const paramKeys = unifyPath(routePath, false).split('/')
    const paramValues = unifyPath(referencePath, false).split('/')
    if (paramKeys.length > paramValues.length) {
        return null
    }
    for (let i = 0, {length} = paramKeys; i < length; i++) {
        const key = paramKeys[i]
        const value = paramValues[i]
        if (key[0] === ':') {
            // 保存动态参数并替换动态路径
            params[key.slice(1)] = paramKeys[i] = value
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