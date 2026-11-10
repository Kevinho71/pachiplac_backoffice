import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'

import {
  ESQUEMA_VERSION,
  calcularMetrosCinta,
  cintaAEsquema,
  bordesAOptimizador,
  type EsquemaCorte,
} from '@pachiplac/shared'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/features/editor/editor.store'
import { OpcionesPanel } from '@/features/editor/components/OpcionesPanel'
import { PiezasTable } from '@/features/editor/components/PiezasTable'
import { ResumenPanel } from '@/features/editor/components/ResumenPanel'
import { ResultadoPanel } from '@/features/editor/components/ResultadoPanel'
import { useProductos } from '@/features/catalogo/useCatalogo'
import { construirEsquemaDeSeccion, reconstruirPiezasDeEsquema } from './esquemaVenta'
import { useActualizarEsquema, useVenta } from './useVentas'

export function EditarEsquemaVentaPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const ordenVenta = Number(id)
  const productoId = Number(searchParams.get('productoId'))
  const venta = useVenta(Number.isFinite(ordenVenta) ? ordenVenta : null)
  const productos = useProductos({ activo: true })
  const actualizar = useActualizarEsquema(ordenVenta)
  const cargar = useEditor((state) => state.cargar)
  const optimizar = useEditor((state) => state.optimizar)
  const estado = useEditor((state) => state.estado)
  const cargado = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cargado.current) return
    if (!venta.data || !Number.isFinite(productoId)) return
    if (productos.isPending) return
    cargado.current = true

    const seccion = venta.data.esquema?.secciones.find(
      (actual) => actual.producto_id === productoId,
    )
    const producto = productos.data?.find((actual) => actual.id === productoId)
    const esquemaSeccion: EsquemaCorte | null = seccion
      ? {
          version: venta.data.esquema?.version ?? ESQUEMA_VERSION,
          kerf_mm: venta.data.esquema?.kerf_mm ?? 4,
          refilado_mm: venta.data.esquema?.refilado_mm ?? 5,
          modo: venta.data.esquema?.modo ?? 'GUILLOTINA_LIBRE',
          secciones: [seccion],
          cinta: { total_m: 0, por_color: {} },
        }
      : null
    const piezas = esquemaSeccion ? reconstruirPiezasDeEsquema(esquemaSeccion) : []
    const hoja = seccion?.hojas[0]

    cargar(piezas, {
      material: producto?.nombre ?? `Material #${productoId}`,
      hojaLargoMm: hoja?.largo_mm ?? producto?.lamina?.largo_mm ?? 2750,
      hojaAnchoMm: hoja?.ancho_mm ?? producto?.lamina?.ancho_mm ?? 1830,
      kerf: esquemaSeccion?.kerf_mm ?? 4,
      refiladoMm: esquemaSeccion?.refilado_mm ?? 5,
      modoCorte: esquemaSeccion?.modo ?? 'GUILLOTINA_LIBRE',
      primerCorte: 'AUTO',
    })
    if (piezas.length > 0) {
      void optimizar()
    }
  }, [venta.data, productoId, productos.data, productos.isPending, cargar, optimizar])

  const guardar = (): void => {
    setError(null)
    const corte = useEditor.getState().resultado?.resultado
    const opciones = useEditor.getState().opciones
    if (!venta.data) return
    if (!corte || corte.hojas.length === 0) {
      setError('Optimizá el pedido antes de guardar el esquema.')
      return
    }
    if (corte.noCaben.length > 0) {
      setError('Hay piezas que no caben en la hoja. Ajustá las medidas o la hoja antes de guardar.')
      return
    }

    const nuevo = construirEsquemaDeSeccion(corte, opciones, productoId)
    const nuevaSeccion = nuevo.secciones[0]
    if (!nuevaSeccion) {
      setError('No se pudo construir la sección del esquema.')
      return
    }

    const actual = venta.data.esquema
    const secciones = actual
      ? actual.secciones.some((seccion) => seccion.producto_id === productoId)
        ? actual.secciones.map((seccion) =>
            seccion.producto_id === productoId ? nuevaSeccion : seccion,
          )
        : [...actual.secciones, nuevaSeccion]
      : [nuevaSeccion]

    const todasLasPiezas = secciones.flatMap((seccion) =>
      seccion.hojas.flatMap((hoja) =>
        hoja.piezas.map((pieza) => ({
          largo: pieza.w,
          ancho: pieza.h,
          cantidad: 1,
          bordes: bordesAOptimizador(pieza.bordes),
        })),
      ),
    )

    const esquema: EsquemaCorte = {
      version: ESQUEMA_VERSION,
      kerf_mm: opciones.kerf,
      refilado_mm: opciones.refiladoMm,
      modo: opciones.modoCorte,
      secciones,
      cinta: cintaAEsquema(calcularMetrosCinta(todasLasPiezas)),
    }

    actualizar.mutate(esquema, {
      onSuccess: () => {
        void navigate(`/ventas/${ordenVenta}`)
      },
      onError: () => setError('No se pudo guardar el esquema de la venta.'),
    })
  }

  if (!Number.isFinite(productoId)) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Elegí un material para editar su esquema.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to={`/ventas/${ordenVenta}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Venta #{venta.data?.numero ?? ''}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Editar esquema</h1>
          <p className="text-sm text-muted-foreground">
            El total y la cinta colocada se recalculan al guardar.
          </p>
        </div>
        <Button size="sm" onClick={guardar} disabled={estado === 'calculando' || actualizar.isPending}>
          {estado === 'calculando' || actualizar.isPending ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Check aria-hidden="true" className="h-4 w-4" />
          )}
          Guardar esquema
        </Button>
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
