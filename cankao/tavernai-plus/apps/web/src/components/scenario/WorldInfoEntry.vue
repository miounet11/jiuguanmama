<template>
  <div
    class="world-info-entry bg-white rounded-lg border shadow-sm transition-all duration-200"
    :class="{
      'border-blue-500 shadow-blue-100': isSelected,
      'border-gray-200': !isSelected,
      'opacity-50': !entry.isActive
    }"
  >
    <!-- 条目头部 -->
    <div class="entry-header flex items-center justify-between p-4 border-b border-gray-100">
      <div class="flex items-center gap-3">
        <!-- 选择框 -->
        <el-checkbox
          :model-value="isSelected"
          @change="$emit('toggle-select', entry.id)"
        />

        <!-- 活跃状态指示器 -->
        <div
          class="w-3 h-3 rounded-full"
          :class="entry.isActive ? 'bg-green-500' : 'bg-gray-400'"
          :title="entry.isActive ? '活跃' : '禁用'"
        />

        <!-- 标题 -->
        <div class="flex-1 min-w-0">
          <h3
            v-if="!isEditingTitle"
            class="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
            @click="startEditingTitle"
          >
            {{ entry.title }}
          </h3>
          <el-input
            v-else
            v-model="editForm.title"
            size="small"
            @blur="finishEditingTitle"
            @keyup.enter="finishEditingTitle"
            @keyup.esc="cancelEditingTitle"
            ref="titleInputRef"
            class="max-w-xs"
          />
        </div>

        <!-- 时空属性标签 -->
        <div v-if="entry.spacetimeAttributes?.length" class="flex gap-1">
          <el-tag
            v-for="attr in entry.spacetimeAttributes.slice(0, 2)"
            :key="attr"
            size="mini"
            type="info"
            effect="plain"
            class="bg-purple-50 text-purple-700 border-purple-200"
          >
            {{ attr }}
          </el-tag>
          <el-tag
            v-if="entry.spacetimeAttributes.length > 2"
            size="mini"
            type="info"
            effect="plain"
            class="bg-purple-50 text-purple-700 border-purple-200"
          >
            +{{ entry.spacetimeAttributes.length - 2 }}
          </el-tag>
        </div>

        <!-- 优先级标签 -->
        <el-tag
          :type="getPriorityType(entry.priority)"
          size="small"
          effect="plain"
        >
          优先级 {{ entry.priority }}
        </el-tag>

        <!-- 分类标签 -->
        <el-tag
          size="small"
          effect="plain"
          class="text-xs"
        >
          {{ entry.category }}
        </el-tag>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-2">
        <!-- 展开/收起按钮 -->
        <el-button
          @click="toggleExpanded"
          :icon="isExpanded ? 'ArrowUp' : 'ArrowDown'"
          size="small"
          circle
          plain
        />

        <!-- 更多操作 -->
        <el-dropdown @command="handleCommand">
          <el-button
            :icon="'More'"
            size="small"
            circle
            plain
          />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">
                <el-icon><Edit /></el-icon>
                编辑
              </el-dropdown-item>
              <el-dropdown-item command="duplicate">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-dropdown-item>
              <el-dropdown-item command="toggle-active">
                <el-icon v-if="entry.isActive"><Hide /></el-icon>
                <el-icon v-else><View /></el-icon>
                {{ entry.isActive ? '禁用' : '启用' }}
              </el-dropdown-item>
              <el-dropdown-item
                command="delete"
                divided
                class="text-red-600"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 条目内容 -->
    <div v-show="isExpanded" class="entry-content">
      <!-- 关键词部分 -->
      <div class="keywords-section p-4 border-b border-gray-50">
        <div class="flex items-start gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              关键词
            </label>
            <KeywordManager
              v-model="editForm.keywords"
              :match-type="editForm.matchType"
              :case-sensitive="editForm.caseSensitive"
              @update:matchType="editForm.matchType = $event"
              @update:caseSensitive="editForm.caseSensitive = $event"
              @change="handleFormChange"
            />
          </div>

          <!-- 快速设置 -->
          <div class="w-48 space-y-3">
            <!-- 优先级 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                优先级
              </label>
              <el-input-number
                v-model="editForm.priority"
                :min="0"
                :max="999"
                size="small"
                @change="handleFormChange"
                class="w-full"
              />
            </div>

            <!-- 插入深度 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                插入深度
              </label>
              <el-input-number
                v-model="editForm.insertDepth"
                :min="0"
                :max="10"
                size="small"
                @change="handleFormChange"
                class="w-full"
              />
            </div>

            <!-- 触发概率 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                触发概率
              </label>
              <el-slider
                v-model="editForm.probability"
                :min="0"
                :max="1"
                :step="0.1"
                :format-tooltip="(val) => `${(val * 100).toFixed(0)}%`"
                @change="handleFormChange"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 内容编辑 -->
      <div class="content-section p-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          条目内容
        </label>
        <el-input
          v-model="editForm.content"
          type="textarea"
          :rows="6"
          placeholder="输入世界信息内容..."
          @change="handleFormChange"
          resize="vertical"
        />
      </div>

      <!-- 高级选项 -->
      <el-collapse class="advanced-options">
        <el-collapse-item title="高级选项" name="advanced">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <!-- 分类和分组 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <el-select
                v-model="editForm.category"
                placeholder="选择分类"
                filterable
                allow-create
                @change="handleFormChange"
                class="w-full"
              >
                <el-option
                  v-for="category in categories"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                分组 (可选)
              </label>
              <el-input
                v-model="editForm.group"
                placeholder="输入分组名称"
                @change="handleFormChange"
              />
            </div>

            <!-- 插入位置 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                插入位置
              </label>
              <el-select
                v-model="editForm.position"
                @change="handleFormChange"
                class="w-full"
              >
                <el-option label="在前面插入" value="before" />
                <el-option label="在后面插入" value="after" />
                <el-option label="替换内容" value="replace" />
              </el-select>
            </div>

            <!-- 行为选项 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                行为选项
              </label>
              <div class="space-y-1">
                <el-checkbox
                  v-model="editForm.isActive"
                  @change="handleFormChange"
                >
                  启用此条目
                </el-checkbox>
                <el-checkbox
                  v-model="editForm.triggerOnce"
                  @change="handleFormChange"
                >
                  只触发一次
                </el-checkbox>
                <el-checkbox
                  v-model="editForm.excludeRecursion"
                  @change="handleFormChange"
                >
                  排除递归
                </el-checkbox>
              </div>
            </div>

            <!-- 时空属性 -->
            <div class="space-y-2 col-span-2">
              <label class="block text-sm font-medium text-purple-700 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V7l-7-5z" clip-rule="evenodd"/>
                </svg>
                时空属性
              </label>
              <el-select
                v-model="editForm.spacetimeAttributes"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入时空属性"
                @change="handleFormChange"
                class="w-full"
              >
                <el-option
                  v-for="attr in spacetimeAttributeOptions"
                  :key="attr.value"
                  :label="attr.label"
                  :value="attr.value"
                />
              </el-select>
              <div class="text-xs text-gray-500 mt-1">
                绑定此条目到时空属性，影响时空事件触发和文化语境
              </div>
            </div>
          </div>
        </el-collapse-item>

        <!-- 时空触发器 -->
        <el-collapse-item title="时空触发器" name="spacetime-triggers">
          <div class="space-y-6 p-4">
            <!-- 角色关系触发器 -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-medium text-cyan-700 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                  </svg>
                  角色关系触发器
                </label>
                <el-button
                  type="primary"
                  size="small"
                  @click="addRelationTrigger"
                  :disabled="editForm.relationTriggers?.length >= 5"
                >
                  <el-icon><Plus /></el-icon>
                  添加触发器
                </el-button>
              </div>

              <div v-if="!editForm.relationTriggers?.length" class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                </svg>
                <p>暂无关系触发器</p>
                <p class="text-xs mt-1">添加触发器来响应角色关系变化</p>
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="(trigger, index) in editForm.relationTriggers"
                  :key="trigger.id || index"
                  class="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-700"
                >
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- 关系类型 -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        关系类型
                      </label>
                      <el-select
                        v-model="trigger.relationType"
                        placeholder="选择关系类型"
                        @change="handleFormChange"
                        class="w-full"
                      >
                        <el-option label="互补关系" value="complementary" />
                        <el-option label="师徒关系" value="mentor_student" />
                        <el-option label="专业联盟" value="professional" />
                        <el-option label="守护关系" value="protector_ward" />
                        <el-option label="文化交流" value="cultural_exchange" />
                        <el-option label="科技魔法" value="technology_magic" />
                      </el-select>
                    </div>

                    <!-- 触发概率 -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        触发概率
                      </label>
                      <el-slider
                        v-model="trigger.triggerProbability"
                        :min="0"
                        :max="1"
                        :step="0.1"
                        show-input
                        @change="handleFormChange"
                        class="w-full"
                      />
                    </div>

                    <!-- 触发条件 -->
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        触发条件
                      </label>
                      <el-input
                        v-model="trigger.triggerCondition"
                        placeholder="描述触发此条目的条件"
                        @change="handleFormChange"
                      />
                    </div>

                    <!-- 效果描述 -->
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        效果描述
                      </label>
                      <el-input
                        v-model="trigger.effectDescription"
                        placeholder="描述触发后的效果"
                        @change="handleFormChange"
                      />
                    </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="flex justify-end mt-3 pt-3 border-t border-cyan-200 dark:border-cyan-700">
                    <el-button
                      type="danger"
                      size="small"
                      text
                      @click="removeRelationTrigger(index)"
                    >
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="text-xs text-gray-500 mt-2">
                💡 关系触发器允许此条目在检测到特定角色关系时自动激活，提供更丰富的互动体验
              </div>
            </div>

            <!-- 文化语境编辑器 -->
            <div class="space-y-4">
              <label class="block text-sm font-medium text-green-700 flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
                </svg>
                文化语境设置
              </label>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- 时代背景 -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    时代背景
                  </label>
                  <el-select
                    v-model="editForm.culturalContext?.era"
                    placeholder="选择时代背景"
                    @change="handleFormChange"
                    class="w-full"
                  >
                    <el-option label="古代 (Ancient)" value="ancient" />
                    <el-option label="中世纪 (Medieval)" value="medieval" />
                    <el-option label="文艺复兴 (Renaissance)" value="renaissance" />
                    <el-option label="工业时代 (Industrial)" value="industrial" />
                    <el-option label="现代 (Modern)" value="modern" />
                    <el-option label="未来 (Future)" value="future" />
                    <el-option label="奇幻 (Fantasy)" value="fantasy" />
                    <el-option label="科幻 (Sci-Fi)" value="scifi" />
                  </el-select>
                </div>

                <!-- 地域设定 -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    地域设定
                  </label>
                  <el-input
                    v-model="editForm.culturalContext?.region"
                    placeholder="如：中国古代、欧洲中世纪、未来都市"
                    @change="handleFormChange"
                  />
                </div>

                <!-- 语言风格 -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    语言风格
                  </label>
                  <el-select
                    v-model="editForm.culturalContext?.languageStyle"
                    placeholder="选择语言风格"
                    @change="handleFormChange"
                    class="w-full"
                  >
                    <el-option label="正式 (Formal)" value="formal" />
                    <el-option label="随意 (Casual)" value="casual" />
                    <el-option label="诗意 (Poetic)" value="poetic" />
                    <el-option label="技术性 (Technical)" value="technical" />
                    <el-option label="粗俗 (Vulgar)" value="vulgar" />
                    <el-option label="古风 (Archaic)" value="archaic" />
                  </el-select>
                </div>
              </div>

              <!-- 价值观设定 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  核心价值观
                </label>
                <el-select
                  v-model="editForm.culturalContext?.valueSystem"
                  multiple
                  filterable
                  allow-create
                  placeholder="选择或添加核心价值观"
                  @change="handleFormChange"
                  class="w-full"
                >
                  <el-option label="侠义精神" value="侠义精神" />
                  <el-option label="科技至上" value="科技至上" />
                  <el-option label="魔法荣耀" value="魔法荣耀" />
                  <el-option label="家族荣誉" value="家族荣誉" />
                  <el-option label="个人自由" value="个人自由" />
                  <el-option label="集体利益" value="集体利益" />
                  <el-option label="知识追求" value="知识追求" />
                  <el-option label="力量崇拜" value="力量崇拜" />
                  <el-option label="和平主义" value="和平主义" />
                  <el-option label="征服欲望" value="征服欲望" />
                </el-select>
              </div>

              <!-- 社会规范 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  社会规范
                </label>
                <el-select
                  v-model="editForm.culturalContext?.socialNorms"
                  multiple
                  filterable
                  allow-create
                  placeholder="选择或添加社会规范"
                  @change="handleFormChange"
                  class="w-full"
                >
                  <el-option label="尊师重道" value="尊师重道" />
                  <el-option label="男女平等" value="男女平等" />
                  <el-option label="阶级制度" value="阶级制度" />
                  <el-option label="民主制度" value="民主制度" />
                  <el-option label="宗教信仰" value="宗教信仰" />
                  <el-option label="契约精神" value="契约精神" />
                  <el-option label="礼仪规范" value="礼仪规范" />
                  <el-option label="实用主义" value="实用主义" />
                </el-select>
              </div>

              <!-- 文化符号 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  文化符号
                </label>
                <el-select
                  v-model="editForm.culturalContext?.culturalSymbols"
                  multiple
                  filterable
                  allow-create
                  placeholder="选择或添加文化符号"
                  @change="handleFormChange"
                  class="w-full"
                >
                  <el-option label="龙" value="龙" />
                  <el-option label="激光剑" value="激光剑" />
                  <el-option label="魔法杖" value="魔法杖" />
                  <el-option label="十字架" value="十字架" />
                  <el-option label="机器人" value="机器人" />
                  <el-option label="符文" value="符文" />
                  <el-option label="面具" value="面具" />
                  <el-option label="徽章" value="徽章" />
                </el-select>
              </div>

              <div class="text-xs text-gray-500 mt-2">
                🌍 文化语境设置将影响此条目的触发逻辑和内容表现，使其更符合特定文化背景下的表达方式
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <!-- 底部操作栏 -->
      <div class="entry-footer flex items-center justify-between p-4 bg-gray-50 border-t border-gray-100">
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <!-- 统计信息 -->
          <span>{{ editForm.keywords.length }} 个关键词</span>
          <span>{{ editForm.content.length }} 字符</span>
          <span>创建于 {{ formatDate(entry.createdAt) }}</span>
        </div>

        <div class="flex items-center gap-2">
          <!-- 测试按钮 -->
          <el-button
            size="small"
            @click="handleTest"
            :icon="'Connection'"
          >
            测试匹配
          </el-button>

          <!-- 保存按钮 -->
          <el-button
            v-if="hasChanges"
            type="primary"
            size="small"
            @click="handleSave"
            :loading="isSaving"
          >
            保存
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  ArrowUp,
  ArrowDown,
  Edit,
  Delete,
  CopyDocument,
  View,
  Hide,
  More,
  Connection,
  Plus
} from '@element-plus/icons-vue'
import { useScenarioStore } from '@/stores/scenario'
import KeywordManager from './KeywordManager.vue'
import type {
  WorldInfoEntry as WorldInfoEntryType,
  UpdateWorldInfoEntryRequest
} from '@/types/scenario'

