-- 添加图片生成相关字段到Character表
ALTER TABLE Character ADD COLUMN backgroundImage TEXT;
ALTER TABLE Character ADD COLUMN mbtiType TEXT;
ALTER TABLE Character ADD COLUMN emotionPack TEXT;
ALTER TABLE Character ADD COLUMN avatarStatus TEXT DEFAULT 'PENDING';
ALTER TABLE Character ADD COLUMN backgroundStatus TEXT DEFAULT 'PENDING';
ALTER TABLE Character ADD COLUMN emotionStatus TEXT DEFAULT 'PENDING';
