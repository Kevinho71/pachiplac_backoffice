import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'

import type { CategoriaProducto } from '@pachiplac/shared'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatearPrecio, formatearStock } from '@/lib/formato'
import {
  useActualizarProducto,
  useDesactivarProducto,
  useProductos,
} from './useCatalogo'
import { CATEGORIA_LABEL, type ProductoDetalle } from './tipos'

export function ProductosPage() {
  const [q, setQ] = useState('')
  const [categoria, setCategoria] = useState<'' | CategoriaProducto>('')
  const [activo, setActivo] = useState<'' | 'true' | 'false'>('')

  const productos = useProductos({
    categoria: categoria || undefined,
    activo: activo === '' ? undefined : activo === 'true',
    q: q.trim() || undefined,
  })
  const desactivar = useDesactivarProducto()
  const actualizar = useActualizarProducto()

  const lista = productos.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            Productos, láminas y precios de la sucursal activa.
          </p>
        </div>
        <Link to="/productos/nuevo" className={buttonVariants({ size: 'sm' })}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Nuevo producto
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar producto"
            className="w-60 pl-8"
            aria-label="Buscar producto"
          />
        </div>
        <Select
          value={categoria}
          onChange={(event) => setCategoria(event.target.value as '' | CategoriaProducto)}
          className="w-44"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          <option value="LAMINA">Láminas</option>
          <option value="CINTA">Cintas</option>
          <option value="HERRAJE">Herrajes</option>
        </Select>
        <Select
          value={activo}
          onChange={(event) => setActivo(event.target.value as '' | 'true' | 'false')}
          className="w-36"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </Select>
      </div>

      {productos.isError ? (
        <Alert variant="destructive">
          <AlertDescription>No se pudo cargar el catálogo.</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {productos.isPending ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Cargando productos…
            </p>
          ) : lista.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <p className="text-sm font-medium">No hay productos con estos filtros</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Creá la primera lámina, cinta o herraje para empezar a cargar precios y compras.
              </p>
              <Link to="/productos/nuevo" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                Nuevo producto
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-normal">Producto</th>
                    <th className="px-3 py-2 font-normal">Categoría</th>
                    <th className="px-3 py-2 text-right font-normal">Precio vigente</th>
                    <th className="px-3 py-2 text-right font-normal">Stock</th>
                    <th className="px-3 py-2 font-normal">Estado</th>
                    <th className="px-3 py-2 text-right font-normal">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((producto) => (
                    <tr key={producto.id} className="border-t border-border/70 align-middle">
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{producto.nombre}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {detalleProducto(producto)}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline">{CATEGORIA_LABEL[producto.categoria]}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="tabular">
                          {formatearPrecio(producto.precio_vigente, producto.unidad_venta)}
                        </div>
                        {producto.categoria === 'LAMINA' && producto.precio_vigente ? (
                          <div className="text-[11px] tabular text-muted-foreground">
                            Hoja Bs {(Number(producto.precio_vigente) * 2).toFixed(2)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular">
                        {producto.controla_stock
                          ? formatearStock(producto.stock, producto.unidad_venta)
                          : 'No controla'}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={producto.activo ? 'positive' : 'outline'}>
                          {producto.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/productos/${producto.id}/precios`}
                            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                          >
                            Precios
                          </Link>
                          <Link
                            to={`/productos/${producto.id}`}
                            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                          >
                            Editar
                          </Link>
                          {producto.activo ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-negative"
                              disabled={desactivar.isPending}
                              onClick={() => {
                                if (window.confirm(`¿Desactivar "${producto.nombre}"?`)) {
                                  desactivar.mutate(producto.id)
                                }
                              }}
                            >
                              Desactivar
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actualizar.isPending}
                              onClick={() =>
                                actualizar.mutate({
                                  id: producto.id,
                                  payload: { activo: true },
                                })
                              }
                            >
                              Reactivar
                            </Button>
                          )}
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

      {desactivar.error || actualizar.error ? (
        <Alert variant="destructive">
          <AlertDescription>No se pudo actualizar el producto.</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

function detalleProducto(producto: ProductoDetalle): string {
  if (producto.categoria === 'LAMINA' && producto.lamina) {
    const l = producto.lamina
    return `${l.tipo} · ${l.color ?? 'sin color'} · ${l.espesor_mm} mm · ${l.largo_mm} × ${l.ancho_mm} mm`
  }
  if (producto.categoria === 'CINTA') return 'Se vende por metro'
  return 'Se vende por unidad'
}
