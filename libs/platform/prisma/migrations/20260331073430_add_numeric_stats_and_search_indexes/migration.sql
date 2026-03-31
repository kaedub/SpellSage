-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "numeric_power" INTEGER,
ADD COLUMN     "numeric_toughness" INTEGER;

-- CreateIndex
CREATE INDEX "Card_cmc_idx" ON "Card"("cmc");

-- CreateIndex
CREATE INDEX "Card_colors_idx" ON "Card" USING GIN ("colors");

-- CreateIndex
CREATE INDEX "Card_color_identity_idx" ON "Card" USING GIN ("color_identity");

-- CreateIndex
CREATE INDEX "Card_types_idx" ON "Card" USING GIN ("types");

-- CreateIndex
CREATE INDEX "Card_subtypes_idx" ON "Card" USING GIN ("subtypes");

-- CreateIndex
CREATE INDEX "Card_keywords_idx" ON "Card" USING GIN ("keywords");

-- CreateIndex
CREATE INDEX "Card_produced_mana_idx" ON "Card" USING GIN ("produced_mana");
