-- CreateTable
CREATE TABLE "OracleCard" (
    "id" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "set" TEXT NOT NULL,
    "set_id" TEXT NOT NULL,
    "collector_num" TEXT NOT NULL,
    "type_line" TEXT NOT NULL,
    "supertypes" TEXT[],
    "types" TEXT[],
    "subtypes" TEXT[],
    "rarity" TEXT,
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
    "price" TEXT,
    "numeric_power" INTEGER,
    "numeric_toughness" INTEGER,
    "keywords_ci" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[],
    "produced_mana" TEXT[],
    "game_changer" BOOLEAN NOT NULL,
    "scryfall_uri" TEXT NOT NULL,
    "image_uri" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OracleCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardPrinting" (
    "id" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
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
    "rarity" TEXT,
    "price" TEXT,
    "numeric_power" INTEGER,
    "numeric_toughness" INTEGER,
    "keywords_ci" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[],
    "produced_mana" TEXT[],
    "game_changer" BOOLEAN NOT NULL,
    "scryfall_uri" TEXT NOT NULL,
    "image_uri" TEXT NOT NULL,
    "raw_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardPrinting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionCardPrinting" (
    "id" SERIAL NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "card_id" TEXT NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "foil" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionCardPrinting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagGroup" (
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagGroup_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Tag" (
    "slug" TEXT NOT NULL,
    "group_slug" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "must_have" TEXT[],
    "must_not_have" TEXT[],
    "edge_rule" TEXT,
    "priority" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "OracleCardTag" (
    "id" SERIAL NOT NULL,
    "oracle_id" TEXT NOT NULL,
    "tag_slug" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OracleCardTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleCardTaggingCompletion" (
    "oracle_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleCardTaggingCompletion_pkey" PRIMARY KEY ("oracle_id","source")
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rules_text_template" TEXT NOT NULL,
    "parameterized" BOOLEAN NOT NULL,
    "parameter_name" TEXT,
    "mechanic_summary" TEXT,
    "default_tags" TEXT[],
    "tag_notes" TEXT[],
    "example" TEXT,
    "set_scope" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "OracleCard_oracle_id_key" ON "OracleCard"("oracle_id");

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
CREATE INDEX "OracleCard_rarity_idx" ON "OracleCard"("rarity");

-- CreateIndex
CREATE INDEX "OracleCard_price_idx" ON "OracleCard"("price");

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
CREATE INDEX "CardPrinting_name_idx" ON "CardPrinting"("name");

-- CreateIndex
CREATE INDEX "CardPrinting_set_idx" ON "CardPrinting"("set");

-- CreateIndex
CREATE INDEX "CardPrinting_set_id_idx" ON "CardPrinting"("set_id");

-- CreateIndex
CREATE INDEX "CardPrinting_type_line_idx" ON "CardPrinting"("type_line");

-- CreateIndex
CREATE INDEX "CardPrinting_is_legendary_idx" ON "CardPrinting"("is_legendary");

-- CreateIndex
CREATE INDEX "CardPrinting_game_changer_idx" ON "CardPrinting"("game_changer");

-- CreateIndex
CREATE INDEX "CardPrinting_cmc_idx" ON "CardPrinting"("cmc");

-- CreateIndex
CREATE INDEX "CardPrinting_oracle_id_idx" ON "CardPrinting"("oracle_id");

-- CreateIndex
CREATE INDEX "CardPrinting_rarity_idx" ON "CardPrinting"("rarity");

-- CreateIndex
CREATE INDEX "CardPrinting_price_idx" ON "CardPrinting"("price");

-- CreateIndex
CREATE INDEX "CardPrinting_colors_idx" ON "CardPrinting" USING GIN ("colors");

-- CreateIndex
CREATE INDEX "CardPrinting_color_identity_idx" ON "CardPrinting" USING GIN ("color_identity");

-- CreateIndex
CREATE INDEX "CardPrinting_types_idx" ON "CardPrinting" USING GIN ("types");

-- CreateIndex
CREATE INDEX "CardPrinting_subtypes_idx" ON "CardPrinting" USING GIN ("subtypes");

-- CreateIndex
CREATE INDEX "CardPrinting_keywords_idx" ON "CardPrinting" USING GIN ("keywords");

-- CreateIndex
CREATE INDEX "CardPrinting_produced_mana_idx" ON "CardPrinting" USING GIN ("produced_mana");

-- CreateIndex
CREATE INDEX "Collection_user_id_idx" ON "Collection"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_user_id_name_key" ON "Collection"("user_id", "name");

-- CreateIndex
CREATE INDEX "CollectionCardPrinting_collection_id_idx" ON "CollectionCardPrinting"("collection_id");

-- CreateIndex
CREATE INDEX "CollectionCardPrinting_card_id_idx" ON "CollectionCardPrinting"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionCardPrinting_collection_id_card_id_foil_key" ON "CollectionCardPrinting"("collection_id", "card_id", "foil");

-- CreateIndex
CREATE INDEX "Tag_group_slug_idx" ON "Tag"("group_slug");

-- CreateIndex
CREATE INDEX "OracleCardTag_oracle_id_idx" ON "OracleCardTag"("oracle_id");

-- CreateIndex
CREATE INDEX "OracleCardTag_tag_slug_idx" ON "OracleCardTag"("tag_slug");

-- CreateIndex
CREATE UNIQUE INDEX "OracleCardTag_oracle_id_tag_slug_source_key" ON "OracleCardTag"("oracle_id", "tag_slug", "source");

-- CreateIndex
CREATE INDEX "OracleCardTaggingCompletion_source_idx" ON "OracleCardTaggingCompletion"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_name_key" ON "Keyword"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_slug_key" ON "Keyword"("slug");

-- CreateIndex
CREATE INDEX "Keyword_type_idx" ON "Keyword"("type");

-- AddForeignKey
ALTER TABLE "CardPrinting" ADD CONSTRAINT "CardPrinting_oracle_id_fkey" FOREIGN KEY ("oracle_id") REFERENCES "OracleCard"("oracle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionCardPrinting" ADD CONSTRAINT "CollectionCardPrinting_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionCardPrinting" ADD CONSTRAINT "CollectionCardPrinting_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "CardPrinting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionCardPrinting" ADD CONSTRAINT "CollectionCardPrinting_oracle_id_fkey" FOREIGN KEY ("oracle_id") REFERENCES "OracleCard"("oracle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_group_slug_fkey" FOREIGN KEY ("group_slug") REFERENCES "TagGroup"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OracleCardTag" ADD CONSTRAINT "OracleCardTag_oracle_id_fkey" FOREIGN KEY ("oracle_id") REFERENCES "OracleCard"("oracle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OracleCardTag" ADD CONSTRAINT "OracleCardTag_tag_slug_fkey" FOREIGN KEY ("tag_slug") REFERENCES "Tag"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OracleCardTaggingCompletion" ADD CONSTRAINT "OracleCardTaggingCompletion_oracle_id_fkey" FOREIGN KEY ("oracle_id") REFERENCES "OracleCard"("oracle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
