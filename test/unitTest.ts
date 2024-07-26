const path = 'ab123cd/[^\/]+'

const reference = 'ab123cd/abdfasgbweacd/sub'

const t = truncatePath(reference, path)

console.log(9, t) // XXX

function truncatePath(path: string, truncate: string) {
    return RegExp('^' + truncate).test(path)
        ? path.replace(RegExp(truncate), '')
        // path开头与truncate不匹配，说明路径不在当前路由下
        : null
}