'use client'

interface ToggleProps {
  checked:  boolean
  onChange: (checked: boolean) => void
  label?:   string
  id?:      string
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-bg last:border-0">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-dark cursor-pointer">
          {label}
        </label>
      )}
      <label className="relative inline-block w-10 h-[22px] flex-shrink-0 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="opacity-0 w-0 h-0 absolute"
        />
        <span className="toggle-slider" />
      </label>
    </div>
  )
}
