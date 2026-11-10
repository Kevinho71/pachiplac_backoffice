import type { Lado } from '@pachiplac/shared'

import { cn } from '@/lib/utils'
import { colorDeCinta } from '../cinta-colores'
import type { BordesEditor } from '../editor.types'

const LADOS_UI: ReadonlyArray<{ lado: Lado; flecha: string; nombre: string }> = [
  { lado: 'sup', flecha: '↑', nombre: 'Superior' },
  { lado: 'der', flecha: '→', nombre: 'Derecho' },
  { lado: 'inf', flecha: '↓', nombre: 'Inferior' },
  { lado: 'izq', flecha: '←', nombre: 'Izquierdo' },
]

interface CintaLadosProps {
  bordes: BordesEditor
  colorActivo: string
  onChange: (lado: Lado, color: string | null) => void
  className?: string
}

/**
 * Cuatro botones, uno por lado de la pieza. Un clic pone la cinta con el color
 * activo; otro clic la quita. Los lados siguen la orientación original de la
 * pieza (largo × ancho), como en la especificación §5.9.
 */
export function CintaLados({ bordes, colorActivo, onChange, className }: CintaLadosProps) {
  return (
    <div
      role="group"
      aria-label="Cinta de canto por lado"
      className={cn('grid grid-cols-4 gap-1', className)}
    >
      {LADOS_UI.map(({ lado, flecha, nombre }) => {
        const color = bordes[lado]
        const c = colorDeCinta(color)
        return (
          <button
            key={lado}
            type="button"
            aria-pressed={Boolean(color)}
            title={`${nombre}: ${color ?? 'sin cinta'}`}
            onClick={() => onChange(lado, color ? null : colorActivo)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-sm border text-[12px] leading-none transition-colors',
              color
                ? 'font-semibold'
                : 'border-border bg-card text-muted-foreground hover:bg-accent',
            )}
            style={
              color
                ? {
                    backgroundColor: c.hex,
                    color: c.texto ?? '#ffffff',
                    borderColor: c.borde ?? '#1c1a16',
                    boxShadow: 'inset 0 0 0 1px rgba(28, 26, 22, 0.16)',
                  }
                : undefined
            }
          >
            {flecha}
          </button>
        )
      })}
    </div>
  )
}
