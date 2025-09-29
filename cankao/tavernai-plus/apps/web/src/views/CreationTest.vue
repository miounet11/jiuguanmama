<template>
  <div class="creation-test-page">
    <AppLayout>
      <!-- 页面头部 -->
      <div class="page-header mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <svg class="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              创建功能时空化测试
            </h1>
            <p class="text-gray-400">
              测试角色卡和世界剧本创建的时空化功能升级
            </p>
          </div>
        </div>
      </div>

      <!-- 测试内容区域 -->
      <div class="test-content space-y-8">
        <!-- 角色创建测试 -->
        <div class="test-section bg-gray-900/50 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            角色创建时空化测试
          </h2>

          <div class="mb-4">
            <el-button
              type="primary"
              @click="showCharacterCreate = true"
              class="bg-gradient-to-r from-purple-500 to-indigo-500 border-0"
            >
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              测试角色创建（时空化）
            </el-button>
          </div>

          <!-- 创建结果显示 -->
          <div v-if="createdCharacter" class="bg-gray-800/50 rounded-lg p-4">
            <h3 class="text-white font-medium mb-3">创建成功 - 角色详情</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 class="text-purple-400 font-medium mb-2">基础信息</h4>
                <div class="text-sm text-gray-300 space-y-1">
                  <p><span class="text-gray-400">名称:</span> {{ createdCharacter.name }}</p>
                  <p><span class="text-gray-400">描述:</span> {{ createdCharacter.description }}</p>
                </div>
              </div>

              <div v-if="createdCharacter.mbti">
                <h4 class="text-purple-400 font-medium mb-2">MBTI性格</h4>
                <div class="text-sm text-gray-300 space-y-1">
                  <p><span class="text-gray-400">类型:</span>
                    <el-tag size="mini" class="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 ml-1">
                      {{ createdCharacter.mbti.type }}
                    </el-tag>
                  </p>
                  <p><span class="text-gray-400">特质:</span> {{ createdCharacter.mbti.traits?.join(', ') }}</p>
                  <p><span class="text-gray-400">兼容类型:</span> {{ createdCharacter.mbti.compatibility?.join(', ') }}</p>
                </div>
              </div>
            </div>

            <div v-if="createdCharacter.characterRelations?.length" class="mt-4">
              <h4 class="text-cyan-400 font-medium mb-2">角色关联网络</h4>
              <div class="space-y-2">
                <div
                  v-for="relation in createdCharacter.characterRelations"
                  :key="relation.characterId"
                  class="bg-cyan-900/20 rounded p-2 text-sm"
                >
                  <span class="text-cyan-300">{{ relation.relationType }}</span>
                  <span class="mx-2">•</span>
                  <span class="text-gray-300">{{ relation.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 剧本创建测试 -->
        <div class="test-section bg-gray-900/50 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
            剧本创建时空化测试
          </h2>

          <div class="mb-4">
            <el-button
              type="success"
              @click="showScenarioCreate = true"
              class="bg-gradient-to-r from-green-500 to-emerald-500 border-0"
            >
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
              </svg>
              测试剧本创建（时空化）
            </el-button>
          </div>

          <!-- 创建结果显示 -->
          <div v-if="createdScenario" class="bg-gray-800/50 rounded-lg p-4">
            <h3 class="text-white font-medium mb-3">创建成功 - 剧本详情</h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 class="text-green-400 font-medium mb-2">基础信息</h4>
                <div class="text-sm text-gray-300 space-y-1">
                  <p><span class="text-gray-400">名称:</span> {{ createdScenario.name }}</p>
                  <p><span class="text-gray-400">分类:</span> {{ createdScenario.category }}</p>
                  <p><span class="text-gray-400">类型:</span> {{ createdScenario.genre }}</p>
                  <p><span class="text-gray-400">复杂度:</span> {{ createdScenario.complexity }}</p>
                </div>
              </div>

              <div v-if="createdScenario.spacetimeHub">
                <h4 class="text-purple-400 font-medium mb-2">时空酒馆分部</h4>
                <div class="text-sm text-gray-300 space-y-1">
                  <p><span class="text-gray-400">时空属性:</span>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <el-tag
                        v-for="attr in createdScenario.spacetimeHub.spacetimeAttributes"
                        :key="attr"
                        size="mini"
                        type="info"
                        effect="plain"
                        class="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {{ attr }}
                      </el-tag>
                    </div>
                  </p>
                  <p><span class="text-gray-400">空间布局:</span> {{ createdScenario.spacetimeHub.spacetimeLayout }}</p>
                  <p><span class="text-gray-400">融合机制:</span> {{ createdScenario.spacetimeHub.fusionMechanisms }}</p>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-lg font-bold text-cyan-400">{{ createdScenario.playerCount }}</div>
                <div class="text-xs text-gray-400">玩家数量</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-cyan-400">{{ createdScenario.estimatedDuration }}</div>
                <div class="text-xs text-gray-400">预计时长(分)</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-cyan-400">{{ createdScenario.worldScope }}</div>
                <div class="text-xs text-gray-400">世界范围</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-cyan-400">{{ createdScenario.contentRating }}</div>
                <div class="text-xs text-gray-400">内容分级</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 功能对比说明 -->
        <div class="test-section bg-gray-900/50 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">时空化升级对比</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 角色创建升级 -->
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h3 class="text-purple-400 font-medium mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                角色创建升级
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span class="text-gray-300">MBTI 16型人格类型选择</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span class="text-gray-300">性格特质多选配置</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span class="text-gray-300">人格兼容性配置</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span class="text-gray-300">角色关联网络建立</span>
                </div>
              </div>
            </div>

            <!-- 剧本创建升级 -->
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h3 class="text-green-400 font-medium mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                </svg>
                剧本创建升级
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span class="text-gray-300">时空酒馆分部启用</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span class="text-gray-300">时空属性配置</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span class="text-gray-300">游戏化参数设置</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span class="text-gray-300">世界设定详细描述</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色创建对话框 -->
      <CharacterCreateDialog
        v-model:visible="showCharacterCreate"
        @success="handleCharacterCreated"
      />

      <!-- 剧本创建对话框 -->
      <CreateScenarioDialog
        v-model="showScenarioCreate"
        @created="handleScenarioCreated"
      />
    </AppLayout>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'
import CharacterCreateDialog from '@/components/character/CharacterCreateDialog.vue'
import CreateScenarioDialog from '@/components/scenario/CreateScenarioDialog.vue'
import type { Character } from '@/types/character'
import type { Scenario } from '@/types/scenario'

// 响应式数据
const showCharacterCreate = ref(false)
const showScenarioCreate = ref(false)
const createdCharacter = ref<Character | null>(null)
const createdScenario = ref<Scenario | null>(null)

// 事件处理
const handleCharacterCreated = (character: Character) => {
  createdCharacter.value = character
  ElMessage.success('角色创建成功！查看时空化配置结果')
}

const handleScenarioCreated = (scenario: Scenario) => {
  createdScenario.value = scenario
  ElMessage.success('剧本创建成功！查看时空化配置结果')
}
</script>

<style scoped>
.creation-test-page {
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
