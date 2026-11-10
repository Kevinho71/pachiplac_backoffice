import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FileText, Loader2, Pencil, Receipt, Scissors } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { ApiError } from '@/lib/api'
import { formatearBs, formatearFechaHora } from '@/lib/formato'
import { useProductos } from '@/features/catalogo/useCatalogo'
import { useActualizarEntregado, useActualizarSaldo, useVenta } from './useVentas'

function sufijoCantidad(unidad: string): string {
  if (unidad === 'MEDIA') return 'medias'
  if (unidad === 'METRO') return 'm'
  return 'u.'
}

export function VentaDetallePage() {
  const { id } = useParams()
  const ordenVenta = Number(id)
  const venta = useVenta(Number.isFinite(ordenVenta) ? ordenVenta : null)
  const productos = useProductos({})
  const saldo = useActualizarSaldo(ordenVenta)
  const entregado = useActualizarEntregado(ordenVenta)
  const [abono, setAbono] = useState('')
  const [laminaNueva, setLaminaNueva] = useState('')
  const [errorAbono, setErrorAbono] = useState<string | null>(null)

  if (venta.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Cargando venta…
      </div>
    )
  }

  if (venta.isError || !venta.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No se pudo cargar la venta.</AlertDescription>
      </Alert>
    )
  }

  const detalle = venta.data
  const laminas = (productos.data ?? []).filter(
    (producto) => producto.categoria === 'LAMINA' && producto.activo,
  )
  const productoPorId = new Map((productos.data ?? []).map((producto) => [producto.id, producto]))

  const registrarAbono = (): void => {
    setErrorAbono(null)
    const monto = Number(abono)
    if (!Number.isFinite(monto) || monto <= 0) {
      setErrorAbono('Ingresá un abono mayor que 0.')
      return
    }
    saldo.mutate(
      { abono: monto.toFixed(2) },
      {
        onSuccess: () => setAbono(''),
        onError: (mutationError) =>
          setErrorAbono(
            mutationError instanceof ApiError
              ? mutationError.message
              : 'No se pudo registrar el abono.',
          ),
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to="/ventas"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Ventas
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Venta #{detalle.numero}</h1>
            {detalle.es_factura ? (
              <Badge variant="primary">
                <Receipt aria-hidden="true" className="h-3 w-3" />
                Factura {detalle.nro_factura ?? ''}
              </Badge>
            ) : (
              <Badge variant="outline">Nota de venta</Badge>
            )}
            {detalle.cancelada ? (
              <Badge variant="positive">Cancelada</Badge>
            ) : (
              <Badge variant="negative">Con saldo</Badge>
            )}
            {detalle.entregado ? <Badge variant="positive">Entregada</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatearFechaHora(detalle.fecha)} · {detalle.cliente?.nombre ?? 'Mostrador'} ·{' '}
            {detalle.metodo_pago}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            to={`/ventas/${detalle.orden_venta}/imprimir?tipo=NOTA`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <FileText aria-hidden="true" className="h-4 w-4" />
            Nota
          </Link>
          {detalle.tiene_esquema ? (
            <Link
              to={`/ventas/${detalle.orden_venta}/imprimir?tipo=PEDIDO`}
              className={buttonVariants({ size: 'sm' })}
            >
              <Scissors aria-hidden="true" className="h-4 w-4" />
              Pedido de corte
            </Link>
          ) : null}
          <Button
            variant={detalle.entregado ? 'outline' : 'secondary'}
            size="sm"
            disabled={entregado.isPending}
            onClick={() => entregado.mutate(!detalle.entregado)}
          >
            {entregado.isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            )}
            {detalle.entregado ? 'Marcar pendiente' : 'Marcar entregada'}
          </Button>
        </div>
      </div>

      {detalle.entregado === false && !detalle.corte_autorizado ? (
        <Alert variant="warning">
          <AlertDescription>
            El saldo pendiente supera la mitad del total: la regla del 50% avisa, pero no bloquea la
            impresión del pedido.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ítems</CardTitle>
              <CardDescription>
                Precios copiados del historial vigente al registrar la venta.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-normal">Producto</th>
                      <th className="px-3 py-2 text-right font-normal">Cantidad</th>
                      <th className="px-3 py-2 text-right font-normal">Precio</th>
                      <th className="px-4 py-2 text-right font-normal">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.items.map((item) => (
                      <tr key={item.id} className="border-t border-border/70">
                        <td className="px-4 py-2.5">
                          <div className="font-medium">{item.producto_nombre}</div>
                          <div className="mt-0.5">
                            <Badge variant="outline">{item.categoria}</Badge>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular">
                          {item.cantidad} {sufijoCantidad(item.unidad_venta)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular">
                          {formatearBs(item.precio_unitario)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular">
                          {formatearBs(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Esquema de corte</CardTitle>
              <CardDescription>
                {detalle.tiene_esquema
                  ? 'Guardado con la venta y recalculado al editarlo.'
                  : 'Esta venta no tiene cortes guardados.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {detalle.esquema ? (
                <>
                  {detalle.esquema.secciones.map((seccion) => {
                    const producto = productoPorId.get(seccion.producto_id)
                    const hojas = seccion.hojas.length
                    const medias = seccion.hojas.reduce(
                      (total, hoja) => total + (hoja.tipo === 'ENTERA' ? 2 : 1),
                      0,
                    )
                    return (
                      <div
                        key={`${seccion.producto_id}-${hojas}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {producto?.nombre ?? `Material #${seccion.producto_id}`}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {hojas} hoja{hojas === 1 ? '' : 's'} · {medias} medias
                          </p>
                        </div>
                        <Link
                          to={`/ventas/${detalle.orden_venta}/esquema?productoId=${seccion.producto_id}`}
                          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                        >
                          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                      </div>
                    )
                  })}
                  <p className="text-xs text-muted-foreground">
                    Cinta colocada total: {detalle.cinta_colocada_m.toFixed(2)} m ·{' '}
                    {detalle.hojas_corte} hoja{detalle.hojas_corte === 1 ? '' : 's'} de corte
                  </p>
                </>
              ) : (
                <div className="flex flex-wrap items-end gap-2">
                  <div className="grid min-w-56 flex-1 gap-1.5">
                    <Label htmlFor="lamina-nueva">Agregar esquema para</Label>
                    <Select
                      id="lamina-nueva"
                      value={laminaNueva}
                      onChange={(event) => setLaminaNueva(event.target.value)}
                    >
                      <option value="">Elegí una lámina</option>
                      {laminas.map((producto) => (
                        <option key={producto.id} value={producto.id}>
                          {producto.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Link
                    to={
                      laminaNueva
                        ? `/ventas/${detalle.orden_venta}/esquema?productoId=${laminaNueva}`
                        : '#'
                    }
                    aria-disabled={!laminaNueva}
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                      className: !laminaNueva ? 'pointer-events-none opacity-50' : undefined,
                    })}
                  >
                    <Scissors aria-hidden="true" className="h-4 w-4" />
                    Armar esquema
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-6 xl:sticky xl:top-20">
          <Card>
            <CardHeader>
              <CardTitle>Totales</CardTitle>
              <CardDescription>Pago y saldo pendiente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="tabular font-semibold">{formatearBs(detalle.monto_total)}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Pagado</span>
                <span className="tabular">{formatearBs(detalle.pagado)}</span>
              </p>
              <p className="flex justify-between rounded-md bg-secondary px-3 py-2">
                <span>Saldo</span>
                <span
                  className={
                    detalle.saldo === '0.00' ? 'tabular text-positive' : 'tabular text-negative'
                  }
                >
                  {formatearBs(detalle.saldo)}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {detalle.corte_autorizado
                  ? 'Corte autorizado: saldo ≤ 50% del total.'
                  : 'Saldo mayor al 50%: se avisa, no se bloquea.'}
              </p>

              {detalle.saldo !== '0.00' ? (
                <div className="space-y-1.5 border-t border-border pt-3">
                  <Label htmlFor="abono">Registrar abono</Label>
                  <div className="flex gap-1.5">
                    <Input
                      id="abono"
                      type="number"
                      inputMode="decimal"
                      min={0.01}
                      step="0.01"
                      value={abono}
                      onChange={(event) => setAbono(event.target.value)}
                      placeholder="0.00"
                      className="text-right tabular"
                    />
                    <Button size="sm" onClick={registrarAbono} disabled={saldo.isPending}>
                      {saldo.isPending ? (
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : null}
                      Abonar
                    </Button>
                  </div>
                  {errorAbono ? <p className="text-[11px] text-negative">{errorAbono}</p> : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{detalle.cliente?.nombre ?? 'Mostrador'}</p>
              {detalle.cliente?.telefono ? (
                <p className="text-muted-foreground">{detalle.cliente.telefono}</p>
              ) : null}
              <p className="text-muted-foreground">Método: {detalle.metodo_pago}</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
