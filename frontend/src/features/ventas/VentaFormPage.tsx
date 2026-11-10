import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Pencil, Plus, Scissors, Trash2, UserPlus } from 'lucide-react'

import type { UnidadVenta } from '@pachiplac/shared'

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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ApiError } from '@/lib/api'
import { formatearBs } from '@/lib/formato'
import { useProductos } from '@/features/catalogo/useCatalogo'
import type { ProductoDetalle } from '@/features/catalogo/tipos'
import { combinarSecciones } from './esquemaVenta'
import { useClientes, useCrearCliente } from './useClientes'
import { useCrearVenta } from './useVentas'
import { useVentaDraft } from './ventaDraft.store'

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function esCintaColocada(nombre: string): boolean {
  return normalizar(nombre).includes('colocad')
}

function sufijoUnidad(unidad: UnidadVenta): string {
  if (unidad === 'MEDIA') return 'medias'
  if (unidad === 'METRO') return 'm'
  return 'u.'
}

function numero(valor: string): number {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

export function VentaFormPage() {
  const navigate = useNavigate()
  const draft = useVentaDraft()
  const productos = useProductos({ activo: true })
  const clientes = useClientes()
  const crearCliente = useCrearCliente()
  const crearVenta = useCrearVenta()

  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [cantidadNueva, setCantidadNueva] = useState('1')
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false)
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [laminaEsquema, setLaminaEsquema] = useState('')
  const [error, setError] = useState<string | null>(null)

  const listaProductos = productos.data ?? []
  const productoPorId = useMemo(
    () => new Map<number, ProductoDetalle>(listaProductos.map((producto) => [producto.id, producto])),
    [listaProductos],
  )

  const cintaColocada = listaProductos.find(
    (producto) => producto.categoria === 'CINTA' && esCintaColocada(producto.nombre),
  )
  const cintaColocadaId = cintaColocada?.id ?? null

  const productosAgregables = listaProductos.filter(
    (producto) =>
      producto.activo &&
      producto.precio_vigente !== null &&
      !(producto.categoria === 'CINTA' && esCintaColocada(producto.nombre)),
  )
  const laminas = listaProductos.filter(
    (producto) =>
      producto.categoria === 'LAMINA' && producto.activo && producto.precio_vigente !== null,
  )

  const totalItems = draft.items.reduce(
    (total, item) => total + numero(item.cantidad) * numero(item.precio_unitario),
    0,
  )
  const cintaM = draft.secciones.reduce((total, seccion) => total + seccion.esquema.cinta.total_m, 0)
  const cintaPrecio = numero(cintaColocada?.precio_vigente ?? '0')
  const cintaTotal = cintaM * cintaPrecio
  const descuento = numero(draft.descuento)
  const total = Math.max(totalItems + cintaTotal - descuento, 0)
  const cobrado = numero(draft.cobrado)
  const saldo = Math.max(total - cobrado, 0)
  const autorizado = total === 0 ? true : saldo <= total / 2

  const agregarItem = (): void => {
    setError(null)
    const producto = productoPorId.get(Number(productoSeleccionado))
    if (!producto) {
      setError('Elegí un producto para agregar.')
      return
    }
    if (draft.items.some((item) => item.producto_id === producto.id)) {
      setError('Ese producto ya está en la venta; editá su cantidad en la tabla.')
      return
    }
    const cantidad = numero(cantidadNueva)
    if (cantidad <= 0) {
      setError('La cantidad debe ser mayor que 0.')
      return
    }
    draft.addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      unidad_venta: producto.unidad_venta,
      cantidad: cantidad.toFixed(2),
      precio_unitario: producto.precio_vigente ?? '0.00',
      stock: producto.stock,
    })
    setCantidadNueva('1')
    setProductoSeleccionado('')
  }

  const crearClienteRapido = (): void => {
    setError(null)
    if (!clienteNombre.trim()) {
      setError('El nombre del cliente es obligatorio.')
      return
    }
    crearCliente.mutate(
      { nombre: clienteNombre.trim(), telefono: clienteTelefono.trim() || null },
      {
        onSuccess: (cliente) => {
          draft.setCampo('clienteId', cliente.id)
          setClienteNombre('')
          setClienteTelefono('')
          setMostrarNuevoCliente(false)
        },
      },
    )
  }

  const abrirEditor = (productoId: number, seccionId: string | null): void => {
    const producto = productoPorId.get(productoId)
    if (!producto?.lamina) {
      setError('Elegí una lámina con medidas cargadas.')
      return
    }
    const seccion = seccionId
      ? draft.secciones.find((actual) => actual.id === seccionId)
      : undefined

    draft.setEditor({
      key: crypto.randomUUID(),
      seccionId,
      producto_id: producto.id,
      material: `${producto.nombre} · ${producto.lamina.espesor_mm} mm`,
      largo_mm: producto.lamina.largo_mm,
      ancho_mm: producto.lamina.ancho_mm,
      esquema: seccion?.esquema ?? null,
    })
    void navigate('/ventas/esquema')
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    setError(null)

    const items = draft.items
      .filter((item) => item.producto_id !== cintaColocadaId)
      .map((item) => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      }))

    if (items.length === 0) {
      setError('Agregá al menos una lámina, cinta suelta o herraje a la venta.')
      return
    }

    const esquema = combinarSecciones(draft.secciones)
    const saldoFinal = Math.max(total - cobrado, 0)

    crearVenta.mutate(
      {
        cliente_id: draft.clienteId,
        fecha: new Date().toISOString(),
        // Con descuento manual se envía el total ajustado; sin descuento el
        // backend calcula el total desde los ítems y el esquema.
        monto_total: descuento > 0 ? total.toFixed(2) : undefined,
        saldo: saldoFinal.toFixed(2),
        metodo_pago: draft.metodoPago.trim() || 'Efectivo',
        es_factura: draft.esFactura,
        nro_factura: draft.esFactura ? draft.nroFactura.trim() || null : null,
        entregado: draft.entregado,
        esquema,
        items,
      },
      {
        onSuccess: (venta) => {
          useVentaDraft.getState().reset()
          void navigate(`/ventas/${venta.orden_venta}`)
        },
        onError: (mutationError) => {
          setError(
            mutationError instanceof ApiError
              ? mutationError.message
              : 'No se pudo registrar la venta.',
          )
        },
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
            ← Ventas
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nueva venta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cliente, ítems y esquema de corte en una sola nota.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/ventas" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Cancelar
          </Link>
          <Button type="submit" form="venta-form" size="sm" disabled={crearVenta.isPending}>
            {crearVenta.isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : null}
            Guardar venta
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form id="venta-form" onSubmit={onSubmit}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cliente y documento</CardTitle>
                <CardDescription>
                  La venta de mostrador puede quedar sin cliente.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="cliente">Cliente</Label>
                  <div className="flex gap-1.5">
                    <Select
                      id="cliente"
                      value={draft.clienteId ?? ''}
                      onChange={(event) =>
                        draft.setCampo(
                          'clienteId',
                          event.target.value ? Number(event.target.value) : null,
                        )
                      }
                      className="min-w-0 flex-1"
                    >
                      <option value="">Mostrador (sin cliente)</option>
                      {clientes.data?.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                          {cliente.telefono ? ` · ${cliente.telefono}` : ''}
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Nuevo cliente"
                      title="Nuevo cliente"
                      onClick={() => setMostrarNuevoCliente((valor) => !valor)}
                    >
                      <UserPlus aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="metodo-pago">Método de pago</Label>
                  <Input
                    id="metodo-pago"
                    value={draft.metodoPago}
                    onChange={(event) => draft.setCampo('metodoPago', event.target.value)}
                    placeholder="Efectivo, QR, transferencia…"
                  />
                </div>

                {mostrarNuevoCliente ? (
                  <div className="grid gap-2 rounded-md border border-border p-3 sm:col-span-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div className="grid gap-1">
                      <Label htmlFor="cliente-nombre" className="text-[11px]">
                        Nombre
                      </Label>
                      <Input
                        id="cliente-nombre"
                        value={clienteNombre}
                        onChange={(event) => setClienteNombre(event.target.value)}
                        placeholder="Nombre del cliente"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="cliente-telefono" className="text-[11px]">
                        Teléfono (opcional)
                      </Label>
                      <Input
                        id="cliente-telefono"
                        value={clienteTelefono}
                        onChange={(event) => setClienteTelefono(event.target.value)}
                        placeholder="Ej. 700 00000"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={crearClienteRapido}
                      disabled={crearCliente.isPending}
                    >
                      {crearCliente.isPending ? (
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : null}
                      Crear cliente
                    </Button>
                  </div>
                ) : null}

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.esFactura}
                    onChange={(event) => draft.setCampo('esFactura', event.target.checked)}
                  />
                  Venta con factura
                </label>

                {draft.esFactura ? (
                  <div className="grid gap-1.5">
                    <Label htmlFor="nro-factura">Número de factura (opcional)</Label>
                    <Input
                      id="nro-factura"
                      value={draft.nroFactura}
                      onChange={(event) => draft.setCampo('nroFactura', event.target.value)}
                      placeholder="Referencia"
                    />
                  </div>
                ) : null}

                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <Checkbox
                    checked={draft.entregado}
                    onChange={(event) => draft.setCampo('entregado', event.target.checked)}
                  />
                  Marcar como entregada
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ítems</CardTitle>
                <CardDescription>
                  Láminas en medias (2 = hoja entera), cinta suelta en metros y herrajes en unidades.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="grid min-w-56 flex-1 gap-1.5">
                    <Label htmlFor="producto-item">Producto</Label>
                    <Select
                      id="producto-item"
                      value={productoSeleccionado}
                      onChange={(event) => setProductoSeleccionado(event.target.value)}
                    >
                      <option value="">Elegí un producto</option>
                      {productosAgregables.map((producto) => (
                        <option key={producto.id} value={producto.id}>
                          {producto.nombre} · Bs {producto.precio_vigente} /{' '}
                          {sufijoUnidad(producto.unidad_venta)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="grid w-28 gap-1.5">
                    <Label htmlFor="cantidad-item">
                      {productoSeleccionado
                        ? sufijoUnidad(
                            productoPorId.get(Number(productoSeleccionado))?.unidad_venta ?? 'UNIDAD',
                          )
                        : 'Cantidad'}
                    </Label>
                    <Input
                      id="cantidad-item"
                      type="number"
                      inputMode="decimal"
                      min={0.01}
                      step="0.01"
                      value={cantidadNueva}
                      onChange={(event) => setCantidadNueva(event.target.value)}
                      className="text-right tabular"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={agregarItem}>
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Agregar
                  </Button>
                </div>

                {draft.items.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Todavía no hay ítems. Las hojas que uses en un esquema se agregan solas.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                          <th className="py-2 font-normal">Producto</th>
                          <th className="px-2 py-2 text-right font-normal">Cantidad</th>
                          <th className="px-2 py-2 text-right font-normal">Precio</th>
                          <th className="px-2 py-2 text-right font-normal">Subtotal</th>
                          <th className="py-2 text-right font-normal">
                            <span className="sr-only">Quitar</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {draft.items.map((item) => {
                          const enEsquema = draft.secciones.some(
                            (seccion) => seccion.producto_id === item.producto_id,
                          )
                          return (
                            <tr key={item.id} className="border-t border-border/70">
                              <td className="py-2">
                                <div className="font-medium">{item.nombre}</div>
                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Badge variant="outline">{item.categoria}</Badge>
                                  {enEsquema ? <Badge variant="primary">Desde esquema</Badge> : null}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-right">
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min={0.01}
                                  step="0.01"
                                  value={item.cantidad}
                                  disabled={enEsquema}
                                  onChange={(event) =>
                                    draft.updateItem(item.id, { cantidad: event.target.value })
                                  }
                                  className="ml-auto h-8 w-24 text-right tabular"
                                />
                                <div className="text-[11px] text-muted-foreground">
                                  {sufijoUnidad(item.unidad_venta)}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-right tabular">
                                {formatearBs(item.precio_unitario)}
                              </td>
                              <td className="px-2 py-2 text-right tabular">
                                {formatearBs(
                                  (numero(item.cantidad) * numero(item.precio_unitario)).toFixed(2),
                                )}
                              </td>
                              <td className="py-2 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Quitar ${item.nombre}`}
                                  onClick={() => draft.removeItem(item.id)}
                                >
                                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {cintaM > 0 ? (
                  <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                    <span>
                      Cinta colocada calculada del esquema · {cintaM.toFixed(2)} m
                    </span>
                    <span className="tabular">{formatearBs(cintaTotal.toFixed(2))}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Esquema de corte</CardTitle>
                <CardDescription>
                  Opcional. Cada material con cortes guarda sus hojas y la cinta colocada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {draft.secciones.map((seccion) => (
                  <div
                    key={seccion.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{seccion.material}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {seccion.esquema.secciones.reduce(
                          (totalHojas, bloque) => totalHojas + bloque.hojas.length,
                          0,
                        )}{' '}
                        hojas · {seccion.total_medias} medias ·{' '}
                        {seccion.esquema.cinta.total_m.toFixed(2)} m de cinta
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirEditor(seccion.producto_id, seccion.id)}
                      >
                        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-negative"
                        onClick={() => draft.removeSeccion(seccion.id)}
                      >
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                        Quitar
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap items-end gap-2">
                  <div className="grid min-w-56 flex-1 gap-1.5">
                    <Label htmlFor="lamina-esquema">Material de las hojas</Label>
                    <Select
                      id="lamina-esquema"
                      value={laminaEsquema}
                      onChange={(event) => setLaminaEsquema(event.target.value)}
                    >
                      <option value="">Elegí una lámina</option>
                      {laminas.map((producto) => (
                        <option key={producto.id} value={producto.id}>
                          {producto.nombre}
                          {producto.lamina
                            ? ` · ${producto.lamina.largo_mm} × ${producto.lamina.ancho_mm} mm`
                            : ''}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!laminaEsquema}
                    onClick={() => abrirEditor(Number(laminaEsquema), null)}
                  >
                    <Scissors aria-hidden="true" className="h-4 w-4" />
                    Armar esquema
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="min-w-0 xl:sticky xl:top-20">
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
                <CardDescription>Saldo y regla del 50% antes de guardar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Ítems</span>
                    <span className="tabular">{formatearBs(totalItems.toFixed(2))}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Cinta colocada</span>
                    <span className="tabular">{formatearBs(cintaTotal.toFixed(2))}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted-foreground">Descuento</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                      value={draft.descuento}
                      onChange={(event) => draft.setCampo('descuento', event.target.value)}
                      placeholder="0.00"
                      className="h-7 w-24 text-right tabular"
                    />
                  </p>
                  <p className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span className="tabular">{formatearBs(total.toFixed(2))}</span>
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="cobrado">Cobrado ahora</Label>
                  <Input
                    id="cobrado"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={draft.cobrado}
                    onChange={(event) => draft.setCampo('cobrado', event.target.value)}
                    placeholder="0.00"
                    className="text-right tabular"
                  />
                </div>

                <div className="flex justify-between rounded-md bg-secondary px-3 py-2 text-sm">
                  <span>Saldo</span>
                  <span className={saldo === 0 ? 'tabular text-positive' : 'tabular text-negative'}>
                    {formatearBs(saldo.toFixed(2))}
                  </span>
                </div>

                <Alert variant={autorizado ? 'default' : 'warning'}>
                  <AlertDescription>
                    {autorizado
                      ? 'Corte autorizado: el saldo no supera la mitad del total.'
                      : 'El saldo supera la mitad del total. El sistema avisa, pero permite guardar e imprimir igual.'}
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={crearVenta.isPending || draft.items.length === 0}
                >
                  {crearVenta.isPending ? (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : null}
                  Guardar venta
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Los precios se copian del historial vigente al confirmar. El stock se descuenta al
                  guardar la venta.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </form>
    </div>
  )
}

