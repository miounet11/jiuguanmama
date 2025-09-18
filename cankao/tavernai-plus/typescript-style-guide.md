# TavernAI Plus TypeScript编码规范

## 概述

本文档定义了TavernAI Plus项目的TypeScript编码标准，确保代码的一致性、可维护性和类型安全性。

## 核心原则

### 1. 严格类型检查
- ✅ 始终启用`strict: true`
- ✅ 禁用`any`类型，使用`unknown`代替
- ✅ 确保100%类型覆盖率（关键模块）
- ✅ 优先使用类型断言而非类型转换

### 2. 命名规范

#### 类型命名
```typescript
// ✅ 推荐：接口使用PascalCase
interface UserProfile {
  id: string;
  username: string;
}

// ✅ 推荐：类型别名使用PascalCase
type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};

// ✅ 推荐：枚举使用PascalCase
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

// ❌ 避免：不要使用I前缀
interface IUserProfile {} // 错误
```

#### 变量和函数命名
```typescript
// ✅ 推荐：使用camelCase
const userProfileData = getUserProfile();
const isAuthenticated = checkAuthStatus();

// ✅ 推荐：布尔值使用is/has/can/should前缀
const isLoading = false;
const hasPermission = true;
const canEdit = checkEditPermission();

// ✅ 推荐：常量使用UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.tavernai.com';
```

### 3. 函数类型定义

#### 函数签名
```typescript
// ✅ 推荐：明确的参数和返回类型
function createUser(
  userData: CreateUserRequest
): Promise<ApiResponse<User>> {
  // 实现
}

// ✅ 推荐：使用类型谓词
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'username' in obj;
}

// ✅ 推荐：异步函数明确返回类型
async function fetchUserData(id: string): Promise<User | null> {
  // 实现
}
```

#### 高阶函数
```typescript
// ✅ 推荐：泛型约束清晰
function createApiHandler<T extends Record<string, unknown>>(
  endpoint: string,
  validator: (data: unknown) => data is T
): (request: Request) => Promise<ApiResponse<T>> {
  return async (request: Request) => {
    // 实现
  };
}
```

### 4. 接口设计原则

#### 基础接口
```typescript
// ✅ 推荐：基础实体接口
interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ✅ 推荐：继承基础接口
interface User extends BaseEntity {
  username: string;
  email: string;
  role: UserRole;
  profile?: UserProfile;
}

// ✅ 推荐：可选属性明确标注
interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  profile?: Partial<UserProfile>;
}
```

#### 联合类型和判别联合
```typescript
// ✅ 推荐：使用判别联合
interface LoadingState {
  status: 'loading';
}

interface SuccessState {
  status: 'success';
  data: User[];
}

interface ErrorState {
  status: 'error';
  error: string;
}

type AsyncState = LoadingState | SuccessState | ErrorState;

// ✅ 推荐：类型守卫处理联合类型
function handleAsyncState(state: AsyncState): void {
  switch (state.status) {
    case 'loading':
      // TypeScript知道这里是LoadingState
      showLoadingSpinner();
      break;
    case 'success':
      // TypeScript知道这里是SuccessState
      displayUsers(state.data);
      break;
    case 'error':
      // TypeScript知道这里是ErrorState
      showError(state.error);
      break;
  }
}
```

### 5. 泛型使用规范

#### 泛型约束
```typescript
// ✅ 推荐：有意义的泛型约束
interface Repository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// ✅ 推荐：条件类型
type ApiEndpoint<T> = T extends string 
  ? `/${T}` 
  : never;

// ✅ 推荐：映射类型
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

### 6. 错误处理

#### 类型安全的错误处理
```typescript
// ✅ 推荐：定义错误类型
class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ✅ 推荐：Result类型模式
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function safeApiCall<T>(
  fn: () => Promise<T>
): Promise<Result<T, ApiError>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error };
    }
    return { 
      success: false, 
      error: new ApiError('Unknown error', 'UNKNOWN', 500) 
    };
  }
}
```

### 7. Vue.js特定规范

#### 组件类型定义
```typescript
// ✅ 推荐：明确的Props类型
interface ChatComponentProps {
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
}

