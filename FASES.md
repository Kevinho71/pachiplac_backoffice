---
proyecto: Sistema de corte, ventas e inventario para melaminas y venestas (PACHIPLAC)
especificacion: sistema-melaminas-especificacion.md
stack: TypeScript (React + NestJS) · Prisma · PostgreSQL 15 · pnpm workspaces
---

# Fases de implementación

> Documento maestro de fases. La especificación funcional y técnica completa está en
> [`sistema-melaminas-especificacion.md`](sistema-melaminas-especificacion.md).
> Las skills pertinentes del proyecto están documentadas en [`.agents/README.md`](.agents/README.md).

## Skills pertinentes

Skills que aplican a este proyecto, cargadas según la fase en la que se trabaje
(el detalle y cuándo usar cada una está en [`.agents/README.md`](.agents/README.md)):

| Skill                         | Uso principal                                                    |
| ----------------------------- | ---------------------------------------------------------------- |
| `gitflow-workflow`            | Ramas, Conventional Commits y PRs                                |
| `cicd-pipelines`              | Pipeline de calidad (lint/test/build/security/docker-build)      |
| `docker-local-db`             | PostgreSQL local con Docker                                      |
| `postgresql`                  | SQL, vistas, JSONB, columnas generadas e índices                 |
| `nestjs-best-practices`       | Buenas prácticas de NestJS (módulos, DI, seguridad, rendimiento) |
| `vitest-unit-testing`         | Pruebas unitarias del optimizador y el cálculo de cinta          |
| `shadcn`                      | Componentes shadcn/ui                                            |
| `ui-styling`                  | Tailwind, accesibilidad y responsive                             |
| `refero-design`               | Investigación de diseño antes de implementar UI                  |
| `design-taste-frontend`       | Dirección de arte (anti-slop) del editor de esquemas             |
| `vercel-react-best-practices` | Rendimiento del frontend React/Vite                              |
| `gh`                          | GitHub CLI (PRs, issues, búsquedas)                              |

## Resumen de fases

| Fase | Nombre                         | Entregable verificable                               |
| ---- | ------------------------------ | ---------------------------------------------------- |
| 0    | Base y fundamentos             | Proyecto levantando con DB migrada y 2 sucursales    |
| 1    | Optimizador de cortes          | Algoritmo guillotina testeado contra trabajos reales |
| 2    | Editor de esquema              | Armar e imprimir un esquema (sin guardar)            |
| 3    | Catálogo, precios e inventario | Reabastecimiento y stock por sucursal                |
| 4    | Ventas                         | Venta completa con esquema e impresión               |
| 5    | Ingresos extra                 | Registrar y listar retazos vendidos                  |
| 6    | PWA, responsive y AWS          | Sistema en producción                                |
| 7    | Importación por foto           | Foto → tabla de piezas editable                      |

---

## Fase 0 — Base y fundamentos

**Objetivo:** dejar el monorepo, la base de datos, las migraciones y el login esqueleto funcionando.

- [ ] Monorepo con **pnpm workspaces**: `apps/web`, `apps/api`, `packages/optimizer`, `packages/shared`.
- [ ] **Docker + docker compose** con PostgreSQL 15+ local.
- [ ] **Prisma**: `schema.prisma` + migración inicial con el esquema completo de la especificación (sección 7), incluyendo `sucursales` y `sucursal_id` en todas las tablas.
- [ ] Vistas (`stock`, `precio_vigente`, `ventas_resumen`) y columnas generadas (`costo_unitario`, `subtotal`) vía SQL crudo en la migración.
- [ ] **Seed**: 2 sucursales + productos de cinta por sucursal (3 Bs colocada, 1,50 Bs suelta).
- [ ] **ESLint + Prettier** y TypeScript estricto de punta a punta.
- [ ] `packages/shared`: tipos, esquemas `zod`, manejo de dinero (`decimal.js` o centavos enteros).
- [ ] Login esqueleto: `bcrypt`/`argon2` + JWT en cookie `httpOnly` + selector de sucursal.

**Entregable:** `docker compose up` levanta el proyecto con la base migrada y 2 sucursales de ejemplo.

**Skills:** `gitflow-workflow` · `docker-local-db` · `postgresql` · `nestjs-best-practices`

---

## Fase 1 — Optimizador de cortes (núcleo de riesgo)

**Objetivo:** implementar una sola vez, en TypeScript puro, el algoritmo guillotina completo y testeado.

- [ ] Tipos del contrato (sección 6.1) en `packages/optimizer`.
- [ ] Algoritmo guillotina: modos `DOS_ETAPAS` y `GUILLOTINA_LIBRE`.
- [ ] **Kerf** (4 mm) y **refilado** (5 mm por lado, encendido por defecto, opcional).
- [ ] **Rotación libre** (intercambiar `largo ↔ ancho`) para todos los materiales.
- [ ] **Media hoja** (a lo largo / a lo ancho) y bajada de hoja entera a media.
- [ ] **Secuencia de cortes** numerada y **retazo mayor**.
- [ ] **Validador** de guillotina (cualquier esquema sigue siendo cortable).
- [ ] Cálculo de **metros de cinta** por color (función compartida, sección 5.9).
- [ ] Pruebas con **fast-check** (sin solapes, todo cabe, cortes de lado a lado) + **5–10 trabajos reales** del dueño como referencia.

