import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { loginUser } from '../api/auth.api'
import type { LoginFormData } from '../schemas/auth.schema'
import { useAuth } from './useAuth'
import { getAuthErrorMessage } from './getAuthErrorMessage'

export function useLogin() {
  const { t } = useTranslation('auth')
  const { setUser } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (data: LoginFormData) => loginUser(data),
    onMutate: () => setErrorMessage(null),
    onSuccess: (user) => setUser(user),
    onError: (error) => setErrorMessage(getAuthErrorMessage(error, t)),
  })

  return { ...mutation, errorMessage }
}
