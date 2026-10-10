import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING = {
  none: 'p-0',
  sm:   'p-4 sm',
  md:   'p-5 sm:p-6',
  lg:   'p-6 sm:p-8',
}

export function Card({ 
  padding = 'sm', 
  className, 
  children, ...props 
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-bordo/[0.4] rounded-2xl border border-black/[0.04] shadow-sm',
        PADDING[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('font-montserrat text-sm font-bold text-chumbo mb-4', className)}
      {...props}
    >
      {children}
    </p>
  )
}