import { describe, it, expect } from 'vitest'
import { unifySlash, dropStartSlash, dropEndSlash, unifyPath, dropLastPortion } from '../../src/utils'

describe('unifySlash', () => {
    it('should convert backslashes to forward slashes', () => {
        expect(unifySlash('a\\b\\c')).toBe('a/b/c')
    })

    it('should collapse multiple consecutive slashes', () => {
        expect(unifySlash('a//b///c')).toBe('a/b/c')
    })

    it('should return unchanged if already unified', () => {
        expect(unifySlash('a/b/c')).toBe('a/b/c')
    })

    it('should return empty string for empty input', () => {
        expect(unifySlash('')).toBe('')
    })

    it('should reduce triple slashes to single slash', () => {
        expect(unifySlash('///')).toBe('/')
    })

    it('should handle leading backslashes', () => {
        expect(unifySlash('\\\\a\\\\b')).toBe('/a/b')
    })
})

describe('dropStartSlash', () => {
    it('should remove a single leading slash', () => {
        expect(dropStartSlash('/a/b')).toBe('a/b')
    })

    it('should remove multiple leading slashes', () => {
        expect(dropStartSlash('//a/b')).toBe('a/b')
    })

    it('should return unchanged when no leading slash', () => {
        expect(dropStartSlash('a/b')).toBe('a/b')
    })

    it('should return empty string for empty input', () => {
        expect(dropStartSlash('')).toBe('')
    })
})

describe('dropEndSlash', () => {
    it('should remove a single trailing slash', () => {
        expect(dropEndSlash('a/b/')).toBe('a/b')
    })

    it('should remove multiple trailing slashes', () => {
        expect(dropEndSlash('a/b///')).toBe('a/b')
    })

    it('should return unchanged when no trailing slash', () => {
        expect(dropEndSlash('a/b')).toBe('a/b')
    })

    it('should return empty string for empty input', () => {
        expect(dropEndSlash('')).toBe('')
    })
})

describe('unifyPath', () => {
    it('should normalize path with mixed separators and slashes', () => {
        expect(unifyPath('/a\\b//c/')).toBe('a/b/c')
    })

    it('should return unchanged for already clean path', () => {
        expect(unifyPath('a/b/c')).toBe('a/b/c')
    })

    it('should return empty string when all characters are slashes', () => {
        expect(unifyPath('///')).toBe('')
    })
})

describe('dropLastPortion', () => {
    it('should remove the last path segment', () => {
        expect(dropLastPortion('a/b/c')).toBe('a/b')
    })

    it('should return original string when only one segment without slash', () => {
        expect(dropLastPortion('a')).toBe('a')
    })

    it('should handle trailing slash', () => {
        expect(dropLastPortion('a/b/')).toBe('a')
    })

    it('should return empty string for empty input', () => {
        expect(dropLastPortion('')).toBe('')
    })
})
