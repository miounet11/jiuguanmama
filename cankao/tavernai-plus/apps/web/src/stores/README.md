# Progressive Disclosure Store 使用指南

## 概述

本文档介绍渐进式功能披露系统的两个核心状态管理store：
- `userModeStore`: 用户模式状态管理
- `featureUnlockStore`: 功能解锁状态管理

## 快速开始

### 1. 基础使用

```vue
<template>
  <div>
    <!-- 模式切换器 -->
    <el-switch
      v-model="isExpertMode"
      @change="handleModeSwitch"
      active-text="专家模式"
      inactive-text="简洁模式"
    />

    <!-- 升级建议 -->
    <el-alert
      v-if="shouldShowUpgrade"
      title="发现更多功能"
      :description="upgradeReason"
      type="info"
      show-icon
    >
      <el-button @click="upgradeToExpert">切换到专家模式</el-button>
    </el-alert>

    <!-- 功能列表 -->
    <div v-for="feature in visibleFeatures" :key="feature.id">
      <FeatureItem :feature="feature" @use="handleFeatureUse" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserModeStore } from '@/stores/userModeStore'
import { useFeatureUnlockStore } from '@/stores/featureUnlockStore'

const userModeStore = useUserModeStore()
const featureUnlockStore = useFeatureUnlockStore()

// 初始化
featureUnlockStore.initialize()

// 计算属性
const isExpertMode = computed({
  get: () => userModeStore.currentMode === 'expert',
  set: (value) => {
    const mode = value ? 'expert' : 'simplified'
    userModeStore.switchMode(mode)
  }
})

const shouldShowUpgrade = computed(() => userModeStore.shouldSuggestModeUpgrade)
const upgradeReason = computed(() => userModeStore.upgradeSuggestionReason)

const visibleFeatures = computed(() => {
  return featureUnlockStore.getVisibleFeatures('chat', userModeStore.currentMode)
})

// 事件处理
const handleModeSwitch = () => {
  userModeStore.recordFeatureUsage('mode-switch', true)
}

const upgradeToExpert = () => {
  isExpertMode.value = true
}

const handleFeatureUse = (featureId: string) => {
  const feature = featureUnlockStore.getFeatureDefinition(featureId)
  userModeStore.recordFeatureUsage(featureId, feature?.isExpertFeature)
  featureUnlockStore.recordFeatureUsage(featureId)
}
</script>
```

### 2. 组合式函数封装

```typescript
// composables/useProgressiveDisclosure.ts
import { computed } from 'vue'
import { useUserModeStore } from '@/stores/userModeStore'
import { useFeatureUnlockStore } from '@/stores/featureUnlockStore'

export function useProgressiveDisclosure(scope = 'global') {
  const userModeStore = useUserModeStore()
  const featureUnlockStore = useFeatureUnlockStore()

  const visibleFeatures = computed(() => {
    return featureUnlockStore.getVisibleFeatures(scope, userModeStore.currentMode)
  })

  const unlockProgress = computed(() => {
    return featureUnlockStore.getUnlockStats()
  })

  const recommendations = computed(() => {
    return featureUnlockStore.getRecommendedFeatures(3)
  })

  const switchMode = (mode: 'simplified' | 'expert') => {
    return userModeStore.switchMode(mode)
  }

  const recordUsage = (featureId: string) => {
    const feature = featureUnlockStore.getFeatureDefinition(featureId)
    userModeStore.recordFeatureUsage(featureId, feature?.isExpertFeature)
    featureUnlockStore.recordFeatureUsage(featureId)
  }

  return {
    // 状态
    currentMode: userModeStore.currentMode,
    userExperience: userModeStore.userExperience,
    shouldSuggestUpgrade: userModeStore.shouldSuggestModeUpgrade,

    // 计算属性
    visibleFeatures,
    unlockProgress,
    recommendations,

    // 方法
    switchMode,
    recordUsage
  }
}
```

## API 参考

### UserModeStore

#### 状态
- `currentMode`: 当前模式 ('simplified' | 'expert')
- `userExperience`: 用户体验数据
- `featureUnlocks`: 功能解锁记录
- `loading`: 加载状态