interface Props {
  entry: WorldInfoEntryType
  scenarioId: string
  isSelected?: boolean
  categories?: string[]
}

interface Emits {
  (e: 'update', entry: WorldInfoEntryType): void
  (e: 'delete', entryId: string): void
  (e: 'duplicate', entry: WorldInfoEntryType): void
  (e: 'toggle-select', entryId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => ['通用', '角色', '地点', '物品', '事件', '设定']
})

const emit = defineEmits<Emits>()

// Store
const scenarioStore = useScenarioStore()

// 响应式数据
const isExpanded = ref(false)
const isEditingTitle = ref(false)
const titleInputRef = ref()
const isSaving = ref(false)
const hasChanges = ref(false)

// 编辑表单
const editForm = reactive<UpdateWorldInfoEntryRequest>({
  title: props.entry.title,
  content: props.entry.content,
  keywords: [...props.entry.keywords],
  priority: props.entry.priority,
  insertDepth: props.entry.insertDepth,
  probability: props.entry.probability,
  matchType: props.entry.matchType,
  caseSensitive: props.entry.caseSensitive,
  isActive: props.entry.isActive,
  triggerOnce: props.entry.triggerOnce,
  excludeRecursion: props.entry.excludeRecursion,
  category: props.entry.category,
  group: props.entry.group,
  position: props.entry.position,
  // 时空酒馆扩展字段
  spacetimeAttributes: props.entry.spacetimeAttributes ? [...props.entry.spacetimeAttributes] : [],
  relationTriggers: props.entry.relationTriggers ? [...props.entry.relationTriggers] : [],
  culturalContext: props.entry.culturalContext ? { ...props.entry.culturalContext } : undefined
})

