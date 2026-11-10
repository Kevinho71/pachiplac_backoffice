import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'

import {
  aDecimal,
  comparar,
  dinero,
  esquemaCorteSchema,
  type Dinero,
  type EsquemaCorte,
  type UnidadVenta,
  type CategoriaProducto,
} from '@pachiplac/shared'

import { Prisma } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import type {
  ActualizarEntregadoInput,
  ActualizarEsquemaInput,
  ActualizarSaldoInput,
  CrearVentaInput,
  ListarVentasQuery,
} from './dto'
import {
  autorizaCorte,
  calcularCintaDeEsquema,
  ajusteDeVenta,
  esCintaColocada,
  esquemaCanonico,
  montoConAjuste,
  saldoTrasAbono,
  totalDeItems,
  totalMediasDeSeccion,
} from './ventas.helpers'
import type {
  ClienteVenta,
  DocumentoImpresion,
  SucursalImpresion,
  VentaDetalle,
  VentaItemDetalle,
  VentaResumen,
} from './ventas.types'

interface ProductoVenta {
  id: number
  nombre: string
  categoria: CategoriaProducto
  unidadVenta: UnidadVenta
}

interface VentaItemCrudo {
  id: number
  productoId: number
  cantidad: { toFixed(decimales: number): string }
  precioUnitario: { toFixed(decimales: number): string }
  producto: ProductoVenta
}

/** Convierte un `Decimal` de Prisma (o similar) al `Dinero` string del contrato. */
function aDinero(valor: { toFixed(decimales: number): string }): Dinero {
  return dinero(valor.toFixed(2))
}

interface VentaCruda {
  ordenVenta: number
  sucursalId: number
  numero: number
  clienteId: number | null
  fecha: Date
  montoTotal: { toFixed(decimales: number): string }
  saldo: { toFixed(decimales: number): string }
  metodoPago: string
  esFactura: boolean
  nroFactura: string | null
  entregado: boolean
  esquema: unknown
  cliente: { id: number; nombre: string; telefono: string | null } | null
  items: VentaItemCrudo[]
}

@Injectable()
export class VentasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(sucursalId: number, filtros: ListarVentasQuery): Promise<VentaResumen[]> {
    const rangoFechas = {
      ...(filtros.desde ? { gte: new Date(`${filtros.desde}T00:00:00.000Z`) } : {}),
      ...(filtros.hasta ? { lte: new Date(`${filtros.hasta}T23:59:59.999Z`) } : {}),
    }

