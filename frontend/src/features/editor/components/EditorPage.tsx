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
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Marca />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={reiniciar}
              title="Volver al pedido de ejemplo"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Reiniciar
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
      </header>

      <main className="no-print mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Editor de cortes</h1>
          <p className="text-sm text-muted-foreground">
            {opciones.material || 'Material sin nombre'} · hoja {opciones.hojaLargoMm} ×{' '}
            {opciones.hojaAnchoMm} mm · kerf {opciones.kerf} mm
          </p>
        </div>

        <div className="space-y-6">
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
      </main>

      <PrintView />
    </div>
  )
}

/** Marca del producto: una lámina con dos cortes, dibujada, no un cuadrado con letra. */
function Marca() {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        aria-hidden="true"
        className="text-foreground"
      >
        <rect
          x="2.5"
          y="2.5"
          width="23"
          height="23"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line x1="2.5" y1="17" x2="25.5" y2="17" stroke="var(--primary)" strokeWidth="1.6" />
        <line x1="17" y1="2.5" x2="17" y2="17" stroke="var(--primary)" strokeWidth="1.6" />
      </svg>
      <div className="leading-none">
        <div className="text-sm font-semibold tracking-tight">PACHIPLAC</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">Editor de cortes</div>
      </div>
    </div>
  )
}
