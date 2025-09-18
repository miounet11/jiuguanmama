-- 数据库查询优化和索引配置
-- TavernAI Plus 推荐系统优化

-- 1. 用户相关索引
CREATE INDEX IF NOT EXISTS idx_users_active ON User(isActive) WHERE isActive = true;
CREATE INDEX IF NOT EXISTS idx_users_verified ON User(isVerified) WHERE isVerified = true;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON User(createdAt);

-- 2. 角色相关索引
CREATE INDEX IF NOT EXISTS idx_characters_public ON Character(isPublic) WHERE isPublic = true;
CREATE INDEX IF NOT EXISTS idx_characters_category ON Character(category);
CREATE INDEX IF NOT EXISTS idx_characters_creator ON Character(creatorId);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON Character(createdAt);
CREATE INDEX IF NOT EXISTS idx_characters_rating ON Character(rating);
CREATE INDEX IF NOT EXISTS idx_characters_nsfw ON Character(isNsfw);
CREATE INDEX IF NOT EXISTS idx_characters_featured ON Character(isFeatured) WHERE isFeatured = true;

-- 3. 对话相关索引
CREATE INDEX IF NOT EXISTS idx_conversations_user ON Conversation(userId);
CREATE INDEX IF NOT EXISTS idx_conversations_character ON Conversation(characterId);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON Conversation(createdAt);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON Conversation(updatedAt);

-- 4. 消息相关索引
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON Message(conversationId);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON Message(createdAt);
CREATE INDEX IF NOT EXISTS idx_messages_role ON Message(role);

