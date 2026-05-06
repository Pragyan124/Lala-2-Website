-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN "created_by_name" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "created_by_name" TEXT;
ALTER TABLE "User" ADD COLUMN "modified_by_name" TEXT;
