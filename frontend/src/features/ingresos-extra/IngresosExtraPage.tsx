import { useState, type FormEvent } from 'react'
import { Coins, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { formatearBs, formatearFechaCorta } from '@/lib/formato'
import {
  useActualizarIngresoExtra,
  useCrearIngresoExtra,
  useEliminarIngresoExtra,
  useIngresosExtra,
} from './useIngresosExtra'
import type { CrearIngresoExtraPayload, IngresoExtra } from './tipos'

function hoy(): string {
  return new Date().toISOString().slice(0, 10)
}

function numero(valor: string): number {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

interface FormularioIngreso {
  material: string
  fecha: string
  precioPieza: string
  precioCinta: string
  montoTotal: string
  montoManual: boolean
}

function formularioVacio(): FormularioIngreso {
  return {
    material: '',
    fecha: hoy(),
    precioPieza: '',
    precioCinta: '',
    montoTotal: '0.00',
    montoManual: false,
  }
}

export function IngresosExtraPage() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [q, setQ] = useState('')
  const [form, setForm] = useState<FormularioIngreso>(formularioVacio)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const ingresos = useIngresosExtra({
    desde: desde || undefined,
    hasta: hasta || undefined,
    q: q.trim() || undefined,
  })
  const crear = useCrearIngresoExtra()
  const actualizar = useActualizarIngresoExtra()
  const eliminar = useEliminarIngresoExtra()

  const lista = ingresos.data ?? []
  const total = lista.reduce((suma, ingreso) => suma + numero(ingreso.monto_total), 0)
  const sumaPrecios = numero(form.precioPieza) + numero(form.precioCinta)
  const guardando = crear.isPending || actualizar.isPending

  const resetForm = (): void => {
    setForm(formularioVacio())
    setEditandoId(null)
    setError(null)
  }

  const cambiarPrecio = (campo: 'precioPieza' | 'precioCinta', valor: string): void => {
    setForm((actual) => {
      const siguiente = { ...actual, [campo]: valor }
      if (!siguiente.montoManual) {
        siguiente.montoTotal = (
          numero(campo === 'precioPieza' ? valor : actual.precioPieza) +
          numero(campo === 'precioCinta' ? valor : actual.precioCinta)
        ).toFixed(2)
      }
      return siguiente
    })
  }

  const editar = (ingreso: IngresoExtra): void => {
    setEditandoId(ingreso.id)
    setForm({
      material: ingreso.material,
      fecha: ingreso.fecha,
      precioPieza: ingreso.precio_pieza,
      precioCinta: ingreso.precio_cinta,
      montoTotal: ingreso.monto_total,
      montoManual: true,
    })
    setError(null)
  }

  const guardar = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    setError(null)

    if (!form.material.trim()) {
      setError('El material del retazo es obligatorio.')
      return
    }
    if (numero(form.montoTotal) < 0) {
      setError('El monto total no puede ser negativo.')
      return
    }

    const payload: CrearIngresoExtraPayload = {
      fecha: form.fecha || undefined,
      material: form.material.trim(),
      precio_pieza: (numero(form.precioPieza) || 0).toFixed(2),
      precio_cinta: (numero(form.precioCinta) || 0).toFixed(2),
      monto_total: (numero(form.montoTotal) || 0).toFixed(2),
    }

    if (editandoId !== null) {
      actualizar.mutate(
        { id: editandoId, payload },
        {
          onSuccess: resetForm,
          onError: (mutationError) =>
            setError(
              mutationError instanceof ApiError
                ? mutationError.message
                : 'No se pudo actualizar el ingreso extra.',
            ),
        },
      )
      return
    }

    crear.mutate(payload, {
      onSuccess: resetForm,
      onError: (mutationError) =>
        setError(
          mutationError instanceof ApiError
            ? mutationError.message
            : 'No se pudo registrar el ingreso extra.',
        ),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Ingresos extra</h1>
          <p className="text-sm text-muted-foreground">
            Retazos vendidos fuera del inventario: precio de la pieza y de la cinta por separado.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Coins aria-hidden="true" className="h-4 w-4 text-primary" />
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Total del listado</p>
            <p className="text-lg font-semibold tabular">{formatearBs(total.toFixed(2))}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1">
          <Label htmlFor="ingreso-desde" className="text-[11px] text-muted-foreground">
            Desde
          </Label>
          <Input
            id="ingreso-desde"
            type="date"
            value={desde}
            onChange={(event) => setDesde(event.target.value)}
            className="h-8 w-36"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="ingreso-hasta" className="text-[11px] text-muted-foreground">
            Hasta
          </Label>
          <Input
            id="ingreso-hasta"
            type="date"
            value={hasta}
            onChange={(event) => setHasta(event.target.value)}
            className="h-8 w-36"
          />
        </div>
        <div className="grid w-64 gap-1">
          <Label htmlFor="ingreso-q" className="text-[11px] text-muted-foreground">
            Material
          </Label>
          <Input
            id="ingreso-q"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por material"
            className="h-8"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDesde('')
            setHasta('')
            setQ('')
          }}
        >
          Limpiar filtros
        </Button>
      </div>

      {ingresos.isError ? (
        <Alert variant="destructive">
          <AlertDescription>No se pudieron cargar los ingresos extra.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
        <Card className="xl:sticky xl:top-20">
          <CardHeader>
            <CardTitle>{editandoId ? 'Editar ingreso extra' : 'Registrar retazo vendido'}</CardTitle>
            <CardDescription>
              {editandoId
                ? `Modificando el ingreso #${editandoId}.`
                : 'El monto total puede ser la suma de pieza + cinta o un valor propio.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={guardar} className="space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={form.material}
                  onChange={(event) =>
                    setForm((actual) => ({ ...actual, material: event.target.value }))
                  }
                  placeholder="Ej. Retazo melamina roble"
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={form.fecha}
                    onChange={(event) =>
                      setForm((actual) => ({ ...actual, fecha: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="monto-total">Monto total</Label>
                  <div className="relative">
                    <Input
                      id="monto-total"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={form.montoTotal}
                      onChange={(event) =>
                        setForm((actual) => ({
                          ...actual,
                          montoTotal: event.target.value,
                          montoManual: true,
                        }))
                      }
                      className="pr-9 text-right tabular"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                      Bs
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="precio-pieza">Precio de la pieza</Label>
                  <div className="relative">
                    <Input
                      id="precio-pieza"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={form.precioPieza}
                      onChange={(event) => cambiarPrecio('precioPieza', event.target.value)}
                      placeholder="0.00"
                      className="pr-9 text-right tabular"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                      Bs
                    </span>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="precio-cinta">Precio de la cinta</Label>
                  <div className="relative">
                    <Input
                      id="precio-cinta"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={form.precioCinta}
                      onChange={(event) => cambiarPrecio('precioCinta', event.target.value)}
                      placeholder="0.00"
                      className="pr-9 text-right tabular"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                      Bs
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-xs">
                <span className="text-muted-foreground">Pieza + cinta</span>
                <button
                  type="button"
                  className="font-medium tabular underline-offset-2 hover:underline"
                  onClick={() =>
                    setForm((actual) => ({
                      ...actual,
                      montoTotal: sumaPrecios.toFixed(2),
                      montoManual: false,
                    }))
                  }
                >
                  {formatearBs(sumaPrecios.toFixed(2))} · usar como total
                </button>
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex items-center gap-2">
                <Button type="submit" className="flex-1" disabled={guardando}>
                  {guardando ? (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : editandoId ? (
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Plus aria-hidden="true" className="h-4 w-4" />
                  )}
                  {editandoId ? 'Guardar cambios' : 'Registrar ingreso'}
                </Button>
                {editandoId ? (
                  <Button variant="outline" size="icon" aria-label="Cancelar edición" onClick={resetForm}>
                    <X aria-hidden="true" className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retazos vendidos</CardTitle>
            <CardDescription>
              {lista.length} registro{lista.length === 1 ? '' : 's'} · no afecta el inventario.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {ingresos.isPending ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Cargando ingresos extra…
              </p>
            ) : lista.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <p className="text-sm font-medium">No hay ingresos extra con estos filtros</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Registrá el primer retazo vendido. No descuenta stock ni se mezcla con las ventas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-normal">Fecha</th>
                      <th className="px-3 py-2 font-normal">Material</th>
                      <th className="px-3 py-2 text-right font-normal">Pieza</th>
                      <th className="px-3 py-2 text-right font-normal">Cinta</th>
                      <th className="px-3 py-2 text-right font-normal">Total</th>
                      <th className="px-4 py-2 text-right font-normal">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((ingreso) => (
                      <tr key={ingreso.id} className="border-t border-border/70">
                        <td className="px-4 py-2.5 tabular text-xs">
                          {formatearFechaCorta(ingreso.fecha)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium">{ingreso.material}</div>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular">
                          {formatearBs(ingreso.precio_pieza)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular">
                          {formatearBs(ingreso.precio_cinta)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular">
                          {formatearBs(ingreso.monto_total)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editar(ingreso)}
                            >
                              <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-negative"
                              disabled={eliminar.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(`¿Eliminar el ingreso "${ingreso.material}"?`)
                                ) {
                                  eliminar.mutate(ingreso.id)
                                }
                              }}
                            >
                              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
