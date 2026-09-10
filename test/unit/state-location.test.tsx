import {act, renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'
import {cloneLocation, isLocationChanged, isUnset, strOrNum, useSync, useSyncState} from '../../src'

describe('U-GUARD renderability and scalar guards', () => {
    it.each([undefined, null, false])('U-GUARD-01 %s is unset', value => expect(isUnset(value)).toBe(true))
    it.each([0, '', true, [], {}, <span key="node"/>])('U-GUARD-02 %j is set', value => expect(isUnset(value)).toBe(false))
    it.each(['', 'text', 0, -1, NaN, Infinity])('U-GUARD-03 %s is a string or number', value => expect(strOrNum(value)).toBe(true))
    it.each([
        {kind: 'null', value: null}, {kind: 'undefined', value: undefined},
        {kind: 'boolean', value: false}, {kind: 'object', value: {}},
        {kind: 'array', value: []}, {kind: 'function', value: () => {}},
        {kind: 'bigint', value: 1n}, {kind: 'symbol', value: Symbol('x')}
    ])('U-GUARD-04 $kind is not a string or number', ({value}) => expect(strOrNum(value)).toBe(false))
})

describe('U-LOCATION browser snapshot', () => {
    it('U-LOCATION-01 copies all public location fields but no browser methods', () => {
        history.replaceState(null, '', '/users/42?q=one#details')
        const snapshot = cloneLocation()
        expect(snapshot).toMatchObject({
            href: 'https://router.test/users/42?q=one#details', origin: 'https://router.test',
            protocol: 'https:', host: 'router.test', hostname: 'router.test', port: '',
            pathname: '/users/42', search: '?q=one', hash: '#details'
        })
        expect(snapshot).not.toBe(location)
        expect(snapshot).not.toHaveProperty('assign')
        expect(Object.values(snapshot).every(value => typeof value === 'string' || typeof value === 'number')).toBe(true)
    })
    it.each(['/next', '/?q=2', '/#part'])('U-LOCATION-02 detects URL change to %s without mutating snapshot', path => {
        const snapshot = cloneLocation()
        history.replaceState(null, '', path)
        expect(isLocationChanged(snapshot)).toBe(true)
        expect(snapshot.href).toBe('https://router.test/')
    })
    it('U-LOCATION-03 unchanged URL and state-only updates do not change location', () => {
        const snapshot = cloneLocation()
        expect(isLocationChanged(snapshot)).toBe(false)
        history.replaceState({flag: true}, '')
        expect(isLocationChanged(snapshot)).toBe(false)
    })
})

describe('U-SYNC React ref/state synchronization', () => {
    it('U-SYNC-01 useSync keeps ref identity and exposes the latest render value', () => {
        const {result, rerender} = renderHook(({value}) => useSync(value), {initialProps: {value: 1}})
        const ref = result.current
        rerender({value: 2})
        expect(result.current).toBe(ref)
        expect(ref.current).toBe(2)
    })
    it('U-SYNC-02 lazily initializes exactly once', () => {
        const initializer = vi.fn(() => ({count: 1}))
        const {result, rerender} = renderHook(() => useSyncState(initializer))
        rerender()
        expect(initializer).toHaveBeenCalledTimes(1)
        expect(result.current[0].current).toEqual({count: 1})
    })
    it('U-SYNC-03 updates the ref immediately and composes batched functional updates', () => {
        const {result} = renderHook(() => useSyncState(0))
        const [ref, setValue] = result.current
        act(() => {
            setValue(1)
            expect(ref.current).toBe(1)
            setValue(value => value + 1)
            setValue(value => value + 1)
            expect(ref.current).toBe(3)
        })
        expect(result.current[0]).toBe(ref)
        expect(result.current[1]).toBe(setValue)
        expect(result.current[0].current).toBe(3)
    })
    it('U-SYNC-04 assigning the same object does not schedule an extra render', () => {
        let renders = 0
        const initial = {value: 1}
        const {result} = renderHook(() => { renders++; return useSyncState(initial) })
        act(() => result.current[1](initial))
        expect(renders).toBe(1)
    })
    it('U-SYNC-05 supports omitted initial state', () => {
        const {result} = renderHook(() => useSyncState<string>())
        expect(result.current[0].current).toBeUndefined()
        act(() => result.current[1]('ready'))
        expect(result.current[0].current).toBe('ready')
    })
})