// 原始数据备份
const originalForm = { ...editForm }

// 计算属性
const getPriorityType = (priority: number) => {
  if (priority >= 100) return 'danger'
  if (priority >= 50) return 'warning'
  if (priority >= 10) return 'primary'
  return 'info'
}

// 时空属性选项
const spacetimeAttributeOptions = [
  { label: '魔力共鸣', value: '魔力共鸣' },
  { label: '时光回溯', value: '时光回溯' },
  { label: '空间扭曲', value: '空间扭曲' },
  { label: '能量潮汐', value: '能量潮汐' },
  { label: '意识链接', value: '意识链接' },
  { label: '维度穿越', value: '维度穿越' },
  { label: '命运交织', value: '命运交织' },
  { label: '灵魂绑定', value: '灵魂绑定' },
  { label: '时空裂隙', value: '时空裂隙' },
  { label: '永恒循环', value: '永恒循环' },
  { label: '因果律变', value: '因果律变' },
  { label: '平行宇宙', value: '平行宇宙' },
  { label: '时间加速', value: '时间加速' },
  { label: '空间压缩', value: '空间压缩' },
  { label: '现实重塑', value: '现实重塑' },
  { label: '记忆回廊', value: '记忆回廊' }
]

// 方法
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: zhCN
    })
  } catch {
    return '未知'
  }
}

