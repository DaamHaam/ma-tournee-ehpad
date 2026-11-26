import { describe, expect, it } from 'vitest'
import { netsoinTugText, TUG_BOOKMARKLET } from './bookmarklet'

describe('favori « Remplir le TUG » pour NetSoin', () => {
  it('est une adresse javascript: valide', () => {
    expect(TUG_BOOKMARKLET.startsWith('javascript:')).toBe(true)
    expect(() => new Function(decodeURIComponent(TUG_BOOKMARKLET.slice('javascript:'.length)))).not.toThrow()
    expect(netsoinTugText([4, 4, 5, 3, 2])).toBe('4\t4\t5\t3\t2')
  })
})
