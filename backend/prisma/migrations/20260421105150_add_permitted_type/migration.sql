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
    "permitted_type" TEXT NOT NULL DEFAULT 'ALL',
    "created_by" INTEGER,
    "created_by_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_by" INTEGER,
    "modified_by_name" TEXT,
    "modified_at" DATETIME NOT NULL,
    CONSTRAINT "User_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_modified_by_fkey" FOREIGN KEY ("modified_by") REFERENCES "User" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("created_at", "created_by", "created_by_name", "dcom", "division", "modified_at", "modified_by", "modified_by_name", "password", "role", "user_id", "username") SELECT "created_at", "created_by", "created_by_name", "dcom", "division", "modified_at", "modified_by", "modified_by_name", "password", "role", "user_id", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
