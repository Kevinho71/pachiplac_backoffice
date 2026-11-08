# .agents — Skills pertinentes del proyecto

Directorio de contexto para los agentes que trabajan en **PACHIPLAC** (sistema de corte,
ventas e inventario para melaminas y venestas).

> Las skills pertinentes están **copiadas localmente** en `.agents/skills/<id>/` (archivos
> reales, no referencias), para que el proyecto sea autocontenido. El origen canónico sigue
> siendo `~/.agents/skills/<id>`; cuando se actualice una skill ahí, se vuelve a copiar al
> proyecto. Este `README.md` es el **manifiesto**: qué skills aplicar y cuándo.

## Stack del proyecto

TypeScript de punta a punta: **React 18 + Vite** (PWA), **NestJS** (API), **Prisma +
PostgreSQL 15** (con Prisma Migrate, estilo Flyway), **pnpm workspaces**, **Vitest +
fast-check**, **Tailwind + shadcn/ui**, **Docker**, despliegue en **AWS**. Multitenencia
por sucursal (2 sucursales independientes).

## Flujo de trabajo / Git / CI

| Skill              | Cuándo usarla                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gitflow-workflow` | Al crear ramas `feat/fix/chore/refactor/docs/test`, preparar commits (Conventional Commits, scope `back`/`front` en el monorepo) y abrir PR/MR contra la rama de integración. |
| `cicd-pipelines`   | Al montar o revisar el pipeline de calidad (lint/test/build/security/docker-build) para el monorepo back+front.                                                               |
| `gh`               | Para operar GitHub por CLI: crear PRs, listar issues, `gh api` y búsquedas.                                                                                                   |
| `docker-local-db`  | Al levantar la base de datos local (PostgreSQL) u otro servicio de respaldo con Docker.                                                                                       |

## Backend / Datos

| Skill                   | Cuándo usarla                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nestjs-best-practices` | Para escribir, revisar o refactorizar código de `apps/api`: módulos, inyección de dependencias, manejo de errores, seguridad (guards, pipes, rate limiting) y rendimiento.                                                                                                                                                |
| `postgresql`            | Para el SQL del proyecto: vistas (`stock`, `precio_vigente`, `ventas_resumen`), columnas generadas (`costo_unitario`, `subtotal`), JSONB de los esquemas de corte e índices. Nota: la convención de migraciones de este proyecto es **Prisma Migrate** (estilo Flyway, ver especificación 9.6), no Flyway de Spring Boot. |
| `vitest-unit-testing`   | Para las pruebas unitarias del optimizador (`fast-check`), el cálculo de cinta y el manejo de dinero.                                                                                                                                                                                                                     |

## Frontend / UI

| Skill                          | Cuándo usarla                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `shadcn`                       | Para agregar o componer componentes shadcn/ui en `apps/web`.                                                       |
| `ui-styling`                   | Para Tailwind, accesibilidad, temas y responsive de PC/celular.                                                    |
| `refero-design`                | Antes de diseñar o rediseñar cualquier pantalla (investigación de referencias). Es la skill de diseño por defecto. |
| `design-taste-frontend`        | Para la dirección de arte y el pulido anti-slop del editor de esquemas y de las pantallas.                         |
| `vercel-react-best-practices`  | Al escribir o revisar componentes React/Vite por rendimiento (memoización, code-splitting, data fetching).         |
| `ui-ux-pro-max` · `impeccable` | Complementarias de diseño/UX: patrones, paletas y auditoría de interfaz cuando hace falta más profundidad.         |

## Fuera de alcance (no aplican aquí)

- `spring-boot-best-practices`, `spring-boot-testing`: este proyecto es **NestJS + Prisma**, no Spring Boot.
- `playwright-cli`: Playwright quedó **fuera del plan** (ver especificación).
- `generic-tgi`, `tgi-tgii-*`, `linkedin-post`, `brand`, `banner-design`, `slides`, `design-system`: son para documentos académicos (LaTeX) o contenido de marca, no para este sistema.
