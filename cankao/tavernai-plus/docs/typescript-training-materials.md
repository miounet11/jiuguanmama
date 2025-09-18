# TypeScript 培训材料

## 📚 培训课程大纲

### 第一阶段：基础入门 (第1-2周)

#### 课程1: TypeScript 概述与环境搭建 (2小时)

**学习目标**：
- 理解 TypeScript 的价值和优势
- 掌握开发环境配置
- 了解项目结构和工具链

**内容大纲**：
1. **为什么选择 TypeScript？** (30分钟)
   - JavaScript 的类型问题
   - TypeScript 的解决方案
   - 项目实际收益分析

2. **环境搭建** (45分钟)
   - Node.js 和 npm 安装
   - VS Code 配置和扩展
   - 项目克隆和依赖安装

3. **项目结构解析** (30分钟)
   - Monorepo 架构理解
   - TypeScript 配置文件
   - 构建和开发脚本

4. **第一次代码运行** (15分钟)
   - 启动开发服务器
   - 运行类型检查
   - 理解错误信息

**实践练习**：
```typescript
// 练习1: 类型注解基础
function greetUser(name: string, age: number): string {
  return `Hello ${name}, you are ${age} years old`;
}

// 任务: 修复以下代码的类型错误
// const user = { name: "Alice", age: "25" }; // 错误：age 应该是 number
// console.log(greetUser(user.name, user.age));

// 练习2: 接口定义
interface User {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
}

// 任务: 创建一个符合 User 接口的对象
```

#### 课程2: 基础类型系统 (2小时)

**学习目标**：
- 掌握 TypeScript 基础类型
- 理解类型推导和类型注解
- 学会使用接口和类型别名

**内容大纲**：
1. **基础类型** (45分钟)
   ```typescript
   // 原始类型
   let name: string = "张三";
   let age: number = 25;
   let isActive: boolean = true;
   let data: null = null;
   let notSet: undefined = undefined;
   
   // 数组和元组
   let numbers: number[] = [1, 2, 3];
   let tuple: [string, number] = ["Alice", 25];
   
   // 对象类型
   let user: { name: string; age: number } = {
     name: "Bob",
     age: 30
   };
   ```

2. **接口定义** (45分钟)
   ```typescript
   interface Product {
     id: string;
     name: string;
     price: number;
     category?: string; // 可选属性
     readonly createdAt: Date; // 只读属性
   }
   
   interface ProductWithMethods extends Product {
     calculateDiscount(percentage: number): number;
   }
   ```

3. **类型别名和联合类型** (30分钟)
   ```typescript
   type Status = "loading" | "success" | "error";
   type ID = string | number;
   
   interface ApiResponse<T> {
     data: T;
     status: Status;
     message?: string;
   }
   ```

**实践练习**：
```typescript
// 练习: 设计用户管理系统的类型

// 1. 定义用户角色枚举
enum UserRole {
  ADMIN = "admin",
  USER = "user",
  MODERATOR = "moderator"
}

// 2. 定义用户接口
interface User {
  // 补充用户属性
}

// 3. 定义用户操作接口
interface UserActions {
  // 补充用户操作方法
}

// 4. 实现用户类
class UserManager implements UserActions {
  // 实现用户管理逻辑
}
```

#### 课程3: 函数和类的类型化 (2小时)

**学习目标**：
- 掌握函数类型定义
- 理解泛型的基本用法
- 学会类的类型化

**内容大纲**：
1. **函数类型** (45分钟)
   ```typescript
   // 函数声明
   function add(a: number, b: number): number {
     return a + b;
   }
   
   // 函数表达式
   const multiply: (a: number, b: number) => number = (a, b) => a * b;
   
   // 可选参数和默认参数
   function greet(name: string, title?: string, greeting = "Hello"): string {
     return `${greeting} ${title ? title + " " : ""}${name}`;
   }
   
   // 剩余参数
   function sum(...numbers: number[]): number {
     return numbers.reduce((total, num) => total + num, 0);
   }
   ```

2. **泛型基础** (45分钟)
   ```typescript
   // 泛型函数
   function identity<T>(arg: T): T {
     return arg;
   }
   
   // 泛型接口
   interface Container<T> {
     value: T;
     getValue(): T;
   }
   
   // 泛型约束
   interface Lengthwise {
     length: number;
   }
   
   function logLength<T extends Lengthwise>(arg: T): T {
     console.log(arg.length);
     return arg;
   }
   ```

