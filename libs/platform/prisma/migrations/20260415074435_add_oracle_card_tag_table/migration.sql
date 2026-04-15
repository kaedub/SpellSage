-- CreateTable
CREATE TABLE "OracleCardTag" (
    "id" SERIAL NOT NULL,
    "oracle_card_id" TEXT NOT NULL,
    "tag_slug" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OracleCardTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OracleCardTag_oracle_card_id_idx" ON "OracleCardTag"("oracle_card_id");

-- CreateIndex
CREATE INDEX "OracleCardTag_tag_slug_idx" ON "OracleCardTag"("tag_slug");

-- CreateIndex
CREATE UNIQUE INDEX "OracleCardTag_oracle_card_id_tag_slug_source_key" ON "OracleCardTag"("oracle_card_id", "tag_slug", "source");

-- AddForeignKey
ALTER TABLE "OracleCardTag" ADD CONSTRAINT "OracleCardTag_oracle_card_id_fkey" FOREIGN KEY ("oracle_card_id") REFERENCES "OracleCard"("oracle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OracleCardTag" ADD CONSTRAINT "OracleCardTag_tag_slug_fkey" FOREIGN KEY ("tag_slug") REFERENCES "Tag"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