// 时空触发器管理方法
const addRelationTrigger = () => {
  if (!editForm.relationTriggers) {
    editForm.relationTriggers = []
  }

  editForm.relationTriggers.push({
    id: `trigger_${Date.now()}`,
    relationType: 'complementary',
    triggerCondition: '',
    triggerProbability: 0.5,
    effectDescription: '',
    cooldownMinutes: 60
  })

  handleFormChange()
}

const removeRelationTrigger = (index: number) => {
  if (editForm.relationTriggers) {
    editForm.relationTriggers.splice(index, 1)
    handleFormChange()
  }
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const startEditingTitle = () => {
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
  })
}

const finishEditingTitle = () => {
  isEditingTitle.value = false
  handleFormChange()
}

const cancelEditingTitle = () => {
  editForm.title = props.entry.title
  isEditingTitle.value = false
}

const handleFormChange = () => {
  // 检查是否有变化
  hasChanges.value = Object.keys(editForm).some(key => {
    const formValue = editForm[key as keyof typeof editForm]
    const originalValue = originalForm[key as keyof typeof originalForm]

    if (Array.isArray(formValue) && Array.isArray(originalValue)) {
      return JSON.stringify(formValue) !== JSON.stringify(originalValue)
    }

    return formValue !== originalValue
  })
}

