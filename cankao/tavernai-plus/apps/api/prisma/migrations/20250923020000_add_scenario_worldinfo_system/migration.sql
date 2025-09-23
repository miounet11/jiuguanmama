-- 情景剧本与世界信息系统迁移
-- Issue #20: 数据库架构设计和迁移

-- CreateTable: 情景剧本表
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT NOT NULL DEFAULT '通用',
    "language" TEXT NOT NULL DEFAULT 'zh-CN',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0.0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parent_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Scenario_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Scenario_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Scenario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable: 世界信息条目表
CREATE TABLE "WorldInfoEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenario_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "insert_depth" INTEGER NOT NULL DEFAULT 4,
    "probability" REAL NOT NULL DEFAULT 1.0,
    "match_type" TEXT NOT NULL DEFAULT 'contains',
    "case_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trigger_once" BOOLEAN NOT NULL DEFAULT false,
    "exclude_recursion" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL DEFAULT '通用',
    "group" TEXT,
    "position" TEXT NOT NULL DEFAULT 'before',
    "trigger_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "WorldInfoEntry_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: 角色剧本关联表
CREATE TABLE "CharacterScenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "character_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "custom_settings" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "CharacterScenario_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterScenario_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: 剧本收藏表
CREATE TABLE "ScenarioFavorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScenarioFavorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScenarioFavorite_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: 剧本评分表
CREATE TABLE "ScenarioRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ScenarioRating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScenarioRating_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex: Scenario表索引
CREATE INDEX "Scenario_user_id_idx" ON "Scenario"("user_id");
CREATE INDEX "Scenario_is_public_idx" ON "Scenario"("is_public");
CREATE INDEX "Scenario_is_active_idx" ON "Scenario"("is_active");
CREATE INDEX "Scenario_category_idx" ON "Scenario"("category");
CREATE INDEX "Scenario_rating_idx" ON "Scenario"("rating");
CREATE INDEX "Scenario_view_count_idx" ON "Scenario"("view_count");
CREATE INDEX "Scenario_use_count_idx" ON "Scenario"("use_count");
CREATE INDEX "Scenario_favorite_count_idx" ON "Scenario"("favorite_count");
CREATE INDEX "Scenario_created_at_idx" ON "Scenario"("created_at");
CREATE INDEX "Scenario_parent_id_idx" ON "Scenario"("parent_id");
CREATE INDEX "Scenario_user_id_is_public_idx" ON "Scenario"("user_id", "is_public");
CREATE INDEX "Scenario_category_rating_idx" ON "Scenario"("category", "rating");
CREATE INDEX "Scenario_is_public_rating_idx" ON "Scenario"("is_public", "rating");

-- CreateIndex: WorldInfoEntry表索引
CREATE INDEX "WorldInfoEntry_scenario_id_idx" ON "WorldInfoEntry"("scenario_id");
CREATE INDEX "WorldInfoEntry_priority_idx" ON "WorldInfoEntry"("priority");
CREATE INDEX "WorldInfoEntry_is_active_idx" ON "WorldInfoEntry"("is_active");
CREATE INDEX "WorldInfoEntry_category_idx" ON "WorldInfoEntry"("category");
CREATE INDEX "WorldInfoEntry_match_type_idx" ON "WorldInfoEntry"("match_type");
CREATE INDEX "WorldInfoEntry_trigger_count_idx" ON "WorldInfoEntry"("trigger_count");
CREATE INDEX "WorldInfoEntry_created_at_idx" ON "WorldInfoEntry"("created_at");
CREATE INDEX "WorldInfoEntry_scenario_id_priority_idx" ON "WorldInfoEntry"("scenario_id", "priority");
CREATE INDEX "WorldInfoEntry_scenario_id_is_active_idx" ON "WorldInfoEntry"("scenario_id", "is_active");
CREATE INDEX "WorldInfoEntry_is_active_priority_idx" ON "WorldInfoEntry"("is_active", "priority");

