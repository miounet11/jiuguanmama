-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "characterId" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "characterId", "comment_count", "content", "created_at", "id", "images", "isPublic", "like_count", "share_count", "updated_at") SELECT "authorId", "characterId", "comment_count", "content", "created_at", "id", "images", "isPublic", "like_count", "share_count", "updated_at" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_characterId_idx" ON "Post"("characterId");
CREATE INDEX "Post_created_at_idx" ON "Post"("created_at");
CREATE INDEX "Post_isPublic_idx" ON "Post"("isPublic");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
