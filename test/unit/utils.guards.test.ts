import { describe, it, expect } from 'vitest'
import { strOrNum, isUnset } from '../../src/utils'

describe('strOrNum', () => {
    it('should return true for a string', () => {
        expect(strOrNum('hello')).toBe(true)
    })

    it('should return true for a positive number', () => {
        expect(strOrNum(42)).toBe(true)
    })

    it('should return true for zero', () => {
        expect(strOrNum(0)).toBe(true)
    })

    it('should return false for boolean false', () => {
        expect(strOrNum(false)).toBe(false)
    })

    it('should return false for null', () => {
        expect(strOrNum(null)).toBe(false)
    })

    it('should return false for undefined', () => {
        expect(strOrNum(undefined)).toBe(false)
    })

    it('should return false for an object', () => {
        expect(strOrNum({})).toBe(false)
    })

    it('should return false for an array', () => {
        expect(strOrNum([])).toBe(false)
    })

    it('should return false for a Symbol', () => {
        expect(strOrNum(Symbol())).toBe(false)
    })
})

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