3. **类的类型化** (30分钟)
   ```typescript
   abstract class Animal {
     protected name: string;
     
     constructor(name: string) {
       this.name = name;
     }
     
     abstract makeSound(): string;
   }
   
   class Dog extends Animal {
     private breed: string;
     
     constructor(name: string, breed: string) {
       super(name);
       this.breed = breed;
     }
     
     makeSound(): string {
       return "Woof!";
     }
   }
   ```

### 第二阶段：进阶应用 (第3-4周)

#### 课程4: 高级类型特性 (3小时)

**学习目标**：
- 掌握条件类型和映射类型
- 理解类型推导和类型守卫
- 学会使用工具类型

**内容大纲**：
1. **条件类型** (60分钟)
   ```typescript
   // 基本条件类型
   type IsString<T> = T extends string ? true : false;
   
   // 分布式条件类型
   type ToArray<T> = T extends any ? T[] : never;
   type StrOrNumArray = ToArray<string | number>; // string[] | number[]
   
   // 条件类型推导
   type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
   type FuncReturn = GetReturnType<() => string>; // string
   ```

2. **映射类型** (60分钟)
   ```typescript
   // 基本映射类型
   type Readonly<T> = {
     readonly [P in keyof T]: T[P];
   };
   
   // 条件映射类型
   type NullableKeys<T> = {
     [K in keyof T]: T[K] extends null | undefined ? K : never;
   }[keyof T];
   
   // 模板字面量类型
   type EventName<T extends string> = `on${Capitalize<T>}`;
   type MouseEvent = EventName<"click" | "hover">; // "onClick" | "onHover"
   ```

3. **类型守卫和断言** (60分钟)
   ```typescript
   // 类型谓词
   function isString(value: unknown): value is string {
     return typeof value === "string";
   }
   
   // 判别联合类型
   interface Circle {
     kind: "circle";
     radius: number;
   }
   
   interface Rectangle {
     kind: "rectangle";
     width: number;
     height: number;
   }
   
   type Shape = Circle | Rectangle;
   
   function getArea(shape: Shape): number {
     switch (shape.kind) {
       case "circle":
         return Math.PI * shape.radius ** 2;
       case "rectangle":
         return shape.width * shape.height;
     }
   }
   ```

#### 课程5: 实际项目应用 (3小时)

**学习目标**：
- 掌握 Vue 3 + TypeScript 最佳实践
- 学会 API 类型设计
- 理解状态管理的类型化

**内容大纲**：
1. **Vue 3 组件类型化** (90分钟)
   ```typescript
   // defineComponent 用法
   import { defineComponent, PropType, ref, computed } from 'vue';
   
   interface User {
     id: string;
     name: string;
     email: string;
   }
   
   export default defineComponent({
     name: 'UserCard',
     props: {
       user: {
         type: Object as PropType<User>,
         required: true
       },
       showEmail: {
         type: Boolean,
         default: false
       }
     },
     emits: {
       userClick: (user: User) => true,
       emailToggle: (show: boolean) => true
     },
     setup(props, { emit }) {
       const isExpanded = ref(false);
       
       const displayName = computed(() => 
         isExpanded.value ? props.user.name : props.user.name.slice(0, 10)
       );
       
       const handleClick = () => {
         emit('userClick', props.user);
       };
       
       return {
         isExpanded,
         displayName,
         handleClick
       };
     }
   });
   ```

2. **Composables 类型化** (90分钟)
   ```typescript
   // useUser composable
   import { ref, computed, Ref } from 'vue';
   
   interface UseUserReturn {
     user: Ref<User | null>;
     loading: Ref<boolean>;
     error: Ref<string | null>;
     fetchUser: (id: string) => Promise<void>;
     updateUser: (updates: Partial<User>) => Promise<void>;
   }
   
   export function useUser(): UseUserReturn {
     const user = ref<User | null>(null);
     const loading = ref(false);
     const error = ref<string | null>(null);
     
     const fetchUser = async (id: string): Promise<void> => {
       loading.value = true;
       error.value = null;
       
       try {
         const response = await api.get(`/users/${id}`);
         user.value = response.data;
       } catch (err) {
         error.value = err instanceof Error ? err.message : 'Unknown error';
       } finally {
         loading.value = false;
       }
     };
     
     const updateUser = async (updates: Partial<User>): Promise<void> => {
       if (!user.value) return;
       
       try {
         const response = await api.put(`/users/${user.value.id}`, updates);
         user.value = response.data;
       } catch (err) {
         error.value = err instanceof Error ? err.message : 'Update failed';
       }
     };
     
     return {
       user: readonly(user),
       loading: readonly(loading),
       error: readonly(error),
       fetchUser,
       updateUser
     };
   }
   ```

### 第三阶段：专家级技能 (第5-8周)

#### 课程6: 类型系统设计 (4小时)

