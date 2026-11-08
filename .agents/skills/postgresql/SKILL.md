---
name: postgresql
description: 'PostgreSQL for the user''s Spring Boot projects, end to end: connecting to the active project''s own database via its .env (dev vs prod resolution, JDBC URL parsing, psql per OS), the hard rule that structural changes always go through a Flyway/Liquibase migration and never a hand-run DDL statement, and reference material for PostgreSQL-specific features (JSONB, arrays, window functions, full-text search, custom types, extensions) and query/index optimization. Use whenever asked to inspect data, run a query, check a table, debug a data issue, design a schema change, or write/optimize PostgreSQL-specific SQL in a Spring Boot + PostgreSQL project.'
---

# PostgreSQL: flujo de trabajo y features avanzadas

Esta skill cubre tres cosas: **cómo conectarse** a la base del proyecto activo usando su propio `.env`, **qué hacer (y qué nunca hacer)** cuando la tarea implica cambiar la estructura de la base, y una **referencia de features PostgreSQL-específicas** (JSONB, arrays, window functions, tipos avanzados, extensiones, optimización de queries/índices) para cuando la tarea es escribir o mejorar SQL, no solo administrar el esquema.

## 1. Localizar las credenciales del proyecto

No hay credenciales guardadas en ningún lado fuera del proyecto. Siempre se leen del `.env` del backend que está en scope en ese momento:

1. Busca `.env` en la raíz del proyecto backend (o en `backend/`, `api/`, según la estructura).
2. Si hay varios (`.env`, `.env.local`, `.env.dev`, `.env.prod`), usa `.env` salvo que el usuario pida explícitamente otro.
3. Si el proyecto es Spring Boot y `application.properties`/`application-*.properties` usa placeholders (`${DB_URL}`, `${DB_DEV_USER}`), las variables reales están en el `.env`, no en el `.properties` — resuelve ahí.

### Patrones de nombres de variables observados en los proyectos del usuario

No hay una convención única — detecta cuál aplica:

| Patrón | Ejemplo real | Notas |
|---|---|---|
| `DB_URL` / `DB_USER` / `DB_PASSWORD` | orientacion-vocacional | Directo |
| `DB_DEV_URL` / `DB_DEV_USER` / `DB_DEV_PASSWORD` + `DB_PROD_*` | CADET-BACKEND, psicologos_backend | Dos perfiles en el mismo archivo |
| `DATABASE_URL` (connection string única) | Pocket_MVP | Formato `postgresql://user:pass@host:port/db`, ya trae todo |
| `spring.datasource.url=${DB_URL}` | cualquier Spring Boot | Placeholder — el valor real está en `.env`, no en el `.properties` |

### Resolución dev vs prod

**Si existen ambos perfiles (`DB_DEV_*` y `DB_PROD_*`) y el usuario no especifica cuál, usa siempre DEV.** Nunca asumas producción. Conectarse a `DB_PROD_*` requiere que el usuario lo pida explícitamente en ese momento — no por costumbre de una conversación anterior.

## 2. Parsear la URL JDBC

Las URLs suelen venir en formato JDBC (`jdbc:postgresql://host:port/db`), que `psql` no entiende directamente. Extrae host, puerto y nombre de base:

```
jdbc:postgresql://localhost:5433/cadet_bd
              └─ host=localhost  puerto=5433  db=cadet_bd
```

Si la variable ya es `DATABASE_URL` en formato `postgresql://user:pass@host:port/db`, pásasela a `psql` directo como argumento único (psql la acepta tal cual).

## 3. Comando psql por sistema operativo

**Windows:**
```powershell
$env:PGPASSWORD = 'valor_de_DB_PASSWORD'
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h <host> -p <puerto> -U <usuario> -d <basededatos> -c "<query>"
```

**WSL / Linux** (requiere `sudo apt install postgresql-client` si `psql` no está instalado — verificar con `command -v psql` antes):
```bash
PGPASSWORD='valor_de_DB_PASSWORD' psql -h <host> -p <puerto> -U <usuario> -d <basededatos> -c "<query>"
```

