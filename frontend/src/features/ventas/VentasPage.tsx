import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Plus, Receipt, Scissors } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { formatearBs, formatearFechaHora } from '@/lib/formato'
import { useVentas } from './useVentas'

export function VentasPage() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [esFactura, setEsFactura] = useState<'' | 'true' | 'false'>('')
  const [pendientes, setPendientes] = useState(false)
  const [entregado, setEntregado] = useState<'' | 'true' | 'false'>('')

  const ventas = useVentas({
    desde: desde || undefined,
    hasta: hasta || undefined,
    esFactura: esFactura === '' ? undefined : esFactura === 'true',
    pendientes: pendientes ? true : undefined,
    entregado: entregado === '' ? undefined : entregado === 'true',
  })

  const lista = ventas.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Ventas</h1>
          <p className="text-sm text-muted-foreground">
            Notas, pedidos de corte, saldos y entregas de la sucursal activa.
          </p>
        </div>
        <Link to="/ventas/nueva" className={buttonVariants({ size: 'sm' })}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nueva venta
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1">
          <Label htmlFor="filtro-desde" className="text-[11px] text-muted-foreground">
            Desde
          </Label>
          <Input
            id="filtro-desde"
            type="date"
            value={desde}
            onChange={(event) => setDesde(event.target.value)}
            className="h-8 w-36"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="filtro-hasta" className="text-[11px] text-muted-foreground">
            Hasta
          </Label>
          <Input
            id="filtro-hasta"
            type="date"
            value={hasta}
            onChange={(event) => setHasta(event.target.value)}
            className="h-8 w-36"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="filtro-doc" className="text-[11px] text-muted-foreground">
            Documento
          </Label>
          <Select
            id="filtro-doc"
            value={esFactura}
            onChange={(event) => setEsFactura(event.target.value as '' | 'true' | 'false')}
            className="h-8 w-40"
          >
            <option value="">Todas</option>
            <option value="true">Con factura</option>
            <option value="false">Sin factura</option>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="filtro-entrega" className="text-[11px] text-muted-foreground">
            Entrega
          </Label>
          <Select
            id="filtro-entrega"
            value={entregado}
            onChange={(event) => setEntregado(event.target.value as '' | 'true' | 'false')}
            className="h-8 w-36"
          >
            <option value="">Todas</option>
            <option value="true">Entregadas</option>
            <option value="false">Pendientes</option>
          </Select>
        </div>
        <label className="flex h-8 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pendientes}
            onChange={(event) => setPendientes(event.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Solo con saldo
        </label>
      </div>

      {ventas.isError ? (
        <Alert variant="destructive">
          <AlertDescription>No se pudieron cargar las ventas.</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {ventas.isPending ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Cargando ventas…
            </p>
          ) : lista.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <p className="text-sm font-medium">No hay ventas con estos filtros</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Registrá la primera venta para guardar su esquema de corte y poder reimprimirla.
              </p>
              <Link
                to="/ventas/nueva"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Nueva venta
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-normal">Nº</th>
                    <th className="px-3 py-2 font-normal">Fecha</th>
                    <th className="px-3 py-2 font-normal">Cliente</th>
                    <th className="px-3 py-2 text-right font-normal">Total</th>
                    <th className="px-3 py-2 text-right font-normal">Saldo</th>
                    <th className="px-3 py-2 font-normal">Estado</th>
                    <th className="px-3 py-2 font-normal">Corte</th>
                    <th className="px-3 py-2 text-right font-normal">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((venta) => (
                    <tr key={venta.orden_venta} className="border-t border-border/70 align-top">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold tabular">#{venta.numero}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {venta.es_factura ? (
                            <Badge variant="primary">
                              <Receipt aria-hidden="true" className="h-3 w-3" />
                              Factura
                            </Badge>
                          ) : (
                            <Badge variant="outline">Nota</Badge>
                          )}
                          {venta.entregado ? <Badge variant="positive">Entregada</Badge> : null}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {formatearFechaHora(venta.fecha)}
                      </td>
                      <td className="px-3 py-2.5">
                        {venta.cliente?.nombre ?? (
                          <span className="text-muted-foreground">Mostrador</span>
                        )}
                        {venta.nro_factura ? (
                          <div className="text-[11px] text-muted-foreground">
                            Factura {venta.nro_factura}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular">
                        {formatearBs(venta.monto_total)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular">
                        <span className={venta.saldo === '0.00' ? 'text-positive' : 'text-negative'}>
                          {formatearBs(venta.saldo)}
                        </span>
                        <div className="text-[11px] text-muted-foreground">
                          Pagado {formatearBs(venta.pagado)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {venta.cancelada ? (
                          <Badge variant="positive">Cancelada</Badge>
                        ) : (
                          <Badge variant="negative">Con saldo</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {venta.tiene_esquema ? (
                          <div className="space-y-0.5">
                            <p className="flex items-center gap-1">
                              <Scissors aria-hidden="true" className="h-3 w-3" />
                              {venta.hojas_corte} hoja{venta.hojas_corte === 1 ? '' : 's'}
                            </p>
                            <p className="text-muted-foreground">
                              {venta.cinta_colocada_m.toFixed(2)} m de cinta
                            </p>
                            {!venta.corte_autorizado ? (
                              <p className="text-[11px] text-negative">Saldo &gt; 50%</p>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin cortes</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/ventas/${venta.orden_venta}`}
                            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                          >
                            Ver
                          </Link>
                          <Link
                            to={`/ventas/${venta.orden_venta}/imprimir?tipo=NOTA`}
                            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                          >
                            <FileText aria-hidden="true" className="h-3.5 w-3.5" />
                            Nota
                          </Link>
                          {venta.tiene_esquema ? (
                            <Link
                              to={`/ventas/${venta.orden_venta}/imprimir?tipo=PEDIDO`}
                              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                            >
                              <Scissors aria-hidden="true" className="h-3.5 w-3.5" />
                              Pedido
                            </Link>
                          ) : null}
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

      <p className="text-right text-xs text-muted-foreground">
        {lista.length} venta{lista.length === 1 ? '' : 's'}
      </p>
    </div>
  )
}
