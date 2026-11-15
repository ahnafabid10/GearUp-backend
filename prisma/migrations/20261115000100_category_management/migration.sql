BEGIN;
ALTER TABLE "categories" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
-- Prevent deleting gear (and its rental history) through a category deletion.
ALTER TABLE "gear_items" DROP CONSTRAINT "gear_items_categoryId_fkey";
ALTER TABLE "gear_items" ADD CONSTRAINT "gear_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "categories_name_case_insensitive" ON "categories" (lower(trim("name")));
CREATE TYPE "CategorySuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TABLE "category_suggestions" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "status" "CategorySuggestionStatus" NOT NULL DEFAULT 'PENDING',
  "reviewNote" TEXT,
  "providerId" TEXT NOT NULL,
  "categoryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "category_suggestions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "category_suggestions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "category_suggestions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "category_suggestions_providerId_createdAt_idx" ON "category_suggestions"("providerId", "createdAt");
CREATE UNIQUE INDEX "category_suggestions_pending_slug" ON "category_suggestions"("slug") WHERE "status" = 'PENDING';
COMMIT;

