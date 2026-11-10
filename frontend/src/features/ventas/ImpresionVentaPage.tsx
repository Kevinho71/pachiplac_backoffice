import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Printer } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { formatearBs, formatearFechaHora } from '@/lib/formato'
import { colorDeCinta } from '@/features/editor/cinta-colores'
import { formatearDimensiones, formatearMetros, TIPO_HOJA_LABEL } from '@/features/editor/constantes'
import { EsquemaSvg } from '@/features/editor/components/EsquemaSvg'
import { cintaDeHojaEsquema, hojaEsquemaParaSvg } from './esquemaVenta'
import type { DocumentoImpresion } from './tipos'
import { useDocumentoImpresion } from './useVentas'

function sufijoCantidad(unidad: string): string {
  if (unidad === 'MEDIA') return 'medias'
  if (unidad === 'METRO') return 'm'
  return 'u.'
}

export function ImpresionVentaPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const ordenVenta = Number(id)
  const tipo = searchParams.get('tipo') === 'PEDIDO' ? 'PEDIDO' : 'NOTA'
  const documento = useDocumentoImpresion(
    Number.isFinite(ordenVenta) ? ordenVenta : null,
    tipo,
  )

  if (documento.isPending) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Preparando el documento…
      </div>
    )
  }

  if (documento.isError || !documento.data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>No se pudo preparar el documento para imprimir.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { venta, sucursal, autorizado, aviso } = documento.data

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-6">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to={`/ventas/${venta.orden_venta}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Venta #{venta.numero}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {tipo === 'PEDIDO' ? 'Pedido de corte' : 'Nota de venta'}
          </h1>
        </div>
        <button type="button" className={buttonVariants({ size: 'sm' })} onClick={() => window.print()}>
          <Printer aria-hidden="true" className="h-4 w-4" />
          Imprimir
        </button>
      </div>

      {!autorizado ? (
        <Alert variant="warning" className="no-print mb-6">
          <AlertDescription>
            {aviso ?? 'El saldo supera la mitad del total. Podés imprimir igual bajo tu criterio.'}
          </AlertDescription>
        </Alert>
      ) : null}

      {tipo === 'NOTA' ? (
        <NotaVenta documento={documento.data} />
      ) : (
        <PedidoCorte documento={documento.data} />
      )}

      <p className="mt-6 text-center text-[10px] text-muted-foreground print:hidden">
        {sucursal.nombre} · {sucursal.ciudad}
      </p>
    </div>
  )
}

