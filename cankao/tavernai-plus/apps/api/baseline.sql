-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 100,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "subscription_expires_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "reset_password_token" TEXT,
    "reset_password_expires" DATETIME,
    "last_login_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Character" (
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
    "avatarStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "backgroundStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "emotionStatus" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "title" TEXT,
    "model" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "presetId" TEXT,
    "worldInfoId" TEXT,
    "lastMessageAt" DATETIME,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatSession_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "externalId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" TEXT DEFAULT '{}',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "characterId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterFavorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterFavorite_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CharacterRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterRating_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "characterId" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'public',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduledTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "payload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "last_run" DATETIME,
    "next_run" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ScheduledTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    "models" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "rateLimit" INTEGER NOT NULL DEFAULT 60,
    "costFactor" REAL NOT NULL DEFAULT 1.0,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MediaFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "metadata" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "MediaFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0.0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoiceProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "speed" REAL NOT NULL DEFAULT 1.0,
    "pitch" REAL NOT NULL DEFAULT 0.0,
    "volume" REAL NOT NULL DEFAULT 1.0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "VoiceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImageGeneration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "model" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 512,
    "height" INTEGER NOT NULL DEFAULT 512,
    "steps" INTEGER NOT NULL DEFAULT 20,
    "scale" REAL NOT NULL DEFAULT 7.5,
    "seed" INTEGER,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "cost" REAL NOT NULL DEFAULT 0.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImageGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBehavior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" TEXT,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBehavior_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "interests" TEXT NOT NULL DEFAULT '[]',
    "chatFrequency" REAL NOT NULL DEFAULT 0.0,
    "avgSessionTime" INTEGER NOT NULL DEFAULT 0,
    "favoriteGenres" TEXT NOT NULL DEFAULT '[]',
    "last_active_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecommendationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "position" INTEGER NOT NULL,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "interacted" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecommendationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSimilarity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId1" TEXT NOT NULL,
    "userId2" TEXT NOT NULL,
    "similarity" REAL NOT NULL,
    "algorithm" TEXT NOT NULL,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSimilarity_userId1_fkey" FOREIGN KEY ("userId1") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSimilarity_userId2_fkey" FOREIGN KEY ("userId2") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentVector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "vector" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimension" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RecommendationConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "algorithm" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RecommendationStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "algorithm" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "ctr" REAL NOT NULL DEFAULT 0.0,
    "cvr" REAL NOT NULL DEFAULT 0.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RecommendationFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ModelPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelName" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "dataset" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "preference" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "definition" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Workflow_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input" TEXT,
    "output" TEXT,
    "error" TEXT,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "WorkflowInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowInstance_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StepExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instanceId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input" TEXT,
    "output" TEXT,
    "error" TEXT,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME
);

