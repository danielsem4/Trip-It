import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Lock, Mail, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormField } from '@/components/common/FormField'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { useToggle } from '@/hooks/useToggle'
import { AuthCard } from '../components/AuthCard'
import { IconInput } from '../components/IconInput'
import { PasswordToggle } from '../components/PasswordToggle'
import { useRegister } from '../hooks/useRegister'
import { createRegisterSchema, type RegisterFormData } from '../schemas/auth.schema'

export function RegisterPage() {
  const { t, i18n } = useTranslation('auth')
  // Carried across to the other form, so signing up also returns to where they were headed.
  const location = useLocation()
  const { mutate: registerAccount, isPending, errorMessage } = useRegister()
  const [showPassword, toggleShowPassword] = useToggle()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const registerSchema = useMemo(() => createRegisterSchema(t), [i18n.language])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  return (
    <AuthCard title={t('register.title')} subtitle={t('register.subtitle')} errorMessage={errorMessage}>
      <form onSubmit={handleSubmit((data) => registerAccount(data))} className="space-y-5" noValidate>
        <FormField id="name" label={t('fields.name')} error={errors.name?.message}>
          <IconInput
            id="name"
            icon={User}
            autoComplete="name"
            placeholder={t('fields.namePlaceholder')}
            aria-invalid={!!errors.name}
            {...register('name')}
          />
        </FormField>
        <FormField id="email" label={t('fields.email')} error={errors.email?.message}>
          <IconInput
            id="email"
            type="email"
            icon={Mail}
            autoComplete="email"
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
            autoComplete="new-password"
            dir="ltr"
            placeholder={t('fields.passwordPlaceholder')}
            aria-invalid={!!errors.password}
            endAdornment={<PasswordToggle shown={showPassword} onToggle={toggleShowPassword} />}
            {...register('password')}
          />
        </FormField>
        <LoadingButton type="submit" className="h-11 w-full text-base" loading={isPending}>
          {t('register.submit')}
          <ArrowRight className="rtl:rotate-180" />
        </LoadingButton>
        <p className="text-center text-sm text-muted-foreground">
          {t('register.hasAccount')}{' '}
          <Link to="/login" state={location.state} className="font-medium text-primary hover:underline">
            {t('register.toLogin')}
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