function NotaVenta({ documento }: { documento: DocumentoImpresion }) {
  const { venta, sucursal } = documento

  return (
    <section className="print-sheet mx-auto max-w-[720px] border border-border bg-white p-8 text-black">
      <header className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <p className="text-xl font-bold tracking-tight">PACHIPLAC</p>
          <p className="text-xs">
            {sucursal.nombre} · {sucursal.ciudad}
          </p>
          {sucursal.direccion ? <p className="text-xs">{sucursal.direccion}</p> : null}
          {sucursal.telefono ? <p className="text-xs">Tel. {sucursal.telefono}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">NOTA DE VENTA</p>
          <p className="text-2xl font-bold tabular">Nº {venta.numero}</p>
          <p className="text-xs">{formatearFechaHora(venta.fecha)}</p>
          {venta.es_factura ? (
            <p className="mt-1 text-xs font-semibold">
              FACTURA {venta.nro_factura ?? ''}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Cliente</p>
          <p className="font-medium">{venta.cliente?.nombre ?? 'Mostrador'}</p>
          {venta.cliente?.telefono ? <p>{venta.cliente.telefono}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">Pago</p>
          <p>{venta.metodo_pago}</p>
        </div>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black text-left text-[10px] uppercase tracking-wide">
            <th className="py-1.5 font-semibold">Material / artículo</th>
            <th className="py-1.5 text-right font-semibold">Cantidad</th>
            <th className="py-1.5 text-right font-semibold">P. unitario</th>
            <th className="py-1.5 text-right font-semibold">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {venta.items.map((item) => (
            <tr key={item.id} className="border-b border-neutral-300">
              <td className="py-1.5">{item.producto_nombre}</td>
              <td className="py-1.5 text-right tabular">
                {item.cantidad} {sufijoCantidad(item.unidad_venta)}
              </td>
              <td className="py-1.5 text-right tabular">{formatearBs(item.precio_unitario)}</td>
              <td className="py-1.5 text-right tabular">{formatearBs(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <p className="flex justify-between">
            <span>Total</span>
            <span className="font-semibold tabular">{formatearBs(venta.monto_total)}</span>
          </p>
          <p className="flex justify-between">
            <span>Pagado</span>
            <span className="tabular">{formatearBs(venta.pagado)}</span>
          </p>
          <p className="flex justify-between border-t border-black pt-1 text-base font-bold">
            <span>Saldo</span>
            <span className="tabular">{formatearBs(venta.saldo)}</span>
          </p>
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <p className="max-w-sm text-[10px] leading-snug text-neutral-600">
          {venta.tiene_esquema
            ? 'Esta venta incluye un pedido de corte adjunto.'
            : 'Gracias por su compra. Los sobrantes se entregan al cliente salvo indicación contraria.'}
        </p>
        <div className="flex h-20 w-40 flex-col items-center justify-center border border-black text-center">
          <p className="text-[9px] tracking-widest">SELLO</p>
          <p className="text-sm font-bold tracking-widest">CANCELADO</p>
        </div>
      </div>
    </section>
  )
}

function PedidoCorte({ documento }: { documento: DocumentoImpresion }) {
  const { venta, sucursal } = documento
  const esquema = venta.esquema
  if (!esquema) return null

  const hojas = esquema.secciones.flatMap((seccion) =>
    seccion.hojas.map((hoja) => ({ producto_id: seccion.producto_id, hoja })),
  )
  const nombreProducto = (productoId: number): string =>
    venta.items.find((item) => item.producto_id === productoId)?.producto_nombre ??
    `Material #${productoId}`

  return (
    <div className="space-y-6">
      <section className="print-page print-sheet border border-border bg-white p-8 text-black">
        <header className="flex items-start justify-between border-b-2 border-black pb-3">
          <div>
            <p className="text-xl font-bold tracking-tight">PACHIPLAC</p>
            <p className="text-xs">
              {sucursal.nombre} · {sucursal.ciudad}
            </p>
            {sucursal.direccion ? <p className="text-xs">{sucursal.direccion}</p> : null}
            {sucursal.telefono ? <p className="text-xs">Tel. {sucursal.telefono}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">PEDIDO DE CORTE</p>
            <p className="text-2xl font-bold tabular">Nº {venta.numero}</p>
            <p className="text-xs">{formatearFechaHora(venta.fecha)}</p>
            {venta.es_factura ? (
              <p className="mt-1 text-xs font-semibold">FACTURA {venta.nro_factura ?? ''}</p>
            ) : null}
          </div>
        </header>

        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">Cliente</p>
            <p className="font-medium">{venta.cliente?.nombre ?? 'Mostrador'}</p>
            {venta.cliente?.telefono ? <p>{venta.cliente.telefono}</p> : null}
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] uppercase tracking-wide text-neutral-500">Resumen</p>
            <p>
              {hojas.length} hoja{hojas.length === 1 ? '' : 's'} de corte ·{' '}
              {venta.cinta_colocada_m.toFixed(2)} m de cinta
            </p>
            <p>
              Kerf {esquema.kerf_mm} mm · Refilado {esquema.refilado_mm} mm
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {esquema.secciones.map((seccion) => {
            const medias = seccion.hojas.reduce(
              (total, hoja) => total + (hoja.tipo === 'ENTERA' ? 2 : 1),
              0,
            )
            return (
              <div
                key={`${seccion.producto_id}-${seccion.hojas.length}`}
                className="flex items-center justify-between rounded border border-neutral-300 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{nombreProducto(seccion.producto_id)}</p>
                  <p className="text-xs text-neutral-600">
                    {seccion.hojas.length} hoja{seccion.hojas.length === 1 ? '' : 's'} · {medias}{' '}
                    medias
                  </p>
                </div>
                <Badge variant="outline" className="print:hidden">
                  {seccion.producto_id}
                </Badge>
              </div>
            )
          })}
        </div>

        <div className="mt-8 flex items-end justify-between">
          <p className="max-w-lg text-[10px] leading-snug text-neutral-600">
            Los sobrantes se entregan al cliente salvo indicación contraria. Se autoriza el corte si
            el saldo es menor o igual a la mitad del total.
          </p>
          <div className="flex h-20 w-40 flex-col items-center justify-center border border-black text-center">
            <p className="text-[9px] tracking-widest">SELLO</p>
            <p className="text-sm font-bold tracking-widest">CANCELADO</p>
          </div>
        </div>
      </section>

      {hojas.map(({ producto_id, hoja }, indice) => {
        const cinta = cintaDeHojaEsquema(hoja)
        return (
          <section
            key={`${producto_id}-${indice}`}
            className="print-page print-sheet border border-border bg-white p-6 text-black"
          >
            <header className="mb-3 flex items-end justify-between border-b-2 border-black pb-2">
              <div>
                <p className="text-base font-semibold">PACHIPLAC · Pedido de corte</p>
                <p className="text-sm">{nombreProducto(producto_id)}</p>
              </div>
              <div className="text-right text-[11px]">
                <p className="text-sm font-semibold">
                  Hoja {indice + 1} de {hojas.length}
                </p>
                <p>
                  {TIPO_HOJA_LABEL[hoja.tipo]} ·{' '}
                  {formatearDimensiones(hoja.largo_mm, hoja.ancho_mm)}
                </p>
                <p>
                  Nº {venta.numero} · {formatearFechaHora(venta.fecha)}
                </p>
                <p>
                  Kerf {esquema.kerf_mm} mm · Refilado {esquema.refilado_mm} mm
                </p>
              </div>
            </header>

            <div className="grid grid-cols-[1fr_190px] gap-4">
              <div className="border border-black p-1">
                <EsquemaSvg
                  hoja={hojaEsquemaParaSvg(hoja)}
                  refiladoMm={esquema.refilado_mm}
                  mostrarCortes
                  mostrarEtiquetas
                  titulo={`Hoja ${indice + 1} de ${hojas.length}`}
                />
              </div>

              <aside className="flex flex-col gap-3 text-[11px]">
                <div>
                  <p className="mb-1 font-semibold">Cinta de canto</p>
                  {Object.entries(cinta.porColor).length > 0 ? (
                    Object.entries(cinta.porColor).map(([nombre, metros]) => {
                      const color = colorDeCinta(nombre)
                      return (
                        <p key={nombre} className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full border border-black"
                              style={{ backgroundColor: color.hex }}
                            />
                            {nombre}
                          </span>
                          <span className="tabular">{formatearMetros(metros)}</span>
                        </p>
                      )
                    })
                  ) : (
                    <p>Sin cinta</p>
                  )}
                  <p className="mt-1 flex justify-between border-t border-black pt-1 font-semibold">
                    <span>Total</span>
                    <span className="tabular">{formatearMetros(cinta.total)}</span>
                  </p>
                </div>

                <div>
                  <p className="mb-1 font-semibold">Corte</p>
                  <p>{hoja.cortes.length} cortes numerados</p>
                </div>

                <div className="mt-auto flex h-24 flex-col items-center justify-center border border-black text-center">
                  <p className="text-[9px] tracking-wide">SELLO</p>
                  <p className="text-sm font-semibold tracking-widest">CANCELADO</p>
                </div>

                <p className="text-[9px] leading-snug">
                  Los sobrantes se entregan al cliente salvo indicación contraria.
                </p>
              </aside>
            </div>
          </section>
        )
      })}
    </div>
  )
}
