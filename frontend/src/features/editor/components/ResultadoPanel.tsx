import { useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { useEditor } from '../editor.store'
import { HojaCard } from './HojaCard'

/** Lista de hojas resultantes, con controles de dibujo (cortes y etiquetas). */
export function ResultadoPanel() {
  const resultado = useEditor((state) => state.resultado)
  const refiladoMm = useEditor((state) => state.opciones.refiladoMm)
  const [mostrarCortes, setMostrarCortes] = useState(true)
  const [mostrarEtiquetas, setMostrarEtiquetas] = useState(true)

  if (!resultado || resultado.resultado.hojas.length === 0) return null

  const { resultado: corte } = resultado

  return (
    <section className="space-y-4" aria-label="Hojas de corte">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Hojas de corte</h2>
          <p className="text-xs text-muted-foreground">
            Cada hoja con su secuencia de cortes y los metros de cinta.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5">
            <Checkbox
              checked={mostrarCortes}
              onChange={(event) => setMostrarCortes(event.target.checked)}
            />
            Secuencia de cortes
          </label>
          <label className="flex items-center gap-1.5">
            <Checkbox
              checked={mostrarEtiquetas}
              onChange={(event) => setMostrarEtiquetas(event.target.checked)}
            />
            Nombres y medidas
          </label>
        </div>
      </div>

      <div className="grid gap-4">
        {corte.hojas.map((hoja, indice) => (
          <HojaCard
            key={`${hoja.tipo}-${indice}`}
            hoja={hoja}
            indice={indice}
            total={corte.hojas.length}
            refiladoMm={refiladoMm}
            mostrarCortes={mostrarCortes}
            mostrarEtiquetas={mostrarEtiquetas}
          />
        ))}
      </div>
    </section>
  )
}
