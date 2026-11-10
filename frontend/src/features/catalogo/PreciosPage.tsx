import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'

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
import { ApiError } from '@/lib/api'
import { formatearFechaHora, sufijoUnidad } from '@/lib/formato'
import { useCrearPrecio, usePrecios, useProducto } from './useCatalogo'

export function PreciosPage() {
  const { id } = useParams()
  const productoId = id ? Number(id) : null
  const producto = useProducto(productoId)
  const precios = usePrecios(productoId)
  const crear = useCrearPrecio(productoId ?? 0)

  const [precio, setPrecio] = useState('')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  const esLamina = producto.data?.categoria === 'LAMINA'
  const unidad = producto.data?.unidad_venta ?? 'UNIDAD'
  const etiquetaPrecio = esLamina
    ? 'Precio de la hoja entera'
    : unidad === 'METRO'
      ? 'Precio por metro'
      : 'Precio por unidad'

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    setErrorLocal(null)
    const valor = Number(precio)
    if (!Number.isFinite(valor) || valor <= 0) {
      setErrorLocal('Ingresá un precio mayor que 0.')
      return
    }
    const guardado = (esLamina ? valor / 2 : valor).toFixed(2)
    crear.mutate(
      { precio: guardado },
      { onSuccess: () => setPrecio('') },
    )
  }

  if (producto.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Cargando producto…
      </div>
    )
  }

  if (producto.isError || !producto.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No se pudo cargar el producto.</AlertDescription>
      </Alert>
    )
  }

  const errorApi = crear.error
  const error =
    errorLocal ??
    (errorApi
      ? errorApi instanceof ApiError
        ? errorApi.message
        : 'No se pudo registrar el precio.'
      : null)

  const precioVigente = producto.data.precio_vigente

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/productos"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Catálogo
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Precios · {producto.data.nombre}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El precio vigente se copia en cada venta; cambiar precios no altera ventas pasadas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">
          {producto.data.categoria === 'LAMINA'
            ? 'Lámina'
            : producto.data.categoria === 'CINTA'
              ? 'Cinta'
              : 'Herraje'}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Precio vigente:{' '}
          <span className="font-medium tabular text-foreground">
            {precioVigente ? `Bs ${precioVigente} / ${sufijoUnidad(unidad)}` : 'Sin precio'}
          </span>
          {esLamina && precioVigente ? (
            <span className="ml-2 text-xs tabular">
              (hoja Bs {(Number(precioVigente) * 2).toFixed(2)})
            </span>
          ) : null}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Nuevo precio</CardTitle>
            <CardDescription>{etiquetaPrecio}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="nuevo-precio">{etiquetaPrecio}</Label>
                <div className="relative">
                  <Input
                    id="nuevo-precio"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={precio}
                    onChange={(event) => setPrecio(event.target.value)}
                    placeholder="0.00"
                    className="pr-9 text-right tabular"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                    Bs
                  </span>
                </div>
                {esLamina ? (
                  <p className="text-[11px] text-muted-foreground">
                    Se guarda la mitad, porque la lámina se vende por media hoja.
                  </p>
                ) : null}
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
                Guardar precio
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Historial de precios</CardTitle>
            <CardDescription>El más reciente rige desde su fecha.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {precios.isPending ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Cargando historial…
              </p>
            ) : precios.data && precios.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="px-4 py-2 font-normal">Vigente desde</th>
                      <th className="px-4 py-2 text-right font-normal">Precio por unidad</th>
                      {esLamina ? (
                        <th className="px-4 py-2 text-right font-normal">Hoja entera</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {precios.data.map((registro) => (
                      <tr key={registro.id} className="border-t border-border/70">
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {formatearFechaHora(registro.vigente_desde)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular">
                          Bs {registro.precio} / {sufijoUnidad(unidad)}
                        </td>
                        {esLamina ? (
                          <td className="px-4 py-2.5 text-right tabular text-muted-foreground">
                            Bs {(Number(registro.precio) * 2).toFixed(2)}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Todavía no hay precios cargados.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
