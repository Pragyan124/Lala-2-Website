/*
  Warnings:

  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Model` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Status` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `department` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `User` table. All the data in the column will be lost.
  - Added the required column `modified_at` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Asset_serial_num_key";

-- DropIndex
DROP INDEX "Asset_asset_tag_key";

-- DropIndex
DROP INDEX "Category_name_key";

-- DropIndex
DROP INDEX "Status_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Asset";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AuditLog";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Category";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Model";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Status";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Inventory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "asset_tag" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inventory_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inventory_id" INTEGER NOT NULL,
    "asset_tag" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "cpu_serial" TEXT,
    "monitor_serial" TEXT,
    "keyboard_serial" TEXT,
    "mouse_serial" TEXT,
    "location" TEXT,
    "created_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Machine_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "Inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Machine_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Network" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inventory_id" INTEGER NOT NULL,
    "asset_tag" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "ip_address" TEXT,
    "assigned_to" TEXT,
    "created_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Network_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "Inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Network_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Printer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inventory_id" INTEGER NOT NULL,
    "asset_tag" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "assigned_to" TEXT,
    "created_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Printer_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "Inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Printer_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "division" TEXT,
    "dcom" TEXT,
    "created_by" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_by" INTEGER,
    "modified_at" DATETIME NOT NULL,
    CONSTRAINT "User_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_modified_by_fkey" FOREIGN KEY ("modified_by") REFERENCES "User" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("role") SELECT "role" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_asset_tag_key" ON "Inventory"("asset_tag");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_inventory_id_key" ON "Machine"("inventory_id");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_asset_tag_key" ON "Machine"("asset_tag");

-- CreateIndex
CREATE UNIQUE INDEX "Network_inventory_id_key" ON "Network"("inventory_id");

-- CreateIndex
CREATE UNIQUE INDEX "Network_asset_tag_key" ON "Network"("asset_tag");

-- CreateIndex
CREATE UNIQUE INDEX "Printer_inventory_id_key" ON "Printer"("inventory_id");

-- CreateIndex
CREATE UNIQUE INDEX "Printer_asset_tag_key" ON "Printer"("asset_tag");
