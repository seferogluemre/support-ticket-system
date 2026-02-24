-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(7),
    "company_id" INTEGER NOT NULL,
    "company_uuid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_tags" (
    "ticket_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_tags_pkey" PRIMARY KEY ("ticket_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_uuid_key" ON "tags"("uuid");

-- CreateIndex
CREATE INDEX "tags_company_id_idx" ON "tags"("company_id");

-- CreateIndex
CREATE INDEX "tags_deleted_at_idx" ON "tags"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_company_id_key" ON "tags"("name", "company_id");

-- CreateIndex
CREATE INDEX "ticket_tags_ticket_id_idx" ON "ticket_tags"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_tags_tag_id_idx" ON "ticket_tags"("tag_id");

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_tags" ADD CONSTRAINT "ticket_tags_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_tags" ADD CONSTRAINT "ticket_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
