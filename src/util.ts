import {ILocation} from '..'

/**
 * 复制location对象，用于存储在react的state中以更新组件
 */
export function copyLocation() {
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
    return ({string: true, number: true} as any)[typeof value]
}

/**
 * 拼接路径
 * @param paths
 */
export function joinPath(...paths: (string | undefined)[]) {
    const fn = (prev: string, next?: string) => {
        if (!next) {
            return prev
        }
        if (next[0] === '/') {
            // 以"/"开头会开启新路径
            return next
        }
        // 以"/"拼接
        return `${prev.replace(/\/+$/, '')}/${next}`
    }
    return paths.reduce(fn, '')
}

/**
 * 裁剪path，获得当前所在的片段
 * @param pathname 
 * @param base 
 */
// export function snipPath(pathname: string, base: string) {
//     const subPath = pathname.slice(base.length)
//     const end = subPath.indexOf('/')
//     return end > -1
//         ? subPath.slice(0, end)
//         : subPath
// }