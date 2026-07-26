import { Controller, type Control, type FieldError, type FieldValues, type Path } from 'react-hook-form'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface SelectFieldOption {
  value: string
  label: string
}

interface SelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: Path<TFieldValues>
  label: string
  hideLabel?: boolean
  options: SelectFieldOption[]
  placeholder?: string
  error?: FieldError
  parse?: (value: string) => unknown
  serialize?: (value: unknown) => string
}

function defaultSerialize(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

export function SelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hideLabel,
  options,
  placeholder,
  error,
  parse = (value) => value,
  serialize = defaultSerialize,
}: SelectFieldProps<TFieldValues>) {
  const fieldId = `${name}-select`
  const errorId = `${fieldId}-error`

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={fieldId} className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select value={serialize(field.value)} onValueChange={(value) => field.onChange(parse(value))}>
            <SelectTrigger id={fieldId} aria-invalid={!!error} aria-describedby={error ? errorId : undefined}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  )
}
