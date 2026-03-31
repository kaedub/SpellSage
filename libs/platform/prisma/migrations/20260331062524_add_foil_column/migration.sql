/*
  Warnings:

  - A unique constraint covering the columns `[user_id,card_id,foil]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Collection_user_id_card_id_key";

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "foil" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_user_id_card_id_foil_key" ON "Collection"("user_id", "card_id", "foil");