#### 主要方法
- `switchMode(mode, reason?)`: 切换用户模式
- `recordFeatureUsage(featureId, isExpert?)`: 记录功能使用
- `incrementSessionCount()`: 增加会话计数
- `incrementMessageCount(count?)`: 增加消息计数
- `recordCharacterUsage(characterId)`: 记录角色使用
- `dismissUpgradeSuggestion(hours?)`: 暂时关闭升级建议
- `loadUserModeData()`: 从服务器加载数据
- `resetUserModeData()`: 重置所有数据

#### 计算属性
- `shouldSuggestModeUpgrade`: 是否应该建议升级
- `upgradeSuggestionReason`: 升级建议原因
- `availableFeatures`: 当前可用功能列表

### FeatureUnlockStore

#### 状态
- `featureManifest`: 功能清单
- `unlockRules`: 解锁规则
- `loading`: 加载状态

#### 主要方法
- `initialize()`: 初始化store
- `getFeatureDefinition(id)`: 获取功能定义
- `getFeaturesByScope(scope)`: 获取指定范围功能
- `getVisibleFeatures(scope, mode)`: 获取可见功能
- `analyzeUnlockCondition(feature)`: 分析解锁条件
- `recordFeatureUsage(featureId)`: 记录功能使用
- `checkAndTriggerUnlocks()`: 检查并触发解锁
- `getUnlockStats()`: 获取解锁统计
- `getRecommendedFeatures(limit?)`: 获取推荐功能

#### 计算属性
- `unlockedFeatureIds`: 已解锁功能ID集合
- `unlockableFeatures`: 可解锁功能分析
- `recommendedUnlocks`: 推荐解锁功能
- `todayUnlockCount`: 今日解锁数量

## 集成示例

### 与路由守卫集成

```typescript
// router/index.ts
import { useUserModeStore } from '@/stores/userModeStore'

router.beforeEach(async (to, from, next) => {
  const userModeStore = useUserModeStore()

  // 记录页面访问
  if (to.meta.featureId) {
    await userModeStore.recordFeatureUsage(to.meta.featureId)
  }

  next()
})
```

### 与聊天系统集成

```typescript
// 在聊天组件中
const sendMessage = async (content: string) => {
  // 发送消息逻辑...

  // 更新统计
  await userModeStore.incrementMessageCount()
  await userModeStore.recordFeatureUsage('chat-basic')

  // 检查新功能解锁
  await featureUnlockStore.checkAndTriggerUnlocks()
}
```

### 与角色系统集成

```typescript
// 在角色选择组件中
const selectCharacter = async (characterId: string) => {
  // 选择角色逻辑...

  // 更新统计
  await userModeStore.recordCharacterUsage(characterId)
  await userModeStore.recordFeatureUsage('character-basic-browse')

  // 检查解锁
  await featureUnlockStore.checkAndTriggerUnlocks()
}
```

## 测试

运行测试：
```bash
npm run test stores/__tests__/userModeStore.test.ts
npm run test stores/__tests__/featureUnlockStore.test.ts
npm run test stores/__tests__/storeCompatibility.test.ts
```

## 注意事项

1. **性能优化**: 解锁检查是异步的，避免在高频操作中调用
2. **错误处理**: 所有API调用都有错误处理，失败时会降级到本地存储
3. **数据同步**: 重要状态变更会同时保存到本地存储和服务器
4. **兼容性**: 与现有stores保持独立，localStorage key不冲突
5. **扩展性**: 功能清单可以通过配置动态调整

## 故障排查

### 常见问题

1. **功能解锁不触发**
   - 检查解锁条件是否正确配置
   - 确认依赖功能已解锁
   - 验证用户体验数据是否更新

2. **模式切换无效**
   - 检查API端点是否可用
   - 确认本地存储权限
   - 验证组件是否正确监听状态变化

3. **推荐算法不准确**
   - 调整analyzeUpgradeOpportunity的条件
   - 检查用户体验数据的准确性
   - 考虑用户行为的多样性

### 调试技巧

```typescript
// 开启详细日志
const userModeStore = useUserModeStore()
console.log('当前模式:', userModeStore.currentMode)
console.log('用户体验:', userModeStore.userExperience)
console.log('解锁功能:', userModeStore.featureUnlocks)

const featureUnlockStore = useFeatureUnlockStore()
console.log('可见功能:', featureUnlockStore.getVisibleFeatures('chat', 'simplified'))
console.log('解锁统计:', featureUnlockStore.getUnlockStats())
```