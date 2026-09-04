-- =============================================================================
-- Migration: 20260904183000_reconcile_schema
-- Deco Vintage Guate — Schema Reconciliation & pg_trgm Acceleration (Phase 2)
-- =============================================================================

-- 1. Accelerate Search with pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Relax enum columns to text to match schema.prisma and eliminate enum restrictions
ALTER TABLE "franchises" ALTER COLUMN "category" TYPE TEXT;
ALTER TABLE "posters" ALTER COLUMN "categoria" TYPE TEXT;
ALTER TABLE "poster_sizes" ALTER COLUMN "sizeId" TYPE TEXT;

-- 3. Add embedding column to posters table if not present (preserve existing data)
ALTER TABLE "posters" ADD COLUMN IF NOT EXISTS "embedding" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[];

-- 4. Create missing indexes on posters table
CREATE INDEX IF NOT EXISTS "posters_createdAt_idx" ON "posters"("createdAt");
CREATE INDEX IF NOT EXISTS "posters_precioMinimo_idx" ON "posters"("precioMinimo");
CREATE INDEX IF NOT EXISTS "posters_isPublished_estado_categoria_createdAt_idx" ON "posters"("isPublished", "estado", "categoria", "createdAt");
CREATE INDEX IF NOT EXISTS "posters_isPublished_estado_createdAt_idx" ON "posters"("isPublished", "estado", "createdAt");

-- 5. Create GIN Trigram Indexes on posters for text search acceleration (R6)
CREATE INDEX IF NOT EXISTS "idx_posters_titulo_trgm" ON "posters" USING gin ("titulo" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_posters_subtitulo_trgm" ON "posters" USING gin ("subtitulo" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_posters_descripcion_trgm" ON "posters" USING gin ("descripcion" gin_trgm_ops);

-- 6. Create store_settings table if not exists (R2)
CREATE TABLE IF NOT EXISTS "store_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "whatsappPhone" TEXT NOT NULL DEFAULT '50238375078',
    "storeName" TEXT NOT NULL DEFAULT 'Deco Vintage Guate',
    "deliveryMinDays" INTEGER NOT NULL DEFAULT 2,
    "deliveryMaxDays" INTEGER NOT NULL DEFAULT 4,
    "customCm2Price" DECIMAL(6,4) NOT NULL DEFAULT 0.048,
    "categories" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- 7. Create jarvis_memory table if not exists (R2)
CREATE TABLE IF NOT EXISTS "jarvis_memory" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "apiKey" TEXT,
    "systemPrompt" TEXT,
    "initialGreeting" TEXT,
    "quickPrompts" JSONB NOT NULL DEFAULT '[]',
    "referenceImages" JSONB NOT NULL DEFAULT '[]',
    "company" JSONB,
    "ownerDirectives" JSONB NOT NULL DEFAULT '[]',
    "customDocuments" JSONB NOT NULL DEFAULT '[]',
    "faqEntries" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jarvis_memory_pkey" PRIMARY KEY ("id")
);

-- 8. Create custom_orders table if not exists (R2)
CREATE TABLE IF NOT EXISTS "custom_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "totalUnits" INTEGER NOT NULL DEFAULT 1,
    "items" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "customerPhone" TEXT,
    "customerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "custom_orders_orderNumber_key" ON "custom_orders"("orderNumber");
CREATE INDEX IF NOT EXISTS "custom_orders_status_idx" ON "custom_orders"("status");
CREATE INDEX IF NOT EXISTS "custom_orders_createdAt_idx" ON "custom_orders"("createdAt");