-- CreateTable
CREATE TABLE "WorkflowLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instanceId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "WorkflowRating_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "maxUsers" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ChatRoom_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" DATETIME,
    CONSTRAINT "ChatParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "metadata" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PostShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "UserMode_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "FeatureUsageLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureUnlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "feature_id" TEXT NOT NULL,
    "unlock_trigger" TEXT NOT NULL,
    "unlock_condition" TEXT,
    "unlocked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeatureUnlock_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "ModeTransition_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
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
    "genre" TEXT,
    "complexity" TEXT,
    "content_rating" TEXT,
    "world_scope" TEXT,
    "timeline_scope" TEXT,
    "player_count" INTEGER,
    "estimated_duration" INTEGER,
    "template_id" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "rating_average" REAL NOT NULL DEFAULT 0.0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "world_setting" TEXT,
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
    CONSTRAINT "Scenario_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Scenario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Scenario_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "ScenarioTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "CharacterScenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "character_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "relationship_type" TEXT,
    "importance_level" TEXT,
    "compatibility_score" REAL,
    "notes" TEXT,
    "custom_settings" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "CharacterScenario_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CharacterScenario_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScenarioFavorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScenarioFavorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScenarioFavorite_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "WorldLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenario_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location_type" TEXT NOT NULL,
    "atmosphere" TEXT,
    "significance" TEXT NOT NULL DEFAULT 'minor',
    "parent_location_id" TEXT,
    "coordinates" TEXT,
    "is_accessible" BOOLEAN NOT NULL DEFAULT true,
    "access_requirements" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "WorldLocation_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldLocation_parent_location_id_fkey" FOREIGN KEY ("parent_location_id") REFERENCES "WorldLocation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorldEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenario_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "time_reference" TEXT NOT NULL,
    "importance" TEXT NOT NULL DEFAULT 'minor',
    "consequences" TEXT,
    "involved_characters" TEXT NOT NULL DEFAULT '[]',
    "related_location_ids" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "WorldEvent_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorldOrganization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenario_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "organization_type" TEXT NOT NULL,
    "influence" TEXT NOT NULL DEFAULT 'local',
    "goals" TEXT NOT NULL DEFAULT '[]',
    "leadership" TEXT,
    "member_count" TEXT,
    "headquarters" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "leader_character_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "WorldOrganization_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldOrganization_leader_character_id_fkey" FOREIGN KEY ("leader_character_id") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorldCulture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenario_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "language" TEXT,
    "traditions" TEXT NOT NULL DEFAULT '[]',
    "beliefs" TEXT NOT NULL DEFAULT '[]',
    "influence" TEXT NOT NULL DEFAULT 'local',
    "population" TEXT,
    "notable_figures" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "WorldCulture_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorldItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenario_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "properties" TEXT NOT NULL DEFAULT '[]',
    "requirements" TEXT,
    "effects" TEXT,
    "value" TEXT,
    "location_found" TEXT,
    "owner_character_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "WorldItem_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldItem_owner_character_id_fkey" FOREIGN KEY ("owner_character_id") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorldRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenario_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'local',
    "enforcement" TEXT NOT NULL DEFAULT 'natural',
    "exceptions" TEXT,
    "consequences" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "WorldRule_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScenarioTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "template_data" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ScenarioTemplate_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterWorldSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "character_scenario_id" TEXT NOT NULL,
    "special_abilities" TEXT NOT NULL DEFAULT '[]',
    "world_knowledge" TEXT,
    "relationships" TEXT NOT NULL DEFAULT '[]',
    "personal_goals" TEXT NOT NULL DEFAULT '[]',
    "current_status" TEXT,
    "equipment" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "CharacterWorldSetting_character_scenario_id_fkey" FOREIGN KEY ("character_scenario_id") REFERENCES "CharacterScenario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Extension" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "author_id" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "manifest_url" TEXT,
    "package_url" TEXT,
    "icon_url" TEXT,
    "screenshots" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0.0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "sandboxLevel" TEXT NOT NULL DEFAULT 'basic',
    "security_review" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "published_at" DATETIME,
    CONSTRAINT "Extension_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtensionInstallation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "extension_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'installing',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "auto_update" BOOLEAN NOT NULL DEFAULT true,
    "config" TEXT NOT NULL DEFAULT '{}',
    "user_data" TEXT NOT NULL DEFAULT '{}',
    "installed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" DATETIME NOT NULL,
    "last_used" DATETIME,
    CONSTRAINT "ExtensionInstallation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtensionInstallation_extension_id_fkey" FOREIGN KEY ("extension_id") REFERENCES "Extension" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtensionReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "extension_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ExtensionReview_extension_id_fkey" FOREIGN KEY ("extension_id") REFERENCES "Extension" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtensionReview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StreamingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "chat_id" TEXT,
    "character_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "connection_type" TEXT NOT NULL DEFAULT 'sse',
    "chunk_size" INTEGER NOT NULL DEFAULT 1024,
    "heartbeat_interval" INTEGER NOT NULL DEFAULT 30,
    "max_duration" INTEGER NOT NULL DEFAULT 300,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "bytes_transferred" INTEGER NOT NULL DEFAULT 0,
    "connection_drops" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "StreamingSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StreamingSession_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "ChatSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StreamingSession_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StreamingMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "message_id" TEXT,
    "event_type" TEXT NOT NULL DEFAULT 'message',
    "content" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "sequence_number" INTEGER NOT NULL,
    "chunk_index" INTEGER NOT NULL DEFAULT 0,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" DATETIME,
    CONSTRAINT "StreamingMessage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "StreamingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StreamingMessage_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CacheItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cache_key" TEXT NOT NULL,
    "cache_value" TEXT NOT NULL,
    "cache_type" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entity_type" TEXT,
    "entity_id" TEXT
);

