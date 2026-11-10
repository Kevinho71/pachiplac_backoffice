import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'

import { dinero, type CategoriaProducto, type Lamina, type PrecioHistorial } from '@pachiplac/shared'

import { PrismaService } from '../prisma/prisma.service'
import type {
  ActualizarProductoInput,
  CrearProductoInput,
  ListarProductosQuery,
  NuevoPrecioInput,
} from './dto'
import type { ProductoDetalle } from './producto.types'

interface ProductoConLamina {
  id: number
  sucursalId: number
  categoria: CategoriaProducto
  nombre: string
  unidadVenta: ProductoDetalle['unidad_venta']
  unidadesPorCompra: number
  controlaStock: boolean
  activo: boolean
  lamina: {
    productoId: number
    tipo: string
    color: string | null
    espesorMm: number
    largoMm: number
    anchoMm: number
    tieneVeta: boolean
  } | null
}

interface PrecioVigenteRow {
  producto_id: number
  precio: string | { toFixed(decimales: number): string }
}

interface StockRow {
  producto_id: number
  stock: number | string | { toFixed(decimales: number): string }
}

function aLamina(lamina: ProductoConLamina['lamina']): Lamina | null {
  if (!lamina) return null
  return {
    producto_id: lamina.productoId,
    tipo: lamina.tipo,
    color: lamina.color,
    espesor_mm: lamina.espesorMm,
    largo_mm: lamina.largoMm,
    ancho_mm: lamina.anchoMm,
    tiene_veta: lamina.tieneVeta,
  }
}

function aDinero(valor: PrecioVigenteRow['precio']): string {
  return typeof valor === 'string' ? dinero(valor) : valor.toFixed(2)
}