-- 5. 用户行为相关索引（推荐系统核心）
CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON UserBehavior(userId);
CREATE INDEX IF NOT EXISTS idx_user_behavior_target ON UserBehavior(targetType, targetId);
CREATE INDEX IF NOT EXISTS idx_user_behavior_action ON UserBehavior(action);
CREATE INDEX IF NOT EXISTS idx_user_behavior_timestamp ON UserBehavior(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_behavior_composite ON UserBehavior(userId, targetType, action, timestamp);

-- 6. 用户偏好索引
CREATE INDEX IF NOT EXISTS idx_user_preference_user ON UserPreference(userId);
CREATE INDEX IF NOT EXISTS idx_user_preference_category ON UserPreference(category);
CREATE INDEX IF NOT EXISTS idx_user_preference_weight ON UserPreference(weight);

-- 7. 推荐日志索引
CREATE INDEX IF NOT EXISTS idx_recommendation_log_user ON RecommendationLog(userId);
CREATE INDEX IF NOT EXISTS idx_recommendation_log_type ON RecommendationLog(type);
CREATE INDEX IF NOT EXISTS idx_recommendation_log_algorithm ON RecommendationLog(algorithm);
CREATE INDEX IF NOT EXISTS idx_recommendation_log_created_at ON RecommendationLog(createdAt);
CREATE INDEX IF NOT EXISTS idx_recommendation_log_composite ON RecommendationLog(userId, type, createdAt);

-- 8. 推荐反馈索引
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user ON RecommendationFeedback(userId);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_recommendation ON RecommendationFeedback(recommendationId);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_clicked ON RecommendationFeedback(clicked) WHERE clicked = true;
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_useful ON RecommendationFeedback(useful) WHERE useful = true;

-- 9. 模型性能索引
CREATE INDEX IF NOT EXISTS idx_model_performance_user ON ModelPerformance(userId);
CREATE INDEX IF NOT EXISTS idx_model_performance_type ON ModelPerformance(modelType);
CREATE INDEX IF NOT EXISTS idx_model_performance_timestamp ON ModelPerformance(timestamp);

-- 10. 社区相关索引
CREATE INDEX IF NOT EXISTS idx_posts_author ON Post(authorId);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON Post(createdAt);
CREATE INDEX IF NOT EXISTS idx_posts_deleted ON Post(isDeleted) WHERE isDeleted = false;
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON Post(visibility);
CREATE INDEX IF NOT EXISTS idx_posts_composite ON Post(isDeleted, visibility, createdAt);

CREATE INDEX IF NOT EXISTS idx_likes_post ON Like(postId);
CREATE INDEX IF NOT EXISTS idx_likes_user ON Like(userId);
CREATE INDEX IF NOT EXISTS idx_likes_composite ON Like(postId, userId);

CREATE INDEX IF NOT EXISTS idx_comments_post ON Comment(postId);
CREATE INDEX IF NOT EXISTS idx_comments_author ON Comment(authorId);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON Comment(createdAt);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON Follow(followerId);
CREATE INDEX IF NOT EXISTS idx_follows_following ON Follow(followingId);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON Follow(createdAt);

-- 11. 市场相关索引
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller ON MarketplaceItem(sellerId);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_character ON MarketplaceItem(characterId);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON MarketplaceItem(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_price ON MarketplaceItem(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_featured ON MarketplaceItem(isFeatured) WHERE isFeatured = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_items_active ON MarketplaceItem(isActive) WHERE isActive = true;

-- 12. 复合索引优化（针对常见查询模式）
CREATE INDEX IF NOT EXISTS idx_characters_public_category_rating ON Character(isPublic, category, rating) WHERE isPublic = true;
CREATE INDEX IF NOT EXISTS idx_user_behavior_recent ON UserBehavior(userId, targetType, timestamp) WHERE timestamp > datetime('now', '-90 days');
CREATE INDEX IF NOT EXISTS idx_posts_trending ON Post(isDeleted, visibility, createdAt) WHERE isDeleted = false AND visibility = 'public';

-- 13. 分析表统计信息（SQLite特定）
ANALYZE;

-- 14. 创建视图用于常见查询优化
CREATE VIEW IF NOT EXISTS ActiveCharacters AS
SELECT
    c.*,
    u.username as creatorName,
    u.avatar as creatorAvatar,
    COUNT(DISTINCT conv.id) as conversationCount,
    AVG(CASE WHEN ub.action = 'rate' THEN ub.weight END) as avgRating
FROM Character c
LEFT JOIN User u ON c.creatorId = u.id
LEFT JOIN Conversation conv ON c.id = conv.characterId
LEFT JOIN UserBehavior ub ON c.id = ub.targetId AND ub.targetType = 'character'
WHERE c.isPublic = true AND c.isDeleted = false
GROUP BY c.id;

CREATE VIEW IF NOT EXISTS TrendingCharacters AS
SELECT
    c.*,
    COUNT(DISTINCT conv.id) as recentConversations,
    COUNT(DISTINCT ub.id) as recentInteractions
FROM Character c
LEFT JOIN Conversation conv ON c.id = conv.characterId AND conv.createdAt > datetime('now', '-7 days')
LEFT JOIN UserBehavior ub ON c.id = ub.targetId AND ub.targetType = 'character' AND ub.timestamp > datetime('now', '-7 days')
WHERE c.isPublic = true AND c.isDeleted = false
GROUP BY c.id
HAVING recentConversations > 0 OR recentInteractions > 0
ORDER BY (recentConversations + recentInteractions) DESC;

CREATE VIEW IF NOT EXISTS UserRecommendationStats AS
SELECT
    userId,
    COUNT(*) as totalRecommendations,
    COUNT(CASE WHEN clicked = true THEN 1 END) as clickedRecommendations,
    COUNT(CASE WHEN useful = true THEN 1 END) as usefulRecommendations,
    AVG(CASE WHEN rating IS NOT NULL THEN rating END) as avgRating
FROM RecommendationFeedback
WHERE createdAt > datetime('now', '-30 days')
GROUP BY userId;

-- 15. 定期清理过期数据的建议（注释形式）
-- 以下操作应在定期维护任务中执行：

-- 清理90天前的用户行为数据
-- DELETE FROM UserBehavior WHERE timestamp < datetime('now', '-90 days');

-- 清理30天前的推荐日志
-- DELETE FROM RecommendationLog WHERE createdAt < datetime('now', '-30 days');

-- 清理过期的模型性能记录（保留最近7天的详细数据）
-- DELETE FROM ModelPerformance WHERE timestamp < datetime('now', '-7 days') AND modelType != 'recommendation_global';

-- 16. 性能监控查询
-- 以下查询可用于监控数据库性能：

-- 检查最耗时的查询类型
-- SELECT
--     type,
--     COUNT(*) as query_count,
--     AVG(confidence) as avg_confidence
-- FROM RecommendationLog
-- WHERE createdAt > datetime('now', '-24 hours')
-- GROUP BY type
-- ORDER BY query_count DESC;

-- 检查推荐系统效果
-- SELECT
--     algorithm,
--     COUNT(*) as total_recommendations,
--     COUNT(CASE WHEN rf.clicked = true THEN 1 END) as clicked,
--     COUNT(CASE WHEN rf.useful = true THEN 1 END) as useful
-- FROM RecommendationLog rl
-- LEFT JOIN RecommendationFeedback rf ON rl.id = rf.recommendationId
-- WHERE rl.createdAt > datetime('now', '-7 days')
-- GROUP BY algorithm;
