-- 插入测试用户数据
INSERT OR REPLACE INTO "User" (
    "id", "username", "email", "passwordHash", "role", "isAdmin", "credits",
    "subscriptionTier", "bio", "is_active", "created_at", "updated_at"
) VALUES
('test-user-1', '测试用户', 'test@tavernai.com', '$2b$10$example.hash.here', 'user', true, 500, 'free', '测试用户账户', true, datetime('now'), datetime('now')),
('test-user-2', 'AI助手用户', 'user2@tavernai.com', '$2b$10$example.hash.here', 'user', false, 1000, 'plus', 'AI助手爱好者', true, datetime('now'), datetime('now'));

-- 插入测试角色数据
INSERT OR REPLACE INTO "Character" (
    "id", "userId", "name", "description", "personality", "backstory", "firstMessage",
    "category", "tags", "is_public", "is_nsfw", "rating", "created_at", "updated_at"
) VALUES
('char-1', 'test-user-1', '艾莉丝', '一个聪明友善的AI助手', '友好、聪明、乐于助人', '艾莉丝是一个专为帮助用户而设计的AI助手', '你好！我是艾莉丝，很高兴认识你！有什么可以帮助你的吗？', '助手', '["AI", "助手", "友好"]', true, false, 4.5, datetime('now'), datetime('now')),
('char-2', 'test-user-1', '学者', '博学的知识专家', '博学、严谨、耐心', '学者拥有丰富的知识储备，善于解答各种问题', '欢迎！我是学者，很高兴为您解答任何问题。', '教育', '["知识", "教育", "专家"]', true, false, 4.7, datetime('now'), datetime('now'));

-- 插入关注关系
INSERT OR REPLACE INTO "Follow" (
    "id", "followerId", "followingId", "createdAt"
) VALUES
('follow-1', 'test-user-2', 'test-user-1', datetime('now'));

-- 插入动态数据
INSERT OR REPLACE INTO "Post" (
    "id", "authorId", "characterId", "content", "type", "visibility", "viewCount", "createdAt", "updatedAt"
) VALUES
('post-1', 'test-user-1', 'char-1', '今天创建了一个新的AI助手角色，大家可以来试试！', 'character_share', 'public', 0, datetime('now'), datetime('now')),
('post-2', 'test-user-1', NULL, '云酒馆真是一个很棒的AI角色扮演平台！', 'text', 'public', 0, datetime('now'), datetime('now'));

-- 插入评论数据
INSERT OR REPLACE INTO "Comment" (
    "id", "postId", "authorId", "content", "createdAt", "updatedAt"
) VALUES
('comment-1', 'post-1', 'test-user-2', '这个角色看起来很不错！我要试试', datetime('now'), datetime('now')),
('comment-2', 'post-2', 'test-user-2', '确实！这里的AI角色都很有趣', datetime('now'), datetime('now'));
