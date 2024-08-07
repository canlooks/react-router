import {ILocation} from '..'

/**
 * 复制location对象，用于存储在react的state中以更新组件
 */
export function cloneLocation(): ILocation {
    const copied: any = {}
    for (const k in location) {
        const v = location[k as keyof Location]
        if (strOrNum(v)) {
            copied[k] = v
        }
    }
    return copied
}

/**
 * 浅比较，判断location是否发生改变
 * @param a 
 * @param b 
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
 * 判断值是否为字符串或数字
 * @param value 
 */
function strOrNum(value: any): value is string | number {
    return ({string: true, number: true} as any)[typeof value] || false
}

/**
 * 统一path格式，以"/"开头，且结尾没有"/"
 * @param path 
 * @param startWithSlash 是否以"/"开头 @default true
 */
export function standardPath(path: string, startWithSlash = true) {
    return path.replace(/\/+$/, '').replace(/^\/*/, startWithSlash ? '/' : '')
}

/**
 * 拼接路径
 * @param paths
 */
export function joinPath(...paths: (string | undefined)[]) {
    const fn = (prev: string, next?: string) => {
        if (!next) {
            return standardPath(prev)
        }
        if (next[0] === '/') {
            // "/"开头会开启新路径
            return standardPath(next)
        }
        if (/^\.\./.test(next)) {
            // ".."开头
            return fn(
                // 去掉prev的前一段路径
                prev.replace(/\/[^\/]+$/, ''),
                // 去掉next的".."或"../"
                next.replace(/^\.\.\/?/, '')
            )
        }
        if (next[0] === '.') {
            // "."开头
            return fn(
                prev,
                // 去掉"."或"./"
                next.replace(/^\.\/?/, '')
            )
        }
        return standardPath(prev) + standardPath(next)
    }
    return paths.reduce(fn, '')
}

/**
 * 获得跳转后的新路径，用于非history模式的路由跳转
 * @param currentPath 
 * @param navigateTo 
 */
export function navigatePath(currentPath: string, navigateTo: string) {
    if (navigateTo[0] === '/') {
        return navigateTo
    }
    return joinPath(
        // 清除currentPath的最后一段，再进行拼接
        currentPath.replace(/\/[^\/]+$/, ''),
        navigateTo
    )
}

/**
 * 截断路径
 * @param path 
 * @param truncate 
 * @returns null: 不匹配，string: 截断后的路径，''：精准匹配
 */
export function truncatePath(path: string, truncate: string | RegExp) {
    path = standardPath(path)
    if (typeof truncate === 'string') {
        truncate = standardPath(truncate)
    } else {
        truncate = String(truncate).slice(1, -1).replace(/^\^+/, '').replace(/\$+$/, '')
    }
    if (truncate === '/' || truncate === '\\/') {
        // truncate为"/"时不进行裁剪
        return path === '/' ? '' : path
    }
    if (!RegExp(`^${truncate}(/[^/]+)*$`).test(path)) {
        return null
    }
    return path.replace(RegExp(`^${truncate}`), '')
}

/**
 * 读取动态路径参数
 * @param params 
 * @param routePath 
 * @param referencePath 
 * @returns 替换后的路径
 */
export function getPathParams(params: Record<string, string>, routePath: string, referencePath: string) {
    const paramKeys = standardPath(routePath, false).split('/')
    const paramValues = standardPath(referencePath, false).split('/')
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
 * 将glob通配符转换为正则表达式（仅支持*与?）
 * @param glob 
 */
export function globToReg(glob: string) {
    return RegExp(
        glob.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]+').replace(/\?/g, '.')
    )
}