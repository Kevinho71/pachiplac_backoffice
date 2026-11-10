import type { HojaResultado } from '@pachiplac/optimizer'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { colorDeCinta } from '../cinta-colores'
import { metrosDeHoja } from '../cinta-hoja'
import { formatearDimensiones, formatearMetros, TIPO_HOJA_LABEL } from '../constantes'
import { EsquemaZoom } from './EsquemaZoom'

interface HojaCardProps {
  hoja: HojaResultado
  indice: number
  total: number
  refiladoMm: number
  mostrarCortes: boolean
  mostrarEtiquetas: boolean
}

export function HojaCard({
  hoja,
  indice,
  total,
  refiladoMm,
  mostrarCortes,
  mostrarEtiquetas,
}: HojaCardProps) {
  const metros = metrosDeHoja(hoja)
  const colores = Object.entries(metros.porColor)
  const retazo = hoja.retazoMayor

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">
            Hoja {indice + 1} <span className="font-normal text-muted-foreground">de {total}</span>
          </span>
          <Badge variant="outline">{TIPO_HOJA_LABEL[hoja.tipo]}</Badge>
          <span className="text-xs tabular text-muted-foreground">
            {formatearDimensiones(hoja.largo, hoja.ancho)}
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold tabular">
            {(hoja.aprovechamiento * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-muted-foreground">aprovechamiento</div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4">
        <EsquemaZoom
          hoja={hoja}
          refiladoMm={refiladoMm}
          mostrarCortes={mostrarCortes}
          mostrarEtiquetas={mostrarEtiquetas}
          titulo={`Hoja ${indice + 1} de ${total}`}
        />
      </CardContent>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border px-4 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <span>
            Retazo mayor{' '}
            <span className="tabular text-foreground">
              {retazo.w > 0 && retazo.h > 0 ? formatearDimensiones(retazo.w, retazo.h) : '—'}
            </span>
          </span>
          <span>
            Cortes <span className="tabular text-foreground">{hoja.cortes.length}</span>
          </span>
          <span>
            Cinta <span className="tabular text-foreground">{formatearMetros(metros.total)}</span>
          </span>
        </div>

        {colores.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {colores.map(([nombre, metrosColor]) => {
              const color = colorDeCinta(nombre)
              return (
                <span
                  key={nombre}
                  className="inline-flex items-center gap-1.5 text-muted-foreground"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full border"
                    style={{
                      backgroundColor: color.hex,
                      borderColor: color.borde ?? 'transparent',
                    }}
                  />
                  <span className="text-foreground">{nombre}</span>
                  <span className="tabular">{formatearMetros(metrosColor)}</span>
                </span>
              )
            })}
          </div>
        ) : (
          <span className="text-muted-foreground">Sin cinta</span>
        )}
      </div>
    </Card>
  )
}
