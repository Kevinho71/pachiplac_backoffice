import { BadRequestException, type PipeTransform } from '@nestjs/common'
import type { ZodError, ZodSchema } from 'zod'

/**
 * Pipe de validación con zod (esquemas compartidos de `@pachiplac/shared`).
 * Se instancia por-endpoint: `@Body(new ZodValidationPipe(loginInputSchema))`.
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const resultado = this.schema.safeParse(value)
    if (!resultado.success) {
      throw new BadRequestException(this.formatear(resultado.error))
    }
    return resultado.data
  }

  private formatear(error: ZodError): string {
    return error.issues.map((issue) => issue.message).join('; ')
  }
}