function aStock(valor: StockRow['stock']): number {
  return typeof valor === 'number' ? valor : Number(valor)
}

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(sucursalId: number, filtros: ListarProductosQuery): Promise<ProductoDetalle[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        sucursalId,
        ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
        ...(filtros.activo ? { activo: filtros.activo === 'true' } : {}),
        ...(filtros.q ? { nombre: { contains: filtros.q, mode: 'insensitive' } } : {}),
      },
      include: { lamina: true },
      orderBy: { nombre: 'asc' },
    })

    const [precios, stocks] = await Promise.all([
      this.prisma.$queryRaw<PrecioVigenteRow[]>`
        SELECT producto_id, precio
        FROM precio_vigente
        WHERE sucursal_id = ${sucursalId}
      `,
      this.prisma.$queryRaw<StockRow[]>`
        SELECT producto_id, stock
        FROM stock
        WHERE sucursal_id = ${sucursalId}
      `,
    ])

    const precioPorProducto = new Map(
      precios.map((fila) => [Number(fila.producto_id), aDinero(fila.precio)]),
    )
    const stockPorProducto = new Map(
      stocks.map((fila) => [Number(fila.producto_id), aStock(fila.stock)]),
    )

    return productos.map((producto) =>
      this.aDetalle(
        producto,
        precioPorProducto.get(producto.id) ?? null,
        stockPorProducto.get(producto.id) ?? null,
      ),
    )
  }

  async obtener(sucursalId: number, id: number): Promise<ProductoDetalle> {
    const producto = await this.prisma.producto.findFirst({
      where: { id, sucursalId },
      include: { lamina: true },
    })
    if (!producto) {
      throw new NotFoundException('Producto no encontrado en la sucursal activa')
    }

    const [precios, stocks] = await Promise.all([
      this.prisma.$queryRaw<PrecioVigenteRow[]>`
        SELECT producto_id, precio
        FROM precio_vigente
        WHERE sucursal_id = ${sucursalId} AND producto_id = ${id}
      `,
      this.prisma.$queryRaw<StockRow[]>`
        SELECT producto_id, stock
        FROM stock
        WHERE sucursal_id = ${sucursalId} AND producto_id = ${id}
      `,
    ])

    return this.aDetalle(
      producto,
      precios[0] ? aDinero(precios[0].precio) : null,
      stocks[0] ? aStock(stocks[0].stock) : null,
    )
  }

  async crear(sucursalId: number, input: CrearProductoInput): Promise<ProductoDetalle> {
    const producto = await this.prisma.$transaction(async (tx) => {
      const creado = await tx.producto.create({
        data: {
          sucursalId,
          categoria: input.categoria,
          nombre: input.nombre,
          unidadVenta: input.unidad_venta,
          unidadesPorCompra:
            input.unidades_por_compra ?? (input.categoria === 'LAMINA' ? 2 : 1),
          controlaStock: input.controla_stock ?? input.categoria !== 'CINTA',
          activo: input.activo ?? true,
        },
      })

      if (input.categoria === 'LAMINA' && input.lamina) {
        await tx.lamina.create({
          data: {
            productoId: creado.id,
            tipo: input.lamina.tipo,
            color: input.lamina.color ?? null,
            espesorMm: input.lamina.espesor_mm,
            largoMm: input.lamina.largo_mm,
            anchoMm: input.lamina.ancho_mm,
            tieneVeta: input.lamina.tiene_veta ?? false,
          },
        })
      }

      if (input.precio_inicial) {
        await tx.precioHistorial.create({
          data: { productoId: creado.id, precio: input.precio_inicial },
        })
      }

      return creado
    })

    return this.obtener(sucursalId, producto.id)
  }

  async actualizar(
    sucursalId: number,
    id: number,
    input: ActualizarProductoInput,
  ): Promise<ProductoDetalle> {
    const actual = await this.prisma.producto.findFirst({
      where: { id, sucursalId },
      include: { lamina: true },
    })
    if (!actual) {
      throw new NotFoundException('Producto no encontrado en la sucursal activa')
    }
    if (input.lamina && actual.categoria !== 'LAMINA') {
      throw new BadRequestException('Solo las láminas llevan datos de lámina')
    }
    if (input.lamina && !actual.lamina) {
      throw new BadRequestException('La lámina no tiene datos base; volvé a crearla')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.producto.update({
        where: { id },
        data: {
          ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
          ...(input.unidad_venta !== undefined ? { unidadVenta: input.unidad_venta } : {}),
          ...(input.unidades_por_compra !== undefined
            ? { unidadesPorCompra: input.unidades_por_compra }
            : {}),
          ...(input.controla_stock !== undefined ? { controlaStock: input.controla_stock } : {}),
          ...(input.activo !== undefined ? { activo: input.activo } : {}),
        },
      })

      if (input.lamina) {
        await tx.lamina.update({
          where: { productoId: id },
          data: {
            ...(input.lamina.tipo !== undefined ? { tipo: input.lamina.tipo } : {}),
            ...(input.lamina.color !== undefined ? { color: input.lamina.color ?? null } : {}),
            ...(input.lamina.espesor_mm !== undefined
              ? { espesorMm: input.lamina.espesor_mm }
              : {}),
            ...(input.lamina.largo_mm !== undefined ? { largoMm: input.lamina.largo_mm } : {}),
            ...(input.lamina.ancho_mm !== undefined ? { anchoMm: input.lamina.ancho_mm } : {}),
            ...(input.lamina.tiene_veta !== undefined
              ? { tieneVeta: input.lamina.tiene_veta }
              : {}),
          },
        })
      }
    })

    return this.obtener(sucursalId, id)
  }

  /** Baja lógica: no se borra el producto para no romper ventas ni compras históricas. */
  async desactivar(sucursalId: number, id: number): Promise<ProductoDetalle> {
    const actual = await this.prisma.producto.findFirst({
      where: { id, sucursalId },
      select: { id: true },
    })
    if (!actual) {
      throw new NotFoundException('Producto no encontrado en la sucursal activa')
    }
    await this.prisma.producto.update({ where: { id }, data: { activo: false } })
    return this.obtener(sucursalId, id)
  }

  async listarPrecios(sucursalId: number, id: number): Promise<PrecioHistorial[]> {
    await this.verificarProducto(sucursalId, id)
    const precios = await this.prisma.precioHistorial.findMany({
      where: { productoId: id },
      orderBy: { vigenteDesde: 'desc' },
    })
    return precios.map((precio) => ({
      id: precio.id,
      producto_id: precio.productoId,
      precio: precio.precio.toFixed(2),
      vigente_desde: precio.vigenteDesde.toISOString(),
    }))
  }

  async crearPrecio(
    sucursalId: number,
    id: number,
    input: NuevoPrecioInput,
  ): Promise<PrecioHistorial> {
    await this.verificarProducto(sucursalId, id)
    const precio = await this.prisma.precioHistorial.create({
      data: {
        productoId: id,
        precio: input.precio,
        ...(input.vigente_desde ? { vigenteDesde: new Date(input.vigente_desde) } : {}),
      },
    })
    return {
      id: precio.id,
      producto_id: precio.productoId,
      precio: precio.precio.toFixed(2),
      vigente_desde: precio.vigenteDesde.toISOString(),
    }
  }

  private async verificarProducto(sucursalId: number, id: number): Promise<void> {
    const existe = await this.prisma.producto.findFirst({
      where: { id, sucursalId },
      select: { id: true },
    })
    if (!existe) {
      throw new NotFoundException('Producto no encontrado en la sucursal activa')
    }
  }

  private aDetalle(
    producto: ProductoConLamina,
    precioVigente: string | null,
    stock: number | null,
  ): ProductoDetalle {
    return {
      id: producto.id,
      sucursal_id: producto.sucursalId,
      categoria: producto.categoria,
      nombre: producto.nombre,
      unidad_venta: producto.unidadVenta,
      unidades_por_compra: producto.unidadesPorCompra,
      controla_stock: producto.controlaStock,
      activo: producto.activo,
      lamina: aLamina(producto.lamina),
      precio_vigente: precioVigente,
      stock: producto.controlaStock ? stock : null,
    }
  }
}