No dejes la contraseña en variables de entorno persistentes ni en archivos temporales — solo en el comando puntual que se ejecuta.

## 4. Política de lectura y escritura

- **`SELECT` y exploración** (`\d`, `\dt`, `EXPLAIN`, agregaciones, joins de solo lectura): ejecuta libremente, sin pedir confirmación.
- **`INSERT` / `UPDATE` / `DELETE`**: muestra el statement exacto que vas a correr y espera confirmación explícita del usuario antes de ejecutarlo. Nunca lo corras en el mismo paso en que lo propones.
- **Cualquier DDL** (`CREATE TABLE`, `ALTER TABLE`, `DROP`, `CREATE INDEX`, cambios de tipo de columna, constraints, etc.): **nunca se ejecuta por psql, bajo ninguna circunstancia**, ni con confirmación del usuario. Ver sección 5.

## 5. Cambios de estructura: siempre por migración

Cuando la tarea implique crear una entidad nueva, agregar/quitar una columna, cambiar un tipo, agregar un índice o una constraint: **la salida es un archivo de migración**, nunca un `ALTER`/`CREATE` corrido a mano.

### Detectar qué herramienta usa el proyecto

- **Flyway**: hay carpeta `src/main/resources/db/migration/`, o `flyway-core` / `org.flywaydb` en `pom.xml`/`build.gradle`.
- **Liquibase**: hay `db/changelog/` o un `changelog-master.xml`/`.yaml`/`.sql`, o `liquibase-core` en las dependencias.

Si no hay ninguna de las dos y el proyecto ya tiene tablas creadas, pregúntale al usuario cómo maneja el esquema antes de asumir — no introduzcas una herramienta de migraciones nueva sin que lo pida.

### Buenas prácticas — Flyway

- **Nombrado versionado (convención del usuario):** `V{AAAAMMDDHH}__{descripcion_en_snake_case}.sql` — la versión es fecha y hora concatenadas sin separadores (año, mes, día, hora), seguida de doble guion bajo. Ejemplo: `V2026081714__add_email_verified_to_users.sql` (17 de agosto de 2026, 14h).
- Migraciones repetibles (vistas, funciones, seeds que se re-aplican): prefijo `R__` en vez de `V{...}__`, sin fecha.
- Una migración = un cambio lógico. No mezcles crear una tabla con poblarla con datos de otra en el mismo archivo si son conceptualmente distintos.
- Las migraciones ya aplicadas (en producción o compartidas con el equipo) **nunca se editan** — Flyway valida checksums y falla si detecta que una migración aplicada cambió. Si hay un error, se corrige con una migración nueva.
- Prueba la migración localmente (`flyway migrate` o el arranque de la app con `spring.flyway.enabled=true`) antes de darla por terminada.
- Como la versión ya incluye hora, dos migraciones creadas el mismo día no colisionan salvo que sean en la misma hora exacta — en ese caso, ajusta manualmente la hora para desempatar.

### Buenas prácticas — Liquibase

- **Nombrado de archivo (convención del usuario):** `db.changelog-{AAAAMMDD}-{HH}.yaml` — fecha (año, mes, día) y hora, ejemplo: `db.changelog-20260817-14.yaml`.
- Un `changeSet` por cambio lógico dentro del archivo, con `id` único (puede ser secuencial o descriptivo) y `author` real.
- Preferir formato **YAML** (coherente con la extensión de nombrado anterior) sobre SQL puro cuando el cambio necesite ser reversible automáticamente (Liquibase infiere el rollback de varios `changeType` estándar como `createTable`, `addColumn`).
- Define `rollback` explícito cuando el `changeType` no permite rollback automático (ej. cambios de datos, `sql` custom).
- Usa `preConditions` cuando el changeset no deba aplicarse dos veces o dependa del estado de otra tabla.
- El changelog maestro (`db.changelog-master.yaml`) solo hace `include`/`includeAll` apuntando a estos archivos por fecha — no pongas cambios directamente ahí.
- Igual que Flyway: un changeset ya aplicado (con su checksum registrado en `DATABASECHANGELOG`) no se edita. Un fix va en un changeset nuevo, en un archivo nuevo con la fecha/hora actual.

