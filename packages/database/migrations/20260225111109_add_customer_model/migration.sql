/*
  Warnings:

  - The primary key for the `ticket_tags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[ticket_id,tag_id]` on the table `ticket_tags` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ticket_tags" DROP CONSTRAINT "ticket_tags_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ticket_tags_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_tags_ticket_id_tag_id_key" ON "ticket_tags"("ticket_id", "tag_id");
