import { useId } from 'react'

import type { HojaResultado } from '@pachiplac/optimizer'
import type { Lado } from '@pachiplac/shared'

import { cn } from '@/lib/utils'
import { colorDeCinta } from '../cinta-colores'

const RELLENOS = ['#f2ecdd', '#ebe1cf', '#f6f0e3', '#e7dcc7', '#efe6d6'] as const

interface EsquemaSvgProps {
  hoja: HojaResultado
  refiladoMm: number
  mostrarCortes: boolean
  mostrarEtiquetas: boolean
  className?: string
  titulo?: string
}

function hashId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function truncar(texto: string, maximo: number): string {
  return texto.length > maximo ? `${texto.slice(0, maximo - 1)}…` : texto
}

function lineaCinta(
  lado: Lado,
  pieza: { x: number; y: number; w: number; h: number },
  grosor: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const mitad = grosor / 2
  switch (lado) {
    case 'sup':
      return { x1: pieza.x, y1: pieza.y + mitad, x2: pieza.x + pieza.w, y2: pieza.y + mitad }
    case 'inf':
      return {
        x1: pieza.x,
        y1: pieza.y + pieza.h - mitad,
        x2: pieza.x + pieza.w,
        y2: pieza.y + pieza.h - mitad,
      }
    case 'izq':
      return { x1: pieza.x + mitad, y1: pieza.y, x2: pieza.x + mitad, y2: pieza.y + pieza.h }
    case 'der':
      return {
        x1: pieza.x + pieza.w - mitad,
        y1: pieza.y,
        x2: pieza.x + pieza.w - mitad,
        y2: pieza.y + pieza.h,
      }
  }
}

/**
 * Dibuja una hoja de corte a escala (mm reales en el `viewBox`): piezas,
 * secuencia numerada de cortes y línea gruesa del color de la cinta en cada lado.
 */
export function EsquemaSvg({
  hoja,
  refiladoMm,
  mostrarCortes,
  mostrarEtiquetas,
  className,
  titulo,
}: EsquemaSvgProps) {
  const idBase = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const clipId = `clip-${idBase}`

  const ancho = hoja.largo
  const alto = hoja.ancho
  const margen = Math.max(0, Math.min(refiladoMm, ancho / 4, alto / 4))
  const utilAncho = Math.max(1, ancho - 2 * margen)
  const utilAlto = Math.max(1, alto - 2 * margen)

  const base = Math.min(ancho, alto)
  const fuente = Math.max(26, base * 0.026)
  const grosorCinta = Math.max(8, base * 0.012)
  const grosorCorte = Math.max(2, base * 0.0028)
  const radioBadge = Math.max(9, base * 0.012)
  const grosorBorde = Math.max(1.2, base * 0.0014)

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      className={cn('block h-auto w-full', className)}
      role="img"
      aria-label={titulo ?? 'Esquema de corte'}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={utilAncho} height={utilAlto} />
        </clipPath>
      </defs>

      {/* Hoja completa */}
      <rect
        x={0}
        y={0}
        width={ancho}
        height={alto}
        fill="#fffdf8"
        stroke="#c9c0ae"
        strokeWidth={grosorBorde}
      />

      <g transform={`translate(${margen} ${margen})`}>
        {/* Superficie útil */}
        <rect x={0} y={0} width={utilAncho} height={utilAlto} fill="#faf6ec" />

        <g clipPath={`url(#${clipId})`}>
          {hoja.piezas.map((pieza, indice) => {
            const relleno = RELLENOS[hashId(pieza.idPieza) % RELLENOS.length]
            const centroX = pieza.x + pieza.w / 2
            const centroY = pieza.y + pieza.h / 2
            const tieneEtiqueta = Boolean(pieza.etiqueta)
            const cabeEtiqueta =
              mostrarEtiquetas && pieza.w > fuente * 3.2 && pieza.h > fuente * 2.6
            const cabeMedidas = mostrarEtiquetas && pieza.w > fuente * 3.2 && pieza.h > fuente * 1.6

            return (
              <g key={`${pieza.idPieza}-${indice}`}>
                <rect
                  x={pieza.x}
                  y={pieza.y}
                  width={pieza.w}
                  height={pieza.h}
                  fill={relleno}
                  stroke="#b7ae9c"
                  strokeWidth={Math.max(1, base * 0.0012)}
                />

                {(Object.entries(pieza.bordes) as Array<[Lado, string | undefined]>).map(
                  ([lado, color]) => {
                    if (!color) return null
                    const c = colorDeCinta(color)
                    const linea = lineaCinta(lado, pieza, grosorCinta)
                    return (
                      <g key={lado}>
                        <line
                          {...linea}
                          stroke="#1c1a16"
                          strokeWidth={grosorCinta * 1.14}
                          strokeLinecap="butt"
                          opacity={0.85}
                        />
                        <line
                          {...linea}
                          stroke={c.hex}
                          strokeWidth={grosorCinta}
                          strokeLinecap="butt"
                        />
                      </g>
                    )
                  },
                )}

                {cabeEtiqueta || cabeMedidas ? (
                  <text
                    x={centroX}
                    y={centroY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#2a261f"
                    fontSize={fuente}
                    style={{ fontFamily: 'inherit' }}
                  >
                    {cabeEtiqueta && tieneEtiqueta ? (
                      <tspan x={centroX} dy={-fuente * 0.18}>
                        {truncar(pieza.etiqueta ?? '', 18)}
                      </tspan>
                    ) : null}
                    {cabeMedidas ? (
                      <tspan
                        x={centroX}
                        dy={cabeEtiqueta && tieneEtiqueta ? fuente * 1.05 : 0}
                        fontSize={fuente * 0.82}
                        fill="#6d6557"
                      >
                        {Math.round(pieza.w)} × {Math.round(pieza.h)}
                      </tspan>
                    ) : null}
                  </text>
                ) : null}
              </g>
            )
          })}

          {mostrarCortes
            ? hoja.cortes.map((corte) => {
                const esVertical = corte.orientacion === 'V'
                const x1 = esVertical ? corte.posicion : corte.desde
                const y1 = esVertical ? corte.desde : corte.posicion
                const x2 = esVertical ? corte.posicion : corte.hasta
                const y2 = esVertical ? corte.hasta : corte.posicion
                const medioX = (x1 + x2) / 2
                const medioY = (y1 + y2) / 2

                return (
                  <g key={corte.n}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#2b2b28"
                      strokeWidth={grosorCorte}
                      strokeDasharray={`${grosorCorte * 4} ${grosorCorte * 2.5}`}
                      opacity={0.72}
                    />
                    <circle cx={medioX} cy={medioY} r={radioBadge} fill="#b4410f" />
                    <text
                      x={medioX}
                      y={medioY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fff8f1"
                      fontSize={radioBadge * 1.15}
                      fontWeight={600}
                      style={{ fontFamily: 'inherit' }}
                    >
                      {corte.n}
                    </text>
                  </g>
                )
              })
            : null}
        </g>

        {/* Borde de la superficie útil (después del refilado) */}
        <rect
          x={0}
          y={0}
          width={utilAncho}
          height={utilAlto}
          fill="none"
          stroke="#d6cdbb"
          strokeWidth={Math.max(1, base * 0.0012)}
        />
      </g>
    </svg>
  )
}