const handleSave = async () => {
  if (!hasChanges.value) return

  isSaving.value = true

  try {
    const updatedEntry = await scenarioStore.updateWorldInfoEntry(
      props.scenarioId,
      props.entry.id,
      editForm
    )

    // 更新原始数据
    Object.assign(originalForm, editForm)
    hasChanges.value = false

    emit('update', updatedEntry)
    ElMessage.success('条目更新成功')
  } catch (error) {
    console.error('更新条目失败:', error)
  } finally {
    isSaving.value = false
  }
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'edit':
      isExpanded.value = true
      break

    case 'duplicate':
      emit('duplicate', props.entry)
      break

    case 'toggle-active':
      editForm.isActive = !editForm.isActive
      handleFormChange()
      await handleSave()
      break

    case 'delete':
      try {
        await ElMessageBox.confirm(
          `确定要删除条目 "${props.entry.title}" 吗？`,
          '确认删除',
          {
            type: 'warning',
            confirmButtonText: '删除',
            cancelButtonText: '取消'
          }
        )

        emit('delete', props.entry.id)
      } catch (error) {
        // 用户取消
      }
      break
  }
}

const handleTest = () => {
  // 触发测试匹配
  if (editForm.keywords.length === 0) {
    ElMessage.warning('请先添加关键词')
    return
  }

  // 这里可以集成到测试对话框中
  ElMessage.info('测试功能开发中...')
}

