const str = 'abc'

const reg = globToReg('*abc')

console.log(5, reg.test(str))

function globToReg(glob: string) {
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