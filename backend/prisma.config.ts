import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Configuración del CLI de Prisma (v7). La URL de la base vive aquí, no en el datasource.
// Se ejecuta desde `backend/`, por lo que `dotenv` carga `backend/.env`.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `prisma db seed` ejecuta este comando (seed idempotente de datos, ver prisma/seed.ts).
    // El seed del usuario dueño corre después, dentro del script `db:seed` de backend/package.json.
    seed: 'ts-node --project tsconfig.seed.json prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
