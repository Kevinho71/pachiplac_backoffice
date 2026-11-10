import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/features/editor/editor.store'
import { OpcionesPanel } from '@/features/editor/components/OpcionesPanel'
import { PiezasTable } from '@/features/editor/components/PiezasTable'
import { ResumenPanel } from '@/features/editor/components/ResumenPanel'
import { ResultadoPanel } from '@/features/editor/components/ResultadoPanel'
import { useProductos } from '@/features/catalogo/useCatalogo'
import { construirEsquemaDeSeccion, reconstruirPiezasDeEsquema } from './esquemaVenta'
import { useVentaDraft } from './ventaDraft.store'

export function EsquemaVentaPage() {
  const navigate = useNavigate()
  const draft = useVentaDraft()
  const editor = draft.editor
  const cargar = useEditor((state) => state.cargar)
  const optimizar = useEditor((state) => state.optimizar)
  const estado = useEditor((state) => state.estado)
  const productos = useProductos({ activo: true })
  const cargado = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editor || cargado.current === editor.key) return
    cargado.current = editor.key

    if (editor.esquema) {
      const piezas = reconstruirPiezasDeEsquema(editor.esquema)
      const hoja = editor.esquema.secciones[0]?.hojas[0]
      cargar(piezas, {
        material: editor.material,
        hojaLargoMm: hoja?.largo_mm ?? editor.largo_mm,
        hojaAnchoMm: hoja?.ancho_mm ?? editor.ancho_mm,
        kerf: editor.esquema.kerf_mm,
        refiladoMm: editor.esquema.refilado_mm,
        modoCorte: editor.esquema.modo,
      })
      if (piezas.length > 0) {
        void optimizar()
      }
    } else {
      cargar([], {
        material: editor.material,
        hojaLargoMm: editor.largo_mm,
        hojaAnchoMm: editor.ancho_mm,
        kerf: 4,
        refiladoMm: 5,
        modoCorte: 'GUILLOTINA_LIBRE',
        primerCorte: 'AUTO',
      })
    }
  }, [editor, cargar, optimizar])

  if (!editor) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No hay un esquema en edición. Volvé a la venta y elegí un material.
        </AlertDescription>
      </Alert>
    )
  }

  const guardar = (): void => {
    setError(null)
    const corte = useEditor.getState().resultado?.resultado
    const opciones = useEditor.getState().opciones
    if (!corte || corte.hojas.length === 0) {
      setError('Optimizá el pedido antes de usar el esquema.')
      return
    }
    if (corte.noCaben.length > 0) {
      setError('Hay piezas que no caben en la hoja. Ajustá las medidas o la hoja antes de guardar.')
      return
    }

    const esquema = construirEsquemaDeSeccion(corte, opciones, editor.producto_id)
    const totalMedias = corte.totalMedias
    const seccionId = editor.seccionId ?? crypto.randomUUID()
    const material = opciones.material.trim() || editor.material

    draft.upsertSeccion({
      id: seccionId,
      producto_id: editor.producto_id,
      material,
      largo_mm: opciones.hojaLargoMm,
      ancho_mm: opciones.hojaAnchoMm,
      total_medias: totalMedias,
      esquema,
    })

    const producto = productos.data?.find((item) => item.id === editor.producto_id)
    const existente = draft.items.find((item) => item.producto_id === editor.producto_id)
    if (existente) {
      draft.updateItem(existente.id, { cantidad: totalMedias.toFixed(2) })
    } else {
      draft.addItem({
        producto_id: editor.producto_id,
        nombre: producto?.nombre ?? material,
        categoria: 'LAMINA',
        unidad_venta: 'MEDIA',
        cantidad: totalMedias.toFixed(2),
        precio_unitario: producto?.precio_vigente ?? '0.00',
        stock: producto?.stock ?? null,
      })
    }

    draft.setEditor(null)
    void navigate('/ventas/nueva')
  }

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={guardar}
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Volver y guardar esquema
          </button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Esquema de corte</h1>
          <p className="text-sm text-muted-foreground">{editor.material}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              draft.setEditor(null)
              void navigate('/ventas/nueva')
            }}
          >
            Descartar
          </Button>
          <Button size="sm" onClick={guardar} disabled={estado === 'calculando'}>
            {estado === 'calculando' ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Check aria-hidden="true" className="h-4 w-4" />
            )}
            Usar este esquema
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="no-print mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

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
    </div>
  )
}
