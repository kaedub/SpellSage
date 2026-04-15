-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "oracle_id" TEXT;

-- CreateTable
CREATE TABLE "OracleCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "set" TEXT NOT NULL,
    "set_id" TEXT NOT NULL,
    "collector_num" TEXT NOT NULL,
    "type_line" TEXT NOT NULL,
    "supertypes" TEXT[],
    "types" TEXT[],
    "subtypes" TEXT[],
    "is_legendary" BOOLEAN NOT NULL,
    "colors" TEXT[],
    "color_identity" TEXT[],
    "mana_cost" TEXT,
    "cmc" DOUBLE PRECISION,
    "oracle_text" TEXT,
    "layout" TEXT NOT NULL,
    "faces" JSONB,
    "power" TEXT,
    "toughness" TEXT,
    "numeric_power" INTEGER,
    "numeric_toughness" INTEGER,
    "keywords_ci" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[],
    "produced_mana" TEXT[],
    "game_changer" BOOLEAN NOT NULL,
    "scryfall_uri" TEXT NOT NULL,
    "image_uri" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OracleCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OracleCard_name_idx" ON "OracleCard"("name");

-- CreateIndex
CREATE INDEX "OracleCard_set_idx" ON "OracleCard"("set");

-- CreateIndex
CREATE INDEX "OracleCard_set_id_idx" ON "OracleCard"("set_id");

-- CreateIndex
CREATE INDEX "OracleCard_type_line_idx" ON "OracleCard"("type_line");

-- CreateIndex
CREATE INDEX "OracleCard_is_legendary_idx" ON "OracleCard"("is_legendary");

-- CreateIndex
CREATE INDEX "OracleCard_game_changer_idx" ON "OracleCard"("game_changer");

-- CreateIndex
CREATE INDEX "OracleCard_cmc_idx" ON "OracleCard"("cmc");

-- CreateIndex
CREATE INDEX "OracleCard_colors_idx" ON "OracleCard" USING GIN ("colors");

-- CreateIndex
CREATE INDEX "OracleCard_color_identity_idx" ON "OracleCard" USING GIN ("color_identity");

-- CreateIndex
CREATE INDEX "OracleCard_types_idx" ON "OracleCard" USING GIN ("types");

-- CreateIndex
CREATE INDEX "OracleCard_subtypes_idx" ON "OracleCard" USING GIN ("subtypes");

-- CreateIndex
CREATE INDEX "OracleCard_supertypes_idx" ON "OracleCard" USING GIN ("supertypes");

-- CreateIndex
CREATE INDEX "OracleCard_keywords_idx" ON "OracleCard" USING GIN ("keywords");

-- CreateIndex
CREATE INDEX "OracleCard_produced_mana_idx" ON "OracleCard" USING GIN ("produced_mana");

-- CreateIndex
CREATE INDEX "OracleCard_rarity_idx" ON "OracleCard"("rarity");
