"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.characterQuerySchema = exports.rateCharacterSchema = exports.updateCharacterSchema = exports.createCharacterSchema = void 0;
const zod_1 = require("zod");
// 角色创建验证schema
exports.createCharacterSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(1, '角色名称不能为空')
        .max(100, '角色名称不能超过100个字符')
        .trim(),
    description: zod_1.z.string()
        .max(500, '角色描述不能超过500个字符')
        .optional(),
    personality: zod_1.z.string()
        .max(2000, '性格描述不能超过2000个字符')
        .optional(),
    backstory: zod_1.z.string()
        .max(3000, '背景故事不能超过3000个字符')
        .optional(),
    speakingStyle: zod_1.z.string()
        .max(500, '说话风格不能超过500个字符')
        .optional(),
    scenario: zod_1.z.string()
        .max(1000, '场景设定不能超过1000个字符')
        .optional(),
    firstMessage: zod_1.z.string()
        .max(500, '开场白不能超过500个字符')
        .optional(),
    systemPrompt: zod_1.z.string()
        .max(2000, '系统提示词不能超过2000个字符')
        .optional(),
    exampleDialogs: zod_1.z.string()
        .max(2000, '示例对话不能超过2000个字符')
        .optional(),
    avatar: zod_1.z.string()
        .url('头像必须是有效的URL')
        .optional(),
    coverImage: zod_1.z.string()
        .url('封面图必须是有效的URL')
        .optional(),
    category: zod_1.z.string()
        .max(50, '分类不能超过50个字符')
        .default('原创'),
    tags: zod_1.z.string()
        .max(500, '标签不能超过500个字符')
        .default('[]'),
    language: zod_1.z.string()
        .max(10, '语言代码不能超过10个字符')
        .default('zh-CN'),
    model: zod_1.z.string()
        .max(50, '模型名称不能超过50个字符')
        .default('gpt-3.5-turbo'),
    temperature: zod_1.z.number()
        .min(0, 'temperature不能小于0')
        .max(2, 'temperature不能大于2')
        .default(0.7),
    maxTokens: zod_1.z.number()
        .min(1, 'maxTokens不能小于1')
        .max(4000, 'maxTokens不能大于4000')
        .default(1000),
    isPublic: zod_1.z.boolean()
        .default(true),
    isNSFW: zod_1.z.boolean()
        .default(false),
    mbtiType: zod_1.z.string()
        .max(10, 'MBTI类型不能超过10个字符')
        .optional(),
    backgroundImage: zod_1.z.string()
        .url('背景图必须是有效的URL')
        .optional()
});
// 角色更新验证schema
exports.updateCharacterSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(1, '角色名称不能为空')
        .max(100, '角色名称不能超过100个字符')
        .trim()
        .optional(),
    description: zod_1.z.string()
        .max(500, '角色描述不能超过500个字符')
        .optional(),
    personality: zod_1.z.string()
        .max(2000, '性格描述不能超过2000个字符')
        .optional(),
    backstory: zod_1.z.string()
        .max(3000, '背景故事不能超过3000个字符')
        .optional(),
    speakingStyle: zod_1.z.string()
        .max(500, '说话风格不能超过500个字符')
        .optional(),
    scenario: zod_1.z.string()
        .max(1000, '场景设定不能超过1000个字符')
        .optional(),
    firstMessage: zod_1.z.string()
        .max(500, '开场白不能超过500个字符')
        .optional(),
    systemPrompt: zod_1.z.string()
        .max(2000, '系统提示词不能超过2000个字符')
        .optional(),
    exampleDialogs: zod_1.z.string()
        .max(2000, '示例对话不能超过2000个字符')
        .optional(),
    avatar: zod_1.z.string()
        .url('头像必须是有效的URL')
        .optional()
        .nullable(),
    coverImage: zod_1.z.string()
        .url('封面图必须是有效的URL')
        .optional()
        .nullable(),
    category: zod_1.z.string()
        .max(50, '分类不能超过50个字符')
        .optional(),
    tags: zod_1.z.string()
        .max(500, '标签不能超过500个字符')
        .optional(),
    language: zod_1.z.string()
        .max(10, '语言代码不能超过10个字符')
        .optional(),
    model: zod_1.z.string()
        .max(50, '模型名称不能超过50个字符')
        .optional(),
    temperature: zod_1.z.number()
        .min(0, 'temperature不能小于0')
        .max(2, 'temperature不能大于2')
        .optional(),
    maxTokens: zod_1.z.number()
        .min(1, 'maxTokens不能小于1')
        .max(4000, 'maxTokens不能大于4000')
        .optional(),
    isPublic: zod_1.z.boolean().optional(),
    isNSFW: zod_1.z.boolean().optional(),
    mbtiType: zod_1.z.string()
        .max(10, 'MBTI类型不能超过10个字符')
        .optional(),
    backgroundImage: zod_1.z.string()
        .url('背景图必须是有效的URL')
        .optional()
        .nullable()
});
// 角色评分验证schema
exports.rateCharacterSchema = zod_1.z.object({
    rating: zod_1.z.number()
        .min(1, '评分不能小于1')
        .max(5, '评分不能大于5'),
    comment: zod_1.z.string()
        .max(1000, '评论不能超过1000个字符')
        .optional()
});
// 角色查询参数验证schema
exports.characterQuerySchema = zod_1.z.object({
    page: zod_1.z.string()
        .transform(Number)
        .refine(n => n >= 1, '页码必须大于0')
        .default('1'),
    limit: zod_1.z.string()
        .transform(Number)
        .refine(n => n >= 1 && n <= 100, '每页数量必须在1-100之间')
        .default('20'),
    sort: zod_1.z.enum(['created', 'rating', 'popular', 'chatCount', 'name'])
        .default('created'),
    search: zod_1.z.string()
        .max(100, '搜索关键词不能超过100个字符')
        .optional(),
    category: zod_1.z.string()
        .max(50, '分类不能超过50个字符')
        .optional(),
    tags: zod_1.z.array(zod_1.z.string())
        .optional()
});
//# sourceMappingURL=character.js.map