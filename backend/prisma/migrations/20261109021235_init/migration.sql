-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('LAMINA', 'CINTA', 'HERRAJE');

-- CreateEnum
CREATE TYPE "UnidadVenta" AS ENUM ('MEDIA', 'METRO', 'UNIDAD');

-- CreateTable
CREATE TABLE "sucursales" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad_venta" "UnidadVenta" NOT NULL,
    "unidades_por_compra" INTEGER NOT NULL DEFAULT 1,
    "controla_stock" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laminas" (
    "producto_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "color" TEXT,
    "espesor_mm" INTEGER NOT NULL,
    "largo_mm" INTEGER NOT NULL,
    "ancho_mm" INTEGER NOT NULL,
    "tiene_veta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "laminas_pkey" PRIMARY KEY ("producto_id")
);

-- CreateTable
CREATE TABLE "precio_historial" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "vigente_desde" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "precio_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" SERIAL NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL DEFAULT current_date,
    "cantidad" INTEGER NOT NULL,
    "costo_total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "orden_venta" SERIAL NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "cliente_id" INTEGER,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "saldo" DECIMAL(10,2) NOT NULL,
    "metodo_pago" TEXT NOT NULL,
    "es_factura" BOOLEAN NOT NULL DEFAULT false,
    "nro_factura" TEXT,
    "entregado" BOOLEAN NOT NULL DEFAULT false,
    "esquema" JSONB,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("orden_venta")
);

-- CreateTable
CREATE TABLE "venta_items" (
    "id" SERIAL NOT NULL,
    "orden_venta" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "venta_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingresos_extra" (
    "id" SERIAL NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL DEFAULT current_date,
    "material" TEXT NOT NULL,
    "precio_pieza" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "precio_cinta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "monto_total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ingresos_extra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "idx_clientes_sucursal" ON "clientes"("sucursal_id");

-- CreateIndex
CREATE INDEX "idx_productos_sucursal" ON "productos"("sucursal_id");

-- CreateIndex
CREATE INDEX "idx_precio_historial_producto" ON "precio_historial"("producto_id", "vigente_desde" DESC);

-- CreateIndex
CREATE INDEX "idx_compras_sucursal" ON "compras"("sucursal_id");

-- CreateIndex
CREATE INDEX "idx_compras_producto" ON "compras"("producto_id");

-- CreateIndex
CREATE INDEX "idx_ventas_sucursal" ON "ventas"("sucursal_id");

-- CreateIndex
CREATE INDEX "idx_ventas_fecha" ON "ventas"("fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_ventas_cliente" ON "ventas"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_sucursal_id_numero_key" ON "ventas"("sucursal_id", "numero");

-- CreateIndex
CREATE INDEX "idx_venta_items_orden" ON "venta_items"("orden_venta");

-- CreateIndex
CREATE INDEX "idx_venta_items_producto" ON "venta_items"("producto_id");

-- CreateIndex
CREATE INDEX "idx_ingresos_extra_sucursal" ON "ingresos_extra"("sucursal_id");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laminas" ADD CONSTRAINT "laminas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precio_historial" ADD CONSTRAINT "precio_historial_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_orden_venta_fkey" FOREIGN KEY ("orden_venta") REFERENCES "ventas"("orden_venta") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_items" ADD CONSTRAINT "venta_items_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos_extra" ADD CONSTRAINT "ingresos_extra_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================================
-- SQL crudo que Prisma no expresa (sección 7 de la especificación):
--   columnas generadas + CHECK constraints + vistas
-- =====================================================================

-- ---------------------------------------------------------------------
-- Columnas generadas (solo lectura; se leen con $queryRaw)
--   compras.costo_unitario  = costo_total / cantidad
--   venta_items.subtotal    = cantidad * precio_unitario
-- ---------------------------------------------------------------------
ALTER TABLE "compras"
    ADD COLUMN "costo_unitario" DECIMAL(10,2) GENERATED ALWAYS AS (round("costo_total" / "cantidad", 2)) STORED;

ALTER TABLE "venta_items"
    ADD COLUMN "subtotal" DECIMAL(10,2) GENERATED ALWAYS AS (round("cantidad" * "precio_unitario", 2)) STORED;

-- ---------------------------------------------------------------------
-- CHECK constraints (Prisma no modela CHECK; fieles a la sección 7)
-- ---------------------------------------------------------------------
ALTER TABLE "productos"        ADD CONSTRAINT "productos_unidades_por_compra_check"   CHECK ("unidades_por_compra" > 0);

ALTER TABLE "laminas"          ADD CONSTRAINT "laminas_espesor_mm_check"  CHECK ("espesor_mm" > 0);
ALTER TABLE "laminas"          ADD CONSTRAINT "laminas_largo_mm_check"    CHECK ("largo_mm" > 0);
ALTER TABLE "laminas"          ADD CONSTRAINT "laminas_ancho_mm_check"    CHECK ("ancho_mm" > 0);

ALTER TABLE "precio_historial" ADD CONSTRAINT "precio_historial_precio_check" CHECK ("precio" >= 0);

ALTER TABLE "compras"          ADD CONSTRAINT "compras_cantidad_check"    CHECK ("cantidad" > 0);
ALTER TABLE "compras"          ADD CONSTRAINT "compras_costo_total_check" CHECK ("costo_total" >= 0);

ALTER TABLE "ventas"           ADD CONSTRAINT "ventas_monto_total_check"  CHECK ("monto_total" >= 0);
ALTER TABLE "ventas"           ADD CONSTRAINT "ventas_saldo_check"        CHECK ("saldo" >= 0);
ALTER TABLE "ventas"           ADD CONSTRAINT "ventas_saldo_le_monto"     CHECK ("saldo" <= "monto_total");
ALTER TABLE "ventas"           ADD CONSTRAINT "ventas_nro_factura_check"  CHECK ("nro_factura" IS NULL OR "es_factura");

ALTER TABLE "venta_items"      ADD CONSTRAINT "venta_items_cantidad_check"          CHECK ("cantidad" > 0);
ALTER TABLE "venta_items"      ADD CONSTRAINT "venta_items_precio_unitario_check"   CHECK ("precio_unitario" >= 0);

ALTER TABLE "ingresos_extra"   ADD CONSTRAINT "ingresos_extra_precio_pieza_check"  CHECK ("precio_pieza" >= 0);
ALTER TABLE "ingresos_extra"   ADD CONSTRAINT "ingresos_extra_precio_cinta_check"  CHECK ("precio_cinta" >= 0);
ALTER TABLE "ingresos_extra"   ADD CONSTRAINT "ingresos_extra_monto_total_check"   CHECK ("monto_total" >= 0);

-- ---------------------------------------------------------------------
-- Vistas (se leen con $queryRaw; no se modelan en Prisma)
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
