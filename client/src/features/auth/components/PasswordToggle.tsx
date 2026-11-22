import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface PasswordToggleProps {
  shown: boolean
  onToggle: () => void
}

export function PasswordToggle({ shown, onToggle }: PasswordToggleProps) {
  const { t } = useTranslation('auth')
  const EyeIcon = shown ? EyeOff : Eye

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-9 text-primary/80 hover:text-primary"
      aria-label={t(shown ? 'hidePassword' : 'showPassword')}
      aria-pressed={shown}
      onClick={onToggle}
    >
      <EyeIcon className="size-5" />
    </Button>
  )
}
