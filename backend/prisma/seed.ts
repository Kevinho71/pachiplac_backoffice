/**
 * Seed idempotente de PACHIPLAC (Fase 0, ver sección 9.6 de la especificación).
 *
 * Carga los datos iniciales mínimos para poder trabajar:
 *   - 2 sucursales de ejemplo.
 *   - Por cada sucursal, los dos productos de cinta (`colocada` a 3,00 Bs el
 *     metro y `suelta` a 1,50 Bs el metro), sin control de stock porque la cinta
 *     se vende por metro y no lleva inventario.
 *
 * Es re-ejecutable sin duplicar nada:
 *   - Las sucursales y los productos se buscan por sus datos naturales antes de
 *     crearlos.
 *   - El precio inicial sólo se inserta si el producto todavía no tiene
 *     historial: si el dueño ya cambió el precio desde la app, se respeta.
 *
 * Se ejecuta con `pnpm --filter @pachiplac/backend db:seed`
 * (o directamente `prisma db seed` desde `backend/`).
 */
import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from '../src/generated/prisma/client'
import { Categoria, UnidadVenta } from '../src/generated/prisma/enums'

/** Sucursales de ejemplo (nombres y ciudades se ajustan con datos reales). */
const SUCURSALES = [
  { nombre: 'Sucursal 1', ciudad: 'Ciudad 1' },
  { nombre: 'Sucursal 2', ciudad: 'Ciudad 2' },
] as const

/**
 * Productos de cinta que existen en toda sucursal, con el precio inicial por
 * metro. Son sólo valores de arranque: el dueño los cambia desde la app.
 */
const PRODUCTOS_CINTA = [
  { nombre: 'Cinta de canto colocada', precio: '3.00' },
  { nombre: 'Cinta de canto suelta', precio: '1.50' },
] as const

const CATEGORIA_CINTA = Categoria.CINTA
const UNIDAD_METRO = UnidadVenta.METRO

interface Resumen {
  sucursalesCreadas: number
  sucursalesExistentes: number
  productosCreados: number
  productosExistentes: number
  preciosCreados: number
  preciosExistentes: number
}

function crearCliente(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('Falta DATABASE_URL: revisá backend/.env antes de correr el seed')
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
}

async function asegurarSucursal(
  prisma: PrismaClient,
  datos: (typeof SUCURSALES)[number],
): Promise<{ id: number; creada: boolean }> {
  const existente = await prisma.sucursal.findFirst({
    where: { nombre: datos.nombre, ciudad: datos.ciudad },
    select: { id: true },
  })
  if (existente) {
    return { id: existente.id, creada: false }
  }

  const creada = await prisma.sucursal.create({
    data: { nombre: datos.nombre, ciudad: datos.ciudad },
    select: { id: true },
  })
  return { id: creada.id, creada: true }
}

async function asegurarProductoCinta(
  prisma: PrismaClient,
  sucursalId: number,
  nombre: string,
): Promise<{ id: number; creado: boolean }> {
  const existente = await prisma.producto.findFirst({
    where: { sucursalId, categoria: CATEGORIA_CINTA, nombre },
    select: { id: true },
  })
  if (existente) {
    return { id: existente.id, creado: false }
  }

  const creado = await prisma.producto.create({
    data: {
      sucursalId,
      categoria: CATEGORIA_CINTA,
      nombre,
      unidadVenta: UNIDAD_METRO,
      unidadesPorCompra: 1,
      controlaStock: false,
    },
    select: { id: true },
  })
  return { id: creado.id, creado: true }
}

async function asegurarPrecioInicial(
  prisma: PrismaClient,
  productoId: number,
  precio: string,
): Promise<{ creado: boolean }> {
  // Sólo se siembra el precio si el producto no tiene historial todavía.
  const ultimo = await prisma.precioHistorial.findFirst({
    where: { productoId },
    orderBy: { vigenteDesde: 'desc' },
    select: { id: true },
  })
  if (ultimo) {
    return { creado: false }
  }

  await prisma.precioHistorial.create({ data: { productoId, precio } })
  return { creado: true }
}

async function seed(prisma: PrismaClient): Promise<Resumen> {
  const resumen: Resumen = {
    sucursalesCreadas: 0,
    sucursalesExistentes: 0,
    productosCreados: 0,
    productosExistentes: 0,
    preciosCreados: 0,
    preciosExistentes: 0,
  }

  for (const datos of SUCURSALES) {
    const sucursal = await asegurarSucursal(prisma, datos)
    if (sucursal.creada) {
      resumen.sucursalesCreadas += 1
      console.log(`Sucursal creada: ${datos.nombre} / ${datos.ciudad}`)
    } else {
      resumen.sucursalesExistentes += 1
      console.log(`Sucursal ya existía: ${datos.nombre} / ${datos.ciudad}`)
    }

    for (const producto of PRODUCTOS_CINTA) {
      const productoCinta = await asegurarProductoCinta(prisma, sucursal.id, producto.nombre)
      resumen[productoCinta.creado ? 'productosCreados' : 'productosExistentes'] += 1
      console.log(
        `${productoCinta.creado ? 'Producto creado' : 'Producto ya existía'}: ` +
          `${producto.nombre} (${datos.nombre})`,
      )

      const precio = await asegurarPrecioInicial(prisma, productoCinta.id, producto.precio)
      resumen[precio.creado ? 'preciosCreados' : 'preciosExistentes'] += 1
      console.log(
        `${precio.creado ? 'Precio inicial' : 'Precio ya registrado'}: ` +
          `Bs ${producto.precio} / metro (${producto.nombre}, ${datos.nombre})`,
      )
    }
  }

  return resumen
}

async function main(): Promise<void> {
  const prisma = crearCliente()
  try {
    const resumen = await seed(prisma)
    console.log(
      'Seed completado: ' +
        `${resumen.sucursalesCreadas} sucursales nuevas, ` +
        `${resumen.sucursalesExistentes} ya existentes, ` +
        `${resumen.productosCreados} productos nuevos, ` +
        `${resumen.productosExistentes} ya existentes, ` +
        `${resumen.preciosCreados} precios nuevos, ` +
        `${resumen.preciosExistentes} ya registrados.`,
    )
  } finally {
    await prisma.$disconnect()
  }
}

void main().catch((error: unknown) => {
  console.error('El seed falló:', error)
  process.exitCode = 1
})
