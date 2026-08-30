-- CreateEnum
CREATE TYPE "Category" AS ENUM ('AUTOS', 'SUPERHEROES', 'ANIME', 'MUSICA', 'SERIESYPELICULAS', 'OBRASDEARTE', 'INFANTILYDIBUJOSANIMADOS', 'CINE');

-- CreateEnum
CREATE TYPE "PosterStatus" AS ENUM ('DISPONIBLE', 'SEPARADO', 'PENDIENTE_PRODUCCION', 'EN_PRODUCCION', 'LISTO_PARA_ENTREGA', 'ENTREGADO', 'DESCONTINUADO');

-- CreateEnum
CREATE TYPE "SizeId" AS ENUM ('MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE', 'PERSONALIZADO');

-- CreateTable
CREATE TABLE "franchises" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "category" "Category",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "franchises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posters" (
    "id" TEXT NOT NULL,
    "legacyId" TEXT,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT,
    "descripcion" TEXT,
    "categoria" "Category" NOT NULL,
    "franchiseId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "thumbUrl" TEXT,
    "precioMinimo" DECIMAL(10,2),
    "precioDisplay" TEXT,
    "estado" "PosterStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "rating" DECIMAL(2,1),
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poster_sizes" (
    "id" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "sizeId" "SizeId" NOT NULL,
    "nombre" TEXT NOT NULL,
    "dimensiones" TEXT NOT NULL,
    "anchoCm" DECIMAL(6,2),
    "altoCm" DECIMAL(6,2),
    "precio" DECIMAL(10,2) NOT NULL,
    "badge" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poster_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "franchises_slug_key" ON "franchises"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "posters_legacyId_key" ON "posters"("legacyId");

-- CreateIndex
CREATE INDEX "posters_categoria_idx" ON "posters"("categoria");

-- CreateIndex
CREATE INDEX "posters_estado_idx" ON "posters"("estado");

-- CreateIndex
CREATE INDEX "posters_isFeatured_idx" ON "posters"("isFeatured");

-- CreateIndex
CREATE INDEX "posters_franchiseId_idx" ON "posters"("franchiseId");

-- CreateIndex
CREATE INDEX "poster_sizes_posterId_idx" ON "poster_sizes"("posterId");

-- CreateIndex
CREATE UNIQUE INDEX "poster_sizes_posterId_sizeId_key" ON "poster_sizes"("posterId", "sizeId");

-- AddForeignKey
ALTER TABLE "posters" ADD CONSTRAINT "posters_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "franchises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poster_sizes" ADD CONSTRAINT "poster_sizes_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "posters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
