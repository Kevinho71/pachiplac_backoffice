import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { UNIDAD_POR_CATEGORIA, type CategoriaProducto } from '@pachiplac/shared'

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
import { useActualizarProducto, useCrearProducto, useProducto } from './useCatalogo'
import type { ActualizarProductoPayload, CrearProductoPayload } from './tipos'

const TIPOS_LAMINA = [
  'melamina',
  'fondo',
  'trupan',
  'ranurado',
  'venesta',
  'multilaminado',
  'otro',
] as const

const PRESETS_HOJA = [
  { largo: 2750, ancho: 1830 },
  { largo: 2750, ancho: 1850 },
  { largo: 2440, ancho: 1220 },
] as const

export function ProductoFormPage() {
  const { id } = useParams()
  const productoId = id ? Number(id) : null
  const esEdicion = productoId !== null
  const navigate = useNavigate()

  const producto = useProducto(productoId)
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const mutacion = esEdicion ? actualizar : crear

  const [categoria, setCategoria] = useState<CategoriaProducto>('LAMINA')
  const [nombre, setNombre] = useState('')
  const [unidadesPorCompra, setUnidadesPorCompra] = useState(2)
  const [controlaStock, setControlaStock] = useState(true)
  const [activo, setActivo] = useState(true)
  const [tipo, setTipo] = useState('melamina')
  const [color, setColor] = useState('')
  const [espesor, setEspesor] = useState(18)
  const [largo, setLargo] = useState(2750)
  const [ancho, setAncho] = useState(1830)
  const [tieneVeta, setTieneVeta] = useState(false)
  const [precio, setPrecio] = useState('')
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  useEffect(() => {
    const actual = producto.data
    if (!actual) return
    setCategoria(actual.categoria)
    setNombre(actual.nombre)
    setUnidadesPorCompra(actual.unidades_por_compra)
    setControlaStock(actual.controla_stock)
    setActivo(actual.activo)
    if (actual.lamina) {
      setTipo(actual.lamina.tipo)
      setColor(actual.lamina.color ?? '')
      setEspesor(actual.lamina.espesor_mm)
      setLargo(actual.lamina.largo_mm)
      setAncho(actual.lamina.ancho_mm)
      setTieneVeta(actual.lamina.tiene_veta)
    }
  }, [producto.data])

  const unidadVenta = UNIDAD_POR_CATEGORIA[categoria]
  const errorApi = mutacion.error
  const error =
    errorLocal ??
    (errorApi
      ? errorApi instanceof ApiError
        ? errorApi.message
        : 'No se pudo guardar el producto.'
      : null)

  const cambiarCategoria = (valor: CategoriaProducto): void => {
    setCategoria(valor)
    setUnidadesPorCompra(valor === 'LAMINA' ? 2 : 1)
    setControlaStock(valor !== 'CINTA')
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    setErrorLocal(null)

    if (!nombre.trim()) {
      setErrorLocal('El nombre es obligatorio.')
      return
    }
    if (categoria === 'LAMINA') {
      if (!tipo.trim()) {
        setErrorLocal('El tipo de lámina es obligatorio.')
        return
      }
      if (!(espesor > 0 && largo > 0 && ancho > 0)) {
        setErrorLocal('El espesor y las medidas deben ser mayores que 0.')
        return
      }
    }
    if (!esEdicion && precio.trim()) {
      const valor = Number(precio)
      if (!Number.isFinite(valor) || valor <= 0) {
        setErrorLocal('El precio inicial debe ser un número mayor que 0.')
        return
      }
    }

    if (esEdicion && productoId !== null) {
      const payload: ActualizarProductoPayload = {
        nombre: nombre.trim(),
        unidad_venta: unidadVenta,
        unidades_por_compra: unidadesPorCompra,
        controla_stock: controlaStock,
        activo,
      }
      if (categoria === 'LAMINA') {
        payload.lamina = {
          tipo: tipo.trim(),
          color: color.trim() || null,
          espesor_mm: espesor,
          largo_mm: largo,
          ancho_mm: ancho,
          tiene_veta: tieneVeta,
        }
      }
      actualizar.mutate(
        { id: productoId, payload },
        {
          onSuccess: () => {
            void navigate('/productos')
          },
        },
      )
      return
    }

    const payload: CrearProductoPayload = {
      categoria,
      nombre: nombre.trim(),
      unidad_venta: unidadVenta,
      unidades_por_compra: unidadesPorCompra,
      controla_stock: controlaStock,
      activo,
    }
    if (categoria === 'LAMINA') {
      payload.lamina = {
        tipo: tipo.trim(),
        color: color.trim() || null,
        espesor_mm: espesor,
        largo_mm: largo,
        ancho_mm: ancho,
        tiene_veta: tieneVeta,
      }
    }
    if (precio.trim()) {
      const valor = Number(precio)
      payload.precio_inicial = (valor / (categoria === 'LAMINA' ? 2 : 1)).toFixed(2)
    }
    crear.mutate(payload, {
      onSuccess: () => {
        void navigate('/productos')
      },
    })
  }

  if (esEdicion && producto.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Cargando producto…
      </div>
    )
  }

  if (esEdicion && producto.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>No se pudo cargar el producto.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to="/productos"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Catálogo
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {esEdicion ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {esEdicion
              ? producto.data?.nombre
              : 'Cargá los datos base y, si es lámina, sus medidas.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/productos" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Cancelar
          </Link>
          <Button type="submit" form="producto-form" size="sm" disabled={mutacion.isPending}>
            {mutacion.isPending ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : null}
            Guardar
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form id="producto-form" onSubmit={onSubmit} className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos del producto</CardTitle>
            <CardDescription>Categoría, nombre y cómo se controla el stock.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                maxLength={80}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej. Melamina roble 18 mm"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                id="categoria"
                value={categoria}
                disabled={esEdicion}
                onChange={(event) => cambiarCategoria(event.target.value as CategoriaProducto)}
              >
                <option value="LAMINA">Lámina</option>
                <option value="CINTA">Cinta</option>
                <option value="HERRAJE">Herraje</option>
              </Select>
              {esEdicion ? (
                <p className="text-[11px] text-muted-foreground">
                  La categoría no se cambia después de crear el producto.
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label>Unidad de venta</Label>
              <div className="flex h-9 items-center">
                <Badge variant="outline">
                  {unidadVenta === 'MEDIA'
                    ? 'Media hoja'
                    : unidadVenta === 'METRO'
                      ? 'Metro'
                      : 'Unidad'}
                </Badge>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="unidades-por-compra">Unidades de venta por compra</Label>
              <Input
                id="unidades-por-compra"
                type="number"
                inputMode="numeric"
                min={1}
                value={unidadesPorCompra}
                onChange={(event) => setUnidadesPorCompra(Number(event.target.value))}
                className="text-right tabular"
              />
              <p className="text-[11px] text-muted-foreground">
                Láminas: 2 medias por hoja. El resto: 1.
              </p>
            </div>

            <label className="flex items-center gap-2 self-end pb-1 text-sm">
              <Checkbox
                checked={controlaStock}
                onChange={(event) => setControlaStock(event.target.checked)}
              />
              Controla stock
            </label>

            {esEdicion ? (
              <label className="flex items-center gap-2 self-end pb-1 text-sm">
                <Checkbox
                  checked={activo}
                  onChange={(event) => setActivo(event.target.checked)}
                />
                Producto activo
              </label>
            ) : null}
          </CardContent>
        </Card>

        {categoria === 'LAMINA' ? (
          <Card>
            <CardHeader>
              <CardTitle>Lámina</CardTitle>
              <CardDescription>Tipo, veta y medidas de la hoja entera.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="tipo">Tipo</Label>
                <Select id="tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                  {TIPOS_LAMINA.map((valor) => (
                    <option key={valor} value={valor}>
                      {valor.charAt(0).toUpperCase() + valor.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={color}
                  maxLength={40}
                  onChange={(event) => setColor(event.target.value)}
                  placeholder="Ej. Blanco"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="espesor">Espesor</Label>
                <div className="relative">
                  <Input
                    id="espesor"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={espesor}
                    onChange={(event) => setEspesor(Number(event.target.value))}
                    className="pr-9 text-right tabular"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                    mm
                  </span>
                </div>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <Checkbox
                    checked={tieneVeta}
                    onChange={(event) => setTieneVeta(event.target.checked)}
                  />
                  Tiene veta (dibujo)
                </label>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="largo">Largo de la hoja</Label>
                <div className="relative">
                  <Input
                    id="largo"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={largo}
                    onChange={(event) => setLargo(Number(event.target.value))}
                    className="pr-9 text-right tabular"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                    mm
                  </span>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="ancho">Ancho de la hoja</Label>
                <div className="relative">
                  <Input
                    id="ancho"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={ancho}
                    onChange={(event) => setAncho(Number(event.target.value))}
                    className="pr-9 text-right tabular"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                    mm
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1 sm:col-span-2">
                <span className="mr-1 text-[11px] text-muted-foreground">Medidas rápidas:</span>
                {PRESETS_HOJA.map((preset) => (
                  <Button
                    key={`${preset.largo}x${preset.ancho}`}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLargo(preset.largo)
                      setAncho(preset.ancho)
                    }}
                  >
                    {preset.largo} × {preset.ancho}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!esEdicion ? (
          <Card>
            <CardHeader>
              <CardTitle>Precio inicial</CardTitle>
              <CardDescription>
                Opcional. Después podés cambiarlo desde el historial de precios.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-1.5">
              <Label htmlFor="precio">
                {categoria === 'LAMINA'
                  ? 'Precio de la hoja entera'
                  : categoria === 'CINTA'
                    ? 'Precio por metro'
                    : 'Precio por unidad'}
              </Label>
              <div className="relative max-w-56">
                <Input
                  id="precio"
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
              {categoria === 'LAMINA' ? (
                <p className="text-[11px] text-muted-foreground">
                  Se guarda la mitad, porque la lámina se vende por media hoja.
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </form>
    </div>
  )
}
