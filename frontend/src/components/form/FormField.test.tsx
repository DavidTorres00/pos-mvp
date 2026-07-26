import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { UseFormRegisterReturn } from 'react-hook-form'

import { FormField } from '@/components/form/FormField'

const register: UseFormRegisterReturn = {
  name: 'nombre',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
}

describe('FormField', () => {
  it('renders a labeled input with no error state', () => {
    render(<FormField label="Nombre" register={register} />)

    const input = screen.getByLabelText('Nombre')
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('wires aria-invalid and aria-describedby to the error message when present', () => {
    render(<FormField label="Nombre" register={register} error={{ type: 'required', message: 'El nombre es requerido' }} />)

    const input = screen.getByLabelText('Nombre')
    expect(input).toHaveAttribute('aria-invalid', 'true')

    const errorMessage = screen.getByRole('alert')
    expect(errorMessage).toHaveTextContent('El nombre es requerido')
    expect(input).toHaveAttribute('aria-describedby', errorMessage.id)
  })
})
