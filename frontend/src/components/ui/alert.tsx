import * as React from 'react'

import { cn } from '@/lib/utils'

type AlertVariant = 'default' | 'destructive' | 'warning'

const variantClasses: Record<AlertVariant, string> = {
  default: 'border-border bg-card text-foreground',
  destructive: 'border-destructive/30 bg-destructive/5 text-negative',
  warning: 'border-primary/30 bg-primary/5 text-foreground',
}

function Alert({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      role="alert"
      className={cn('rounded-md border px-3 py-2 text-sm', variantClasses[variant], className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('font-medium', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-0.5 text-xs text-muted-foreground', className)} {...props} />
}

export { Alert, AlertTitle, AlertDescription }
