import { cn } from '@/lib/utils'
import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'

export function Table({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.04] shadow-sm">
      <table
        className={cn('w-full border-collapse', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function Thead({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('bg-gray-bg border-b-[1.5px] border-[#E8E8F0]', className)}
      {...props}
    >
      {children}
    </thead>
  )
}

export function Th({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-5 py-3 text-left text-[11px] font-bold text-gray-mid uppercase tracking-wide',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function Tbody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn('divide-y divide-gray-bg bg-white', className)}
      {...props}
    >
      {children}
    </tbody>
  )
}

export function Tr({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('transition-colors hover:bg-[#FAFAFE]', className)}
      {...props}
    >
      {children}
    </tr>
  )
}

export function Td({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-5 py-3.5 text-sm text-gray-dark align-middle', className)}
      {...props}
    >
      {children}
    </td>
  )
}
