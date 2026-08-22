import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title:      string
  subtitle?:  string
  actions?:   React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 flex-wrap mb-7',
        className
      )}
    >
      <div>
        <h2 className="font-poppins text-2xl font-extrabold text-gray-dark leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-mid mt-1">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  )
}
