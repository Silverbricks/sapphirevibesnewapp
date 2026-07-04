-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "bytes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dominantColor" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "kind" TEXT,
ADD COLUMN     "originalUrl" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT,
ADD COLUMN     "width" INTEGER;

