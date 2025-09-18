/**
 * TavernAI Plus 共享类型定义
 *
 * 此文件包含前后端共享的所有核心类型定义
 * 确保API契约和数据结构的一致性
 */

// 基础类型
export * from './base';

// 用户相关类型
export * from './user';

// 角色相关类型
export * from './character';

// 聊天相关类型
export * from './chat';

// API相关类型
export * from './api';

// 实用工具类型
export * from './utils';

// 数据库类型（基于Prisma，但添加前端需要的扩展）
export * from './database';

// 验证和表单类型
export * from './validation';

// 事件类型
export * from './events';

// 文件和媒体类型
export * from './media';