-- CreateIndex: CharacterScenario表索引
CREATE UNIQUE INDEX "CharacterScenario_character_id_scenario_id_key" ON "CharacterScenario"("character_id", "scenario_id");
CREATE INDEX "CharacterScenario_character_id_idx" ON "CharacterScenario"("character_id");
CREATE INDEX "CharacterScenario_scenario_id_idx" ON "CharacterScenario"("scenario_id");
CREATE INDEX "CharacterScenario_is_default_idx" ON "CharacterScenario"("is_default");
CREATE INDEX "CharacterScenario_is_active_idx" ON "CharacterScenario"("is_active");

-- CreateIndex: ScenarioFavorite表索引
CREATE UNIQUE INDEX "ScenarioFavorite_user_id_scenario_id_key" ON "ScenarioFavorite"("user_id", "scenario_id");
CREATE INDEX "ScenarioFavorite_user_id_idx" ON "ScenarioFavorite"("user_id");
CREATE INDEX "ScenarioFavorite_scenario_id_idx" ON "ScenarioFavorite"("scenario_id");

-- CreateIndex: ScenarioRating表索引
CREATE UNIQUE INDEX "ScenarioRating_user_id_scenario_id_key" ON "ScenarioRating"("user_id", "scenario_id");
CREATE INDEX "ScenarioRating_user_id_idx" ON "ScenarioRating"("user_id");
CREATE INDEX "ScenarioRating_scenario_id_idx" ON "ScenarioRating"("scenario_id");
CREATE INDEX "ScenarioRating_rating_idx" ON "ScenarioRating"("rating");

-- 关键词字段的全文索引优化 (SQLite FTS5)
-- 创建虚拟表用于全文搜索
CREATE VIRTUAL TABLE scenario_search USING fts5(
    id UNINDEXED,
    name,
    description,
    content,
    tags,
    category,
    content='Scenario',
    content_rowid='id'
);

-- 触发器：保持搜索索引同步
CREATE TRIGGER scenario_search_insert AFTER INSERT ON Scenario
BEGIN
    INSERT INTO scenario_search(rowid, id, name, description, content, tags, category)
    VALUES (new.rowid, new.id, new.name, new.description, new.content, new.tags, new.category);
END;

CREATE TRIGGER scenario_search_delete AFTER DELETE ON Scenario
BEGIN
    INSERT INTO scenario_search(scenario_search, rowid, id, name, description, content, tags, category)
    VALUES('delete', old.rowid, old.id, old.name, old.description, old.content, old.tags, old.category);
END;

CREATE TRIGGER scenario_search_update AFTER UPDATE ON Scenario
BEGIN
    INSERT INTO scenario_search(scenario_search, rowid, id, name, description, content, tags, category)
    VALUES('delete', old.rowid, old.id, old.name, old.description, old.content, old.tags, old.category);
    INSERT INTO scenario_search(rowid, id, name, description, content, tags, category)
    VALUES (new.rowid, new.id, new.name, new.description, new.content, new.tags, new.category);
END;

-- 世界信息条目全文搜索
CREATE VIRTUAL TABLE worldinfo_search USING fts5(
    id UNINDEXED,
    title,
    content,
    keywords,
    category,
    content='WorldInfoEntry',
    content_rowid='id'
);

-- 世界信息条目搜索触发器
CREATE TRIGGER worldinfo_search_insert AFTER INSERT ON WorldInfoEntry
BEGIN
    INSERT INTO worldinfo_search(rowid, id, title, content, keywords, category)
    VALUES (new.rowid, new.id, new.title, new.content, new.keywords, new.category);
END;

CREATE TRIGGER worldinfo_search_delete AFTER DELETE ON WorldInfoEntry
BEGIN
    INSERT INTO worldinfo_search(worldinfo_search, rowid, id, title, content, keywords, category)
    VALUES('delete', old.rowid, old.id, old.title, old.content, old.keywords, old.category);
END;

CREATE TRIGGER worldinfo_search_update AFTER UPDATE ON WorldInfoEntry
BEGIN
    INSERT INTO worldinfo_search(worldinfo_search, rowid, id, title, content, keywords, category)
    VALUES('delete', old.rowid, old.id, old.title, old.content, old.keywords, old.category);
    INSERT INTO worldinfo_search(rowid, id, title, content, keywords, category)
    VALUES (new.rowid, new.id, new.title, new.content, new.keywords, new.category);
END;