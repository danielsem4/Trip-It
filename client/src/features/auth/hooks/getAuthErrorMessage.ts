import axios from 'axios'
import type { TFunction } from 'i18next'

export function getAuthErrorMessage(error: unknown, t: TFunction): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return t('toast.invalidCredentials')
    const message = error.response?.data?.message
    if (message && error.response?.status !== 500) return String(message)
  }
  return t('errors.generic')
}
