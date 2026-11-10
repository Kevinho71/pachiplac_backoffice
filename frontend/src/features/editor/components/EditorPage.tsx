import { useEffect, useRef } from 'react'
import { Loader2, Printer, RotateCcw, Scissors } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { OpcionesPanel } from './OpcionesPanel'
import { PiezasTable } from './PiezasTable'
import { PrintView } from './PrintView'
import { ResumenPanel } from './ResumenPanel'
import { ResultadoPanel } from './ResultadoPanel'
import { useEditor } from '../editor.store'

export function EditorPage() {
  const estado = useEditor((state) => state.estado)
  const resultado = useEditor((state) => state.resultado)
  const opciones = useEditor((state) => state.opciones)
  const optimizar = useEditor((state) => state.optimizar)
  const reiniciar = useEditor((state) => state.reiniciar)

  const calculando = estado === 'calculando'

  // Optimiza el pedido de ejemplo la primera vez que se abre la pantalla, para
  // que el esquema (la respuesta de la pantalla) esté visible desde el inicio.
  const autoOptimizado = useRef(false)
  useEffect(() => {
    if (autoOptimizado.current) return
    autoOptimizado.current = true
    if (useEditor.getState().estado === 'inactivo') {
      void optimizar()
    }
  }, [optimizar])

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Editor de cortes</h1>
          <p className="text-sm text-muted-foreground">
            {opciones.material || 'Material sin nombre'} · hoja {opciones.hojaLargoMm} ×{' '}
            {opciones.hojaAnchoMm} mm · kerf {opciones.kerf} mm
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={reiniciar}
            title="Volver al pedido de ejemplo"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Reiniciar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!resultado}
            onClick={() => window.print()}
          >
            <Printer aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
          <Button size="sm" onClick={() => void optimizar()} disabled={calculando}>
            {calculando ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Scissors aria-hidden="true" className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{calculando ? 'Optimizando…' : 'Optimizar'}</span>
          </Button>
        </div>
      </div>

      <div className="no-print space-y-6">
        <ResumenPanel />

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
          <div className="min-w-0 xl:sticky xl:top-20">
            <OpcionesPanel />
          </div>

          <div className="min-w-0 space-y-6">
            <PiezasTable />
            <ResultadoPanel />
          </div>
        </div>
      </div>

      <PrintView />
    </div>
  )
}
