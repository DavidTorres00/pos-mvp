import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'

import { getApiErrorMessage } from '@/lib/apiError'

function makeAxiosError(status: number, detail?: string): AxiosError {
  const error = new AxiosError('Request failed')
  error.response = {
    status,
    data: detail !== undefined ? { detail } : {},
    statusText: '',
    headers: {},
    config: {} as AxiosResponse['config'],
  }
  return error
}

describe('getApiErrorMessage', () => {
  it('returns the backend detail when present', () => {
    const error = makeAxiosError(400, 'Ya hay una caja abierta')
    expect(getApiErrorMessage(error, 'fallback')).toBe('Ya hay una caja abierta')
  })

  it('returns the fallback when detail is missing', () => {
    const error = makeAxiosError(500)
    expect(getApiErrorMessage(error, 'fallback')).toBe('fallback')
  })

  it('returns the fallback for non-axios errors', () => {
    expect(getApiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
  })
})
