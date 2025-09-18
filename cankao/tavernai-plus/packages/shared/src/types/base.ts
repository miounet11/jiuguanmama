/**
 * 基础类型定义
 */

// 基础实体接口
export interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// 可创建实体（排除自动生成字段）
export type CreateEntity<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

// 可更新实体（所有字段可选，排除id和时间戳）
export type UpdateEntity<T extends BaseEntity> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 排序参数
export interface SortParams<T = string> {
  field: T;
  order: 'asc' | 'desc';
}

// 过滤参数基础类型
export interface FilterParams {
  search?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

// 异步状态
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = unknown, E = Error> {
  status: AsyncStatus;
  data?: T;
  error?: E;
}

// ID类型别名，便于将来更改ID格式
export type EntityId = string;

// 时间戳类型
export type Timestamp = Date;

// 语言代码
export type LanguageCode = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR';

// 主题模式
export type ThemeMode = 'light' | 'dark' | 'system';

// 权限级别
export type PermissionLevel = 'read' | 'write' | 'admin' | 'owner';

// 状态枚举
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

// 可见性级别
export enum VisibilityLevel {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private'
}

// 内容评级
export enum ContentRating {
  GENERAL = 'general',     // 所有年龄
  TEEN = 'teen',          // 13+
  MATURE = 'mature',      // 17+
  ADULT = 'adult'         // 18+
}

// 选择器选项
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
}

// 键值对
export interface KeyValuePair<K = string, V = unknown> {
  key: K;
  value: V;
}

// 坐标
export interface Coordinates {
  x: number;
  y: number;
}

// 尺寸
export interface Dimensions {
  width: number;
  height: number;
}

// 颜色
export interface Color {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
  };
}
