# PACHIPLAC

Sistema de corte, ventas e inventario para melaminas y venestas.
Documentación de referencia: [`FASES.md`](FASES.md) (plan de fases) y
[`sistema-melaminas-especificacion.md`](sistema-melaminas-especificacion.md)
(especificación funcional y técnica completa).

## Estado

| Fase | Estado |
|---|---|
| 0 — Base y fundamentos | **Completada**: monorepo pnpm, PostgreSQL/MinIO, Prisma con migración inicial (tablas, vistas y columnas generadas), seed idempotente y auth con JWT. |
| 1 — Optimizador de cortes | **Completada**: `packages/optimizer` con algoritmo, validador, secuencia de cortes y metros de cinta, cubierto con Vitest + fast-check. Pendiente: reemplazar los fixtures provisionales por trabajos reales del dueño. |
| 2 — Editor de esquema | **Completada**: tabla de piezas, cinta por lado, hoja editable, optimizador en Web Worker, dibujo SVG con cortes numerados e impresión. Pendiente: mover piezas entre hojas y fijar posiciones (requiere extender el optimizador). |
| 3 en adelante | Pendiente. |

## Requisitos

- Node.js ≥ 22.12
- pnpm (se activa con `corepack enable pnpm`)
- Docker Desktop (para PostgreSQL y MinIO locales)

## Puesta en marcha

```bash
corepack enable pnpm
pnpm install
docker compose up -d
pnpm test
```

Comandos disponibles:

| Comando | Qué hace |
|---|---|
| `pnpm test` | Pruebas de todos los paquetes (Vitest) |
| `pnpm test:watch` | Vitest en modo watch |
| `pnpm test:coverage` | Cobertura con V8 |
| `pnpm typecheck` | TypeScript estricto en todo el workspace |
| `pnpm lint` | ESLint (flat config + typescript-eslint) |
| `pnpm format` | Prettier |
| `pnpm dev:frontend` | Levanta el editor en `http://localhost:5173` |
| `pnpm build:frontend` | Build de producción del editor |
| `pnpm --filter @pachiplac/optimizer demo [n]` | Imprime el resultado del optimizador para un trabajo de ejemplo |

## Contenedores locales

Definidos en [`docker-compose.yml`](docker-compose.yml), siguiendo la convención
`<proyecto>-<imagen>`, volumen `<contenedor>-data` y puertos incrementales sobre los ya
usados en la máquina:

| Servicio | Contenedor | Puerto host | Volumen |
|---|---|---|---|
| PostgreSQL 15 | `pachiplac-postgres` | `5445` (el máximo de la familia era `5444`) | `pachiplac-postgres-data` |
| MinIO | `pachiplac-minio` | `9010` API / `9011` consola (el último MinIO usaba `9000/9001`) | `pachiplac-minio-data` |

Las credenciales y URLs están en [`.env.example`](.env.example) (copiar a `.env`; el `.env`
está ignorado por git). Consola de MinIO: http://localhost:9011.

```bash
docker compose up -d
docker compose ps
docker compose down
```

## Estructura

```
backend/              # API NestJS + Prisma
  prisma/             # schema, migraciones y seed
frontend/             # React 18 + Vite (editor de cortes)
packages/
  shared/             # cinta de canto, dinero, DTOs zod y tipos compartidos
  optimizer/          # optimizador guillotina, validador y secuencia de cortes
.agents/              # skills del proyecto + manifiesto
docker-compose.yml
pnpm-workspace.yaml
```

## Optimizador de cortes (`packages/optimizer`)

API pública: `optimizar(piezas, hojas, opciones)` y `validarHoja(hoja, opciones)`.

- **Modos**: `GUILLOTINA_LIBRE` y `DOS_ETAPAS` (tiras + cortes perpendiculares).
- **Kerf** 4 mm y **refilado** 5 mm por lado (ambos configurables; refilado activo por
  defecto).
- **Rotación libre** (`largo ↔ ancho`) para todas las piezas; los bordes de cinta rotan
  con la pieza.
- **Media hoja**: si el llamador solo entrega la hoja entera, se derivan las dos medias
  hojas (a lo largo y a lo ancho); además, cada hoja entera se intenta bajar a media al
  final.
- **Objetivos**, en orden: menor `totalMedias`, mayor `retazoMayor`, menos cortes.
- **Búsqueda** multiorden con semilla (`semilla`) y presupuesto de tiempo (`tiempoMaxMs`),
  así que es reproducible.
- **Coordenadas**: mm enteros, relativos a la superficie útil (la hoja menos el refilado).
  Los cortes usan coordenadas absolutas de esa superficie (`posicion` desde el borde
  izquierdo o superior; `desde`/`hasta` es el tramo que recorre).
- **Cinta**: se calcula con `calcularMetrosCinta` de `@pachiplac/shared`, por color y en
  total, y es independiente de la rotación.
- **No caben**: las piezas más grandes que cualquier hoja disponible se devuelven en
  `noCaben` en lugar de fallar.

### Pruebas

- `optimizar.test.ts`: propiedades con fast-check (todas las piezas colocadas, sin
  solapes, dentro de la hoja, cortes de lado a lado, cinta y costo coherentes) y casos
  puntuales de kerf, refilado, rotación, media hoja y `noCaben`.
- `validador.test.ts`: solapes, piezas fuera de la hoja, molinillo no guillotinable,
  falta de espacio para la sierra y secuencias de corte inválidas.
- `trabajos-reales.test.ts`: 7 trabajos de referencia (provisionales) que deben gastar
  como máximo las medias hojas del trabajo real.

> Los trabajos de `src/__fixtures__/trabajos-reales.ts` son **provisionales**. Hay que
> reemplazarlos por los 5–10 trabajos que el dueño ya cortó con SketchCut (piezas,
> material y hojas gastadas) para que la comparación sea real.

## Editor de cortes (`frontend`)

Pantalla única de la Fase 2, todavía **sin persistencia**: se arma el pedido en
memoria, se optimiza y se imprime.

- Tabla de piezas editable (largo, ancho, cantidad, rotación y cinta por lado con
  color independiente). El alta rápida usa `react-hook-form` + `zod`.
- Hoja configurable (presets de melamina/ventas o medida personalizada), kerf,
  refilado opcional, modo de corte y opciones avanzadas (tiempo y semilla).
- **Optimizador en Web Worker** con Comlink: la interfaz no se congela.
- Dibujo **SVG** a escala real (mm) con la secuencia numerada de cortes, la línea
  de cinta en cada lado y el resumen de cinta por color.
- **Vista previa de impresión** (`@media print`): una página por hoja, con el
  espacio para el sello de CANCELADO.
- Estado con **Zustand** y estilos con **Tailwind CSS v4**.

> Limitación conocida: mover una pieza ya ubicada a otra hoja y fijar posiciones
> requiere extender el optimizador (hoy empaqueta todo desde cero). El editor sí
> permite voltear piezas (intercambiar largo ↔ ancho), cambiar la prioridad con
> las flechas y reoptimizar.

## Convenciones de trabajo

- Ramas `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `test/` y PR contra la rama de
  integración; Conventional Commits con scope `(back)`/`(front)` cuando aplique.
- Todo cambio de esquema de base de datos va por migración (Prisma Migrate), nunca SQL a
  mano.
- Las skills aplicables están en [`.agents/README.md`](.agents/README.md).
