import { AlertTriangle, Loader2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatearDimensiones, formatearMetros } from '../constantes'
import { useEditor } from '../editor.store'

/**
 * Respuesta principal de la pantalla: cuántas hojas necesita el pedido y cuánto
 * material consume. Se muestra como una tira de cifras, no como tarjetas sueltas.
 */
export function ResumenPanel() {
  const estado = useEditor((state) => state.estado)
  const error = useEditor((state) => state.error)
  const resultado = useEditor((state) => state.resultado)
  const piezas = useEditor((state) => state.piezas)

  if (estado === 'calculando') {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-primary" />
          Buscando la distribución con menos hojas…
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle className="flex items-center gap-2">
          <AlertTriangle aria-hidden="true" className="h-4 w-4" />
          No se pudo optimizar
        </AlertTitle>
        <AlertDescription className="text-negative/80">{error}</AlertDescription>
      </Alert>
    )
  }

  if (!resultado) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-1 p-4">
          <p className="text-sm font-medium">Todavía no hay un esquema</p>
          <p className="text-xs text-muted-foreground">
            Cargá las piezas y las medidas de la hoja y presioná{' '}
            <span className="font-medium text-foreground">Optimizar</span> para ver el corte.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { resultado: corte, calculadoEn } = resultado
  const hojas = corte.hojas
  const promedio =
    hojas.length > 0
      ? hojas.reduce((total, hoja) => total + hoja.aprovechamiento, 0) / hojas.length
      : 0
  const retazoMayor = hojas.reduce(
    (mejor, hoja) =>
      hoja.retazoMayor.w * hoja.retazoMayor.h > mejor.w * mejor.h ? hoja.retazoMayor : mejor,
    { w: 0, h: 0 },
  )

  const cifras = [
    { etiqueta: 'Hojas', valor: String(hojas.length), destacada: true },
    { etiqueta: 'Medias hojas', valor: String(corte.totalMedias) },
    { etiqueta: 'Cinta total', valor: formatearMetros(corte.metrosCinta.total) },
    { etiqueta: 'Aprovechamiento', valor: `${(promedio * 100).toFixed(1)}%` },
  ]

  const nombresNoCaben = corte.noCaben.map((id) => {
    const pieza = piezas.find((item) => item.id === id)
    return pieza?.etiqueta.trim() || 'pieza sin nombre'
  })

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-border bg-border">
        <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
          {cifras.map((cifra) => (
            <div key={cifra.etiqueta} className="bg-card p-4">
              <div className="text-xs text-muted-foreground">{cifra.etiqueta}</div>
              <div
                className={cn(
                  'mt-1 font-semibold tabular',
                  cifra.destacada ? 'text-2xl' : 'text-lg',
                )}
              >
                {cifra.valor}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
        <span>
          {corte.noCaben.length > 0 ? (
            <span className="text-negative">
              No cabe en la hoja: {nombresNoCaben.join(', ')}. Ajustá la medida o la hoja.
            </span>
          ) : retazoMayor.w > 0 ? (
            <>
              El sobrante más grande mide{' '}
              <span className="tabular text-foreground">
                {formatearDimensiones(retazoMayor.w, retazoMayor.h)}
              </span>
              .
            </>
          ) : (
            'Todas las piezas entran en la hoja.'
          )}
        </span>
        <span className="tabular">
          Calculado a las{' '}
          {calculadoEn.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
