import { describe, expect, it } from 'vitest'

import { sumLineTotals } from '@/lib/lineItems'

describe('sumLineTotals', () => {
  it('sums computed line totals', () => {
    const items = [
      { cantidad: 2, costo: 10 },
      { cantidad: 3, costo: 5 },
    ]
    expect(sumLineTotals(items, (item) => item.cantidad * item.costo)).toBe(35)
  })

  it('returns 0 for undefined items', () => {
    expect(sumLineTotals(undefined, () => 1)).toBe(0)
  })

  it('returns 0 for an empty list', () => {
    expect(sumLineTotals([], () => 1)).toBe(0)
  })
})