// 监听属性变化
watch(() => props.entry, (newEntry) => {
  // 更新表单数据
  Object.assign(editForm, {
    title: newEntry.title,
    content: newEntry.content,
    keywords: [...newEntry.keywords],
    priority: newEntry.priority,
    insertDepth: newEntry.insertDepth,
    probability: newEntry.probability,
    matchType: newEntry.matchType,
    caseSensitive: newEntry.caseSensitive,
    isActive: newEntry.isActive,
    triggerOnce: newEntry.triggerOnce,
    excludeRecursion: newEntry.excludeRecursion,
    category: newEntry.category,
    group: newEntry.group,
    position: newEntry.position
  })

  // 更新原始数据
  Object.assign(originalForm, editForm)
  hasChanges.value = false
}, { deep: true })

// 自动保存逻辑
let saveTimeout: NodeJS.Timeout | null = null

watch(() => hasChanges.value, (newValue) => {
  if (newValue && editForm.title && editForm.content) {
    // 延迟自动保存
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(() => {
      handleSave()
    }, 2000) // 2秒后自动保存
  }
})

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})
</script>

<style scoped>
.world-info-entry {
  transition: all 0.2s ease;
}

.world-info-entry:hover {
  shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.entry-header {
  background: linear-gradient(to right, #f8fafc, #f1f5f9);
}

.keywords-section {
  background: #fafbfc;
}

/* 网格布局 */
.grid {
  display: grid;
  gap: 1rem;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* 折叠面板样式 */
:deep(.el-collapse) {
  border: none;
  background: transparent;
}

:deep(.el-collapse-item__header) {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-collapse-item__content) {
  background: white;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 6px 6px;
  padding: 0;
}

/* 滑块样式 */
:deep(.el-slider) {
  margin: 8px 0;
}

:deep(.el-slider__runway) {
  height: 4px;
  background-color: #e5e7eb;
}

:deep(.el-slider__bar) {
  background-color: #3b82f6;
}

:deep(.el-slider__button) {
  width: 16px;
  height: 16px;
  border: 2px solid #3b82f6;
  background-color: white;
}

/* 数字输入框样式 */
:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

/* 复选框样式 */
:deep(.el-checkbox) {
  margin-right: 0;
  margin-bottom: 4px;
}

:deep(.el-checkbox__label) {
  font-size: 14px;
  color: #374151;
}

/* 标签样式 */
:deep(.el-tag) {
  font-size: 11px;
  height: 20px;
  line-height: 18px;
  padding: 0 6px;
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu) {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

:deep(.el-dropdown-menu__item) {
  padding: 8px 16px;
  font-size: 14px;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: #f8fafc;
}

:deep(.el-dropdown-menu__item.text-red-600:hover) {
  background-color: #fef2f2;
  color: #dc2626;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .keywords-section .flex {
    flex-direction: column;
    gap: 16px;
  }

  .keywords-section .w-48 {
    width: 100%;
  }
}

/* 动画效果 */
.entry-content {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

/* 加载状态 */
.is-loading {
  opacity: 0.6;
  pointer-events: none;
}

/* 未保存更改指示器 */
.has-changes::before {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background-color: #f59e0b;
  border-radius: 50%;
}

/* 禁用状态样式 */
.world-info-entry.opacity-50 .entry-header {
  background: linear-gradient(to right, #f3f4f6, #e5e7eb);
}

.world-info-entry.opacity-50 h3 {
  color: #6b7280;
}
</style>