    const ventas = await this.prisma.venta.findMany({
      where: {
        sucursalId,
        ...(Object.keys(rangoFechas).length > 0 ? { fecha: rangoFechas } : {}),
        ...(filtros.esFactura ? { esFactura: filtros.esFactura === 'true' } : {}),
        ...(filtros.entregado ? { entregado: filtros.entregado === 'true' } : {}),
        ...(filtros.clienteId ? { clienteId: filtros.clienteId } : {}),
        ...(filtros.pendientes === 'true' ? { saldo: { gt: 0 } } : {}),
      },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        items: {
          include: {
            producto: {
              select: { id: true, nombre: true, categoria: true, unidadVenta: true },
            },
          },
        },
      },
      orderBy: [{ fecha: 'desc' }, { ordenVenta: 'desc' }],
    })

    return ventas.map((venta) => this.aResumen(venta as VentaCruda))
  }

  async obtener(sucursalId: number, ordenVenta: number): Promise<VentaDetalle> {
    const venta = await this.prisma.venta.findFirst({
      where: { ordenVenta, sucursalId },
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        items: {
          include: {
            producto: {
              select: { id: true, nombre: true, categoria: true, unidadVenta: true },
            },
          },
        },
      },
    })

    if (!venta) {
      throw new NotFoundException('Venta no encontrada en la sucursal activa')
    }

    return this.aDetalle(venta)
  }

  /**
   * Crea la venta completa en una transacción: valida productos de la sucursal,
   * copia precios vigentes (R8), recalcula la cinta colocada desde el esquema
   * (secciones 5.9 y 8), asigna el número secuencial por sucursal y guarda saldo.
   */
  async crear(sucursalId: number, input: CrearVentaInput): Promise<VentaDetalle> {
    if (input.cliente_id) {
      const cliente = await this.prisma.cliente.findFirst({
        where: { id: input.cliente_id, sucursalId },
        select: { id: true },
      })
      if (!cliente) {
        throw new BadRequestException('El cliente no pertenece a la sucursal activa')
      }
    }

    const esquema = input.esquema ? esquemaCanonico(input.esquema) : null
    const cintaColocadaM = calcularCintaDeEsquema(esquema).total
    const idsEsquema = esquema?.secciones.map((seccion) => seccion.producto_id) ?? []
    const idsProductos = [...new Set([...input.items.map((item) => item.producto_id), ...idsEsquema])]
    const productos = await this.prisma.producto.findMany({
      where: { id: { in: idsProductos }, sucursalId },
      select: { id: true, nombre: true, categoria: true, unidadVenta: true },
    })
    const productoPorId = new Map(productos.map((producto) => [producto.id, producto]))
    if (
      input.items.some((item) => !productoPorId.has(item.producto_id)) ||
      idsEsquema.some((id) => !productoPorId.has(id))
    ) {
      throw new BadRequestException('Todos los ítems deben pertenecer al catálogo de la sucursal activa')
    }

    const cintaColocada = cintaColocadaM > 0 ? await this.buscarCintaColocada(sucursalId) : null
    if (cintaColocadaM > 0 && !cintaColocada) {
      throw new BadRequestException(
        'La sucursal no tiene el producto "Cinta de canto colocada" para cobrar la cinta del esquema',
      )
    }

    const ordenVenta = await this.prisma.$transaction(async (tx) => {
      const ids = [...new Set([...idsProductos, ...(cintaColocada ? [cintaColocada.id] : [])])]
      const precios = await tx.precioHistorial.findMany({
        where: { productoId: { in: ids }, vigenteDesde: { lte: new Date() } },
        orderBy: { vigenteDesde: 'desc' },
      })
      const precioPorProducto = new Map<number, Dinero>()
      for (const precio of precios) {
        if (!precioPorProducto.has(precio.productoId)) {
          precioPorProducto.set(precio.productoId, aDinero(precio.precio))
        }
      }

      const items = this.combinarItems(input.items).filter(
        (item) => item.producto_id !== cintaColocada?.id,
      )

      // Las hojas del esquema mandan sobre la cantidad de láminas vendidas.
      for (const seccion of esquema?.secciones ?? []) {
        const producto = productoPorId.get(seccion.producto_id)
        if (!producto || producto.categoria !== 'LAMINA') continue
        const medias = totalMediasDeSeccion(seccion)
        if (medias <= 0) continue
        const indice = items.findIndex((item) => item.producto_id === seccion.producto_id)
        if (indice >= 0) {
          items[indice] = { producto_id: seccion.producto_id, cantidad: dinero(medias) }
        } else {
          items.push({ producto_id: seccion.producto_id, cantidad: dinero(medias) })
        }
      }

      if (cintaColocada && cintaColocadaM > 0) {
        items.push({ producto_id: cintaColocada.id, cantidad: dinero(cintaColocadaM) })
      }

      const itemsConPrecio = items.map((item) => {
        const precio = precioPorProducto.get(item.producto_id)
        if (!precio) {
          const producto = productoPorId.get(item.producto_id) ?? cintaColocada
          throw new BadRequestException(
            `El producto "${producto?.nombre ?? item.producto_id}" no tiene precio vigente`,
          )
        }
        return { ...item, precio_unitario: precio }
      })

      const totalItems = totalDeItems(itemsConPrecio)
      const montoTotal = input.monto_total ?? totalItems
      const saldo = input.saldo ?? montoTotal
      if (comparar(saldo, montoTotal) > 0) {
        throw new BadRequestException('El saldo no puede superar el monto total')
      }

      const ultima = await tx.venta.aggregate({
        where: { sucursalId },
        _max: { numero: true },
      })
      const numero = (ultima._max.numero ?? 0) + 1

      const creada = await tx.venta.create({
        data: {
          sucursalId,
          numero,
          clienteId: input.cliente_id ?? null,
          ...(input.fecha ? { fecha: new Date(input.fecha) } : {}),
          montoTotal,
          saldo,
          metodoPago: input.metodo_pago,
          esFactura: input.es_factura,
          nroFactura: input.es_factura ? (input.nro_factura ?? null) : null,
          entregado: input.entregado,
          ...(esquema ? { esquema } : {}),
          items: {
            create: itemsConPrecio.map((item) => ({
              productoId: item.producto_id,
              cantidad: item.cantidad,
              precioUnitario: item.precio_unitario,
            })),
          },
        },
        select: { ordenVenta: true },
      })

      return creada.ordenVenta
    })

    return this.obtener(sucursalId, ordenVenta)
  }

  async actualizarSaldo(
    sucursalId: number,
    ordenVenta: number,
    input: ActualizarSaldoInput,
  ): Promise<VentaDetalle> {
    const venta = await this.ventaBasica(sucursalId, ordenVenta)
    const saldoActual = aDinero(venta.saldo)
    const montoTotal = aDinero(venta.montoTotal)

    let nuevoSaldo: Dinero
    if (input.abono !== undefined) {
      const resultado = saldoTrasAbono(saldoActual, input.abono)
      if (resultado === null) {
        throw new BadRequestException('El abono no puede superar el saldo pendiente')
      }
      nuevoSaldo = resultado
    } else {
      nuevoSaldo = input.saldo ?? saldoActual
      if (comparar(nuevoSaldo, montoTotal) > 0) {
        throw new BadRequestException('El saldo no puede superar el monto total')
      }
    }

    await this.prisma.venta.update({
      where: { ordenVenta },
      data: { saldo: nuevoSaldo },
    })

    return this.obtener(sucursalId, ordenVenta)
  }

  async actualizarEntregado(
    sucursalId: number,
    ordenVenta: number,
    input: ActualizarEntregadoInput,
  ): Promise<VentaDetalle> {
    await this.ventaBasica(sucursalId, ordenVenta)
    await this.prisma.venta.update({
      where: { ordenVenta },
      data: { entregado: input.entregado },
    })
    return this.obtener(sucursalId, ordenVenta)
  }

  /**
   * Reemplaza el esquema guardado y recalcula todo en la misma transacción:
   * cinta colocada, total de ítems, monto total (respetando el descuento manual)
   * y saldo a partir de lo ya pagado.
   */
  async actualizarEsquema(
    sucursalId: number,
    ordenVenta: number,
    input: ActualizarEsquemaInput,
  ): Promise<VentaDetalle> {
    const venta = await this.prisma.venta.findFirst({
      where: { ordenVenta, sucursalId },
      include: {
        items: {
          include: {
            producto: {
              select: { id: true, nombre: true, categoria: true, unidadVenta: true },
            },
          },
        },
      },
    })
    if (!venta) {
      throw new NotFoundException('Venta no encontrada en la sucursal activa')
    }

    const cruda = venta as unknown as VentaCruda
    const esquema = input.esquema ? esquemaCanonico(input.esquema) : null
    const cintaM = calcularCintaDeEsquema(esquema).total
    const cintaColocada = cintaM > 0 ? await this.buscarCintaColocada(sucursalId) : null
    if (cintaM > 0 && !cintaColocada) {
      throw new BadRequestException(
        'La sucursal no tiene el producto "Cinta de canto colocada" para cobrar la cinta del esquema',
      )
    }

    const montoAnterior = aDinero(cruda.montoTotal)
    const saldoAnterior = aDinero(cruda.saldo)
    const pagado = dinero(aDecimal(montoAnterior).minus(saldoAnterior))
    const ajuste = ajusteDeVenta(montoAnterior, this.itemsDinero(cruda.items))
    const itemCinta = cruda.items.find((item) => esCintaColocada(item.producto.nombre))

    await this.prisma.$transaction(async (tx) => {
      if (cintaColocada && cintaM > 0) {
        if (itemCinta) {
          await tx.ventaItem.update({
            where: { id: itemCinta.id },
            data: { cantidad: dinero(cintaM) },
          })
        } else {
          const precio = await tx.precioHistorial.findFirst({
            where: { productoId: cintaColocada.id, vigenteDesde: { lte: new Date() } },
            orderBy: { vigenteDesde: 'desc' },
          })
          if (!precio) {
            throw new BadRequestException(
              'El producto "Cinta de canto colocada" no tiene precio vigente',
            )
          }
          await tx.ventaItem.create({
            data: {
              ordenVenta,
              productoId: cintaColocada.id,
              cantidad: dinero(cintaM),
              precioUnitario: aDinero(precio.precio),
            },
          })
        }
      } else if (itemCinta) {
        await tx.ventaItem.delete({ where: { id: itemCinta.id } })
      }

      // Las hojas de cada sección también mandan sobre la cantidad de láminas.
      const idsSecciones = [...new Set(esquema?.secciones.map((seccion) => seccion.producto_id) ?? [])]
      if (idsSecciones.length > 0) {
        const productosSeccion = await tx.producto.findMany({
          where: { id: { in: idsSecciones }, sucursalId },
          select: { id: true, nombre: true, categoria: true, unidadVenta: true },
        })
        if (productosSeccion.length !== idsSecciones.length) {
          throw new BadRequestException(
            'Todos los materiales del esquema deben pertenecer a la sucursal activa',
          )
        }

        const mediasPorProducto = new Map<number, number>()
        for (const seccion of esquema?.secciones ?? []) {
          const producto = productosSeccion.find((actual) => actual.id === seccion.producto_id)
          if (producto?.categoria !== 'LAMINA') continue
          mediasPorProducto.set(
            seccion.producto_id,
            (mediasPorProducto.get(seccion.producto_id) ?? 0) + totalMediasDeSeccion(seccion),
          )
        }

        for (const [productoId, medias] of mediasPorProducto) {
          if (medias <= 0) continue
          const itemLamina = cruda.items.find((item) => item.productoId === productoId)
          if (itemLamina) {
            await tx.ventaItem.update({
              where: { id: itemLamina.id },
              data: { cantidad: dinero(medias) },
            })
          } else {
            const precio = await tx.precioHistorial.findFirst({
              where: { productoId, vigenteDesde: { lte: new Date() } },
              orderBy: { vigenteDesde: 'desc' },
            })
            if (!precio) {
              throw new BadRequestException(
                'La lámina del esquema no tiene precio vigente para agregarla a la venta',
              )
            }
            await tx.ventaItem.create({
              data: {
                ordenVenta,
                productoId,
                cantidad: dinero(medias),
                precioUnitario: aDinero(precio.precio),
              },
            })
          }
        }
      }

      const itemsActuales = await tx.ventaItem.findMany({
        where: { ordenVenta },
        select: { cantidad: true, precioUnitario: true },
      })
      const totalItems = totalDeItems(
        itemsActuales.map((item) => ({
          cantidad: aDinero(item.cantidad),
          precio_unitario: aDinero(item.precioUnitario),
        })),
      )
      const montoTotal = montoConAjuste(totalItems, ajuste)
      const saldo = comparar(montoTotal, pagado) > 0
        ? dinero(aDecimal(montoTotal).minus(pagado))
        : '0.00'

      await tx.venta.update({
        where: { ordenVenta },
        data: {
          esquema: esquema ?? Prisma.DbNull,
          montoTotal,
          saldo,
        },
      })
    })

    return this.obtener(sucursalId, ordenVenta)
  }

  async documentoImpresion(
    sucursalId: number,
    ordenVenta: number,
    tipo: 'NOTA' | 'PEDIDO',
  ): Promise<DocumentoImpresion> {
    const venta = await this.obtener(sucursalId, ordenVenta)
    if (tipo === 'PEDIDO' && !venta.esquema) {
      throw new BadRequestException('La venta no tiene esquema de corte para imprimir el pedido')
    }

    const sucursal = await this.prisma.sucursal.findUnique({ where: { id: sucursalId } })
    if (!sucursal) {
      throw new NotFoundException('Sucursal no encontrada')
    }

    const autorizado = autorizaCorte(venta.monto_total, venta.saldo)
    const sucursalImpresion: SucursalImpresion = {
      id: sucursal.id,
      nombre: sucursal.nombre,
      ciudad: sucursal.ciudad,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
    }

    return {
      tipo,
      autorizado,
      aviso: autorizado
        ? null
        : 'El saldo pendiente supera la mitad del total. Podés imprimir igual bajo tu criterio.',
      venta,
      sucursal: sucursalImpresion,
    }
  }

  private async ventaBasica(
    sucursalId: number,
    ordenVenta: number,
  ): Promise<{ montoTotal: { toFixed(decimales: number): string }; saldo: { toFixed(decimales: number): string } }> {
    const venta = await this.prisma.venta.findFirst({
      where: { ordenVenta, sucursalId },
      select: { montoTotal: true, saldo: true },
    })
    if (!venta) {
      throw new NotFoundException('Venta no encontrada en la sucursal activa')
    }
    return venta
  }

  private async buscarCintaColocada(sucursalId: number): Promise<ProductoVenta | null> {
    const cintas = await this.prisma.producto.findMany({
      where: { sucursalId, categoria: 'CINTA' },
      select: { id: true, nombre: true, categoria: true, unidadVenta: true },
    })
    return cintas.find((producto) => esCintaColocada(producto.nombre)) ?? null
  }

  /** Une ítems repetidos del mismo producto y normaliza su cantidad. */
  private combinarItems(
    items: ReadonlyArray<{ producto_id: number; cantidad: string }>,
  ): Array<{ producto_id: number; cantidad: Dinero }> {
    const cantidades = new Map<number, Dinero>()
    for (const item of items) {
      const anterior = cantidades.get(item.producto_id)
      cantidades.set(
        item.producto_id,
        anterior ? dinero(aDecimal(anterior).plus(item.cantidad)) : dinero(item.cantidad),
      )
    }
    return [...cantidades].map(([producto_id, cantidad]) => ({ producto_id, cantidad }))
  }

  private itemsDinero(items: VentaItemCrudo[]): Array<{ cantidad: Dinero; precio_unitario: Dinero }> {
    return items.map((item) => ({
      cantidad: aDinero(item.cantidad),
      precio_unitario: aDinero(item.precioUnitario),
    }))
  }

  private esquemaDe(valor: unknown): EsquemaCorte | null {
    if (valor === null || valor === undefined) return null
    const resultado = esquemaCorteSchema.safeParse(valor)
    return resultado.success ? resultado.data : null
  }

  private aResumen(venta: VentaCruda): VentaResumen {
    const montoTotal = aDinero(venta.montoTotal)
    const saldo = aDinero(venta.saldo)
    const esquema = this.esquemaDe(venta.esquema)

    return {
      orden_venta: venta.ordenVenta,
      sucursal_id: venta.sucursalId,
      numero: venta.numero,
      cliente_id: venta.clienteId,
      cliente: this.aCliente(venta.cliente),
      fecha: venta.fecha.toISOString(),
      monto_total: montoTotal,
      saldo,
      pagado: dinero(aDecimal(montoTotal).minus(saldo)),
      cancelada: comparar(saldo, '0') === 0,
      metodo_pago: venta.metodoPago,
      es_factura: venta.esFactura,
      nro_factura: venta.nroFactura,
      entregado: venta.entregado,
      cantidad_items: venta.items.length,
      cinta_colocada_m: esquema ? calcularCintaDeEsquema(esquema).total : 0,
      tiene_esquema: esquema !== null,
      hojas_corte: esquema
        ? esquema.secciones.reduce((total, seccion) => total + seccion.hojas.length, 0)
        : 0,
      corte_autorizado: autorizaCorte(montoTotal, saldo),
    }
  }

  private aDetalle(venta: VentaCruda): VentaDetalle {
    return {
      ...this.aResumen(venta),
      esquema: this.esquemaDe(venta.esquema),
      items: venta.items.map((item) => this.aItem(item)),
    }
  }

  private aItem(item: VentaItemCrudo): VentaItemDetalle {
    const cantidad = aDinero(item.cantidad)
    const precioUnitario = aDinero(item.precioUnitario)
    return {
      id: item.id,
      producto_id: item.productoId,
      producto_nombre: item.producto.nombre,
      categoria: item.producto.categoria,
      unidad_venta: item.producto.unidadVenta,
      cantidad,
      precio_unitario: precioUnitario,
      subtotal: dinero(aDecimal(cantidad).times(precioUnitario)),
    }
  }

  private aCliente(cliente: VentaCruda['cliente']): ClienteVenta | null {
    if (!cliente) return null
    return { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono }
  }
}
