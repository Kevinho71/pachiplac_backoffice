import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useEditor } from '../editor.store'
import { PIEZA_FORM_DEFAULT, piezaFormSchema, type PiezaFormValues } from '../esquemas'

/** Alta rápida de pieza con validación zod (react-hook-form). */
export function AddPiezaForm() {
  const addPieza = useEditor((state) => state.addPieza)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PiezaFormValues>({
    resolver: zodResolver(piezaFormSchema),
    defaultValues: PIEZA_FORM_DEFAULT,
  })

  const onSubmit = (values: PiezaFormValues): void => {
    addPieza(values)
    reset({ ...PIEZA_FORM_DEFAULT })
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event)
      }}
      className="flex flex-wrap items-end gap-2 border-t border-border px-4 py-3"
    >
      <div className="flex min-w-36 flex-1 flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="nueva-etiqueta">
          Pieza
        </label>
        <Input
          id="nueva-etiqueta"
          placeholder="Ej. Estante"
          maxLength={40}
          className="h-8"
          {...register('etiqueta')}
        />
        {errors.etiqueta ? (
          <span className="text-[11px] text-negative">{errors.etiqueta.message}</span>
        ) : null}
      </div>

      <div className="flex w-20 flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="nueva-largo">
          Largo mm
        </label>
        <Input
          id="nueva-largo"
          type="number"
          inputMode="numeric"
          className="h-8 text-right tabular"
          {...register('largo', { valueAsNumber: true })}
        />
        {errors.largo ? (
          <span className="text-[11px] text-negative">{errors.largo.message}</span>
        ) : null}
      </div>

      <div className="flex w-20 flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="nueva-ancho">
          Ancho mm
        </label>
        <Input
          id="nueva-ancho"
          type="number"
          inputMode="numeric"
          className="h-8 text-right tabular"
          {...register('ancho', { valueAsNumber: true })}
        />
        {errors.ancho ? (
          <span className="text-[11px] text-negative">{errors.ancho.message}</span>
        ) : null}
      </div>

      <div className="flex w-16 flex-col gap-1">
        <label className="text-xs text-muted-foreground" htmlFor="nueva-cantidad">
          Cant.
        </label>
        <Input
          id="nueva-cantidad"
          type="number"
          inputMode="numeric"
          className="h-8 text-right tabular"
          {...register('cantidad', { valueAsNumber: true })}
        />
        {errors.cantidad ? (
          <span className="text-[11px] text-negative">{errors.cantidad.message}</span>
        ) : null}
      </div>

      <label className="flex h-8 items-center gap-1.5 text-xs text-muted-foreground">
        <Checkbox {...register('puedeRotar')} />
        Rotar
      </label>

      <Button type="submit" size="sm" variant="secondary" className="h-8">
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        Agregar
      </Button>
    </form>
  )
}
