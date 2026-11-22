import { apiClient } from '@/lib/apiClient'
import type { AuthUser } from '../types/auth.types'
import type { LoginFormData, RegisterFormData } from '../schemas/auth.schema'

export async function loginUser(data: LoginFormData): Promise<AuthUser> {
  const response = await apiClient.post<{ user: AuthUser }>('/auth/login', data)
  return response.data.user
}

export async function registerUser(data: RegisterFormData): Promise<AuthUser> {
  const response = await apiClient.post<{ user: AuthUser }>('/auth/register', data)
  return response.data.user
}

export async function getMe(signal?: AbortSignal): Promise<AuthUser> {
  const response = await apiClient.get<{ user: AuthUser }>('/auth/me', { signal })
  return response.data.user
}

export async function logoutUser(): Promise<void> {
  await apiClient.post('/auth/logout')
}
