/*
  Warnings:

  - A unique constraint covering the columns `[oracle_id]` on the table `OracleCard` will be added. If there are existing duplicate values, this will fail.
  - Made the column `oracle_id` on table `Card` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `oracle_id` to the `OracleCard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Card" ALTER COLUMN "oracle_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "OracleCard" ADD COLUMN     "oracle_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OracleCard_oracle_id_key" ON "OracleCard"("oracle_id");