**学习目标**：
- 设计复杂的类型系统
- 掌握类型级编程
- 学会性能优化技巧

**实战项目：设计类型安全的表单库**

```typescript
// 1. 基础类型定义
type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox';

interface BaseField {
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
}

interface TextField extends BaseField {
  type: 'text' | 'email' | 'password';
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
}

interface NumberField extends BaseField {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
}

interface SelectField extends BaseField {
  type: 'select';
  options: Array<{ value: string; label: string }>;
  multiple?: boolean;
}

interface CheckboxField extends BaseField {
  type: 'checkbox';
  checked?: boolean;
}

type FormField = TextField | NumberField | SelectField | CheckboxField;

// 2. 表单 schema 类型
type FormSchema<T extends Record<string, FormField>> = T;

// 3. 表单值类型推导
type InferFormValues<T extends FormSchema<any>> = {
  [K in keyof T]: T[K] extends TextField 
    ? string
    : T[K] extends NumberField
    ? number
    : T[K] extends SelectField
    ? T[K]['multiple'] extends true
      ? string[]
      : string
    : T[K] extends CheckboxField
    ? boolean
    : never;
};

// 4. 验证规则类型
type ValidationRule<T> = (value: T) => string | null;

type FormValidation<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

// 5. 表单状态类型
interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

// 6. 表单 hook 实现
function useForm<T extends FormSchema<any>>(
  schema: T,
  validation?: FormValidation<InferFormValues<T>>
) {
  type FormValues = InferFormValues<T>;
  
  const state = reactive<FormState<FormValues>>({
    values: {} as FormValues,
    errors: {},
    touched: {},
    isValid: false,
    isSubmitting: false
  });
  
  // 实现表单逻辑...
  
  return {
    state: readonly(state),
    setValue: (field: keyof FormValues, value: FormValues[keyof FormValues]) => void,
    setError: (field: keyof FormValues, error: string) => void,
    validate: () => boolean,
    submit: (handler: (values: FormValues) => Promise<void>) => Promise<void>
  };
}

// 使用示例
const userFormSchema = {
  username: {
    type: 'text' as const,
    name: 'username',
    label: 'Username',
    required: true,
    minLength: 3
  },
  email: {
    type: 'email' as const,
    name: 'email',
    label: 'Email',
    required: true
  },
  age: {
    type: 'number' as const,
    name: 'age',
    label: 'Age',
    min: 18,
    max: 100
  }
} satisfies FormSchema<any>;

// TypeScript 会自动推导出正确的类型
const { state, setValue, submit } = useForm(userFormSchema);
// state.values 的类型为: { username: string; email: string; age: number }
```

## 🎯 实践项目

### 项目1: 类型安全的 API 客户端
构建一个完全类型安全的 API 客户端，支持：
- 端点类型定义
- 请求/响应类型推导
- 错误处理类型化
- 中间件类型安全

### 项目2: 状态管理库
设计一个 TypeScript 状态管理库，包含：
- 类型安全的 actions
- 自动推导的 getters
- 中间件支持
- 开发工具集成

### 项目3: 表单验证框架
开发一个声明式表单验证框架：
- Schema 驱动的类型生成
- 组合式验证规则
- 异步验证支持
- 国际化错误消息

## 📝 评估标准

### 基础级别 (1-2周后)
- [ ] 能够配置 TypeScript 开发环境
- [ ] 理解基础类型系统
- [ ] 能编写类型安全的函数和接口
- [ ] 掌握基本的 Vue 3 组件类型化

### 进阶级别 (3-4周后)
- [ ] 熟练使用高级类型特性
- [ ] 能设计复杂的类型接口
- [ ] 掌握泛型的高级用法
- [ ] 能解决复杂的类型问题

### 专家级别 (5-8周后)
- [ ] 能设计完整的类型系统
- [ ] 掌握类型级编程技巧
- [ ] 能优化类型性能
- [ ] 能指导其他开发者

## 🔧 练习工具

### 在线练习平台
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Type Challenges](https://github.com/type-challenges/type-challenges)
- [TypeScript Exercises](https://typescript-exercises.github.io/)

### 代码质量检查
```bash
# 运行类型检查
npm run type-check

# 检查类型覆盖率
npm run type-coverage

# 运行 ESLint
npm run lint

# 完整质量检查
npm run validate
```

### 学习资源
- **官方文档**: [TypeScript 手册](https://www.typescriptlang.org/docs/)
- **进阶指南**: [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- **实战项目**: [TavernAI Plus 源码](../README.md)

---

*培训材料会根据团队反馈和技术发展持续更新，建议定期查看最新版本。*