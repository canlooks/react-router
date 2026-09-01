import { describe, it, expect } from 'vitest'
import { isUnset } from '../../src/utils'

describe('isUnset', () => {
    it('should return true for undefined', () => {
        expect(isUnset(undefined)).toBe(true)
    })

    it('should return true for null', () => {
        expect(isUnset(null)).toBe(true)
    })

    it('should return true for false', () => {
        expect(isUnset(false)).toBe(true)
    })

    it('should return false for zero', () => {
        expect(isUnset(0)).toBe(false)
    })

    it('should return false for empty string', () => {
        expect(isUnset('')).toBe(false)
    })

    it('should return false for an object', () => {
        expect(isUnset({})).toBe(false)
    })
})
