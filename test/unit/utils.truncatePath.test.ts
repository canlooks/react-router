import { describe, it, expect } from 'vitest'
import { truncatePath } from '../../src/utils'

describe('truncatePath', () => {
    it('should strip a matching prefix from pathname', () => {
        expect(truncatePath('/app/users', '/app')).toBe('users')
    })

    it('should strip prefix from deeper nested paths', () => {
        expect(truncatePath('/app/users/123', '/app')).toBe('users/123')
    })

    it('should return empty string when prefix matches entire pathname', () => {
        expect(truncatePath('/app', '/app')).toBe('')
    })

    it('should return null when prefix does not match', () => {
        expect(truncatePath('/other', '/app')).toBeNull()
    })

    it('should return full pathname when scissor is empty string', () => {
        expect(truncatePath('/app', '')).toBe('app')
    })

    it('should strip prefix from a deeper nested path', () => {
        expect(truncatePath('/app/sub/deep', '/app')).toBe('sub/deep')
    })

    it('should accept regex with anchor as scissor', () => {
        expect(truncatePath('/app/users', /^\/app/)).toBe('users')
    })

    it('should accept regex without anchors as scissor', () => {
        expect(truncatePath('/app/users', /app/)).toBe('users')
    })

    it('should return full pathname when scissor is undefined', () => {
        expect(truncatePath('/app', undefined)).toBe('app')
    })

    it('should normalize trailing slash in scissor', () => {
        expect(truncatePath('/app/users', '/app/')).toBe('users')
    })

    it('should strip only the exact prefix, not prefix-like segments', () => {
        expect(truncatePath('/app/app-users', '/app')).toBe('app-users')
    })

    it('should treat a string base containing regex characters literally', () => {
        expect(truncatePath('/app.v1/home', '/app.v1')).toBe('home')
        expect(truncatePath('/appXv1/home', '/app.v1')).toBeNull()
    })

    it('should not throw for literal square brackets in a string base', () => {
        expect(truncatePath('/app[1]/home', '/app[1]')).toBe('home')
    })

    it('returns null when a regex does not match the prefix', () => {
        expect(truncatePath('/other/home', /app/)).toBeNull()
    })

    it('returns null when a regex match ends inside a path segment', () => {
        expect(truncatePath('/application/home', /app/)).toBeNull()
    })
})
