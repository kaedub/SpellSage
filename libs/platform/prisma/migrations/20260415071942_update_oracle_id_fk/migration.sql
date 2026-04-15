-- CreateIndex
CREATE INDEX "Card_oracle_id_idx" ON "Card"("oracle_id");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_oracle_id_fkey" FOREIGN KEY ("oracle_id") REFERENCES "OracleCard"("oracle_id") ON DELETE RESTRICT ON UPDATE CASCADE;
