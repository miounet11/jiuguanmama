import { z } from 'zod'

// 角色创建验证schema
export const createCharacterSchema = z.object({
  name: z.string()
    .min(1, '角色名称不能为空')
    .max(100, '角色名称不能超过100个字符')
    .trim(),

  description: z.string()
    .max(500, '角色描述不能超过500个字符')
    .optional(),

  personality: z.string()
    .max(2000, '性格描述不能超过2000个字符')
    .optional(),

  backstory: z.string()
    .max(3000, '背景故事不能超过3000个字符')
    .optional(),

  speakingStyle: z.string()
    .max(500, '说话风格不能超过500个字符')
    .optional(),

  scenario: z.string()
    .max(1000, '场景设定不能超过1000个字符')
    .optional(),

  firstMessage: z.string()
    .max(500, '开场白不能超过500个字符')
    .optional(),

  systemPrompt: z.string()
    .max(2000, '系统提示词不能超过2000个字符')
    .optional(),

  exampleDialogs: z.string()
    .max(2000, '示例对话不能超过2000个字符')
    .optional(),

  avatar: z.string()
    .url('头像必须是有效的URL')
    .optional(),

  coverImage: z.string()
    .url('封面图必须是有效的URL')
    .optional(),

  category: z.string()
    .max(50, '分类不能超过50个字符')
    .default('原创'),

  tags: z.string()
    .max(500, '标签不能超过500个字符')
    .default('[]'),

  language: z.string()
    .max(10, '语言代码不能超过10个字符')
    .default('zh-CN'),

  model: z.string()
    .max(50, '模型名称不能超过50个字符')
    .default('gpt-3.5-turbo'),

  temperature: z.number()
    .min(0, 'temperature不能小于0')
    .max(2, 'temperature不能大于2')
    .default(0.7),

  maxTokens: z.number()
    .min(1, 'maxTokens不能小于1')
    .max(4000, 'maxTokens不能大于4000')
    .default(1000),

  isPublic: z.boolean()
    .default(true),

  isNSFW: z.boolean()
    .default(false),

  mbtiType: z.string()
    .max(10, 'MBTI类型不能超过10个字符')
    .optional(),

  backgroundImage: z.string()
    .url('背景图必须是有效的URL')
    .optional()
})

// 角色更新验证schema
export const updateCharacterSchema = z.object({
  name: z.string()
    .min(1, '角色名称不能为空')
    .max(100, '角色名称不能超过100个字符')
    .trim()
    .optional(),

  description: z.string()
    .max(500, '角色描述不能超过500个字符')
    .optional(),

  personality: z.string()
    .max(2000, '性格描述不能超过2000个字符')
    .optional(),

  backstory: z.string()
    .max(3000, '背景故事不能超过3000个字符')
    .optional(),

  speakingStyle: z.string()
    .max(500, '说话风格不能超过500个字符')
    .optional(),

  scenario: z.string()
    .max(1000, '场景设定不能超过1000个字符')
    .optional(),

  firstMessage: z.string()
    .max(500, '开场白不能超过500个字符')
    .optional(),

  systemPrompt: z.string()
    .max(2000, '系统提示词不能超过2000个字符')
    .optional(),

  exampleDialogs: z.string()
    .max(2000, '示例对话不能超过2000个字符')
    .optional(),

  avatar: z.string()
    .url('头像必须是有效的URL')
    .optional()
    .nullable(),

  coverImage: z.string()
    .url('封面图必须是有效的URL')
    .optional()
    .nullable(),

  category: z.string()
    .max(50, '分类不能超过50个字符')
    .optional(),

  tags: z.string()
    .max(500, '标签不能超过500个字符')
    .optional(),

  language: z.string()
    .max(10, '语言代码不能超过10个字符')
    .optional(),

  model: z.string()
    .max(50, '模型名称不能超过50个字符')
    .optional(),

  temperature: z.number()
    .min(0, 'temperature不能小于0')
    .max(2, 'temperature不能大于2')
    .optional(),

  maxTokens: z.number()
    .min(1, 'maxTokens不能小于1')
    .max(4000, 'maxTokens不能大于4000')
    .optional(),

  isPublic: z.boolean().optional(),
  isNSFW: z.boolean().optional(),
  mbtiType: z.string()
    .max(10, 'MBTI类型不能超过10个字符')
    .optional(),

  backgroundImage: z.string()
    .url('背景图必须是有效的URL')
    .optional()
    .nullable()
})

// 角色评分验证schema
export const rateCharacterSchema = z.object({
  rating: z.number()
    .min(1, '评分不能小于1')
    .max(5, '评分不能大于5'),
  comment: z.string()
    .max(1000, '评论不能超过1000个字符')
    .optional()
})

// 角色查询参数验证schema
export const characterQuerySchema = z.object({
  page: z.string()
    .transform(Number)
    .refine(n => n >= 1, '页码必须大于0')
    .default('1'),

  limit: z.string()
    .transform(Number)
    .refine(n => n >= 1 && n <= 100, '每页数量必须在1-100之间')
    .default('20'),

  sort: z.enum(['created', 'rating', 'popular', 'chatCount', 'name'])
    .default('created'),

  search: z.string()
    .max(100, '搜索关键词不能超过100个字符')
    .optional(),

  category: z.string()
    .max(50, '分类不能超过50个字符')
    .optional(),

  tags: z.array(z.string())
    .optional()
})