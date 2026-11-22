import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { useToggle } from '@/hooks/useToggle'
import { AuthCard } from '../components/AuthCard'
import { IconInput } from '../components/IconInput'
import { PasswordToggle } from '../components/PasswordToggle'
import { useLogin } from '../hooks/useLogin'
import { createLoginSchema, type LoginFormData } from '../schemas/auth.schema'

export function LoginPage() {
  const { t, i18n } = useTranslation('auth')
  // Carried across to the other form, so signing up also returns to where they were headed.
  const location = useLocation()
  const { mutate: login, isPending, errorMessage } = useLogin()
  const [showPassword, toggleShowPassword] = useToggle()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loginSchema = useMemo(() => createLoginSchema(t), [i18n.language])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <AuthCard title={t('login.title')} subtitle={t('login.subtitle')} errorMessage={errorMessage}>
      <form onSubmit={handleSubmit((data) => login(data))} className="space-y-5" noValidate>
        <FormField id="email" label={t('fields.email')} error={errors.email?.message}>
          <IconInput
            id="email"
            type="email"
            icon={Mail}
            autoComplete="username"
            dir="ltr"
            placeholder={t('fields.emailPlaceholder')}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>
        <FormField id="password" label={t('fields.password')} error={errors.password?.message}>
          <IconInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            autoComplete="current-password"
            dir="ltr"
            placeholder={t('fields.passwordPlaceholder')}
            aria-invalid={!!errors.password}
            endAdornment={<PasswordToggle shown={showPassword} onToggle={toggleShowPassword} />}
            {...register('password')}
          />
        </FormField>
        <LoadingButton type="submit" className="h-11 w-full text-base" loading={isPending}>
          {t('login.submit')}
          <ArrowRight className="rtl:rotate-180" />
        </LoadingButton>
        <p className="text-center text-sm text-muted-foreground">
          {t('login.noAccount')}{' '}
          <Link to="/register" state={location.state} className="font-medium text-primary hover:underline">
            {t('login.toRegister')}
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
