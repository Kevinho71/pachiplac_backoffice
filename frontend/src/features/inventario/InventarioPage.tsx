import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { Select } from '@/components/ui/select'
import { CATEGORIA_LABEL } from '@/features/catalogo/tipos'
import { useProductos } from '@/features/catalogo/useCatalogo'
import { ApiError } from '@/lib/api'
import { formatearFechaCorta, formatearStock } from '@/lib/formato'
import { useCompras, useCrearCompra, useStock } from './useInventario'

const HOY = new Date().toISOString().slice(0, 10)

export function InventarioPage() {
  const productos = useProductos({ activo: true })
  const compras = useCompras()
  const stock = useStock()
  const crear = useCrearCompra()

  const [productoId, setProductoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [costoTotal, setCostoTotal] = useState('')
  const [fecha, setFecha] = useState(HOY)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  const cantidadNum = Number(cantidad)
  const costoNum = Number(costoTotal)
  const costoUnitario =
    Number.isFinite(cantidadNum) && cantidadNum > 0 && Number.isFinite(costoNum) && costoNum >= 0
      ? (costoNum / cantidadNum).toFixed(2)
      : '—'

  const productoSeleccionado = productos.data?.find((item) => item.id === Number(productoId))
  const unidadCompra =
    productoSeleccionado?.categoria === 'LAMINA'
      ? 'hojas'
      : productoSeleccionado?.unidad_venta === 'METRO'
        ? 'metros'
        : 'unidades'
  const unidadCompraSingular =
    unidadCompra === 'hojas' ? 'hoja' : unidadCompra === 'metros' ? 'metro' : 'unidad'

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    setErrorLocal(null)
    if (!productoId) {
      setErrorLocal('Elegí un producto.')
      return
    }
    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0 || !Number.isInteger(cantidadNum)) {
      setErrorLocal('La cantidad debe ser un entero mayor que 0.')
      return
    }
    if (!Number.isFinite(costoNum) || costoNum < 0) {
      setErrorLocal('El costo total no puede ser negativo.')
      return
    }
    crear.mutate(
      {
        producto_id: Number(productoId),
        cantidad: cantidadNum,
        costo_total: costoNum.toFixed(2),
        fecha,
      },
      {
        onSuccess: () => {
          setCantidad('')
          setCostoTotal('')
        },
      },
    )
  }

  const errorApi = crear.error
  const error =
    errorLocal ??
    (errorApi
      ? errorApi instanceof ApiError
        ? errorApi.message
        : 'No se pudo registrar la compra.'
      : null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          Compras de reabastecimiento y stock calculado de la sucursal activa.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Registrar compra</CardTitle>
            <CardDescription>
              Por paquete o por hojas sueltas: el costo unitario se calcula solo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="compra-producto">Producto</Label>
                <Select
                  id="compra-producto"
                  value={productoId}
                  onChange={(event) => setProductoId(event.target.value)}
                  disabled={productos.isPending}
                >
                  <option value="">Elegí un producto</option>
                  {productos.data?.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} · {CATEGORIA_LABEL[producto.categoria]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="compra-cantidad">Cantidad ({unidadCompra})</Label>
                  <Input
                    id="compra-cantidad"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={cantidad}
                    onChange={(event) => setCantidad(event.target.value)}
                    placeholder="0"
                    className="text-right tabular"
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="compra-costo">Costo total</Label>
                  <div className="relative">
                    <Input
                      id="compra-costo"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={costoTotal}
                      onChange={(event) => setCostoTotal(event.target.value)}
                      placeholder="0.00"
                      className="pr-9 text-right tabular"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                      Bs
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  Costo por {unidadCompraSingular}
                </span>
                <span className="font-medium tabular">Bs {costoUnitario}</span>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="compra-fecha">Fecha</Label>
                <Input
                  id="compra-fecha"
                  type="date"
                  value={fecha}
                  max={HOY}
                  onChange={(event) => setFecha(event.target.value)}
                />
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" disabled={crear.isPending}>
                {crear.isPending ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : null}
                Registrar compra
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Stock por sucursal</CardTitle>
            <CardDescription>
              Calculado como compras − ventas. Solo productos que controlan stock.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stock.isPending ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Cargando stock…
              </p>
            ) : stock.data && stock.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-normal">Producto</th>
                      <th className="px-4 py-2 font-normal">Categoría</th>
                      <th className="px-4 py-2 text-right font-normal">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.data.map((item) => (
                      <tr key={item.producto_id} className="border-t border-border/70">
                        <td className="px-4 py-2.5 font-medium">{item.nombre}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline">{CATEGORIA_LABEL[item.categoria]}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular">
                          {formatearStock(item.stock, item.unidad_venta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Sin productos con control de stock.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Compras registradas</CardTitle>
          <CardDescription>Últimos reabastecimientos de la sucursal activa.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {compras.isPending ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Cargando compras…
            </p>
          ) : compras.data && compras.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-normal">Fecha</th>
                    <th className="px-4 py-2 font-normal">Producto</th>
                    <th className="px-4 py-2 text-right font-normal">Cantidad</th>
                    <th className="px-4 py-2 text-right font-normal">Costo total</th>
                    <th className="px-4 py-2 text-right font-normal">Costo unitario</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.data.map((compra) => (
                    <tr key={compra.id} className="border-t border-border/70">
                      <td className="px-4 py-2.5 tabular text-muted-foreground">
                        {formatearFechaCorta(compra.fecha)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{compra.producto.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {CATEGORIA_LABEL[compra.producto.categoria]}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular">{compra.cantidad}</td>
                      <td className="px-4 py-2.5 text-right tabular">Bs {compra.costo_total}</td>
                      <td className="px-4 py-2.5 text-right tabular">
                        Bs {compra.costo_unitario}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Todavía no hay compras registradas.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
