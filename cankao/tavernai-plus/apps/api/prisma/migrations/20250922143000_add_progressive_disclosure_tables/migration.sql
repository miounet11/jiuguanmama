-- CreateTable
CREATE TABLE "UserMode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "current_mode" TEXT NOT NULL DEFAULT 'simplified',
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "messages_count" INTEGER NOT NULL DEFAULT 0,
    "characters_used" INTEGER NOT NULL DEFAULT 0,
    "skill_level" TEXT NOT NULL DEFAULT 'beginner',
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "UserMode_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureUsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "feature_id" TEXT NOT NULL,
    "is_expert_feature" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 1,
    "first_used_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeatureUsageLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureUnlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "feature_id" TEXT NOT NULL,
    "unlock_trigger" TEXT NOT NULL,
    "unlock_condition" TEXT,
    "unlocked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeatureUnlock_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateTable
CREATE TABLE "ModeTransition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "from_mode" TEXT NOT NULL,
    "to_mode" TEXT NOT NULL,
    "reason" TEXT,
    "user_initiated" BOOLEAN NOT NULL DEFAULT true,
    "transitioned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModeTransition_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMode_user_id_key" ON "UserMode"("user_id");

-- CreateIndex
CREATE INDEX "UserMode_user_id_idx" ON "UserMode"("user_id");

-- CreateIndex
CREATE INDEX "UserMode_current_mode_idx" ON "UserMode"("current_mode");

-- CreateIndex
CREATE INDEX "UserMode_skill_level_idx" ON "UserMode"("skill_level");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureUsageLog_user_id_feature_id_key" ON "FeatureUsageLog"("user_id", "feature_id");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_user_id_idx" ON "FeatureUsageLog"("user_id");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_feature_id_idx" ON "FeatureUsageLog"("feature_id");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_last_used_at_idx" ON "FeatureUsageLog"("last_used_at");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_is_expert_feature_idx" ON "FeatureUsageLog"("is_expert_feature");

-- CreateIndex
CREATE INDEX "FeatureUnlock_user_id_idx" ON "FeatureUnlock"("user_id");

-- CreateIndex
CREATE INDEX "FeatureUnlock_feature_id_idx" ON "FeatureUnlock"("feature_id");

-- CreateIndex
CREATE INDEX "FeatureUnlock_unlocked_at_idx" ON "FeatureUnlock"("unlocked_at");

-- CreateIndex
CREATE INDEX "FeatureUnlock_unlock_trigger_idx" ON "FeatureUnlock"("unlock_trigger");

-- CreateIndex
CREATE INDEX "ModeTransition_user_id_idx" ON "ModeTransition"("user_id");

-- CreateIndex
CREATE INDEX "ModeTransition_transitioned_at_idx" ON "ModeTransition"("transitioned_at");

-- CreateIndex
CREATE INDEX "ModeTransition_to_mode_idx" ON "ModeTransition"("to_mode");