// ✅ 推荐：使用defineComponent
export default defineComponent({
  name: 'ChatComponent',
  props: {
    messages: {
      type: Array as PropType<Message[]>,
      required: true
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: {
    sendMessage: (message: string) => typeof message === 'string'
  },
  setup(props, { emit }) {
    // 类型安全的实现
  }
});
```

#### Composables类型定义
```typescript
// ✅ 推荐：明确的Composable返回类型
interface UseUserReturn {
  user: Ref<User | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  fetchUser: (id: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

function useUser(): UseUserReturn {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 实现

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchUser,
    updateUser
  };
}
```

### 8. API和数据层类型

#### Prisma集成
```typescript
// ✅ 推荐：扩展Prisma类型
import { User as PrismaUser, Character as PrismaCharacter } from '@prisma/client';

// 前端显示用的类型
interface UserWithProfile extends PrismaUser {
  profile: {
    avatar: string;
    bio: string;
  };
  charactersCount: number;
}

// API响应类型
interface GetUserResponse extends ApiResponse<UserWithProfile> {}

// 请求类型
interface UpdateUserRequest {
  username?: string;
  email?: string;
  profile?: {
    avatar?: string;
    bio?: string;
  };
}
```

#### API路由类型
```typescript
// ✅ 推荐：类型安全的API路由
interface ApiRoutes {
  'GET /api/users/:id': {
    params: { id: string };
    response: GetUserResponse;
  };
  'POST /api/users': {
    body: CreateUserRequest;
    response: CreateUserResponse;
  };
  'PUT /api/users/:id': {
    params: { id: string };
    body: UpdateUserRequest;
    response: UpdateUserResponse;
  };
}

// 类型安全的API客户端
class ApiClient {
  async get<K extends keyof ApiRoutes>(
    endpoint: K,
    ...args: ApiRoutes[K] extends { params: infer P } ? [P] : []
  ): Promise<ApiRoutes[K]['response']> {
    // 实现
  }
}
```

## 工具配置

### ESLint TypeScript规则
```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": "error",
  "@typescript-eslint/explicit-function-return-type": "warn",
  "@typescript-eslint/prefer-nullish-coalescing": "error",
  "@typescript-eslint/prefer-optional-chain": "error",
  "@typescript-eslint/no-non-null-assertion": "error"
}
```

### Prettier TypeScript配置
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 质量检查

### 必须通过的检查
1. TypeScript编译无错误
2. ESLint TypeScript规则检查
3. 类型覆盖率 ≥ 95%
4. 单元测试类型安全

### 推荐的检查
1. 复杂度分析
2. 类型推导性能分析
3. 依赖循环检测
4. 未使用类型清理

## 常见反模式

### 避免的模式
```typescript
// ❌ 避免：使用any
function processData(data: any): any {
  return data.whatever;
}

// ❌ 避免：类型断言滥用
const user = response as User;

// ❌ 避免：非空断言滥用
const name = user.profile!.name!;

// ❌ 避免：过度嵌套的条件类型
type ComplexType<T> = T extends string 
  ? T extends `${infer Prefix}_${infer Suffix}` 
    ? Prefix extends 'user' 
      ? UserType<Suffix> 
      : never 
    : never 
  : never;
```

### 推荐的替代方案
```typescript
// ✅ 推荐：使用unknown和类型守卫
function processData(data: unknown): ProcessedData {
  if (isValidData(data)) {
    return processValidData(data);
  }
  throw new Error('Invalid data');
}

// ✅ 推荐：安全的类型检查
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

// ✅ 推荐：可选链和空值合并
const name = user.profile?.name ?? 'Unknown';
```

## 总结

遵循这些规范能够：
- 提高代码可读性和可维护性
- 减少运行时错误
- 提升开发效率
- 确保团队协作一致性
- 支持重构和扩展

定期评审和更新这些规范，确保与TypeScript生态系统的最佳实践保持同步。