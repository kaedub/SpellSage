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

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_name_key" ON "Keyword"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_slug_key" ON "Keyword"("slug");

-- CreateIndex
CREATE INDEX "Keyword_type_idx" ON "Keyword"("type");