## 6. Resumen de la regla dura

> Ver datos → `psql` libre.
> Cambiar datos existentes → `psql` con confirmación previa.
> Cambiar estructura → migración (Flyway/Liquibase), nunca `psql`, sin excepción.

---

## 7. Referencia: features PostgreSQL-específicas

Para cuando la tarea es escribir o mejorar SQL (no administrar esquema). Nada de esto se ejecuta directo contra la base sin pasar por la política de la sección 4 — un `CREATE INDEX`/`CREATE EXTENSION` sigue siendo DDL y va por migración.

### JSONB

```sql
CREATE INDEX idx_events_data_gin ON events USING gin(data);

-- Containment y path queries
SELECT * FROM events
WHERE data @> '{"type": "login"}'
  AND data #>> '{user,role}' = 'admin';

SELECT jsonb_agg(data) FROM events WHERE data ? 'user_id';
```

### Arrays

```sql
SELECT * FROM posts WHERE 'postgresql' = ANY(tags);
SELECT * FROM posts WHERE tags && ARRAY['database', 'sql'];
SELECT array_agg(DISTINCT category) FROM posts, unnest(categories) as category;
```

### Window functions y CTEs recursivas

```sql
SELECT
    product_id, sale_date, amount,
    SUM(amount) OVER (PARTITION BY product_id ORDER BY sale_date) as running_total,
    AVG(amount) OVER (PARTITION BY product_id ORDER BY sale_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as moving_avg,
    LAG(amount, 1) OVER (PARTITION BY product_id ORDER BY sale_date) as prev_amount
FROM sales;

-- Jerarquías (árboles de categorías, orgcharts)
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 1 as level FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY level, name;
```

### Full-text search

```sql
UPDATE documents SET search_vector = to_tsvector('spanish', title || ' ' || content);
CREATE INDEX idx_documents_search ON documents USING gin(search_vector);

SELECT *, ts_rank(search_vector, plainto_tsquery('spanish', 'inventario mipymes')) as rank
FROM documents
WHERE search_vector @@ plainto_tsquery('spanish', 'inventario mipymes')
ORDER BY rank DESC;
```

### Tipos avanzados (custom types, enums, ranges)

```sql
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

CREATE DOMAIN email_address AS TEXT
  CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ranges y solapamiento (ej. reservas, periodos de vigencia)
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    room_id INTEGER,
    reservation_period tstzrange
);
ALTER TABLE reservations
  ADD CONSTRAINT no_overlap EXCLUDE USING gist (room_id WITH =, reservation_period WITH &&);
```

### Extensiones comunes

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- Hashing/cifrado
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Fuzzy matching / ILIKE performante
```

### Optimización de queries e índices

```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;

-- Índices compuestos, parciales, de expresión y covering
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);
CREATE INDEX idx_active_users ON users(created_at) WHERE status = 'active';
CREATE INDEX idx_users_lower_email ON users(lower(email));
CREATE INDEX idx_orders_covering ON orders(user_id, status) INCLUDE (total, created_at);
```

- **Paginación:** evita `OFFSET` en datasets grandes; usa keyset/cursor pagination (`WHERE id > $last_id ORDER BY id LIMIT n`).
- **Índices no usados:** `SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;`
- **Queries lentas:** `pg_stat_statements` ordenado por `total_time`/`mean_time`.
- **Mantenimiento:** VACUUM/ANALYZE regular, estadísticas del planner al día.

### Checklist rápido antes de dar una query por optimizada

- [ ] `EXPLAIN ANALYZE` corrido, sin sequential scan inesperado en tablas grandes
- [ ] Índice cubre la selectividad real del `WHERE`, no solo "existe un índice"
- [ ] Sin índices duplicados o no usados dejados atrás
- [ ] Paginación por cursor si el resultado puede crecer sin límite
- [ ] Queries parametrizadas — nunca concatenación de valores del usuario
