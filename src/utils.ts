import {ILocation} from '..'

/**
 * 复制location对象，用于存储在react的state中以更新组件
 */
export function copyLocation(): ILocation {
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
export function isLocationChanged(copiedLocation: ILocation) {
    for (const k in copiedLocation) {
        const v = copiedLocation[k as keyof ILocation]
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
 * 拼接路径
 * @param paths
 */
export function joinPath(...paths: (string | undefined)[]) {
    const fn = (prev: string, next?: string) => {
        if (!next) {
            return prev
                // 清除末尾的"/"; 若prev只有"/"，清除后会变成空字符串，此时返回"/"
                ? clearEndSlash(prev) || '/'
                // prev原本就是空字符串
                : prev
        }
        if (next[0] === '/') {
            // "/"开头会开启新路径
            return fn(next)
        }
        if (/^\.\./.test(next)) {
            // ".."开头,去掉prev的前一段路径，与next的".."或"../"后递归
            return fn(
                prev.replace(/\/[^\/]+$/, ''),
                next.replace(/^\.\.\/?/, '')
            )
        }
        if (next[0] === '.') {
            // "."开头，去掉"."或"./"后递归
            return fn(
                prev,
                next.replace(/^\.\/?/, '')
            )
        }
        return `${clearEndSlash(prev)}/${clearEndSlash(next)}`
    }
    return paths.reduce(fn, '')
}

/**
 * 清除末端的"/"
 * @param str 
 */
export function clearEndSlash(str: string) {
    return str.replace(/\/+$/, '')
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
 * 截断base路径
 * @param path 
 * @param truncate 
 * @param regular 是否使用正则表达式
 */
export function truncatePath(path: string, truncate: string, regular?: boolean) {
    if (!RegExp('^' + truncate).test(path)) {
        return null
    }
    return path.replace(
        regular ? RegExp(truncate) : truncate,
        ''
    )
}