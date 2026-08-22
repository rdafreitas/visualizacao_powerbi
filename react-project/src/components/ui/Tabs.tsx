'use client'

import { cn } from '@/lib/utils'

interface Tab {
  key:   string
  label: string
}

interface TabsProps {
  tabs:      Tab[]
  active:    string
  onChange:  (key: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1 bg-white rounded-2xl p-1.5',
        'border border-black/[0.04] shadow-sm flex-wrap',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
            active === tab.key
              ? 'bg-purple text-white'
              : 'text-gray-mid hover:text-gray-dark hover:bg-gray-bg'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
