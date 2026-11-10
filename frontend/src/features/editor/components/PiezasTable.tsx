import { ArrowDown, ArrowUp, Copy, RotateCw, Trash2 } from 'lucide-react'

import type { Lado } from '@pachiplac/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { AddPiezaForm } from './AddPiezaForm'
import { CintaLados } from './CintaLados'
import { COLORES_CINTA } from '../cinta-colores'
import { useEditor } from '../editor.store'

export function PiezasTable() {
  const piezas = useEditor((state) => state.piezas)
  const colorActivo = useEditor((state) => state.colorActivo)
  const setColorActivo = useEditor((state) => state.setColorActivo)
  const updatePieza = useEditor((state) => state.updatePieza)
  const setBorde = useEditor((state) => state.setBorde)
  const removePieza = useEditor((state) => state.removePieza)
  const duplicarPieza = useEditor((state) => state.duplicarPieza)
  const moverPieza = useEditor((state) => state.moverPieza)

  const totalPiezas = piezas.reduce((total, pieza) => total + (pieza.cantidad || 0), 0)

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Piezas del pedido</CardTitle>
          <CardDescription>
            {piezas.length === 0
              ? 'Todavía no cargaste piezas.'
              : `${piezas.length} líneas · ${totalPiezas} piezas en total`}
          </CardDescription>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs text-muted-foreground">
            Cinta activa: <span className="font-medium text-foreground">{colorActivo}</span>
          </span>
          <div
            className="flex flex-wrap justify-end gap-1.5"
            role="group"
            aria-label="Color de cinta activo"
          >
            {COLORES_CINTA.map((color) => {
              const activo = color.nombre === colorActivo
              return (
                <button
                  key={color.nombre}
                  type="button"
                  aria-label={`Usar cinta ${color.nombre}`}
                  aria-pressed={activo}
                  title={color.nombre}
                  onClick={() => setColorActivo(color.nombre)}
                  className={cn(
                    'h-5 w-5 rounded-full border transition-transform',
                    activo ? 'scale-110 ring-2 ring-ring ring-offset-1' : 'hover:scale-105',
                  )}
                  style={{
                    backgroundColor: color.hex,
                    borderColor: color.borde ?? 'transparent',
                  }}
                />
              )
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-normal">Pieza</th>
                <th className="px-2 py-2 text-right font-normal">Largo mm</th>
                <th className="px-2 py-2 text-right font-normal">Ancho mm</th>
                <th className="px-2 py-2 text-right font-normal">Cant.</th>
                <th className="px-2 py-2 text-center font-normal">Rotar</th>
                <th className="px-3 py-2 font-normal">Cinta por lado</th>
                <th className="px-2 py-2 text-right font-normal">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {piezas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Agregá una pieza abajo para empezar el pedido.
                  </td>
                </tr>
              ) : (
                piezas.map((pieza, indice) => (
                  <tr key={pieza.id} className="border-t border-border/70 align-middle">
                    <td className="px-4 py-1.5">
                      <Input
                        aria-label="Nombre de la pieza"
                        value={pieza.etiqueta}
                        maxLength={40}
                        onChange={(event) =>
                          updatePieza(pieza.id, { etiqueta: event.target.value })
                        }
                        className="h-8 w-32 border-transparent bg-transparent px-1 hover:border-input focus-visible:border-input"
                        placeholder="Sin nombre"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <Input
                        aria-label="Largo en milímetros"
                        type="number"
                        inputMode="numeric"
                        value={Number.isFinite(pieza.largo) ? pieza.largo : ''}
                        onChange={(event) =>
                          updatePieza(pieza.id, { largo: Number(event.target.value) })
                        }
                        className="ml-auto h-8 w-20 border-transparent bg-transparent px-1 text-right tabular hover:border-input focus-visible:border-input"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <Input
                        aria-label="Ancho en milímetros"
                        type="number"
                        inputMode="numeric"
                        value={Number.isFinite(pieza.ancho) ? pieza.ancho : ''}
                        onChange={(event) =>
                          updatePieza(pieza.id, { ancho: Number(event.target.value) })
                        }
                        className="ml-auto h-8 w-20 border-transparent bg-transparent px-1 text-right tabular hover:border-input focus-visible:border-input"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <Input
                        aria-label="Cantidad"
                        type="number"
                        inputMode="numeric"
                        value={Number.isFinite(pieza.cantidad) ? pieza.cantidad : ''}
                        onChange={(event) =>
                          updatePieza(pieza.id, { cantidad: Number(event.target.value) })
                        }
                        className="ml-auto h-8 w-14 border-transparent bg-transparent px-1 text-right tabular hover:border-input focus-visible:border-input"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <Checkbox
                        aria-label={`Permitir rotar ${pieza.etiqueta || 'la pieza'}`}
                        checked={pieza.puedeRotar}
                        onChange={(event) =>
                          updatePieza(pieza.id, { puedeRotar: event.target.checked })
                        }
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <CintaLados
                          bordes={pieza.bordes}
                          colorActivo={colorActivo}
                          onChange={(lado: Lado, color) => setBorde(pieza.id, lado, color)}
                        />
                        <span className="hidden text-[11px] leading-tight text-muted-foreground lg:block">
                          {resumenCinta(pieza.bordes)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Subir pieza"
                          disabled={indice === 0}
                          onClick={() => moverPieza(pieza.id, -1)}
                        >
                          <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Bajar pieza"
                          disabled={indice === piezas.length - 1}
                          onClick={() => moverPieza(pieza.id, 1)}
                        >
                          <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Voltear pieza (intercambiar largo y ancho)"
                          title="Voltear: intercambiar largo y ancho"
                          onClick={() =>
                            updatePieza(pieza.id, { largo: pieza.ancho, ancho: pieza.largo })
                          }
                        >
                          <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Duplicar pieza"
                          onClick={() => duplicarPieza(pieza.id)}
                        >
                          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-negative"
                          aria-label="Eliminar pieza"
                          onClick={() => removePieza(pieza.id)}
                        >
                          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AddPiezaForm />
      </CardContent>
    </Card>
  )
}

function resumenCinta(bordes: Record<Lado, string | null>): string {
  const activos = (Object.entries(bordes) as Array<[Lado, string | null]>)
    .filter(([, color]) => Boolean(color))
    .map(([, color]) => color as string)
  if (activos.length === 0) return 'Sin cinta'
  const unicos = [...new Set(activos)]
  if (unicos.length === 1) {
    return `${activos.length} lado${activos.length > 1 ? 's' : ''} · ${unicos[0]}`
  }
  return `${activos.length} lados · varios colores`
}
