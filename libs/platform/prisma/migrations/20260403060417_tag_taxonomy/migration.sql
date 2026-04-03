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
    "mana_cost" TEXT,
    "cmc" DOUBLE PRECISION,
    "oracle_text" TEXT,
    "layout" TEXT NOT NULL,
    "faces" JSONB,
    "power" TEXT,
    "toughness" TEXT,
    "numeric_power" INTEGER,
    "numeric_toughness" INTEGER,
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
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionCard" (
    "id" SERIAL NOT NULL,
    "collection_id" INTEGER NOT NULL,
    "card_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "foil" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionCard_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "CardTag" (
    "id" SERIAL NOT NULL,
    "card_id" TEXT NOT NULL,
    "tag_slug" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardTag_pkey" PRIMARY KEY ("id")
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
    "mechanic_summary" TEXT NOT NULL,
    "default_tags" TEXT[],
    "tag_notes" TEXT[],
    "example" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "Collection_user_id_name_key" ON "Collection"("user_id", "name");

-- CreateIndex
CREATE INDEX "Collection_user_id_idx" ON "Collection"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionCard_collection_id_card_id_foil_key" ON "CollectionCard"("collection_id", "card_id", "foil");

-- CreateIndex
CREATE INDEX "CollectionCard_collection_id_idx" ON "CollectionCard"("collection_id");

-- CreateIndex
CREATE INDEX "CollectionCard_card_id_idx" ON "CollectionCard"("card_id");

-- CreateIndex
CREATE INDEX "Tag_group_slug_idx" ON "Tag"("group_slug");

-- CreateIndex
CREATE INDEX "CardTag_card_id_idx" ON "CardTag"("card_id");

-- CreateIndex
CREATE INDEX "CardTag_tag_slug_idx" ON "CardTag"("tag_slug");

-- CreateIndex
CREATE UNIQUE INDEX "CardTag_card_id_tag_slug_source_key" ON "CardTag"("card_id", "tag_slug", "source");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_name_key" ON "Keyword"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_slug_key" ON "Keyword"("slug");

-- CreateIndex
CREATE INDEX "Keyword_type_idx" ON "Keyword"("type");

-- AddForeignKey
ALTER TABLE "CollectionCard" ADD CONSTRAINT "CollectionCard_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionCard" ADD CONSTRAINT "CollectionCard_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_group_slug_fkey" FOREIGN KEY ("group_slug") REFERENCES "TagGroup"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTag" ADD CONSTRAINT "CardTag_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTag" ADD CONSTRAINT "CardTag_tag_slug_fkey" FOREIGN KEY ("tag_slug") REFERENCES "Tag"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
