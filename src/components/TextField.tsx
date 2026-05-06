import type { Customer } from '../services/api'

export type CustomerDraft = Omit<Customer, 'id'>

type TextFieldProps = {
  label: string
  min?: number
  name: keyof CustomerDraft
  onChange: (name: keyof CustomerDraft, value: string | number) => void
  required?: boolean
  type?: 'date' | 'email' | 'number' | 'text'
  value: string | number
}

export function TextField({
  label,
  min,
  name,
  onChange,
  required,
  type = 'text',
  value,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        min={min}
        onChange={(event) =>
          onChange(
            name,
            type === 'number'
              ? Number(event.target.value)
              : event.target.value,
          )
        }
        required={required}
        type={type}
        value={value}
      />
    </label>
  )
}
