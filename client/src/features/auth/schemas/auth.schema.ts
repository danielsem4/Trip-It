import { z } from 'zod'
import type { TFunction } from 'i18next'

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z.email(t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  })
}

export function createRegisterSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t('validation.nameRequired')),
    email: z.email(t('validation.emailInvalid')),
    password: z.string().min(8, t('validation.passwordMin')),
  })
}

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>
export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>
