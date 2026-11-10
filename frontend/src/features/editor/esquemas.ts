import { z } from 'zod'

/** Formulario de alta de pieza. Los números llegan ya convertidos con valueAsNumber. */
export const piezaFormSchema = z.object({
  etiqueta: z.string().trim().max(40, 'Máximo 40 caracteres'),
  largo: z
    .number({ invalid_type_error: 'Ingresá un número' })
    .int('Usá milímetros enteros')
    .min(10, 'Mínimo 10 mm')
    .max(10_000, 'Máximo 10 000 mm'),
  ancho: z
    .number({ invalid_type_error: 'Ingresá un número' })
    .int('Usá milímetros enteros')
    .min(10, 'Mínimo 10 mm')
    .max(10_000, 'Máximo 10 000 mm'),
  cantidad: z
    .number({ invalid_type_error: 'Ingresá un número' })
    .int('Usá unidades enteras')
    .min(1, 'Mínimo 1')
    .max(999, 'Máximo 999'),
  puedeRotar: z.boolean(),
})

export type PiezaFormValues = z.infer<typeof piezaFormSchema>

export const PIEZA_FORM_DEFAULT: PiezaFormValues = {
  etiqueta: '',
  largo: 800,
  ancho: 400,
  cantidad: 1,
  puedeRotar: true,
}
