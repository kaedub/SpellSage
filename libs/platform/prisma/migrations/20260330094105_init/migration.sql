-- CreateTable
CREATE TABLE "Card" (
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
    "mana_cost" TEXT NOT NULL,
    "cmc" DOUBLE PRECISION NOT NULL,
    "oracle_text" TEXT NOT NULL,
    "layout" TEXT NOT NULL,
    "faces" JSONB,
    "power" TEXT,
    "toughness" TEXT,
    "keywords" TEXT[],
    "produced_mana" TEXT[],
    "game_changer" BOOLEAN NOT NULL,
    "scryfall_uri" TEXT NOT NULL,
    "image_uri" TEXT NOT NULL,
    "raw_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTag" (
    "id" SERIAL NOT NULL,
    "card_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScryfallSyncRun" (
    "id" SERIAL NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "cards_processed" INTEGER NOT NULL,
    "error_message" TEXT,

    CONSTRAINT "ScryfallSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Card_name_idx" ON "Card"("name");

-- CreateIndex
CREATE INDEX "Card_set_idx" ON "Card"("set");

-- CreateIndex
CREATE INDEX "Card_set_id_idx" ON "Card"("set_id");

-- CreateIndex
CREATE INDEX "Card_type_line_idx" ON "Card"("type_line");

-- CreateIndex
CREATE INDEX "Card_is_legendary_idx" ON "Card"("is_legendary");

-- CreateIndex
CREATE INDEX "Card_game_changer_idx" ON "Card"("game_changer");

-- CreateIndex
CREATE INDEX "Collection_user_id_idx" ON "Collection"("user_id");

-- CreateIndex
CREATE INDEX "Collection_card_id_idx" ON "Collection"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_user_id_card_id_key" ON "Collection"("user_id", "card_id");

-- CreateIndex
CREATE INDEX "CardTag_card_id_idx" ON "CardTag"("card_id");

-- CreateIndex
CREATE INDEX "CardTag_tag_idx" ON "CardTag"("tag");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTag" ADD CONSTRAINT "CardTag_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
