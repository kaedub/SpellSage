-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "keywords_ci" TEXT[] DEFAULT ARRAY[]::TEXT[];