-- CreateTable
CREATE TABLE "CacheStatistics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "cache_type" TEXT NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "miss_count" INTEGER NOT NULL DEFAULT 0,
    "eviction_count" INTEGER NOT NULL DEFAULT 0,
    "total_size" INTEGER NOT NULL DEFAULT 0,
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "avg_access_time" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AdvancedConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "config_name" TEXT NOT NULL,
    "config_type" TEXT NOT NULL,
    "config_data" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "sillytavern_compatible" BOOLEAN NOT NULL DEFAULT false,
    "import_source" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "AdvancedConfig_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfigTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config_type" TEXT NOT NULL,
    "author_id" TEXT,
    "template_data" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '{}',
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" REAL NOT NULL DEFAULT 0.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ConfigTemplate_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Character_userId_idx" ON "Character"("userId");

-- CreateIndex
CREATE INDEX "Character_is_public_idx" ON "Character"("is_public");

-- CreateIndex
CREATE INDEX "Character_rating_idx" ON "Character"("rating");

-- CreateIndex
CREATE INDEX "Character_category_idx" ON "Character"("category");

-- CreateIndex
CREATE INDEX "Character_is_featured_idx" ON "Character"("is_featured");

-- CreateIndex
CREATE INDEX "Character_created_at_idx" ON "Character"("created_at");

-- CreateIndex
CREATE INDEX "Character_chat_count_idx" ON "Character"("chat_count");

-- CreateIndex
CREATE INDEX "Character_favorite_count_idx" ON "Character"("favorite_count");

-- CreateIndex
CREATE INDEX "Character_is_public_is_featured_idx" ON "Character"("is_public", "is_featured");

-- CreateIndex
CREATE INDEX "Character_is_public_rating_idx" ON "Character"("is_public", "rating");

-- CreateIndex
CREATE INDEX "Character_category_rating_idx" ON "Character"("category", "rating");

-- CreateIndex
CREATE INDEX "Character_userId_is_public_idx" ON "Character"("userId", "is_public");

