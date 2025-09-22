-- Migration: Add WorldInfo tables for dynamic world injection
-- Generated for Issue #15: 动态世界观注入

-- WorldInfo Books table
CREATE TABLE IF NOT EXISTS "WorldInfoBook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creatorId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "characterIds" TEXT NOT NULL DEFAULT "[]", -- JSON array of character IDs
    "settings" TEXT NOT NULL DEFAULT "{}", -- JSON settings
    "metadata" TEXT NOT NULL DEFAULT "{}",
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- WorldInfo Entries table
CREATE TABLE IF NOT EXISTS "WorldInfoEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT "[]", -- JSON array
    "secondaryKeywords" TEXT DEFAULT "[]", -- JSON array
    "keywordFilter" TEXT NOT NULL DEFAULT "OR", -- "AND", "OR", "NOT"
    "priority" INTEGER NOT NULL DEFAULT 100,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "probability" INTEGER NOT NULL DEFAULT 100, -- 0-100%
    "insertionPosition" TEXT NOT NULL DEFAULT "before", -- "before", "after", "top", "bottom"
    "insertionDepth" INTEGER NOT NULL DEFAULT 3,
    "contextLength" INTEGER NOT NULL DEFAULT 500,
    "preventRecursion" BOOLEAN NOT NULL DEFAULT true,
    "selectiveLogic" TEXT DEFAULT "",
    "constant" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL DEFAULT "general", -- "location", "character", "item", "lore", "custom"
    "comment" TEXT,
    "embedding" TEXT, -- JSON vector for semantic search
    "relevanceScore" REAL DEFAULT 0.0,
    "activationCount" INTEGER NOT NULL DEFAULT 0,
    "lastActivated" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("bookId") REFERENCES "WorldInfoBook" ("id") ON DELETE CASCADE
);

-- WorldInfo Activation Logs table
CREATE TABLE IF NOT EXISTS "WorldInfoActivation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "characterId" TEXT,
    "roomId" TEXT,
    "triggeredBy" TEXT NOT NULL, -- "keyword", "semantic", "context", "manual"
    "keywords" TEXT DEFAULT "[]", -- triggered keywords
    "relevanceScore" REAL DEFAULT 0.0,
    "contextText" TEXT,
    "injectionPosition" TEXT NOT NULL,
    "isSuccessful" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT DEFAULT "{}",
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("entryId") REFERENCES "WorldInfoEntry" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL,
    FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE SET NULL
);

-- User WorldInfo Preferences table
CREATE TABLE IF NOT EXISTS "UserWorldInfoPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bookId" TEXT,
    "entryId" TEXT,
    "preference" TEXT NOT NULL, -- "like", "dislike", "hide", "prioritize"
    "weight" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("bookId") REFERENCES "WorldInfoBook" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("entryId") REFERENCES "WorldInfoEntry" ("id") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_worldinfo_book_creator" ON "WorldInfoBook" ("creatorId");
CREATE INDEX IF NOT EXISTS "idx_worldinfo_book_public" ON "WorldInfoBook" ("isPublic");
CREATE INDEX IF NOT EXISTS "idx_worldinfo_book_global" ON "WorldInfoBook" ("isGlobal");

CREATE INDEX IF NOT EXISTS "idx_worldinfo_entry_book" ON "WorldInfoEntry" ("bookId");
CREATE INDEX IF NOT EXISTS "idx_worldinfo_entry_enabled" ON "WorldInfoEntry" ("isEnabled");
CREATE INDEX IF NOT EXISTS "idx_worldinfo_entry_priority" ON "WorldInfoEntry" ("priority");
CREATE INDEX IF NOT EXISTS "idx_worldinfo_entry_category" ON "WorldInfoEntry" ("category");
CREATE INDEX IF NOT EXISTS "idx_worldinfo_entry_relevance" ON "WorldInfoEntry" ("relevanceScore");

CREATE INDEX IF NOT EXISTS "idx_worldinfo_activation_entry" ON "WorldInfoActivation" ("entryId");
CREATE INDEX IF NOT EXISTS "idx_worldinfo_activation_session" ON "WorldInfoActivation" ("sessionId");
CREATE INDEX IF NOT EXISTS "idx_worldinfo_activation_user" ON "WorldInfoActivation" ("userId");
CREATE INDEX IF NOT EXISTS "idx_worldinfo_activation_trigger" ON "WorldInfoActivation" ("triggeredBy");
CREATE INDEX IF NOT EXISTS "idx_worldinfo_activation_date" ON "WorldInfoActivation" ("createdAt");

CREATE INDEX IF NOT EXISTS "idx_user_worldinfo_pref_user" ON "UserWorldInfoPreference" ("userId");
CREATE INDEX IF NOT EXISTS "idx_user_worldinfo_pref_book" ON "UserWorldInfoPreference" ("bookId");
CREATE INDEX IF NOT EXISTS "idx_user_worldinfo_pref_entry" ON "UserWorldInfoPreference" ("entryId");