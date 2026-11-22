import { AlertCircle, Plane } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthCardProps {
  title: string
  subtitle: string
  errorMessage?: string | null
  children: React.ReactNode
}

export function AuthCard({ title, subtitle, errorMessage, children }: AuthCardProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Card className="w-full max-w-md gap-6 py-8 shadow-xl sm:gap-8 sm:py-10">
        <CardHeader className="items-center gap-3 px-6 text-center sm:px-10">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Plane aria-hidden className="size-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl">{title}</CardTitle>
          <CardDescription className="text-balance">{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-6 sm:px-10">
          {errorMessage && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
              {errorMessage}
            </p>
          )}
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
