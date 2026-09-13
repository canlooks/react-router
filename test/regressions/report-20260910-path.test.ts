import {describe, expect, it} from 'vitest'
import {joinPath, matchPath} from '../../src'

describe('X-JOIN public utility boundaries', () => {
  it.each([
    [['https://router.test/a','b'],'https://router.test/a/b'],
    [['https://router.test/a','../b'],'https://router.test/b'],
    [['/a','.well-known'],'/a/.well-known'],
    [['/a','..hidden'],'/a/..hidden'],
    [['/a','b?q=/x//y'],'/a/b?q=/x//y'],
    [['/a?q=/x//y'],'/a?q=/x//y'],
    [['/a','./b'],'/a/b'],
    [['/a/b','../c'],'/a/c']
  ] as [string[],string][])('X-JOIN-01 joinPath(%j) preserves path literals and URL structure', (parts,expected)=>{
    expect(joinPath(...parts)).toBe(expected)
  })
})

describe('X-PARAM legal parameter names', () => {
  it.each(['__proto__','constructor','toString','id'])('X-PARAM-01 named parameter %s is an own property', name => {
    const params=matchPath('/value','/:'+name)!
    expect(Object.hasOwn(params,name)).toBe(true)
    expect(params[name]).toBe('value')
  })
  it('X-PARAM-02 repeated __proto__ parameters form an own array', () => {
    const params=matchPath('/a/b','/:__proto__/:__proto__')!
    expect(Object.hasOwn(params,'__proto__')).toBe(true)
    expect(params['__proto__']).toEqual(['a','b'])
  })
})

describe('X-JOIN-02 additional authority and suffix boundaries', () => {
  it.each([
    [['/a', 'b#part//'], '/a/b#part//'],
    [['/a', 'b?next=https://h/a//b#part//'], '/a/b?next=https://h/a//b#part//'],
    [['https://user:pass@router.test:8443/a', 'b'], 'https://user:pass@router.test:8443/a/b'],
    [['/a/b/c', '../../d'], '/a/d'],
    [['/a', '?q=1'], '/a/?q=1'],
    [['/a', '#part'], '/a/#part'],
    [['/a', '../b'], '/b'],
    [['/a', '.../b'], '/a/.../b']
  ] as [string[], string][])('preserves structure for %j', (parts, expected) => {
    expect(joinPath(...parts)).toBe(expected)
  })
  it('normalizes only the pathname of a complete URL', () => {
    expect(joinPath('https://user:pass@router.test:8443/a$//中文/%2F///?return=/a//b/$/#part//'))
      .toBe('https://user:pass@router.test:8443/a$/中文/%2F?return=/a//b/$/#part//')
  })
  it('keeps root and empty distinctions', () => {
    expect(joinPath()).toBe('')
    expect(joinPath('/')).toBe('')
    expect(joinPath('/', '')).toBe('/')
  })
})
