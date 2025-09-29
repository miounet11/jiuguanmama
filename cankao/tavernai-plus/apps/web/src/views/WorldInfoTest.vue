<template>
  <div class="worldinfo-test-page">
    <AppLayout>
      <!-- 页面头部 -->
      <div class="page-header mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <svg class="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clip-rule="evenodd"/>
              </svg>
              WorldInfo时空化测试
            </h1>
            <p class="text-gray-400">
              测试时空酒馆WorldInfo系统的时空属性、关系触发器和文化语境功能
            </p>
          </div>
        </div>
      </div>

      <!-- 测试内容区域 -->
      <div class="test-content space-y-6">
        <!-- 时空属性测试 -->
        <div class="test-section bg-gray-900/50 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clip-rule="evenodd"/>
            </svg>
            时空属性绑定测试
          </h2>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 测试条目1 -->
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h3 class="text-white font-medium mb-3">魔法森林条目</h3>
              <WorldInfoEntry
                :entry="testEntry1"
                scenario-id="test-scenario"
                @update="handleEntryUpdate"
              />
            </div>

            <!-- 测试条目2 -->
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h3 class="text-white font-medium mb-3">未来都市条目</h3>
              <WorldInfoEntry
                :entry="testEntry2"
                scenario-id="test-scenario"
                @update="handleEntryUpdate"
              />
            </div>
          </div>
        </div>

        <!-- 关系触发器测试 -->
        <div class="test-section bg-gray-900/50 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
            </svg>
            关系触发器测试
          </h2>

          <div class="bg-gray-800/50 rounded-lg p-4">
            <h3 class="text-white font-medium mb-3">师徒关系触发条目</h3>
            <WorldInfoEntry
              :entry="testEntry3"
              scenario-id="test-scenario"
              @update="handleEntryUpdate"
            />
          </div>
        </div>

        <!-- 文化语境测试 -->
        <div class="test-section bg-gray-900/50 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
            文化语境测试
          </h2>

          <div class="bg-gray-800/50 rounded-lg p-4">
            <h3 class="text-white font-medium mb-3">古代中国文化条目</h3>
            <WorldInfoEntry
              :entry="testEntry4"
              scenario-id="test-scenario"
              @update="handleEntryUpdate"
            />
          </div>
        </div>

        <!-- 测试结果展示 -->
        <div class="test-section bg-gray-900/50 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">测试结果</h2>
          <div class="bg-gray-800/50 rounded-lg p-4">
            <pre class="text-green-400 text-sm overflow-auto">{{ JSON.stringify(testResults, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </AppLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import WorldInfoEntry from '@/components/scenario/WorldInfoEntry.vue'
import type { WorldInfoEntry as WorldInfoEntryType } from '@/types/scenario'

// 测试数据
const testEntry1 = reactive<WorldInfoEntryType>({
  id: 'test-entry-1',
  scenarioId: 'test-scenario',
  title: '魔法森林的秘密',
  content: '魔法森林中隐藏着古老的魔法源泉，能够增强魔法师的能力。',
  keywords: ['魔法森林', '魔法源泉', '古老魔法'],
  priority: 50,
  insertDepth: 2,
  probability: 0.8,
  matchType: 'contains',
  caseSensitive: false,
  isActive: true,
  triggerOnce: false,
  excludeRecursion: false,
  category: '地点',
  position: 'after',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // 时空属性
  spacetimeAttributes: ['魔力共鸣', '空间扭曲']
})

const testEntry2 = reactive<WorldInfoEntryType>({
  id: 'test-entry-2',
  scenarioId: 'test-scenario',
  title: '未来都市科技',
  content: '未来都市配备了先进的AI系统，能够预测和响应市民的需求。',
  keywords: ['未来都市', 'AI系统', '智能预测'],
  priority: 45,
  insertDepth: 1,
  probability: 0.9,
  matchType: 'contains',
  caseSensitive: false,
  isActive: true,
  triggerOnce: false,
  excludeRecursion: false,
  category: '科技',
  position: 'before',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // 时空属性
  spacetimeAttributes: ['时间加速', '空间压缩']
})

const testEntry3 = reactive<WorldInfoEntryType>({
  id: 'test-entry-3',
  scenarioId: 'test-scenario',
  title: '师徒传承',
  content: '当徒弟展现出足够的悟性时，师父会传授秘传心法。',
  keywords: ['师徒', '传承', '秘传心法'],
  priority: 60,
  insertDepth: 3,
  probability: 0.7,
  matchType: 'contains',
  caseSensitive: false,
  isActive: true,
  triggerOnce: true,
  excludeRecursion: false,
  category: '关系',
  position: 'after',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // 关系触发器
  relationTriggers: [
    {
      id: 'trigger_1',
      relationType: 'mentor_student',
      triggerCondition: '徒弟展现悟性',
      triggerProbability: 0.8,
      effectDescription: '触发秘传心法传承事件',
      cooldownMinutes: 120
    }
  ]
})

const testEntry4 = reactive<WorldInfoEntryType>({
  id: 'test-entry-4',
  scenarioId: 'test-scenario',
  title: '古代礼仪',
  content: '在古代中国，晚辈见到长辈必须行跪拜礼，以示尊敬。',
  keywords: ['古代礼仪', '跪拜', '尊敬'],
  priority: 40,
  insertDepth: 2,
  probability: 0.6,
  matchType: 'contains',
  caseSensitive: false,
  isActive: true,
  triggerOnce: false,
  excludeRecursion: false,
  category: '文化',
  position: 'after',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // 文化语境
  culturalContext: {
    era: 'ancient',
    region: '中国古代',
    languageStyle: 'formal',
    valueSystem: ['尊师重道', '家族荣誉'],
    socialNorms: ['礼仪规范', '阶级制度'],
    culturalSymbols: ['龙', '符文']
  }
})

// 测试结果
const testResults = ref({
  spacetimeAttributes: [],
  relationTriggers: [],
  culturalContext: []
})

// 处理条目更新
const handleEntryUpdate = (entry: WorldInfoEntryType) => {
  console.log('条目更新:', entry)

  // 收集测试结果
  testResults.value.spacetimeAttributes = entry.spacetimeAttributes || []
  testResults.value.relationTriggers = entry.relationTriggers || []
  testResults.value.culturalContext = entry.culturalContext ? [entry.culturalContext] : []

  // 这里可以添加实际的保存逻辑
}
</script>

<style scoped>
.worldinfo-test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
}

.test-section {
  border: 1px solid rgba(147, 51, 234, 0.2);
}

.test-section:hover {
  border-color: rgba(147, 51, 234, 0.4);
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.1);
}
</style>
