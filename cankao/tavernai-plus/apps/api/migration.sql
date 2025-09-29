-- DropIndex
DROP INDEX "Extension_category_idx";

-- DropIndex
DROP INDEX "Extension_status_idx";

-- DropIndex
DROP INDEX "Extension_rating_idx";

-- DropIndex
DROP INDEX "Extension_author_id_idx";

-- DropIndex
DROP INDEX "ExtensionInstallation_user_id_idx";

-- DropIndex
DROP INDEX "ExtensionInstallation_status_idx";

-- DropIndex
DROP INDEX "ExtensionInstallation_user_id_extension_id_key";

-- DropIndex
DROP INDEX "ExtensionReview_extension_id_idx";

-- DropIndex
DROP INDEX "ExtensionReview_rating_idx";

-- DropIndex
DROP INDEX "ExtensionReview_user_id_extension_id_key";

-- DropIndex
DROP INDEX "StreamingSession_user_id_idx";

-- DropIndex
DROP INDEX "StreamingSession_status_idx";

-- DropIndex
DROP INDEX "StreamingSession_last_activity_idx";

-- DropIndex
DROP INDEX "StreamingMessage_session_id_idx";

-- DropIndex
DROP INDEX "StreamingMessage_session_id_sequence_number_idx";

-- DropIndex
DROP INDEX "StreamingMessage_status_idx";

-- DropIndex
DROP INDEX "CacheItem_cache_key_key";

-- DropIndex
DROP INDEX "CacheItem_cache_type_idx";

-- DropIndex
DROP INDEX "CacheItem_expires_at_idx";

-- DropIndex
DROP INDEX "CacheItem_entity_type_entity_id_idx";

-- DropIndex
DROP INDEX "CacheItem_last_accessed_idx";

-- DropIndex
DROP INDEX "CacheStatistics_date_idx";

-- DropIndex
DROP INDEX "CacheStatistics_cache_type_idx";

-- DropIndex
DROP INDEX "CacheStatistics_date_cache_type_key";

-- DropIndex
DROP INDEX "AdvancedConfig_user_id_idx";

-- DropIndex
DROP INDEX "AdvancedConfig_config_type_idx";

-- DropIndex
DROP INDEX "AdvancedConfig_is_public_idx";

-- DropIndex
DROP INDEX "ConfigTemplate_config_type_idx";

-- DropIndex
DROP INDEX "ConfigTemplate_is_official_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Extension";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ExtensionInstallation";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ExtensionReview";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StreamingSession";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StreamingMessage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CacheItem";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CacheStatistics";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AdvancedConfig";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ConfigTemplate";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fullDescription" TEXT,
    "personality" TEXT,
    "backstory" TEXT,
    "speakingStyle" TEXT,
    "scenario" TEXT,
    "firstMessage" TEXT,
    "systemPrompt" TEXT,
    "exampleDialogs" TEXT,
    "avatar" TEXT,
    "coverImage" TEXT,
    "category" TEXT NOT NULL DEFAULT '原创',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "language" TEXT NOT NULL DEFAULT 'zh-CN',
    "model" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "temperature_value" REAL NOT NULL DEFAULT 0.7,
    "max_tokens" INTEGER NOT NULL DEFAULT 1000,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_nsfw" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "rating" REAL NOT NULL DEFAULT 0.0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "chat_count" INTEGER NOT NULL DEFAULT 0,
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "importedFrom" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "backgroundImage" TEXT,
    "mbtiType" TEXT,
    "emotionPack" TEXT,
    "avatarStatus" TEXT DEFAULT 'PENDING',
    "backgroundStatus" TEXT DEFAULT 'PENDING',
    "emotionStatus" TEXT DEFAULT 'PENDING',
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("avatar", "avatarStatus", "backgroundImage", "backgroundStatus", "backstory", "category", "chat_count", "coverImage", "created_at", "description", "emotionPack", "emotionStatus", "exampleDialogs", "favorite_count", "firstMessage", "fullDescription", "id", "importedFrom", "isDeleted", "is_featured", "is_nsfw", "is_public", "language", "max_tokens", "mbtiType", "metadata", "model", "name", "personality", "rating", "rating_count", "scenario", "speakingStyle", "systemPrompt", "tags", "temperature_value", "updated_at", "userId", "version") SELECT "avatar", "avatarStatus", "backgroundImage", "backgroundStatus", "backstory", "category", "chat_count", "coverImage", "created_at", "description", "emotionPack", "emotionStatus", "exampleDialogs", "favorite_count", "firstMessage", "fullDescription", "id", "importedFrom", "isDeleted", "is_featured", "is_nsfw", "is_public", "language", "max_tokens", "mbtiType", "metadata", "model", "name", "personality", "rating", "rating_count", "scenario", "speakingStyle", "systemPrompt", "tags", "temperature_value", "updated_at", "userId", "version" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE UNIQUE INDEX "Character_name_userId_key" ON "Character"("name" ASC, "userId" ASC);
CREATE INDEX "Character_userId_is_public_idx" ON "Character"("userId" ASC, "is_public" ASC);
CREATE INDEX "Character_category_rating_idx" ON "Character"("category" ASC, "rating" ASC);
CREATE INDEX "Character_is_public_rating_idx" ON "Character"("is_public" ASC, "rating" ASC);
CREATE INDEX "Character_is_public_is_featured_idx" ON "Character"("is_public" ASC, "is_featured" ASC);
CREATE INDEX "Character_favorite_count_idx" ON "Character"("favorite_count" ASC);
CREATE INDEX "Character_chat_count_idx" ON "Character"("chat_count" ASC);
CREATE INDEX "Character_created_at_idx" ON "Character"("created_at" ASC);
CREATE INDEX "Character_is_featured_idx" ON "Character"("is_featured" ASC);
CREATE INDEX "Character_category_idx" ON "Character"("category" ASC);
CREATE INDEX "Character_rating_idx" ON "Character"("rating" ASC);
CREATE INDEX "Character_is_public_idx" ON "Character"("is_public" ASC);
CREATE INDEX "Character_userId_idx" ON "Character"("userId" ASC);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

