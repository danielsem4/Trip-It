import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { registerUser } from '../api/auth.api'
import type { RegisterFormData } from '../schemas/auth.schema'
import { useAuth } from './useAuth'
import { getAuthErrorMessage } from './getAuthErrorMessage'

export function useRegister() {
  const { t } = useTranslation('auth')
  const { setUser } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (data: RegisterFormData) => registerUser(data),
    onMutate: () => setErrorMessage(null),
    onSuccess: (user) => setUser(user),
    onError: (error) => setErrorMessage(getAuthErrorMessage(error, t)),
  })

  return { ...mutation, errorMessage }
}
