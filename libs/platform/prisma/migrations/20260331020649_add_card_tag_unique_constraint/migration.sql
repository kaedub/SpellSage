-- CreateIndex
CREATE UNIQUE INDEX "CardTag_card_id_tag_source_key" ON "CardTag"("card_id", "tag", "source");
