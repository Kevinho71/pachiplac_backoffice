import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { hashPassword } from '../auth/password'

/**
 * Seed idempotente: crea el usuario dueño inicial si no existe.
 * No crea sucursales ni otros datos (eso lo hace el seed de sucursales).
 *
 * Configuración:
 *   OWNER_EMAIL    (default: admin@pachiplac.com)
 *   OWNER_PASSWORD (default: cambiar123, SOLO para desarrollo)
 */
async function main(): Promise<void> {
  const email = process.env.OWNER_EMAIL ?? 'admin@pachiplac.com'
  const password = process.env.OWNER_PASSWORD ?? 'cambiar123'

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL es obligatoria')
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

  try {
    const existente = await prisma.usuario.findUnique({ where: { email } })
    if (existente) {
      console.log(`El usuario dueño ya existe: ${email} (id=${existente.id})`)
      return
    }

    const passwordHash = await hashPassword(password)
    const usuario = await prisma.usuario.create({
      data: { email, passwordHash },
    })
    console.log(`Usuario dueño creado: ${usuario.email} (id=${usuario.id})`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error('Error al crear el usuario dueño:', error)
  process.exitCode = 1
})
