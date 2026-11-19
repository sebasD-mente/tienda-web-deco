-- =============================================================================
-- Migration: 20261118203500_add_web_order_integration_fields
-- Deco Vintage Guate — Web Orders S2S Integration & Customer Metadata (feat-003)
-- 100% Additive & Idempotent (Safe for entrypoint.sh under set -e)
-- =============================================================================

ALTER TABLE "custom_orders" ADD COLUMN IF NOT EXISTS "orderSource" TEXT NOT NULL DEFAULT 'WEB_CUSTOM';
ALTER TABLE "custom_orders" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE "custom_orders" ADD COLUMN IF NOT EXISTS "customerAddress" TEXT;
ALTER TABLE "custom_orders" ADD COLUMN IF NOT EXISTS "customerDepartment" TEXT;
ALTER TABLE "custom_orders" ADD COLUMN IF NOT EXISTS "externalSaleNumber" TEXT;
ALTER TABLE "custom_orders" ADD COLUMN IF NOT EXISTS "importedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "custom_orders_status_idx" ON "custom_orders"("status");
CREATE INDEX IF NOT EXISTS "custom_orders_orderSource_idx" ON "custom_orders"("orderSource");
CREATE INDEX IF NOT EXISTS "custom_orders_createdAt_idx" ON "custom_orders"("createdAt");
