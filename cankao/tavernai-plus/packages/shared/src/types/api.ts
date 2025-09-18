/**
 * API相关类型定义
 */

// API响应基础类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  meta?: ResponseMeta;
}

// API错误类型
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// 响应元数据
export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
  executionTime?: number;
}

// HTTP状态码常量
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;

export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

// API错误代码
export enum ApiErrorCode {
  // 认证和授权错误
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // 验证错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // 资源错误
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // 业务逻辑错误
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  FEATURE_NOT_AVAILABLE = 'FEATURE_NOT_AVAILABLE',

  // 系统错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // 外部服务错误
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

// 成功响应类型
export interface SuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T;
}

// 错误响应类型
export interface ErrorResponse extends ApiResponse<never> {
  success: false;
  errors: ApiError[];
}

// API结果类型（用于类型安全的错误处理）
export type ApiResult<T> = SuccessResponse<T> | ErrorResponse;

// 请求配置
export interface ApiRequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  abortSignal?: AbortSignal;
  headers?: Record<string, string>;
}

// API端点类型定义
export interface ApiEndpoints {
  // 用户相关
  'GET /api/users/me': {
    response: SuccessResponse<User>;
  };
  'PUT /api/users/me': {
    body: UpdateUserRequest;
    response: SuccessResponse<User>;
  };
  'POST /api/users/avatar': {
    body: FormData;
    response: SuccessResponse<{ url: string }>;
  };

  // 角色相关
  'GET /api/characters': {
    query?: GetCharactersQuery;
    response: SuccessResponse<PaginatedResponse<Character>>;
  };
  'GET /api/characters/:id': {
    params: { id: string };
    response: SuccessResponse<Character>;
  };
  'POST /api/characters': {
    body: CreateCharacterRequest;
    response: SuccessResponse<Character>;
  };
  'PUT /api/characters/:id': {
    params: { id: string };
    body: UpdateCharacterRequest;
    response: SuccessResponse<Character>;
  };
  'DELETE /api/characters/:id': {
    params: { id: string };
    response: SuccessResponse<void>;
  };

  // 聊天相关
  'GET /api/chats': {
    query?: GetChatsQuery;
    response: SuccessResponse<PaginatedResponse<Chat>>;
  };
  'GET /api/chats/:id': {
    params: { id: string };
    response: SuccessResponse<Chat>;
  };
  'POST /api/chats': {
    body: CreateChatRequest;
    response: SuccessResponse<Chat>;
  };
  'POST /api/chats/:id/messages': {
    params: { id: string };
    body: SendMessageRequest;
    response: SuccessResponse<Message>;
  };
  'GET /api/chats/:id/messages': {
    params: { id: string };
    query?: GetMessagesQuery;
    response: SuccessResponse<PaginatedResponse<Message>>;
  };

  // AI服务相关
  'POST /api/ai/generate': {
    body: GenerateRequest;
    response: SuccessResponse<GenerateResponse>;
  };
  'GET /api/ai/models': {
    response: SuccessResponse<AiModel[]>;
  };
}

// 提取API路径
export type ApiPath = keyof ApiEndpoints;

// 提取特定端点的类型
export type EndpointConfig<T extends ApiPath> = ApiEndpoints[T];

// 类型安全的API客户端接口
export interface TypedApiClient {
  get<T extends ApiPath>(
    path: T,
    config?: ApiRequestConfig & EndpointConfig<T>
  ): Promise<EndpointConfig<T>['response']>;

  post<T extends ApiPath>(
    path: T,
    data: EndpointConfig<T> extends { body: infer B } ? B : never,
    config?: ApiRequestConfig
  ): Promise<EndpointConfig<T>['response']>;

  put<T extends ApiPath>(
    path: T,
    data: EndpointConfig<T> extends { body: infer B } ? B : never,
    config?: ApiRequestConfig
  ): Promise<EndpointConfig<T>['response']>;

  delete<T extends ApiPath>(
    path: T,
    config?: ApiRequestConfig
  ): Promise<EndpointConfig<T>['response']>;
}

// WebSocket消息类型
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
  id?: string;
}

// 实时事件类型
export enum WebSocketEventType {
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_SENT = 'message_sent',
  USER_TYPING = 'user_typing',
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  CHAT_UPDATED = 'chat_updated',
  CHARACTER_UPDATED = 'character_updated'
}

// 导入其他模块的类型引用
import type { User, UpdateUserRequest } from './user';
import type { Character, CreateCharacterRequest, UpdateCharacterRequest, GetCharactersQuery } from './character';
import type { Chat, Message, CreateChatRequest, SendMessageRequest, GetChatsQuery, GetMessagesQuery } from './chat';
import type { GenerateRequest, GenerateResponse, AiModel } from './ai';
import type { PaginatedResponse } from './base';