**Entregable:** dado un set de piezas, devuelve hojas, posiciones, cortes y cinta; validado contra trabajos reales.

**Skills:** `vitest-unit-testing`

---

## Fase 2 — Editor de esquema (frontend)

**Objetivo:** armar, ajustar e imprimir un esquema de corte, aún sin guardarlo.

- [ ] Tabla de piezas: largo, ancho, cantidad, rotación (largo↔ancho) y cinta por lado (color).
- [ ] **Dimensiones de hoja editables** (por defecto las del material).
- [ ] Optimizador en **Web Worker** (Comlink) para no congelar la pantalla.
- [ ] Dibujo del esquema en **SVG** o **react-konva**, con la secuencia numerada de cortes.
- [ ] Línea gruesa del color de la cinta en cada lado con cinta.
- [ ] Volteo y movimiento de piezas, fijar y reoptimizar.
- [ ] Vista previa de impresión (`@media print`).

**Entregable:** el dueño arma e imprime un esquema completo, sin persistencia todavía.

**Skills:** `shadcn` · `ui-styling` · `refero-design` · `design-taste-frontend` · `vercel-react-best-practices`

---

## Fase 3 — Catálogo, precios e inventario (multitenant)

**Objetivo:** productos, láminas, precios, compras y stock, todo por sucursal.

- [ ] Login + **selector de sucursal** (sucursal activa en la sesión).
- [ ] CRUD de **productos** y **láminas** por sucursal (tipo, color, espesor, medidas, veta).
- [ ] **Historial de precios** (precios editables por el dueño, no archivos de configuración).
- [ ] **Compras** (paquetes o unidades) con `costo_unitario` calculado.
- [ ] Vista de **stock** por sucursal (medias y hojas).
- [ ] Middleware de **aislamiento por sucursal** en toda consulta.

**Entregable:** registrar un reabastecimiento y ver el stock de la sucursal activa.

**Skills:** `postgresql` · `nestjs-best-practices` · `vitest-unit-testing`

---

## Fase 4 — Ventas

**Objetivo:** registrar una venta completa de principio a fin.

- [ ] Ítems genéricos: lámina (medias), cinta suelta (metros) y herraje (unidades).
- [ ] **Cinta colocada** calculada automáticamente desde el esquema.
- [ ] **Numeración de nota por sucursal** (`UNIQUE (sucursal_id, numero)`).
- [ ] Saldo (`monto_total − cobrado`) y **regla del 50%** (avisa, no bloquea).
- [ ] Esquema guardado en **JSONB** y recalculado al editar (misma transacción).
- [ ] Impresión: **nota pequeña** (sin cortes) y **pedido de corte** (una página por hoja).
- [ ] CRUD de **clientes**.

**Entregable:** una venta completa con esquema guardado, reimpresión y nota/pedido impresos.

**Skills:** `postgresql` · `nestjs-best-practices` · `vitest-unit-testing`

---

## Fase 5 — Ingresos extra

**Objetivo:** registrar los retazos vendidos, fuera del inventario.

- [ ] CRUD de `ingresos_extra` (material, precio pieza, precio cinta, monto, fecha, sucursal).

**Entregable:** registrar y listar retazos vendidos.

**Skills:** `vitest-unit-testing`

---

## Fase 6 — PWA, responsive y despliegue AWS

**Objetivo:** dejar el sistema en producción.

- [ ] **PWA** con `vite-plugin-pwa` (instalable; cachea la app, no los datos).
- [ ] Ajustes **responsive** (gestos de zoom/arrastre del esquema en celular).
- [ ] **CI**: pipeline de calidad lint/test/build/security/docker-build para back+front.
- [ ] Despliegue: **S3 + CloudFront** (web), **Lightsail/App Runner** (api), **RDS** (PostgreSQL con backups), **SSM** (secretos).

**Entregable:** sistema en producción con HTTPS, backups y una sola base multitenant.

**Skills:** `cicd-pipelines` · `gh` · `docker-local-db`

---

## Fase 7 — Importación por foto (posterior)

**Objetivo:** extraer las piezas de una foto y pasarlas al editor.

- [ ] Subida a **S3** + modelo de visión (**Claude API**).
- [ ] Resultado presentado en una **tabla editable** antes de usarlo (datos no confiables).

**Entregable:** subir una foto y obtener una lista de piezas editable que pasa al editor.

**Skills:** — (sin skill específica; aplicar `refero-design` para la pantalla)
