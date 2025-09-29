<template>
  <div class="character-network-page">
    <AppLayout>
      <!-- 页面头部 -->
      <div class="page-header mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <svg class="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 011 1h2a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"/>
              </svg>
              时空酒馆 - 角色关联网络
            </h1>
            <p class="text-gray-400">
              探索角色间的时空关系网络，发现更多有趣的互动可能性
            </p>
          </div>

          <!-- 控制面板 -->
          <div class="flex items-center gap-4">
            <el-select
              v-model="selectedScenario"
              placeholder="选择时空剧本"
              clearable
              class="w-48"
              @change="loadNetworkData"
            >
              <el-option
                v-for="scenario in scenarios"
                :key="scenario.id"
                :label="scenario.name"
                :value="scenario.id"
              />
            </el-select>

            <el-button
              type="primary"
              @click="loadNetworkData"
              :loading="loading"
            >
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
              </svg>
              刷新网络
            </el-button>
          </div>
        </div>
      </div>

      <!-- 网络可视化区域 -->
      <div class="network-container bg-gray-900/50 rounded-lg p-6">
        <div v-if="loading" class="flex items-center justify-center h-96">
          <el-spin size="large">
            <template #icon>
              <svg class="animate-spin w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </template>
          </el-spin>
          <span class="ml-4 text-gray-400">正在构建时空关联网络...</span>
        </div>

        <div v-else-if="networkData.nodes.length === 0" class="flex flex-col items-center justify-center h-96">
          <svg class="w-16 h-16 text-gray-600 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 011 1h2a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"/>
          </svg>
          <h3 class="text-lg font-semibold text-white mb-2">暂无关联数据</h3>
          <p class="text-gray-400 text-center">
            选择一个时空剧本或等待数据加载
          </p>
        </div>

        <div v-else class="network-visualization">
          <!-- 网络图容器 -->
          <div ref="networkContainer" class="network-graph h-96 bg-gray-800/30 rounded-lg overflow-hidden"></div>

          <!-- 图例 -->
          <div class="legend mt-4 flex flex-wrap gap-4 justify-center">
            <div v-for="relationType in relationTypes" :key="relationType.key" class="flex items-center gap-2">
              <div
                class="w-4 h-4 rounded"
                :style="{ backgroundColor: relationType.color }"
              ></div>
              <span class="text-sm text-gray-300">{{ relationType.label }}</span>
            </div>
          </div>

          <!-- 节点信息面板 -->
          <div class="node-info-panel mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 选中节点信息 -->
            <div v-if="selectedNode" class="bg-gray-800/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
                选中角色
              </h3>

              <div class="flex items-start gap-4">
                <img
                  :src="selectedNode.avatar || '/default-avatar.png'"
                  :alt="selectedNode.name"
                  class="w-16 h-16 rounded-lg object-cover"
                  @error="handleImageError"
                />
                <div class="flex-1">
                  <h4 class="text-white font-medium mb-1">{{ selectedNode.name }}</h4>
                  <div v-if="selectedNode.mbti" class="mb-2">
                    <el-tag
                      size="small"
                      class="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0"
                    >
                      {{ selectedNode.mbti.type }}
                    </el-tag>
                  </div>
                  <p class="text-gray-400 text-sm line-clamp-2">{{ selectedNode.description }}</p>
                </div>
              </div>
            </div>

            <!-- 关系统计 -->
            <div class="bg-gray-800/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 011 1h2a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clip-rule="evenodd"/>
                </svg>
                网络统计
              </h3>

              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-cyan-400">{{ networkData.nodes.length }}</div>
                  <div class="text-sm text-gray-400">角色节点</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-400">{{ networkData.edges.length }}</div>
                  <div class="text-sm text-gray-400">关联关系</div>
                </div>
              </div>

              <div class="mt-4">
                <h4 class="text-white font-medium mb-2">关系类型分布</h4>
                <div class="space-y-2">
                  <div
                    v-for="stat in relationStats"
                    :key="stat.type"
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="text-gray-300">{{ stat.label }}</span>
                    <span class="text-cyan-400 font-medium">{{ stat.count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import AppLayout from '@/components/layout/AppLayout.vue'

// 类型定义
interface NetworkNode {
  id: string
  name: string
  avatar?: string
  mbti?: { type: string }
  description: string
  group: number // 节点分组
}

interface NetworkEdge {
  from: string
  to: string
  relationType: string
  label: string
  color: string
  width: number
}

// 响应式数据
const loading = ref(false)
const selectedScenario = ref('')
const scenarios = ref<any[]>([])
const networkData = ref<{ nodes: NetworkNode[], edges: NetworkEdge[] }>({ nodes: [], edges: [] })
const selectedNode = ref<NetworkNode | null>(null)
const networkContainer = ref<HTMLElement>()
let visNetwork: any = null

// 关系类型配置
const relationTypes = [
  { key: 'complementary', label: '互补关系', color: '#10b981' },
  { key: 'mentor_student', label: '师徒关系', color: '#3b82f6' },
  { key: 'professional', label: '专业联盟', color: '#8b5cf6' },
  { key: 'protector_ward', label: '守护关系', color: '#f59e0b' },
  { key: 'cultural_exchange', label: '文化交流', color: '#06b6d4' },
  { key: 'technology_magic', label: '科技魔法', color: '#ec4899' }
]

// 关系统计
const relationStats = ref<Array<{ type: string, label: string, count: number }>>([])

// 加载剧本列表
const loadScenarios = async () => {
  try {
    // 这里应该调用API获取剧本列表
    // 暂时使用模拟数据
    scenarios.value = [
      { id: 'scenario1', name: '时空酒馆 - 现代奇幻' },
      { id: 'scenario2', name: '时空酒馆 - 科幻未来' },
      { id: 'scenario3', name: '时空酒馆 - 历史穿越' }
    ]
  } catch (error) {
    console.error('加载剧本列表失败:', error)
    ElMessage.error('加载剧本列表失败')
  }
}

// 加载网络数据
const loadNetworkData = async () => {
  loading.value = true
  try {
    // 这里应该调用API获取角色关联网络数据
    // 暂时使用模拟数据
    const mockNodes: NetworkNode[] = [
      {
        id: 'char1',
        name: '艾伦·特斯拉',
        avatar: '/characters/tesla.jpg',
        mbti: { type: 'INTJ' },
        description: '天才发明家，来自未来的科技大师',
        group: 1
      },
      {
        id: 'char2',
        name: '李逍遥',
        avatar: '/characters/li.jpg',
        mbti: { type: 'ENFP' },
        description: '古代侠客，武艺高强，心怀天下',
        group: 2
      },
      {
        id: 'char3',
        name: '梅林法师',
        avatar: '/characters/merlin.jpg',
        mbti: { type: 'INFJ' },
        description: '古老的魔法师，智慧深邃',
        group: 3
      }
    ]

    const mockEdges: NetworkEdge[] = [
      {
        from: 'char1',
        to: 'char2',
        relationType: 'technology_magic',
        label: '科技魔法',
        color: '#ec4899',
        width: 2
      },
      {
        from: 'char1',
        to: 'char3',
        relationType: 'mentor_student',
        label: '师徒关系',
        color: '#3b82f6',
        width: 2
      },
      {
        from: 'char2',
        to: 'char3',
        relationType: 'cultural_exchange',
        label: '文化交流',
        color: '#06b6d4',
        width: 2
      }
    ]

    networkData.value = {
      nodes: mockNodes,
      edges: mockEdges
    }

    // 计算关系统计
    calculateRelationStats()

    // 渲染网络图
    await nextTick()
    renderNetwork()

  } catch (error) {
    console.error('加载网络数据失败:', error)
    ElMessage.error('加载网络数据失败')
  } finally {
    loading.value = false
  }
}

// 计算关系统计
const calculateRelationStats = () => {
  const stats: Record<string, number> = {}

  networkData.value.edges.forEach(edge => {
    stats[edge.relationType] = (stats[edge.relationType] || 0) + 1
  })

  relationStats.value = relationTypes.map(type => ({
    type: type.key,
    label: type.label,
    count: stats[type.key] || 0
  }))
}

// 渲染网络图
const renderNetwork = () => {
  if (!networkContainer.value) return

  // 清理之前的网络
  if (visNetwork) {
    visNetwork.destroy()
  }

  // 准备Vis.js数据格式
  const nodes = networkData.value.nodes.map(node => ({
    id: node.id,
    label: node.name,
    title: `${node.name}\n${node.mbti?.type || '未知MBTI'}\n${node.description}`,
    shape: 'circularImage',
    image: node.avatar || '/default-avatar.png',
    size: 30,
    group: node.group
  }))

  const edges = networkData.value.edges.map(edge => ({
    from: edge.from,
    to: edge.to,
    label: edge.label,
    color: { color: edge.color },
    width: edge.width,
    arrows: { to: { enabled: true, scaleFactor: 0.5 } }
  }))

  // Vis.js选项
  const options = {
    nodes: {
      borderWidth: 2,
      borderWidthSelected: 3,
      shadow: true,
      shapeProperties: {
        useBorderWithImage: true
      }
    },
    edges: {
      shadow: true,
      smooth: {
        enabled: true,
        type: 'continuous'
      }
    },
    physics: {
      enabled: true,
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.3,
        springLength: 95,
        springConstant: 0.04
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 300
    }
  }

  // 创建网络
  const DataSet = (window as any).vis?.DataSet
  if (!DataSet) {
    console.error('Vis.js not loaded')
    return
  }

  const visNodes = new DataSet(nodes)
  const visEdges = new DataSet(edges)

  const data = {
    nodes: visNodes,
    edges: visEdges
  }

  const Network = (window as any).vis?.Network
  if (!Network) {
    console.error('Vis.js Network not available')
    return
  }

  visNetwork = new Network(networkContainer.value, data, options)

  // 事件监听
  visNetwork.on('selectNode', (params: any) => {
    const nodeId = params.nodes[0]
    const node = networkData.value.nodes.find(n => n.id === nodeId)
    if (node) {
      selectedNode.value = node
    }
  })

  visNetwork.on('deselectNode', () => {
    selectedNode.value = null
  })
}

// 图片错误处理
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/default-avatar.png'
}

// 生命周期
onMounted(async () => {
  await loadScenarios()
  await loadNetworkData()
})

onUnmounted(() => {
  if (visNetwork) {
    visNetwork.destroy()
  }
})
</script>

<style scoped>
.character-network-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
}

.network-container {
  min-height: 600px;
}

.network-graph {
  position: relative;
}

.legend {
  padding: 1rem;
  background: rgba(31, 41, 55, 0.5);
  border-radius: 0.5rem;
  backdrop-filter: blur(8px);
}

.node-info-panel {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 自定义Vis.js样式 */
:deep(.vis-network) {
  background: transparent !important;
}

:deep(.vis-tooltip) {
  background: rgba(0, 0, 0, 0.9) !important;
  border: 1px solid rgba(147, 51, 234, 0.3) !important;
  border-radius: 0.5rem !important;
  color: white !important;
  font-size: 0.875rem !important;
  padding: 0.5rem !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
}
</style>
