-- =============================================================================
-- Migration: 20260904190000_normalize_categories
-- Deco Vintage Guate — Relational Category Normalization & Referential Integrity (Phase 3)
-- =============================================================================

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT DEFAULT '🏷️',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- 2. Create unique index on name
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");

-- 3. Seed the 12 Canonical Store Categories
INSERT INTO "categories" ("id", "name", "icon", "createdAt", "updatedAt")
VALUES
    ('SUPERHEROES', 'SUPERHÉROES', '⚡', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('INFANTILYDIBUJOSANIMADOS', 'INFANTIL & DIBUJOS ANIMADOS', '🧸', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('BASKETBALL_Y_FORMULA_1', 'BASKETBALL & FÓRMULA 1', '🏎️', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ANIME', 'ANIME & MANGA', '⛩️', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SERIESYPELICULAS', 'SERIES Y PELÍCULAS', '🎬', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('MUSICA', 'MÚSICA & BANDAS', '🎵', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('FUTBOL', 'FÚTBOL', '⚽', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('BEBIDAS_Y_BAR', 'BEBIDAS & BAR', '🍸', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('OBRASDEARTE', 'OBRAS DE ARTE', '🖼️', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('VIDEO_JUEGOS', 'VIDEOJUEGOS', '🎮', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('AUTOS', 'AUTOS & VELOCIDAD', '🚗', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('VINTAGE', 'VINTAGE & RETRO', '🕰️', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE
SET "name" = EXCLUDED."name",
    "icon" = EXCLUDED."icon",
    "updatedAt" = CURRENT_TIMESTAMP;

-- 4. Normalize any legacy aliases in posters before creating foreign key
UPDATE "posters" SET "categoria" = 'VINTAGE' WHERE "categoria" = 'RETRO';

-- 5. Trigger to automatically map legacy 'RETRO' alias to 'VINTAGE' on insert/update
CREATE OR REPLACE FUNCTION normalize_poster_categoria()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.categoria = 'RETRO' THEN
        NEW.categoria := 'VINTAGE';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_poster_categoria ON posters;
CREATE TRIGGER trg_normalize_poster_categoria
BEFORE INSERT OR UPDATE ON posters
FOR EACH ROW
EXECUTE FUNCTION normalize_poster_categoria();

-- 6. Add foreign key constraint posters_categoria_fkey on posters(categoria) -> categories(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'posters_categoria_fkey'
    ) THEN
        ALTER TABLE "posters" ADD CONSTRAINT "posters_categoria_fkey"
        FOREIGN KEY ("categoria") REFERENCES "categories"("id")
        ON UPDATE CASCADE ON DELETE RESTRICT;
    END IF;
END $$;
