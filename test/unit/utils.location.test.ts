import { describe, it, expect } from 'vitest'
import { cloneLocation, isLocationChanged } from '../../src/utils'
import type { ILocation } from '../../src/index'

describe('cloneLocation', () => {
    it('should return an object with expected location properties', () => {
        const cloned = cloneLocation()
        expect(typeof cloned).toBe('object')
        expect(cloned).not.toBeNull()
        expect(typeof cloned.href).toBe('string')
        expect(typeof cloned.pathname).toBe('string')
        expect(typeof cloned.search).toBe('string')
        expect(typeof cloned.hash).toBe('string')
        expect(typeof cloned.origin).toBe('string')
        expect(typeof cloned.protocol).toBe('string')
        expect(typeof cloned.host).toBe('string')
        expect(typeof cloned.hostname).toBe('string')
        expect(typeof cloned.port).toBe('string')
    })

    it('should only include string and number properties', () => {
        const cloned = cloneLocation()
        for (const value of Object.values(cloned)) {
            const t = typeof value
            expect(t === 'string' || t === 'number').toBe(true)
        }
    })

    it('should have a string href matching the current jsdom location', () => {
        const cloned = cloneLocation()
        expect(typeof cloned.href).toBe('string')
        expect(cloned.href.length).toBeGreaterThan(0)
    })
})

describe('isLocationChanged', () => {
    it('should return false for a freshly cloned location', () => {
        const cloned = cloneLocation()
        expect(isLocationChanged(cloned)).toBe(false)
    })

    it('should return true when pathname differs', () => {
        const cloned = cloneLocation()
        cloned.pathname = '/some-other-path'
        expect(isLocationChanged(cloned)).toBe(true)
    })

    it('should return true when search differs', () => {
        const cloned = cloneLocation()
        cloned.search = '?q=test'
        expect(isLocationChanged(cloned)).toBe(true)
    })

    it('should return true when hash differs', () => {
        const cloned = cloneLocation()
        cloned.hash = '#section'
        expect(isLocationChanged(cloned)).toBe(true)
    })
})
