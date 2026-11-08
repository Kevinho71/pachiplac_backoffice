# Sistema de corte, ventas e inventario para melaminas y venestas

Documento de especificación del proyecto: descripción, modelo de negocio, reglas y lógica de negocio, modelo de datos (SQL completo), diseño del optimizador de cortes, stack tecnológico y plan de construcción.

---

## Tabla de contenido

1. [Descripción del proyecto](#1-descripción-del-proyecto)
2. [Alcance](#2-alcance)
3. [Modelo de negocio](#3-modelo-de-negocio)
4. [Reglas de negocio](#4-reglas-de-negocio)
5. [Lógica de negocio detallada](#5-lógica-de-negocio-detallada)
6. [El optimizador de cortes](#6-el-optimizador-de-cortes)
7. [Modelo de datos (SQL completo)](#7-modelo-de-datos-sql-completo)
8. [El esquema de cortes (JSON)](#8-el-esquema-de-cortes-json)
9. [Arquitectura y stack tecnológico](#9-arquitectura-y-stack-tecnológico)
10. [API (resumen)](#10-api-resumen)
11. [Pantallas](#11-pantallas)
12. [Despliegue en AWS](#12-despliegue-en-aws)
13. [Seguridad](#13-seguridad)
14. [Estrategia de pruebas](#14-estrategia-de-pruebas)
15. [Plan de construcción por fases](#15-plan-de-construcción-por-fases)
16. [Decisiones confirmadas con el dueño](#16-decisiones-confirmadas-con-el-dueño)
17. [Ideas a futuro](#17-ideas-a-futuro)

---

## 1. Descripción del proyecto

Sistema web (instalable como PWA, usable desde PC y celular) para un negocio que vende láminas de melamina, venesta y otros tableros, y que además corta esas láminas en piezas a pedido del cliente.

El sistema reemplaza el uso de un programa tipo SketchCut y lo integra con el resto de la operación:

- **Optimiza el corte** de las piezas que pide el cliente, minimizando las hojas usadas y respetando que la sierra es de panel (cortes de lado a lado).
- **Marca la cinta de canto** en cada pieza y calcula los metros totales.
- **Registra ventas** (láminas, cinta, artículos de armado) con su saldo pendiente.
- **Controla el inventario** a partir de compras (reabastecimiento) y ventas.
- **Guarda cada esquema de corte junto a su venta** y permite reimprimirlo.
- **Imprime** la nota de venta o la hoja de corte lista para el sello de "cancelado".
- Opcionalmente, **importa piezas desde una foto** (medidas escritas a mano o esquemas de otro programa).

**Usuario:** un único usuario, el dueño, con un login simple y un selector de sucursal.
**Sucursales:** el negocio tiene **2 sucursales** en ciudades distintas; cada una maneja su propio inventario, ventas, catálogo, precios y clientes de forma independiente (multitenencia, ver sección 3).
**Conexión:** el taller tiene internet estable, por lo que el modo offline queda fuera de alcance.

---

## 2. Alcance

### Dentro del alcance

- Optimizador de cortes con sierra de panel (guillotina), kerf de 4 mm, rotación de piezas y edición manual.
- Cinta de canto por lado (1 a 4 lados), con colores distintos en un mismo esquema.
- Catálogo de productos (láminas, cinta, artículos de armado) con historial de precios.
- Compras (reabastecimiento) e inventario calculado.
- Ventas con saldo, tipo de documento (con o sin factura) y esquema guardado.
- Impresión de nota de venta y de hoja de corte.
- Registro de ingresos extra (retazos vendidos).
- Multitenencia por sucursal (2 sucursales independientes: catálogo, precios, inventario y ventas propios).
- Login simple, PWA para PC y celular, despliegue en AWS.
- Importación de piezas por foto (fase posterior).

### Fuera del alcance

- Facturación electrónica o integración con impuestos. El sistema solo **marca** qué ventas llevan factura.
- Modo offline y sincronización.
- Calendario o agenda de cortes. El dueño organiza el trabajo a mano.
- Múltiples usuarios y roles por sucursal (hoy un único login con selector de sucursal).
- Inventario de retazos y su reutilización automática en cortes (idea a futuro).
- Ajustes y mermas de inventario (el negocio nunca los realiza).

---

## 3. Modelo de negocio

### Qué se vende

La fuente de ingresos principal es la **venta de láminas** de material. Además se venden:

- **Metros de cinta de canto** por separado.
- **Artículos de armado de muebles** por unidad (herrajes y similares).
- **Retazos** de material, como ingreso extra fuera del inventario.

### Láminas y medidas

| Materiales                             | Medida de la hoja entera                  |
| -------------------------------------- | ----------------------------------------- |
| Ventas / multilaminados                | 244 cm × 122 cm (2440 × 1220 mm)          |
| Melaminas, fondos, trupanes, ranurados | 275 cm × 183/185 cm (2750 × 1830/1850 mm) |
| Otros materiales (pocos)               | Medidas propias, definidas por producto   |

- Una hoja se vende **entera** o en **media hoja**. La media puede ser **a lo largo** o **a lo ancho**.
- Una media hoja cuesta **exactamente la mitad** del precio de la hoja entera.
- **Fondos:** tablero MDF de 3 mm de espesor con una cara de color.
- En el inventario y al consultar materiales las medidas se muestran en **centímetros**. Al armar esquemas de corte se trabaja **solo en milímetros**.

### Flujo típico de una venta

```
Cliente llega
   │
   ├── ¿Pide hojas enteras o medias SIN cortes? ──► Nota pequeña (material y cantidad)
   │                                                 + sello "CANCELADO" al pagar
   │
   └── ¿Pide CORTES? ──► El dueño ingresa las medidas (o importa una foto)
                          ├─ El sistema optimiza y el dueño ajusta el esquema
                          ├─ Se registra la venta con el esquema
                          ├─ El cliente paga el total o al menos la mitad
                          └─ Se imprime el esquema + sello "CANCELADO"
                                 │
                                 ├─ Pedido pequeño: el dueño da la hoja impresa al cliente,
                                 │   y este la pasa a los cortadores.
                                 └─ Pedido grande: el dueño lo programa y va pasando las hojas
                                     a los cortadores, pedido por pedido (no por hoja de corte).
```

Los **sobrantes** de un corte normalmente se los lleva el cliente.

### Reabastecimiento

El negocio repone material de dos maneras: **por paquetes** o **comprando hojas por unidad**. En ambos casos el costo de compra por hoja es:

```
costo por hoja = precio pagado / cantidad de hojas que llegaron
```

### Multitenencia: dos sucursales

El negocio tiene **dos sucursales en ciudades distintas** y funciona como negocio familiar. Cada sucursal es **independiente**: tiene su propio **catálogo** (productos y láminas), sus **precios**, sus **clientes**, su **inventario** (compras) y sus **ventas**.

- Se usa **una sola base de datos** y una sola instalación del sistema; cada sucursal es una fila en la tabla `sucursales` y el resto de tablas llevan `sucursal_id` (multitenencia por fila).
- El dueño inicia sesión una vez y elige la **sucursal activa** con un selector; a partir de ahí, todo (stock, ventas, precios, esquemas, reportes) queda filtrado por esa sucursal.
- La **numeración de las notas de venta es propia de cada sucursal** (cada una imprime su propia secuencia de números de orden).
- Los datos de una sucursal **nunca se mezclan** con los de la otra: el backend fuerza la sucursal de la sesión en cada consulta (ver sección 13).

---

## 4. Reglas de negocio

| #   | Regla                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | La sierra es de panel: **todos los cortes son rectos y recorren completo** el tablero que se está cortando. El esquema debe ser de tipo **guillotina**.                                                                                  |
| R2  | El grosor de la sierra (**kerf**) es de **4 mm** y se descuenta en cada corte. Es un parámetro configurable.                                                                                                                             |
| R3  | Las **vetas van siempre en sentido horizontal**. Si se gira la hoja horizontalmente, las líneas de la veta corren de izquierda a derecha.                                                                                                |
| R4  | Hay veta en la **melamina** (salvo la **blanca**, que es lisa) y en los **fondos**. La veta es una propiedad de dibujo (define hacia dónde corre la línea de veta en la pieza); **no restringe la rotación**.                            |
| R5  | Cada pieza tiene **4 lados** y puede llevar cinta de canto en **0, 1, 2, 3 o 4** de ellos, cada lado con su propio color.                                                                                                                |
| R6  | La cinta de canto se **cobra por metro**: por defecto **3 Bs** por metro colocado y **1,50 Bs** por metro suelto. Son precios **editables por el dueño en cualquier momento** (historial de precios), no valores fijos en configuración. |
| R7  | Una media hoja vale `precio de la hoja / 2`. El inventario se cuenta en **medias hojas**.                                                                                                                                                |
| R8  | Cada línea de venta guarda una **copia del precio** vigente al momento de vender. Cambiar precios no altera ventas pasadas.                                                                                                              |
| R9  | El **saldo** de una venta es lo que le falta pagar al cliente. Lo pagado se deduce como `monto_total − saldo`.                                                                                                                           |
| R10 | El **corte** solo se realiza si el cliente canceló el total o al menos la mitad de lo que vale: `saldo ≤ monto_total × 0,5`. Si no se cumple, la app avisa, pero el dueño puede continuar bajo su criterio.                              |
| R11 | Una venta es **con factura** o **sin factura**. Las que llevan factura se marcan y pueden tener un número de factura. Las demás llevan nota de venta.                                                                                    |
| R12 | Toda venta sin factura debe poder imprimir una **nota de venta** para sellarla como cancelada.                                                                                                                                           |
| R13 | El stock se **calcula** (compras − ventas). No existen movimientos de ajuste ni de merma.                                                                                                                                                |
| R14 | Un **retazo** vendido se registra como ingreso extra y **no forma parte del inventario**.                                                                                                                                                |
| R15 | Todo esquema de corte se **guarda junto a la venta** asociada, aunque no todas las hojas de la venta tengan cortes.                                                                                                                      |
| R16 | **Rotación:** rotar una pieza es intercambiar `largo ↔ ancho` (p. ej. 900 × 1200 → 1200 × 900). Está permitida para **todos los materiales**, sin importar la veta.                                                                      |
| R17 | **Refilado:** al cortar se descuenta un **margen de 5 mm por lado** (10 mm por dimensión) para perfilar los bordes, que suelen venir dañados. Está **encendido por defecto** y es opcional.                                              |

---

## 5. Lógica de negocio detallada

### 5.1 Catálogo unificado

Todo lo que se vende es un **producto**, con una categoría y una unidad de venta:

| Categoría | Unidad de venta | Ejemplo                      | ¿Controla stock? |
| --------- | --------------- | ---------------------------- | ---------------- |
| `LAMINA`  | `MEDIA`         | Melamina Roble 18 mm         | Sí               |
| `CINTA`   | `METRO`         | Cinta colocada, Cinta suelta | No (por defecto) |
| `HERRAJE` | `UNIDAD`        | Bisagra, tornillos, rieles   | Sí               |

Los datos propios de las láminas (tipo, color, espesor, medidas, veta) viven en una tabla aparte, `laminas`, en relación 1 a 1 con `productos`.

La cinta se modela como **dos productos**: "Cinta colocada" (3 Bs/m) y "Cinta suelta" (1,50 Bs/m). Así ambos precios tienen historial y no hacen falta columnas especiales. Los **3 Bs y 1,50 Bs son solo el valor inicial**; el dueño los cambia cuando quiera desde la app (no son archivos de configuración).

### 5.2 Precios

- `precio_historial` guarda el precio **por unidad de venta** y desde cuándo rige.
- Para una lámina, el precio guardado es el **de una media** (`precio de la hoja / 2`). La app pide el precio de la hoja al dueño y calcula la mitad.
- El precio vigente es la fila con la fecha `vigente_desde` más reciente que no sea futura (vista `precio_vigente`).
- Al crear una venta, el `precio_unitario` del ítem se **copia** del precio vigente.
- Los precios de la cinta (colocada y suelta) son **editables** igual que cualquier otro producto: el dueño los cambia en la app y el historial guarda cada cambio.

### 5.3 Compras e inventario

- Una compra registra: producto, cantidad que llegó (hojas, o unidades para herrajes), costo total y fecha.
- `costo_unitario = costo_total / cantidad` (columna calculada). Sirve igual para paquetes y para hojas sueltas.
- `productos.unidades_por_compra` convierte lo comprado a la unidad de venta: **2** para láminas (1 hoja = 2 medias) y **1** para el resto.

```
stock (en unidad de venta) = Σ(compras.cantidad) × unidades_por_compra − Σ(venta_items.cantidad)
```

Para láminas el stock queda en medias. Dividido entre 2 da hojas, y un número impar significa que hay una media hoja suelta. El stock se calcula **por sucursal**: las compras y ventas de cada sucursal solo afectan su propio inventario.

### 5.4 Ventas

Una venta tiene uno o más **ítems**. Cada ítem es un producto con cantidad y precio:

- **Lámina:** cantidad en medias (una entera = 2).
- **Cinta colocada:** cantidad en metros, calculada desde el esquema (suma de todos los lados con cinta de todas las piezas de la venta).
- **Cinta suelta:** cantidad en metros, ingresada a mano.
- **Herraje:** cantidad en unidades.

```
subtotal del ítem = cantidad × precio_unitario
monto_total       = Σ subtotales (ajustable por el dueño, por ejemplo por un descuento)
```

Ejemplo: una melamina con 2 hojas enteras y 14,6 m de cinta colocada genera dos ítems: `Melamina X` con cantidad 4 (medias) y `Cinta colocada` con cantidad 14,6.

### 5.5 Saldo y regla de corte

- Al crear la venta, el dueño registra el monto cobrado, y `saldo = monto_total − cobrado`.
- Si el cliente abona después, la app resta del saldo.
- "Cancelado" equivale a `saldo = 0`.
- **Corte autorizado:** `saldo ≤ monto_total × 0,5`. El botón de imprimir el esquema avisa si no se cumple, pero permite continuar.
- Limitación asumida: no se guarda el historial de abonos, solo el saldo actual. Si más adelante se necesita, se agrega una tabla `pagos` sin tocar el resto.

### 5.6 Con factura y sin factura

- `es_factura = true` marca la venta con un diferenciador visible (insignia) y habilita `nro_factura` como dato opcional de referencia.
- El sistema **no emite facturas** ni se conecta con el ente tributario.
- Los listados se pueden filtrar por este campo.

### 5.7 Impresión

Hay dos documentos:

1. **Nota pequeña** (venta sin cortes): cliente, fecha, número de orden, material y cantidad, y un espacio libre para el sello físico de CANCELADO.
2. **Pedido de corte** (venta con cortes): una portada con el resumen del pedido y luego **una página por hoja de corte**, cada una con:
   - Nombre del material, color, espesor y tipo de hoja (entera o media).
   - El esquema dibujado, con la **secuencia numerada de cortes**.
   - Cada pieza con sus medidas, etiqueta y una **línea gruesa del color de la cinta** en cada lado que lleva cinta.
   - Leyenda de colores de cinta y **metros totales de cinta** (por color y en total).
   - Kerf usado, número de hoja (por ejemplo 2 de 3), número de orden y fecha.
   - Espacio libre para el sello de CANCELADO.

El pedido se imprime **por venta**, porque el dueño reparte las hojas a los cortadores pedido por pedido.

### 5.8 Ingresos extra (retazos)

Tabla simple e independiente: `material`, `precio_pieza`, `precio_cinta`, `monto_total` y `fecha`. No afecta el inventario. Si un retazo se vende ya cortado y con cinta, el precio de la cinta se anota aparte para tener ambos montos.

### 5.9 Cálculo de metros de cinta

Cada pieza guarda, por lado, el **color de la cinta** o `null`. Los lados se definen respecto a la pieza tal como la ingresó el dueño (largo × ancho):

- `sup` e `inf`: los dos lados de longitud **largo**.
- `izq` y `der`: los dos lados de longitud **ancho**.

Si la pieza se rota en el esquema, los lados rotan con ella, y la línea de cinta se dibuja en el lado correcto.

```
metros de cinta = Σ sobre piezas (cantidad × Σ longitud de cada lado con cinta) / 1000
```

Se calcula por color y en total. Esta función vive en el paquete compartido y la usan tanto el navegador como el backend al guardar la venta.

---

## 6. El optimizador de cortes

Es el corazón del sistema y la parte de mayor riesgo técnico. Se implementa una sola vez, en **TypeScript puro**, dentro de `packages/optimizer`, y se ejecuta en un **Web Worker** en el navegador para no congelar la pantalla. El backend lo reutiliza para validar y recalcular.

### 6.1 Contrato

```ts
type Lado = 'sup' | 'inf' | 'izq' | 'der'

interface PiezaEntrada {
  id: string
  etiqueta?: string
  largo: number // mm, sentido de la veta (horizontal)
  ancho: number // mm
  cantidad: number
  puedeRotar: boolean // rotación (largo ↔ ancho), permitida para todos los materiales
  bordes: Partial<Record<Lado, string>> // color de cinta por lado, o ausente
}

interface HojaDisponible {
  tipo: 'ENTERA' | 'MEDIA_LARGA' | 'MEDIA_ANCHA'
  largo: number // mm
  ancho: number // mm
  costoMedias: number // 2 para entera, 1 para media
}

interface OpcionesOptimizacion {
  kerf: number // mm, por defecto 4
  refilado_mm: number // mm por lado a recortar, por defecto 5 (0 = sin refilar)
  modoCorte: 'DOS_ETAPAS' | 'GUILLOTINA_LIBRE'
  primerCorte: 'VERTICAL' | 'HORIZONTAL' | 'AUTO'
  tiempoMaxMs: number // presupuesto de búsqueda
  semilla?: number // reproducibilidad
}

interface PiezaColocada {
  idPieza: string
  x: number
  y: number // mm, esquina superior izquierda
  w: number
  h: number // dimensiones ya orientadas
  rotada: boolean
  bordes: Partial<Record<Lado, string>> // ya rotados a la orientación colocada
}

interface Corte {
  n: number // orden de ejecución
  orientacion: 'V' | 'H'
  posicion: number // mm desde el borde del sub-tablero
  desde: number
  hasta: number // tramo que recorre
}

interface HojaResultado {
  tipo: HojaDisponible['tipo']
  largo: number
  ancho: number
  piezas: PiezaColocada[]
  cortes: Corte[]
  aprovechamiento: number // 0..1
  retazoMayor: { w: number; h: number }
}

interface ResultadoOptimizacion {
  hojas: HojaResultado[]
  totalMedias: number
  metrosCinta: { total: number; porColor: Record<string, number> }
  noCaben: string[] // piezas más grandes que cualquier hoja
}

function optimizar(
  piezas: PiezaEntrada[],
  hojas: HojaDisponible[],
  opciones: OpcionesOptimizacion,
): ResultadoOptimizacion
```

### 6.2 Algoritmo

1. **Expandir** cada pieza según su cantidad.
2. **Refilado y kerf:** primero, si el refilado está activo, se restan `refilado_mm` (por defecto 5) a cada lado de la hoja; luego se infla cada pieza y la hoja (ya refilada) en `kerf` (`w + kerf` × `h + kerf` sobre `W + kerf` × `H + kerf`). Con cortes de guillotina esto es exacto, porque cada corte consume `kerf` y el último borde no necesita sierra.
3. **Colocación guillotina:** mantener una lista de rectángulos libres. Para cada pieza se elige un rectángulo libre (reglas best-short-side-fit o best-area-fit), se coloca en su esquina y el sobrante se **parte en dos** con un corte de lado a lado. Cada partición queda registrada en el árbol de cortes.
4. **Modos de corte:**
   - `DOS_ETAPAS`: primero tiras en una dirección y luego cortes perpendiculares dentro de cada tira. Es el más fácil de ejecutar en la sierra.
   - `GUILLOTINA_LIBRE`: cualquier secuencia de cortes completos. Aprovecha más material.
5. **Rotación:** rotar es intercambiar `largo ↔ ancho`. Está permitida para **todos los materiales** (`puedeRotar` siempre verdadero). Los bordes rotan con la pieza.
6. **Búsqueda:** se prueban muchos órdenes de piezas (por área, lado largo, ancho, aleatorios con semilla) y varias reglas de partición, dentro de un presupuesto de tiempo. Con decenas de piezas son milisegundos.
7. **Objetivo, en este orden:**
   1. Menor `totalMedias` (menor costo).
   2. Mayor `retazoMayor` (un sobrante grande y útil, que el cliente se lleva).
   3. Menor número de cortes.
8. **Bajar a media hoja:** al final, para cada hoja entera, se intenta reubicar sus piezas en una media (a lo largo o a lo ancho). Si caben, la hoja pasa a media y el costo baja en una media.
9. **Secuencia de cortes:** se numeran en el orden en que la sierra debe ejecutarlos, para dibujarlos sobre el esquema.
10. **Metros de cinta:** se calculan con la función compartida (sección 5.9).

### 6.3 Edición manual

El dueño puede **voltear** una pieza, **moverla a otra hoja**, **fijarla** y pedir que el resto se reoptimice. No se permite arrastrar libremente, porque rompería la guillotina. Un **validador** comprueba que cualquier esquema siga siendo cortable por la sierra y avisa si no lo es.

### 6.4 Convención de medidas

- La primera medida de cada pieza (**largo**) va en el sentido de la veta, es decir, horizontal.
- La hoja se dibuja con la veta horizontal. Una hoja de 2750 × 1830 se dibuja de 2750 de ancho por 1830 de alto.
- **Dimensiones variables:** el largo y ancho de la hoja se cargan por defecto del material elegido (`laminas.largo_mm` / `ancho_mm`), pero **se pueden cambiar** en el editor si se desea.
- Media hoja **a lo largo:** la mitad del largo, con el ancho completo. Media hoja **a lo ancho:** la mitad del ancho, con el largo completo. (Con las medidas por defecto: 2750 × 915 y 1375 × 1830.)
- **Refilado:** recorte de bordes de **5 mm por lado** (10 mm por dimensión), **encendido por defecto** para perfilar los bordes dañados. Es opcional: el dueño puede desactivarlo (`refilado_mm = 0`).
- **Rotación:** intercambiar `largo ↔ ancho` de una pieza está permitido para todos los materiales; es independiente de la veta.

---

## 7. Modelo de datos (SQL completo)

Base de datos **PostgreSQL**. Las medidas se guardan en **milímetros** (enteros) y los montos en **bolivianos** con 2 decimales.

```sql
-- =====================================================================
-- Sistema de corte y ventas para melaminas y venestas
-- PostgreSQL 15+
-- =====================================================================

-- ---------------------------------------------------------------------
-- Sucursales (multitenencia: cada sucursal es totalmente independiente)
-- ---------------------------------------------------------------------
CREATE TABLE sucursales (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL,
  ciudad    TEXT NOT NULL,
  direccion TEXT,
  telefono  TEXT,
  activa    BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- Usuarios (login simple, un solo usuario: el dueño, con selector de sucursal)
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------
CREATE TABLE clientes (
  id          SERIAL PRIMARY KEY,
  sucursal_id INT NOT NULL REFERENCES sucursales(id),
  nombre      TEXT NOT NULL,
  telefono    TEXT
);

CREATE INDEX idx_clientes_sucursal ON clientes (sucursal_id);

-- ---------------------------------------------------------------------
-- Catálogo único: láminas, cinta y artículos de armado
--   unidad_venta:  MEDIA (láminas), METRO (cinta), UNIDAD (herrajes)
--   unidades_por_compra: cuántas unidades de venta trae una unidad comprada
--                        láminas = 2 (1 hoja = 2 medias); resto = 1
--   controla_stock: si entra al cálculo de inventario
-- ---------------------------------------------------------------------
CREATE TABLE productos (
  id                  SERIAL PRIMARY KEY,
  sucursal_id         INT NOT NULL REFERENCES sucursales(id),
  categoria           TEXT NOT NULL CHECK (categoria IN ('LAMINA', 'CINTA', 'HERRAJE')),
  nombre              TEXT NOT NULL,
  unidad_venta        TEXT NOT NULL CHECK (unidad_venta IN ('MEDIA', 'METRO', 'UNIDAD')),
  unidades_por_compra INT  NOT NULL DEFAULT 1 CHECK (unidades_por_compra > 0),
  controla_stock      BOOLEAN NOT NULL DEFAULT TRUE,
  activo              BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_productos_sucursal ON productos (sucursal_id);

-- ---------------------------------------------------------------------
-- Datos propios de las láminas (1 a 1 con productos de categoría LAMINA)
-- La app garantiza que producto_id pertenezca a un producto LAMINA.
-- ---------------------------------------------------------------------
CREATE TABLE laminas (
  producto_id INT PRIMARY KEY REFERENCES productos(id),
  tipo        TEXT NOT NULL,                 -- melamina, fondo, trupan, ranurado, venesta, multilaminado, otro
  color       TEXT,
  espesor_mm  INT NOT NULL CHECK (espesor_mm > 0),
  largo_mm    INT NOT NULL CHECK (largo_mm > 0),   -- hoja entera
  ancho_mm    INT NOT NULL CHECK (ancho_mm > 0),
  tiene_veta  BOOLEAN NOT NULL DEFAULT FALSE        -- veta de dibujo (melamina, fondos); NO restringe la rotación
);

-- ---------------------------------------------------------------------
-- Historial de precios, por unidad de venta
-- (láminas: precio de una media = precio de la hoja / 2, lo calcula la app)
-- ---------------------------------------------------------------------
CREATE TABLE precio_historial (
  id            SERIAL PRIMARY KEY,
  producto_id   INT NOT NULL REFERENCES productos(id),
  precio        NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  vigente_desde TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_precio_historial_producto
  ON precio_historial (producto_id, vigente_desde DESC);

-- ---------------------------------------------------------------------
-- Compras (reabastecimiento), por paquete o por unidades sueltas
--   cantidad: hojas que llegaron (o unidades, en herrajes)
--   costo_unitario: costo_total / cantidad
-- ---------------------------------------------------------------------
CREATE TABLE compras (
  id             SERIAL PRIMARY KEY,
  sucursal_id    INT NOT NULL REFERENCES sucursales(id),
  producto_id    INT NOT NULL REFERENCES productos(id),
  fecha          DATE NOT NULL DEFAULT current_date,
  cantidad       INT NOT NULL CHECK (cantidad > 0),
  costo_total    NUMERIC(10,2) NOT NULL CHECK (costo_total >= 0),
  costo_unitario NUMERIC(10,2) GENERATED ALWAYS AS (round(costo_total / cantidad, 2)) STORED
);

CREATE INDEX idx_compras_sucursal ON compras (sucursal_id);
CREATE INDEX idx_compras_producto ON compras (producto_id);

-- ---------------------------------------------------------------------
-- Ventas
--   saldo: lo que falta pagar. pagado = monto_total - saldo
--   esquema: todos los cortes de la venta (JSONB); NULL si no hubo cortes
-- ---------------------------------------------------------------------
CREATE TABLE ventas (
  orden_venta SERIAL PRIMARY KEY,                 -- id interno
  sucursal_id INT NOT NULL REFERENCES sucursales(id),
  numero      INT NOT NULL,                       -- número de nota, secuencial POR sucursal
  cliente_id  INT REFERENCES clientes(id),        -- opcional (venta de mostrador)
  fecha       TIMESTAMPTZ NOT NULL DEFAULT now(),
  monto_total NUMERIC(10,2) NOT NULL CHECK (monto_total >= 0),
  saldo       NUMERIC(10,2) NOT NULL CHECK (saldo >= 0),
  metodo_pago TEXT NOT NULL,
  es_factura  BOOLEAN NOT NULL DEFAULT FALSE,
  nro_factura TEXT,
  entregado   BOOLEAN NOT NULL DEFAULT FALSE,
  esquema     JSONB,
  UNIQUE (sucursal_id, numero),
  CHECK (saldo <= monto_total),
  CHECK (nro_factura IS NULL OR es_factura)
);

CREATE INDEX idx_ventas_sucursal ON ventas (sucursal_id);
CREATE INDEX idx_ventas_fecha    ON ventas (fecha DESC);
CREATE INDEX idx_ventas_cliente  ON ventas (cliente_id);

-- ---------------------------------------------------------------------
-- Detalle de ventas: una sola tabla para todo lo que se vende
--   cantidad: medias (láminas), metros (cinta) o unidades (herrajes)
--   precio_unitario: copia del precio vigente al momento de vender
-- ---------------------------------------------------------------------
CREATE TABLE venta_items (
  id              SERIAL PRIMARY KEY,
  orden_venta     INT NOT NULL REFERENCES ventas(orden_venta) ON DELETE CASCADE,
  producto_id     INT NOT NULL REFERENCES productos(id),
  cantidad        NUMERIC(10,2) NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal        NUMERIC(10,2) GENERATED ALWAYS AS (round(cantidad * precio_unitario, 2)) STORED
);

CREATE INDEX idx_venta_items_orden    ON venta_items (orden_venta);
CREATE INDEX idx_venta_items_producto ON venta_items (producto_id);

-- ---------------------------------------------------------------------
-- Ingresos extra (retazos vendidos). Fuera del inventario.
-- ---------------------------------------------------------------------
CREATE TABLE ingresos_extra (
  id           SERIAL PRIMARY KEY,
  sucursal_id  INT NOT NULL REFERENCES sucursales(id),
  fecha        DATE NOT NULL DEFAULT current_date,
  material     TEXT NOT NULL,
  precio_pieza NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (precio_pieza >= 0),
  precio_cinta NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (precio_cinta >= 0),
  monto_total  NUMERIC(10,2) NOT NULL CHECK (monto_total >= 0)
);

CREATE INDEX idx_ingresos_extra_sucursal ON ingresos_extra (sucursal_id);

-- ---------------------------------------------------------------------
-- Vistas
-- ---------------------------------------------------------------------

-- Precio vigente de cada producto (por sucursal)
CREATE VIEW precio_vigente AS
SELECT DISTINCT ON (p.sucursal_id, ph.producto_id)
       p.sucursal_id, ph.producto_id, ph.precio, ph.vigente_desde
FROM precio_historial ph
JOIN productos p ON p.id = ph.producto_id
WHERE ph.vigente_desde <= now()
ORDER BY p.sucursal_id, ph.producto_id, ph.vigente_desde DESC;

-- Stock en unidad de venta (láminas: medias), por sucursal
CREATE VIEW stock AS
SELECT p.sucursal_id,
       p.id AS producto_id,
       COALESCE((SELECT SUM(c.cantidad)  FROM compras c      WHERE c.producto_id  = p.id), 0) * p.unidades_por_compra
     - COALESCE((SELECT SUM(vi.cantidad) FROM venta_items vi WHERE vi.producto_id = p.id), 0) AS stock
FROM productos p
WHERE p.controla_stock;

-- Resumen de ventas con lo pagado y si está cancelada
CREATE VIEW ventas_resumen AS
SELECT v.*,
       v.monto_total - v.saldo AS pagado,
       (v.saldo = 0)           AS cancelada
FROM ventas v;

-- ---------------------------------------------------------------------
-- Datos iniciales de ejemplo (ajustar nombres, ciudades y precios reales)
-- ---------------------------------------------------------------------
INSERT INTO sucursales (nombre, ciudad) VALUES
  ('Sucursal 1', 'Ciudad 1'),
  ('Sucursal 2', 'Ciudad 2');

-- Cinta de canto: dos productos POR sucursal (3 Bs colocada, 1,50 Bs suelta).
-- Son solo valores iniciales; el dueño los cambia cuando quiera desde la app.
INSERT INTO productos (sucursal_id, categoria, nombre, unidad_venta, unidades_por_compra, controla_stock)
SELECT s.id, 'CINTA', 'Cinta de canto colocada', 'METRO', 1, FALSE
FROM sucursales s;

INSERT INTO productos (sucursal_id, categoria, nombre, unidad_venta, unidades_por_compra, controla_stock)
SELECT s.id, 'CINTA', 'Cinta de canto suelta', 'METRO', 1, FALSE
FROM sucursales s;

INSERT INTO precio_historial (producto_id, precio)
SELECT id, CASE nombre WHEN 'Cinta de canto colocada' THEN 3.00 ELSE 1.50 END
FROM productos
WHERE categoria = 'CINTA';
```

### Notas sobre el modelo

- **`ventas` y `venta_items`:** todos los cálculos y consultas se hacen a este nivel. Las piezas **no son una entidad consultable**: viven dentro del JSON del esquema.
- **`stock` y `precio_vigente`** son vistas, no tablas, para que no puedan quedar desincronizadas.
- **Columnas generadas** (`costo_unitario`, `subtotal`): la base las calcula. Con Prisma se leen como solo lectura (ver sección 9).
- **`metodo_pago`** es texto libre. Si siempre son las mismas opciones (efectivo, QR, transferencia), se puede convertir en un `CHECK`.
- **Multitenencia:** todas las tablas transaccionales llevan `sucursal_id`; `laminas`, `precio_historial` y `venta_items` heredan la sucursal de su producto o venta. Las vistas y consultas se filtran siempre por la sucursal activa.
- **Numeración de nota:** `ventas.numero` es secuencial **por sucursal** (restricción `UNIQUE (sucursal_id, numero)`); la app asigna el siguiente número en la misma transacción.

---

## 8. El esquema de cortes (JSON)

El campo `ventas.esquema` guarda un **instantánea** de todos los cortes de la venta. Sirve para volver a dibujar, reimprimir o reeditar, y se lee y se escribe siempre completo.

```json
{
  "version": 1,
  "kerf_mm": 4,
  "refilado_mm": 5,
  "modo": "GUILLOTINA_LIBRE",
  "secciones": [
    {
      "producto_id": 3,
      "hojas": [
        {
          "tipo": "ENTERA",
          "largo_mm": 2750,
          "ancho_mm": 1830,
          "piezas": [
            {
              "id": "p1",
              "etiqueta": "Puerta",
              "x": 0,
              "y": 0,
              "w": 800,
              "h": 400,
              "rotada": false,
              "bordes": { "sup": "Blanco", "inf": null, "izq": null, "der": "Blanco" }
            }
          ],
          "cortes": [{ "n": 1, "orientacion": "V", "posicion": 804, "desde": 0, "hasta": 1830 }]
        }
      ]
    }
  ],
  "cinta": {
    "total_m": 14.6,
    "por_color": { "Blanco": 14.6 }
  }
}
```

**Regla de coherencia:** los metros de cinta y el monto de la venta se **calculan desde este JSON al guardar**, con la misma función compartida, y se escriben en las columnas (`venta_items`, `monto_total`). Si el dueño edita un esquema guardado, se recalcula todo en la misma transacción.

---

## 9. Arquitectura y stack tecnológico

Se usa **TypeScript de punta a punta**. Así el optimizador y el cálculo de cinta se escriben una sola vez y corren tanto en el navegador como en el servidor.

```
                ┌────────────────────────────────────────────┐
                │   PWA (React + TypeScript + Vite)          │
                │   - Editor de esquemas (SVG / Konva)       │
                │   - Optimizador en Web Worker              │
                └──────────────────┬─────────────────────────┘
                                   │ HTTPS (JSON)
                ┌──────────────────▼─────────────────────────┐
                │   API (NestJS)                             │
                │   - Auth, ventas, inventario, precios      │
                │   - Reutiliza packages/optimizer y shared  │
                └───────┬───────────────────────┬────────────┘
                        │                       │
              ┌─────────▼────────┐     ┌────────▼─────────┐
              │ PostgreSQL (RDS) │     │ S3 (fotos, PDFs) │
              └──────────────────┘     └──────────────────┘
```

### 9.1 Frontend

| Capa                         | Elección                            | Para qué                                                                       |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| Framework                    | **React 18 + TypeScript + Vite**    | Rápido, liviano y con tipado de punta a punta                                  |
| Rutas                        | **React Router**                    | Navegación entre pantallas                                                     |
| PWA                          | **vite-plugin-pwa** (Workbox)       | Instalable en celular; solo guarda en caché la app, no los datos               |
| UI                           | **Tailwind CSS + shadcn/ui**        | Componentes accesibles y responsive para PC y celular                          |
| Formularios                  | **react-hook-form + zod**           | Tablas de piezas y formularios con validación                                  |
| Datos del servidor           | **TanStack Query**                  | Caché, recarga y estados de carga                                              |
| Estado local                 | **Zustand**                         | Esquema en edición                                                             |
| Dibujo del esquema           | **SVG nativo**, o **react-konva**   | Konva si se quiere arrastrar, voltear y hacer zoom con comodidad en el celular |
| Optimizador en segundo plano | **Web Worker** + **Comlink**        | No congela la pantalla mientras calcula                                        |
| Íconos                       | **lucide-react**                    | Íconos livianos                                                                |
| Fechas                       | **date-fns**                        | Formato y rangos de fechas                                                     |
| Dinero                       | **decimal.js** (o centavos enteros) | Evita errores de punto flotante                                                |
| Impresión                    | **CSS `@media print`** sobre el SVG | El SVG se imprime nítido y sin librerías extra                                 |

### 9.2 Backend

| Capa                       | Elección                                                                    | Para qué                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework                  | **NestJS**                                                                  | Estructura por módulos e inyección de dependencias (parecida a Spring Boot). **Fastify** es la alternativa más ligera                      |
| Validación                 | **zod** (esquemas compartidos)                                              | Mismas reglas en front y back                                                                                                              |
| ORM                        | **Prisma**                                                                  | Tipos y acceso a datos. Las columnas generadas y las vistas se crean con SQL en la migración y se leen con `$queryRaw` o como solo lectura |
| Migraciones                | **Prisma Migrate**                                                          | Migraciones versionadas y con historial, estilo Flyway (ver 9.6)                                                                           |
| Base de datos              | **PostgreSQL 15+**                                                          | Relacional, ideal para ventas e inventario, con JSONB para los esquemas                                                                    |
| Autenticación              | **JWT en cookie httpOnly** + **bcrypt** (o argon2)                          | Login simple de un solo usuario                                                                                                            |
| PDF en servidor (opcional) | **Puppeteer** o **pdf-lib**                                                 | Solo si se quiere guardar el PDF en S3                                                                                                     |
| Fotos                      | **S3** + **Claude API** (modelo de visión, por ejemplo `claude-sonnet-5-5`) | Extraer las piezas de una foto                                                                                                             |
| Logs                       | **pino**                                                                    | Logs estructurados                                                                                                                         |

### 9.3 Paquetes compartidos y herramientas

| Elemento     | Elección                        | Para qué                                                        |
| ------------ | ------------------------------- | --------------------------------------------------------------- |
| Monorepo     | **pnpm workspaces**             | `packages/optimizer`, `packages/shared`, `apps/web`, `apps/api` |
| Pruebas      | **Vitest** + **fast-check**     | Pruebas unitarias y basadas en propiedades del optimizador      |
| Calidad      | **ESLint + Prettier**           | Estilo consistente                                              |
| Contenedores | **Docker** y **docker compose** | Postgres local y despliegue del backend                         |

### 9.4 Estructura del repositorio

```
melaminas/
├─ apps/
│  ├─ web/                 # React + Vite (PWA)
│  └─ api/                 # NestJS
│     └─ prisma/
│        ├─ schema.prisma  # modelo Prisma
│        └─ migrations/    # migraciones versionadas (Prisma Migrate, estilo Flyway)
├─ packages/
│  ├─ optimizer/           # optimizar(), validador de guillotina, secuencia de cortes
│  └─ shared/              # tipos, esquemas zod, cálculo de cinta, dinero
├─ db/
│  └─ schema.sql           # referencia del SQL (sección 7), materializado como migración inicial
├─ docker-compose.yml
└─ pnpm-workspace.yaml
```

### 9.5 Referencias para el algoritmo

Existen `rectpack` (Python) y `guillotine-packer` y `maxrects-packer` (npm) como inspiración. Ninguno resuelve juntos los requisitos de este negocio (guillotina estricta, kerf, bordes que rotan con la pieza, media hoja y secuencia de cortes), por lo que el optimizador se implementa propio, adaptando las ideas.

### 9.6 Migraciones (Prisma Migrate, estilo Flyway)

El esquema de datos se controla con **migraciones versionadas**, con la misma disciplina que Flyway: nunca se modifica la base a mano, cada cambio va en una migración numerada y ordenada, y queda registrado en una tabla de historial.

- **Herramienta:** Prisma Migrate. Cada migración vive en `apps/api/prisma/migrations/<timestamp>_<nombre>/migration.sql`, en orden cronológico.
- **Historial:** la tabla `_prisma_migrations` registra qué migraciones ya se aplicaron (equivalente a `flyway_schema_history`); así se sabe exactamente en qué versión está cada base.
- **Flujo de desarrollo:** `prisma migrate dev` crea la migración desde el `schema.prisma` y la aplica en local.
- **Flujo de producción:** `prisma migrate deploy` aplica solo las migraciones pendientes, en orden, al desplegar.
- **SQL crudo (columnas generadas y vistas):** las columnas `GENERATED ALWAYS AS ... STORED` y las vistas (`stock`, `precio_vigente`, `ventas_resumen`) no se expresan en `schema.prisma`; se generan con `prisma migrate dev --create-only`, se edita el `migration.sql` a mano para agregarlas y se aplica. En tiempo de ejecución se leen con `$queryRaw` o como solo lectura.
- **Política de cambios:** todo cambio de esquema es una migración nueva, revisada en el PR y desplegada **antes** del código que la usa. Ejemplos: la migración inicial crea el esquema completo; una migración posterior agrega `sucursales` y `sucursal_id` con su backfill.
- **Seed:** los datos iniciales (cinta por sucursal, etc.) se cargan con el seed de Prisma o un script idempotente, no como migración.

---

## 10. API (resumen)

| Recurso                                 | Operaciones                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `POST /auth/login`, `POST /auth/logout` | Sesión                                                                                             |
| `/sucursales`                           | Listar y seleccionar la sucursal activa                                                            |
| `/productos`, `/laminas`                | Listar, crear, editar, desactivar                                                                  |
| `/productos/:id/precios`                | Historial y nuevo precio                                                                           |
| `/compras`                              | Registrar y listar reabastecimientos                                                               |
| `/stock`                                | Consultar stock por producto                                                                       |
| `/clientes`                             | Listar, crear, editar                                                                              |
| `/ventas`                               | Crear (con ítems y esquema), listar con filtros (fecha, con factura, saldo pendiente), ver detalle |
| `PATCH /ventas/:id/saldo`               | Registrar un abono                                                                                 |
| `PATCH /ventas/:id/entregado`           | Marcar entregada                                                                                   |
| `PUT /ventas/:id/esquema`               | Reeditar el esquema (recalcula ítems y total)                                                      |
| `/ventas/:id/imprimir`                  | Datos para la nota o el pedido de corte                                                            |
| `/ingresos-extra`                       | Registrar y listar                                                                                 |
| `POST /importar-foto`                   | Foto a lista de piezas (a confirmar en una tabla editable)                                         |

Todos los recursos se filtran por la **sucursal activa** de la sesión: el `sucursal_id` se toma de la sesión, no del cuerpo de la petición, para que una sucursal no pueda acceder a los datos de otra.

---

## 11. Pantallas

1. **Login y selector de sucursal:** login simple; al entrar (o desde la barra superior) se elige la **sucursal activa**, y todo el sistema queda filtrado por ella.
2. **Nueva venta / Editar venta:** cliente, ítems (láminas, cinta suelta, herrajes), tipo de documento, método de pago y saldo.
3. **Editor de cortes:** tabla de piezas (largo, ancho, cantidad, rotar = intercambiar largo↔ancho, cinta por lado), dimensiones de la hoja **editables** (por defecto las del material), botón de optimizar, esquema dibujado con la secuencia de cortes, volteo y movimiento de piezas, totales de hojas y de cinta, vista previa de impresión.
4. **Listado de ventas:** filtros por fecha, con o sin factura, con saldo pendiente y entregadas. Insignia visible para las ventas con factura.
5. **Productos y precios:** catálogo, alta de láminas con sus medidas y veta, historial de precios.
6. **Compras y stock:** registro de reabastecimiento y vista de existencias (láminas en hojas y medias).
7. **Ingresos extra.**
8. **Importar desde foto:** subir imagen, revisar y corregir la tabla de piezas extraída, y pasar al editor.
9. **Sucursales:** alta y edición de sucursales (nombre, ciudad, dirección). Solo se ven los datos de la sucursal activa.

El diseño es **responsive**: en celular, el esquema se puede mover y ampliar con gestos, y la tabla de piezas se adapta a pantalla angosta.

---

## 12. Despliegue en AWS

Para un único usuario (con 2 sucursales en una misma base, multitenencia por fila) no hace falta una arquitectura compleja.

| Componente    | Servicio                                    | Nota                                                                    |
| ------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| Frontend      | **S3 + CloudFront**                         | Hosting estático con HTTPS (certificado en **ACM**)                     |
| Backend       | **Lightsail** (contenedor) o **App Runner** | Un solo contenedor, sin Kubernetes ni microservicios                    |
| Base de datos | **RDS PostgreSQL** (instancia pequeña)      | Con **backups automáticos**                                             |
| Archivos      | **S3**                                      | Fotos importadas y PDFs de esquemas                                     |
| Secretos      | **SSM Parameter Store**                     | Credenciales de la base de datos, clave JWT y clave de la API de visión |
| Dominio       | **Route 53** (opcional)                     | Dominio propio                                                          |

**Alternativa más económica:** Postgres en el mismo servidor Lightsail con respaldo diario a S3. Funciona, pero se pierde la comodidad de los backups gestionados.

---

## 13. Seguridad

- Contraseña con **bcrypt/argon2** y **límite de intentos** en el login.
- JWT en **cookie httpOnly**, `Secure` y `SameSite`.
- **Aislamiento por sucursal (tenant):** el backend resuelve la `sucursal_id` desde la sesión y la aplica como filtro en **toda** consulta, de modo que una sucursal nunca ve ni modifica datos de la otra.
- **HTTPS** obligatorio (CloudFront y ACM).
- Validación de toda entrada con **zod** en el backend.
- Las fotos subidas y el contenido que devuelve el modelo de visión se tratan como **datos no confiables**: nunca se aceptan directamente, se muestran en una tabla editable antes de usarlos.
- Secretos fuera del código (SSM) y **backups** automáticos de la base de datos.

---

## 14. Estrategia de pruebas

- **Optimizador (la más importante):**
  - Pruebas con **fast-check** que verifican, con miles de casos aleatorios: ninguna pieza se solapa, todas caben dentro de la hoja y cada corte va de lado a lado.
  - Casos reales: de **5 a 10 trabajos ya cortados** por el dueño con SketchCut (lista de piezas, material, hojas gastadas) para comparar el resultado del sistema con el real.
- **Cálculo de cinta y dinero:** pruebas unitarias con casos conocidos (por ejemplo 4 lados, 1 lado, mezcla de colores, piezas rotadas).
- **Backend:** pruebas de integración de ventas, saldo, stock y recalculado de esquemas.
- **Multitenencia:** pruebas que verifican el aislamiento por sucursal (los datos de una sucursal no aparecen en otra).

---

## 15. Plan de construcción por fases

| Fase                     | Qué se construye                                                                                                                  | Entregable que se puede probar                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 0. Base                  | Monorepo, Postgres con Docker, esquema SQL (con `sucursales` y `sucursal_id`), Prisma con migraciones, datos de prueba            | Proyecto levantando con migraciones y 2 sucursales de ejemplo                                      |
| 1. Optimizador           | Paquete `optimizer` con tipos, algoritmo, kerf, rotación, media hoja, secuencia de cortes, validador y metros de cinta            | Dado un set de piezas, devuelve hojas, posiciones, cortes y cinta. Validado contra trabajos reales |
| 2. Editor de esquema     | Tabla de piezas, selector de cinta por lado, dibujo SVG, volteo y movimiento de piezas, vista de impresión                        | El dueño arma e imprime un esquema, aún sin guardarlo                                              |
| 3. Catálogo e inventario | Login, selector de sucursal, productos y láminas por sucursal, historial de precios, compras, vista de stock                      | Registrar un reabastecimiento y ver el stock de la sucursal activa                                 |
| 4. Ventas                | Ítems genéricos, línea automática de cinta colocada, saldo, esquema guardado, nota pequeña y pedido de corte con la regla del 50% | Una venta completa, de principio a fin                                                             |
| 5. PWA y AWS             | Instalación en celular, ajustes responsive, despliegue y backups                                                                  | Sistema en producción                                                                              |
| 6. Extras                | Ingresos extra, importación por foto                                                                                              | Foto de medidas a tabla de piezas                                                                  |

---

## 16. Decisiones confirmadas con el dueño

Decisiones cerradas con el dueño, incorporadas a lo largo del documento:

1. **Orientación de la veta:** la veta va siempre en el **sentido largo** de la pieza y corre a lo largo de la hoja, en un solo sentido.
2. **Media hoja:** "a lo largo" da 2750 × 915 y "a lo ancho" da 1375 × 1830 (con las medidas por defecto).
3. **Refilado:** se descuenta un margen de **5 mm por lado** para perfilar los bordes, que suelen venir dañados. **Encendido por defecto** y opcional.
4. **Rotación:** rotar es intercambiar `largo ↔ ancho` (p. ej. 900 × 1200 → 1200 × 900). Permitida para **todos los materiales**, sin importar la veta. Las **dimensiones de la hoja** son configurables (por defecto las del material, editables en el esquema).
5. **Descuento de stock:** se descuenta al registrar la venta, no al sacar las hojas para el corte.
6. **Cobro:** las láminas se cobran por hoja o media hoja, sin cargo adicional por el servicio de corte.
7. **Cinta:** los precios (3 Bs y 1,50 Bs por metro) son productos con historial y **editables por el dueño cuando quiera**; no son archivos de configuración. La cinta colocada no controla stock.
8. **Abonos:** solo se guarda el saldo actual, sin historial de pagos.
9. **Regla del 50%:** el sistema avisa pero no bloquea la impresión del esquema.
10. **Medidas 183 y 185:** son dos productos distintos, cada uno con sus medidas.
11. **Multitenencia:** 2 sucursales independientes; catálogo, precios, clientes, inventario y ventas **propios de cada sucursal**.
12. **Migraciones:** con Prisma Migrate, versionadas y con historial (estilo Flyway, sección 9.6).

---

## 17. Ideas a futuro

- **Reutilización de retazos:** registrar retazos con sus medidas y que el optimizador los use para sustituir piezas cuando ya existe un retazo que sirva.
- **Historial de pagos:** una tabla `pagos` si se necesita saber cuándo y cuánto abonó cada cliente.
- **Modo offline** con sincronización, si el taller pierde conexión.
- **Más usuarios y permisos**, si se suman empleados.
- **Reportes:** ventas por período, por material, cuentas por cobrar, comparación con y sin factura.
- **Estadísticas por pieza:** el JSONB permite extraer las medidas más pedidas si algún día interesa.
