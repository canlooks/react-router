import {memo, ReactNode, useMemo} from 'react'
import {RouteItem} from '../index'
import {useRouter} from './router'
import {isUnset} from './utils'
import {Outlet, RouteLayoutStackIndex, RouteStack} from './outlet'

export const Routes = memo(({entry, notFound}: {
    entry: RouteItem
    notFound?: ReactNode
}) => {
    const {pathname, params} = useRouter()

    const routeStack = useMemo(() => {
        const stack: RouteItem[] = []

        const _pathname = pathname.slice(1)
        if (!_pathname) {
            return isUnset(entry.page) ? void 0 : [entry]
        }

        const portions = _pathname.split('/')

        const findMatchChild = (item: RouteItem, index = 0): boolean => {
            if (index >= portions.length) {
                return !isUnset(item.page)
            }

            const {children} = item
            if (!children || !Object.keys(children).length) {
                return false
            }

            const portion = portions[index]
            const child = children[portion]
            if (child) {
                const match = findMatchChild(child, index + 1)
                if (match) {
                    stack.push(child)
                    return true
                }
                return false
            }

            for (const path in children) {
                const child = children[path]
                const [l] = path

                if (l === ':') {
                    const match = findMatchChild(child, index + 1)
                    if (match) {
                        params[path.slice(1)] = portion
                        stack.push(child)
                        return true
                    }
                    continue
                }
                if (l === '#') {
                    const match = findMatchChild(child, index)
                    if (match) {
                        stack.push(child)
                        return true
                    }
                    continue
                }
                if (path === '*') {
                    const match = findMatchChild(child, index + 1)
                    if (match) {
                        stack.push(child)
                        return true
                    }
                    continue
                }
                if (path === '**') {
                    if (!isUnset(child.page)) {
                        stack.push(child)
                        return true
                    }
                }
            }
            return false
        }

        const match = findMatchChild(entry)
        if (!match) {
            return
        }
        stack.push(entry)

        return stack.reverse()
    }, [pathname])

    if (!routeStack) {
        return notFound
    }

    return (
        <RouteStack value={routeStack}>
            <RouteLayoutStackIndex value={0}>
                <Outlet/>
            </RouteLayoutStackIndex>
        </RouteStack>
    )
})