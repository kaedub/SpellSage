-- CreateTable
CREATE TABLE "CardTaggingCompletion" (
    "card_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardTaggingCompletion_pkey" PRIMARY KEY ("card_id","source")
);

-- CreateIndex
CREATE INDEX "CardTaggingCompletion_source_idx" ON "CardTaggingCompletion"("source");

-- AddForeignKey
ALTER TABLE "CardTaggingCompletion" ADD CONSTRAINT "CardTaggingCompletion_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