-- CreateIndex
CREATE UNIQUE INDEX "Character_name_userId_key" ON "Character"("name", "userId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerId_key" ON "OAuthAccount"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "ChatSession_characterId_idx" ON "ChatSession"("characterId");

-- CreateIndex
CREATE INDEX "ChatSession_updatedAt_idx" ON "ChatSession"("updatedAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Message_sessionId_idx" ON "Message"("sessionId");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "CharacterFavorite_userId_idx" ON "CharacterFavorite"("userId");

-- CreateIndex
CREATE INDEX "CharacterFavorite_characterId_idx" ON "CharacterFavorite"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterFavorite_userId_characterId_key" ON "CharacterFavorite"("userId", "characterId");

-- CreateIndex
CREATE INDEX "CharacterRating_userId_idx" ON "CharacterRating"("userId");

-- CreateIndex
CREATE INDEX "CharacterRating_characterId_idx" ON "CharacterRating"("characterId");

-- CreateIndex
CREATE INDEX "CharacterRating_rating_idx" ON "CharacterRating"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterRating_userId_characterId_key" ON "CharacterRating"("userId", "characterId");

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

-- CreateIndex
CREATE INDEX "Post_characterId_idx" ON "Post"("characterId");

-- CreateIndex
CREATE INDEX "Post_created_at_idx" ON "Post"("created_at");

-- CreateIndex
CREATE INDEX "Post_isPublic_idx" ON "Post"("isPublic");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Comment_created_at_idx" ON "Comment"("created_at");

-- CreateIndex
CREATE INDEX "PostLike_postId_idx" ON "PostLike"("postId");

-- CreateIndex
CREATE INDEX "PostLike_userId_idx" ON "PostLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_postId_userId_key" ON "PostLike"("postId", "userId");

-- CreateIndex
CREATE INDEX "UsageLog_userId_idx" ON "UsageLog"("userId");

-- CreateIndex
CREATE INDEX "UsageLog_action_idx" ON "UsageLog"("action");

-- CreateIndex
CREATE INDEX "UsageLog_created_at_idx" ON "UsageLog"("created_at");

-- CreateIndex
CREATE INDEX "Alert_type_idx" ON "Alert"("type");

-- CreateIndex
CREATE INDEX "Alert_severity_idx" ON "Alert"("severity");

-- CreateIndex
CREATE INDEX "Alert_isRead_idx" ON "Alert"("isRead");

-- CreateIndex
CREATE INDEX "Alert_isResolved_idx" ON "Alert"("isResolved");

-- CreateIndex
CREATE INDEX "Alert_created_at_idx" ON "Alert"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_name_key" ON "Channel"("name");

-- CreateIndex
CREATE INDEX "Channel_type_idx" ON "Channel"("type");

-- CreateIndex
CREATE INDEX "Channel_isActive_idx" ON "Channel"("isActive");

-- CreateIndex
CREATE INDEX "ScheduledTask_userId_idx" ON "ScheduledTask"("userId");

-- CreateIndex
CREATE INDEX "ScheduledTask_status_idx" ON "ScheduledTask"("status");

-- CreateIndex
CREATE INDEX "ScheduledTask_next_run_idx" ON "ScheduledTask"("next_run");

-- CreateIndex
CREATE INDEX "ScheduledTask_isActive_idx" ON "ScheduledTask"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AIProvider_name_key" ON "AIProvider"("name");

-- CreateIndex
CREATE INDEX "AIProvider_isActive_priority_idx" ON "AIProvider"("isActive", "priority");

-- CreateIndex
CREATE INDEX "AIProvider_name_idx" ON "AIProvider"("name");

-- CreateIndex
CREATE INDEX "MediaFile_userId_idx" ON "MediaFile"("userId");

-- CreateIndex
CREATE INDEX "MediaFile_hash_idx" ON "MediaFile"("hash");

-- CreateIndex
CREATE INDEX "MediaFile_mimeType_idx" ON "MediaFile"("mimeType");

-- CreateIndex
CREATE INDEX "AIRequest_userId_idx" ON "AIRequest"("userId");

-- CreateIndex
CREATE INDEX "AIRequest_provider_model_idx" ON "AIRequest"("provider", "model");

-- CreateIndex
CREATE INDEX "AIRequest_status_idx" ON "AIRequest"("status");

-- CreateIndex
CREATE INDEX "AIRequest_created_at_idx" ON "AIRequest"("created_at");

-- CreateIndex
CREATE INDEX "VoiceProfile_userId_idx" ON "VoiceProfile"("userId");

-- CreateIndex
CREATE INDEX "VoiceProfile_isDefault_idx" ON "VoiceProfile"("isDefault");

-- CreateIndex
CREATE INDEX "ImageGeneration_userId_idx" ON "ImageGeneration"("userId");

-- CreateIndex
CREATE INDEX "ImageGeneration_status_idx" ON "ImageGeneration"("status");

-- CreateIndex
CREATE INDEX "ImageGeneration_created_at_idx" ON "ImageGeneration"("created_at");

-- CreateIndex
CREATE INDEX "UserBehavior_userId_idx" ON "UserBehavior"("userId");

-- CreateIndex
CREATE INDEX "UserBehavior_action_idx" ON "UserBehavior"("action");

-- CreateIndex
CREATE INDEX "UserBehavior_targetType_targetId_idx" ON "UserBehavior"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "UserBehavior_created_at_idx" ON "UserBehavior"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_userId_idx" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_last_active_at_idx" ON "UserProfile"("last_active_at");

-- CreateIndex
CREATE INDEX "RecommendationLog_userId_idx" ON "RecommendationLog"("userId");

-- CreateIndex
CREATE INDEX "RecommendationLog_itemType_itemId_idx" ON "RecommendationLog"("itemType", "itemId");

-- CreateIndex
CREATE INDEX "RecommendationLog_algorithm_idx" ON "RecommendationLog"("algorithm");

-- CreateIndex
CREATE INDEX "RecommendationLog_created_at_idx" ON "RecommendationLog"("created_at");

-- CreateIndex
CREATE INDEX "UserSimilarity_userId1_idx" ON "UserSimilarity"("userId1");

-- CreateIndex
CREATE INDEX "UserSimilarity_userId2_idx" ON "UserSimilarity"("userId2");

-- CreateIndex
CREATE INDEX "UserSimilarity_similarity_idx" ON "UserSimilarity"("similarity");

-- CreateIndex
CREATE UNIQUE INDEX "UserSimilarity_userId1_userId2_algorithm_key" ON "UserSimilarity"("userId1", "userId2", "algorithm");

-- CreateIndex
CREATE INDEX "ContentVector_contentType_idx" ON "ContentVector"("contentType");

-- CreateIndex
CREATE INDEX "ContentVector_model_idx" ON "ContentVector"("model");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVector_contentType_contentId_model_key" ON "ContentVector"("contentType", "contentId", "model");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationConfig_algorithm_key" ON "RecommendationConfig"("algorithm");

-- CreateIndex
CREATE INDEX "RecommendationConfig_algorithm_idx" ON "RecommendationConfig"("algorithm");

-- CreateIndex
CREATE INDEX "RecommendationConfig_isActive_idx" ON "RecommendationConfig"("isActive");

-- CreateIndex
CREATE INDEX "RecommendationStats_algorithm_idx" ON "RecommendationStats"("algorithm");

-- CreateIndex
CREATE INDEX "RecommendationStats_date_idx" ON "RecommendationStats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationStats_algorithm_date_key" ON "RecommendationStats"("algorithm", "date");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_userId_idx" ON "RecommendationFeedback"("userId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_itemType_itemId_idx" ON "RecommendationFeedback"("itemType", "itemId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_feedbackType_idx" ON "RecommendationFeedback"("feedbackType");

-- CreateIndex
CREATE INDEX "ModelPerformance_modelName_idx" ON "ModelPerformance"("modelName");

-- CreateIndex
CREATE INDEX "ModelPerformance_metric_idx" ON "ModelPerformance"("metric");

-- CreateIndex
CREATE INDEX "ModelPerformance_timestamp_idx" ON "ModelPerformance"("timestamp");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_category_idx" ON "UserPreference"("category");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_category_preference_key" ON "UserPreference"("userId", "category", "preference");

-- CreateIndex
CREATE INDEX "Workflow_creatorId_idx" ON "Workflow"("creatorId");

-- CreateIndex
CREATE INDEX "Workflow_isPublic_idx" ON "Workflow"("isPublic");

-- CreateIndex
CREATE INDEX "Workflow_isActive_idx" ON "Workflow"("isActive");

-- CreateIndex
CREATE INDEX "WorkflowInstance_workflowId_idx" ON "WorkflowInstance"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_userId_idx" ON "WorkflowInstance"("userId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_status_idx" ON "WorkflowInstance"("status");

-- CreateIndex
CREATE INDEX "StepExecution_instanceId_idx" ON "StepExecution"("instanceId");

-- CreateIndex
CREATE INDEX "StepExecution_status_idx" ON "StepExecution"("status");

-- CreateIndex
CREATE INDEX "StepExecution_stepName_idx" ON "StepExecution"("stepName");

-- CreateIndex
CREATE INDEX "WorkflowLog_instanceId_idx" ON "WorkflowLog"("instanceId");

-- CreateIndex
CREATE INDEX "WorkflowLog_level_idx" ON "WorkflowLog"("level");

-- CreateIndex
CREATE INDEX "WorkflowLog_timestamp_idx" ON "WorkflowLog"("timestamp");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_category_idx" ON "WorkflowTemplate"("category");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_isPublic_idx" ON "WorkflowTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_rating_idx" ON "WorkflowTemplate"("rating");

-- CreateIndex
CREATE INDEX "AdminLog_adminId_idx" ON "AdminLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminLog_action_idx" ON "AdminLog"("action");

-- CreateIndex
CREATE INDEX "AdminLog_created_at_idx" ON "AdminLog"("created_at");

-- CreateIndex
CREATE INDEX "WorkflowRating_workflowId_idx" ON "WorkflowRating"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowRating_userId_idx" ON "WorkflowRating"("userId");

-- CreateIndex
CREATE INDEX "WorkflowRating_rating_idx" ON "WorkflowRating"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowRating_workflowId_userId_key" ON "WorkflowRating"("workflowId", "userId");

-- CreateIndex
CREATE INDEX "ChatRoom_creatorId_idx" ON "ChatRoom"("creatorId");

-- CreateIndex
CREATE INDEX "ChatRoom_isPublic_idx" ON "ChatRoom"("isPublic");

-- CreateIndex
CREATE INDEX "ChatRoom_isActive_idx" ON "ChatRoom"("isActive");

-- CreateIndex
CREATE INDEX "ChatParticipant_roomId_idx" ON "ChatParticipant"("roomId");

-- CreateIndex
CREATE INDEX "ChatParticipant_userId_idx" ON "ChatParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_roomId_userId_key" ON "ChatParticipant"("roomId", "userId");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_idx" ON "ChatMessage"("roomId");

-- CreateIndex
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");

-- CreateIndex
CREATE INDEX "ChatMessage_created_at_idx" ON "ChatMessage"("created_at");

-- CreateIndex
CREATE INDEX "CommentLike_commentId_idx" ON "CommentLike"("commentId");

-- CreateIndex
CREATE INDEX "CommentLike_userId_idx" ON "CommentLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_userId_key" ON "CommentLike"("commentId", "userId");

-- CreateIndex
CREATE INDEX "PostShare_postId_idx" ON "PostShare"("postId");

-- CreateIndex
CREATE INDEX "PostShare_userId_idx" ON "PostShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostShare_postId_userId_key" ON "PostShare"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMode_user_id_key" ON "UserMode"("user_id");

-- CreateIndex
CREATE INDEX "UserMode_user_id_idx" ON "UserMode"("user_id");

-- CreateIndex
CREATE INDEX "UserMode_current_mode_idx" ON "UserMode"("current_mode");

-- CreateIndex
CREATE INDEX "UserMode_skill_level_idx" ON "UserMode"("skill_level");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_user_id_idx" ON "FeatureUsageLog"("user_id");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_feature_id_idx" ON "FeatureUsageLog"("feature_id");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_last_used_at_idx" ON "FeatureUsageLog"("last_used_at");

-- CreateIndex
CREATE INDEX "FeatureUsageLog_is_expert_feature_idx" ON "FeatureUsageLog"("is_expert_feature");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureUsageLog_user_id_feature_id_key" ON "FeatureUsageLog"("user_id", "feature_id");

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

-- CreateIndex
CREATE INDEX "Scenario_user_id_idx" ON "Scenario"("user_id");

-- CreateIndex
CREATE INDEX "Scenario_is_public_idx" ON "Scenario"("is_public");

-- CreateIndex
CREATE INDEX "Scenario_is_active_idx" ON "Scenario"("is_active");

-- CreateIndex
CREATE INDEX "Scenario_category_idx" ON "Scenario"("category");

-- CreateIndex
CREATE INDEX "Scenario_rating_idx" ON "Scenario"("rating");

-- CreateIndex
CREATE INDEX "Scenario_view_count_idx" ON "Scenario"("view_count");

-- CreateIndex
CREATE INDEX "Scenario_use_count_idx" ON "Scenario"("use_count");

-- CreateIndex
CREATE INDEX "Scenario_favorite_count_idx" ON "Scenario"("favorite_count");

-- CreateIndex
CREATE INDEX "Scenario_created_at_idx" ON "Scenario"("created_at");

-- CreateIndex
CREATE INDEX "Scenario_parent_id_idx" ON "Scenario"("parent_id");

-- CreateIndex
CREATE INDEX "Scenario_user_id_is_public_idx" ON "Scenario"("user_id", "is_public");

-- CreateIndex
CREATE INDEX "Scenario_category_rating_idx" ON "Scenario"("category", "rating");

-- CreateIndex
CREATE INDEX "Scenario_is_public_rating_idx" ON "Scenario"("is_public", "rating");

-- CreateIndex
CREATE INDEX "WorldInfoEntry_scenario_id_idx" ON "WorldInfoEntry"("scenario_id");

-- CreateIndex
CREATE INDEX "WorldInfoEntry_priority_idx" ON "WorldInfoEntry"("priority");

-- CreateIndex
CREATE INDEX "WorldInfoEntry_is_active_idx" ON "WorldInfoEntry"("is_active");

-- CreateIndex
CREATE INDEX "WorldInfoEntry_category_idx" ON "WorldInfoEntry"("category");

-- CreateIndex
CREATE INDEX "WorldInfoEntry_match_type_idx" ON "WorldInfoEntry"("match_type");

-- CreateIndex
CREATE INDEX "WorldInfoEntry_trigger_count_idx" ON "WorldInfoEntry"("trigger_count");

-- CreateIndex
CREATE INDEX "WorldInfoEntry_created_at_idx" ON "WorldInfoEntry"("created_at");

-- CreateIndex
CREATE INDEX "WorldInfoEntry_scenario_id_priority_idx" ON "WorldInfoEntry"("scenario_id", "priority");

-- CreateIndex
CREATE INDEX "WorldInfoEntry_scenario_id_is_active_idx" ON "WorldInfoEntry"("scenario_id", "is_active");

-- CreateIndex
CREATE INDEX "WorldInfoEntry_is_active_priority_idx" ON "WorldInfoEntry"("is_active", "priority");

-- CreateIndex
CREATE INDEX "CharacterScenario_character_id_idx" ON "CharacterScenario"("character_id");

-- CreateIndex
CREATE INDEX "CharacterScenario_scenario_id_idx" ON "CharacterScenario"("scenario_id");

-- CreateIndex
CREATE INDEX "CharacterScenario_is_default_idx" ON "CharacterScenario"("is_default");

-- CreateIndex
CREATE INDEX "CharacterScenario_is_active_idx" ON "CharacterScenario"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterScenario_character_id_scenario_id_key" ON "CharacterScenario"("character_id", "scenario_id");

-- CreateIndex
CREATE INDEX "ScenarioFavorite_user_id_idx" ON "ScenarioFavorite"("user_id");

-- CreateIndex
CREATE INDEX "ScenarioFavorite_scenario_id_idx" ON "ScenarioFavorite"("scenario_id");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioFavorite_user_id_scenario_id_key" ON "ScenarioFavorite"("user_id", "scenario_id");

-- CreateIndex
CREATE INDEX "ScenarioRating_user_id_idx" ON "ScenarioRating"("user_id");

-- CreateIndex
CREATE INDEX "ScenarioRating_scenario_id_idx" ON "ScenarioRating"("scenario_id");

-- CreateIndex
CREATE INDEX "ScenarioRating_rating_idx" ON "ScenarioRating"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioRating_user_id_scenario_id_key" ON "ScenarioRating"("user_id", "scenario_id");

-- CreateIndex
CREATE INDEX "WorldLocation_scenario_id_idx" ON "WorldLocation"("scenario_id");

-- CreateIndex
CREATE INDEX "WorldLocation_parent_location_id_idx" ON "WorldLocation"("parent_location_id");

-- CreateIndex
CREATE INDEX "WorldLocation_location_type_idx" ON "WorldLocation"("location_type");

-- CreateIndex
CREATE INDEX "WorldLocation_significance_idx" ON "WorldLocation"("significance");

-- CreateIndex
CREATE INDEX "WorldEvent_scenario_id_idx" ON "WorldEvent"("scenario_id");

-- CreateIndex
CREATE INDEX "WorldEvent_event_type_idx" ON "WorldEvent"("event_type");

-- CreateIndex
CREATE INDEX "WorldEvent_importance_idx" ON "WorldEvent"("importance");

-- CreateIndex
CREATE INDEX "WorldEvent_time_reference_idx" ON "WorldEvent"("time_reference");

-- CreateIndex
CREATE INDEX "WorldOrganization_scenario_id_idx" ON "WorldOrganization"("scenario_id");

-- CreateIndex
CREATE INDEX "WorldOrganization_organization_type_idx" ON "WorldOrganization"("organization_type");

-- CreateIndex
CREATE INDEX "WorldOrganization_influence_idx" ON "WorldOrganization"("influence");

-- CreateIndex
CREATE INDEX "WorldOrganization_leader_character_id_idx" ON "WorldOrganization"("leader_character_id");

-- CreateIndex
CREATE INDEX "WorldCulture_scenario_id_idx" ON "WorldCulture"("scenario_id");

-- CreateIndex
CREATE INDEX "WorldCulture_influence_idx" ON "WorldCulture"("influence");

-- CreateIndex
CREATE INDEX "WorldCulture_language_idx" ON "WorldCulture"("language");

-- CreateIndex
CREATE INDEX "WorldItem_scenario_id_idx" ON "WorldItem"("scenario_id");

-- CreateIndex
CREATE INDEX "WorldItem_item_type_idx" ON "WorldItem"("item_type");

-- CreateIndex
CREATE INDEX "WorldItem_rarity_idx" ON "WorldItem"("rarity");

-- CreateIndex
CREATE INDEX "WorldItem_owner_character_id_idx" ON "WorldItem"("owner_character_id");

-- CreateIndex
CREATE INDEX "WorldRule_scenario_id_idx" ON "WorldRule"("scenario_id");

-- CreateIndex
CREATE INDEX "WorldRule_rule_type_idx" ON "WorldRule"("rule_type");

-- CreateIndex
CREATE INDEX "WorldRule_scope_idx" ON "WorldRule"("scope");

-- CreateIndex
CREATE INDEX "WorldRule_enforcement_idx" ON "WorldRule"("enforcement");

-- CreateIndex
CREATE INDEX "ScenarioTemplate_created_by_idx" ON "ScenarioTemplate"("created_by");

-- CreateIndex
CREATE INDEX "ScenarioTemplate_category_idx" ON "ScenarioTemplate"("category");

-- CreateIndex
CREATE INDEX "ScenarioTemplate_is_public_idx" ON "ScenarioTemplate"("is_public");

-- CreateIndex
CREATE INDEX "ScenarioTemplate_usage_count_idx" ON "ScenarioTemplate"("usage_count");

-- CreateIndex
CREATE INDEX "CharacterWorldSetting_character_scenario_id_idx" ON "CharacterWorldSetting"("character_scenario_id");

-- CreateIndex
CREATE INDEX "Extension_category_idx" ON "Extension"("category");

-- CreateIndex
CREATE INDEX "Extension_status_idx" ON "Extension"("status");

-- CreateIndex
CREATE INDEX "Extension_rating_idx" ON "Extension"("rating");

-- CreateIndex
CREATE INDEX "Extension_author_id_idx" ON "Extension"("author_id");

-- CreateIndex
CREATE INDEX "ExtensionInstallation_user_id_idx" ON "ExtensionInstallation"("user_id");

-- CreateIndex
CREATE INDEX "ExtensionInstallation_status_idx" ON "ExtensionInstallation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionInstallation_user_id_extension_id_key" ON "ExtensionInstallation"("user_id", "extension_id");

-- CreateIndex
CREATE INDEX "ExtensionReview_extension_id_idx" ON "ExtensionReview"("extension_id");

-- CreateIndex
CREATE INDEX "ExtensionReview_rating_idx" ON "ExtensionReview"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionReview_user_id_extension_id_key" ON "ExtensionReview"("user_id", "extension_id");

-- CreateIndex
CREATE INDEX "StreamingSession_user_id_idx" ON "StreamingSession"("user_id");

-- CreateIndex
CREATE INDEX "StreamingSession_status_idx" ON "StreamingSession"("status");

-- CreateIndex
CREATE INDEX "StreamingSession_last_activity_idx" ON "StreamingSession"("last_activity");

-- CreateIndex
CREATE INDEX "StreamingMessage_session_id_idx" ON "StreamingMessage"("session_id");

-- CreateIndex
CREATE INDEX "StreamingMessage_session_id_sequence_number_idx" ON "StreamingMessage"("session_id", "sequence_number");

-- CreateIndex
CREATE INDEX "StreamingMessage_status_idx" ON "StreamingMessage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CacheItem_cache_key_key" ON "CacheItem"("cache_key");

-- CreateIndex
CREATE INDEX "CacheItem_cache_type_idx" ON "CacheItem"("cache_type");

-- CreateIndex
CREATE INDEX "CacheItem_expires_at_idx" ON "CacheItem"("expires_at");

-- CreateIndex
CREATE INDEX "CacheItem_entity_type_entity_id_idx" ON "CacheItem"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "CacheItem_last_accessed_idx" ON "CacheItem"("last_accessed");

-- CreateIndex
CREATE INDEX "CacheStatistics_date_idx" ON "CacheStatistics"("date");

-- CreateIndex
CREATE INDEX "CacheStatistics_cache_type_idx" ON "CacheStatistics"("cache_type");

-- CreateIndex
CREATE UNIQUE INDEX "CacheStatistics_date_cache_type_key" ON "CacheStatistics"("date", "cache_type");

-- CreateIndex
CREATE INDEX "AdvancedConfig_user_id_idx" ON "AdvancedConfig"("user_id");

-- CreateIndex
CREATE INDEX "AdvancedConfig_config_type_idx" ON "AdvancedConfig"("config_type");

-- CreateIndex
CREATE INDEX "AdvancedConfig_is_public_idx" ON "AdvancedConfig"("is_public");

-- CreateIndex
CREATE INDEX "ConfigTemplate_config_type_idx" ON "ConfigTemplate"("config_type");

-- CreateIndex
CREATE INDEX "ConfigTemplate_is_official_idx" ON "ConfigTemplate"("is_official");

