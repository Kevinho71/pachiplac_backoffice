import { z } from 'zod'

import { idSchema } from './common'

/** Login simple de un único usuario (el dueño). El JWT viaja en cookie httpOnly. */
export const loginInputSchema = z.object({
  email: z.string().trim().email('correo inválido'),
  password: z.string().min(1, 'la contraseña es requerida'),
})

export const usuarioSesionSchema = z.object({
  id: idSchema,
  email: z.string().email(),
})

export const loginResponseSchema = z.object({
  usuario: usuarioSesionSchema,
})

export type LoginInput = z.infer<typeof loginInputSchema>
export type UsuarioSesion = z.infer<typeof usuarioSesionSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
