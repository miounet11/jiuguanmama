import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// import { ElMessage } from 'element-plus'
import { scenarioApi } from '@/services/scenarioApi'
import type {
  Scenario,
  WorldInfoEntry,
  ScenarioQueryParams,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  CreateWorldInfoEntryRequest,
  UpdateWorldInfoEntryRequest,
  TestMatchingRequest,
  TestMatchingResult,
  SortBy,
  EntryGroup
} from '@/types/scenario'

export const useScenarioStore = defineStore('scenario', () => {
  // ===== 基础状态 =====
  const scenarios = ref<Scenario[]>([])
  const currentScenario = ref<Scenario | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ===== 分页状态 =====
  const currentPage = ref(1)
  const itemsPerPage = ref(12)
  const totalItems = ref(0)
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
  const hasMore = computed(() => currentPage.value < totalPages.value)

  // ===== 筛选状态 =====
  const searchQuery = ref('')
  const selectedCategory = ref('')
  const selectedTags = ref<string[]>([])
  const sortBy = ref<SortBy>('created')
  const showPublicOnly = ref(false)

  // ===== 条目管理状态 =====
  const selectedEntryIds = ref<string[]>([])
  const entryGroups = ref<EntryGroup[]>([])
  const draggedEntry = ref<WorldInfoEntry | null>(null)

  // ===== 测试状态 =====
  const testResults = ref<TestMatchingResult | null>(null)
  const isTestingMatch = ref(false)

  // ===== 分类和标签缓存 =====
  const categories = ref<string[]>([])
  const tags = ref<Array<{ name: string; count: number }>>([])

  // ===== 计算属性 =====
  const filteredScenarios = computed(() => {
    let filtered = [...scenarios.value]

    // 搜索过滤
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(scenario =>
        scenario.name.toLowerCase().includes(query) ||
        scenario.description?.toLowerCase().includes(query) ||
        scenario.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // 分类过滤
    if (selectedCategory.value) {
      filtered = filtered.filter(scenario => scenario.category === selectedCategory.value)
    }

    // 标签过滤
    if (selectedTags.value.length > 0) {
      filtered = filtered.filter(scenario =>
        selectedTags.value.some(tag => scenario.tags.includes(tag))
      )
    }

    // 公开状态过滤
    if (showPublicOnly.value) {
      filtered = filtered.filter(scenario => scenario.isPublic)
    }

    return filtered
  })

  const currentScenarioEntries = computed(() => {
    if (!currentScenario.value || !currentScenario.value.worldInfoEntries) return []
    return currentScenario.value.worldInfoEntries
  })

  const selectedEntries = computed(() => {
    return currentScenarioEntries.value.filter(entry =>
      selectedEntryIds.value.includes(entry.id)
    )
  })

  // ===== 剧本 CRUD 方法 =====

  /**
   * 获取剧本列表
   */
  const fetchScenarios = async (options: ScenarioQueryParams = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const params = {
        page: options.page || currentPage.value,
        limit: options.limit || itemsPerPage.value,
        search: options.search || searchQuery.value || undefined,
        category: options.category || selectedCategory.value || undefined,
        sort: options.sort || sortBy.value,
        isPublic: options.isPublic ?? (showPublicOnly.value ? true : undefined),
        tags: options.tags || (selectedTags.value.length > 0 ? selectedTags.value : undefined)
      }

      const response = await scenarioApi.getScenarios(params)

      scenarios.value = response.scenarios
      totalItems.value = response.pagination.total
      currentPage.value = response.pagination.page
      itemsPerPage.value = response.pagination.limit

    } catch (err: any) {
      error.value = err.message || '获取剧本列表失败'
      console.error(error.value)
      console.error('Error fetching scenarios:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取剧本详情
   */
  const fetchScenario = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      const scenario = await scenarioApi.getScenario(id)
      currentScenario.value = scenario

      // 初始化分组
      initializeEntryGroups()

      return scenario
    } catch (err: any) {
      error.value = err.message || '获取剧本详情失败'
      console.error(error.value)
      console.error('Error fetching scenario:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 创建剧本
   */
  const createScenario = async (data: CreateScenarioRequest) => {
    isLoading.value = true
    error.value = null

    try {
      const scenario = await scenarioApi.createScenario(data)

      // 添加到列表开头
      scenarios.value.unshift(scenario)
      totalItems.value++

      console.log('剧本创建成功')
      return scenario
    } catch (err: any) {
      error.value = err.message || '创建剧本失败'
      console.error(error.value)
      console.error('Error creating scenario:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新剧本
   */
  const updateScenario = async (id: string, data: UpdateScenarioRequest) => {
    isLoading.value = true
    error.value = null

    try {
      const scenario = await scenarioApi.updateScenario(id, data)

      // 更新列表中的剧本
      const index = scenarios.value.findIndex(s => s.id === id)
      if (index !== -1) {
        scenarios.value[index] = scenario
      }

      // 更新当前剧本
      if (currentScenario.value?.id === id) {
        currentScenario.value = scenario
      }

      console.log('剧本更新成功')
      return scenario
    } catch (err: any) {
      error.value = err.message || '更新剧本失败'
      console.error(error.value)
      console.error('Error updating scenario:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 删除剧本
   */
  const deleteScenario = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      await scenarioApi.deleteScenario(id)

      // 从列表中移除
      scenarios.value = scenarios.value.filter(s => s.id !== id)
      totalItems.value--

      // 清除当前剧本
      if (currentScenario.value?.id === id) {
        currentScenario.value = null
      }

      console.log('剧本删除成功')
    } catch (err: any) {
      error.value = err.message || '删除剧本失败'
      console.error(error.value)
      console.error('Error deleting scenario:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ===== 世界信息条目方法 =====

  /**
   * 添加世界信息条目
   */
  const createWorldInfoEntry = async (scenarioId: string, data: CreateWorldInfoEntryRequest) => {
    isLoading.value = true
    error.value = null

    try {
      const entry = await scenarioApi.createWorldInfoEntry(scenarioId, data)

      // 添加到当前剧本
      if (currentScenario.value?.id === scenarioId) {
        if (!currentScenario.value.worldInfoEntries) {
          currentScenario.value.worldInfoEntries = []
        }
        currentScenario.value.worldInfoEntries.push(entry)
        currentScenario.value.entriesCount = (currentScenario.value.entriesCount || 0) + 1
        updateEntryGroups()
      }

      console.log('世界信息条目添加成功')
      return entry
    } catch (err: any) {
      error.value = err.message || '添加世界信息条目失败'
      console.error(error.value)
      console.error('Error creating world info entry:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 更新世界信息条目
   */
  const updateWorldInfoEntry = async (
    scenarioId: string,
    entryId: string,
    data: UpdateWorldInfoEntryRequest
  ) => {
    isLoading.value = true
    error.value = null

    try {
      const entry = await scenarioApi.updateWorldInfoEntry(scenarioId, entryId, data)

      // 更新当前剧本中的条目
      if (currentScenario.value?.id === scenarioId && currentScenario.value.worldInfoEntries) {
        const index = currentScenario.value.worldInfoEntries.findIndex(e => e.id === entryId)
        if (index !== -1) {
          currentScenario.value.worldInfoEntries[index] = entry
          updateEntryGroups()
        }
      }

      console.log('世界信息条目更新成功')
      return entry
    } catch (err: any) {
      error.value = err.message || '更新世界信息条目失败'
      console.error(error.value)
      console.error('Error updating world info entry:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 删除世界信息条目
   */
  const deleteWorldInfoEntry = async (scenarioId: string, entryId: string) => {
    isLoading.value = true
    error.value = null

    try {
      await scenarioApi.deleteWorldInfoEntry(scenarioId, entryId)

      // 从当前剧本中移除
      if (currentScenario.value?.id === scenarioId && currentScenario.value.worldInfoEntries) {
        currentScenario.value.worldInfoEntries = currentScenario.value.worldInfoEntries.filter(
          e => e.id !== entryId
        )
        currentScenario.value.entriesCount = Math.max((currentScenario.value.entriesCount || 1) - 1, 0)
        updateEntryGroups()
      }

      // 从选中列表中移除
      selectedEntryIds.value = selectedEntryIds.value.filter(id => id !== entryId)

      console.log('世界信息条目删除成功')
    } catch (err: any) {
      error.value = err.message || '删除世界信息条目失败'
      console.error(error.value)
      console.error('Error deleting world info entry:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ===== 高级功能方法 =====

  /**
   * 测试关键词匹配
   */
  const testMatching = async (scenarioId: string, data: TestMatchingRequest) => {
    isTestingMatch.value = true
    error.value = null

    try {
      const result = await scenarioApi.testMatching(scenarioId, data)
      testResults.value = result
      return result
    } catch (err: any) {
      error.value = err.message || '测试关键词匹配失败'
      console.error(error.value)
      console.error('Error testing matching:', err)
      throw err
    } finally {
      isTestingMatch.value = false
    }
  }

  /**
   * 重排条目顺序
   */
  const reorderEntries = async (scenarioId: string, entryIds: string[]) => {
    try {
      await scenarioApi.reorderEntries(scenarioId, entryIds)

      // 更新本地顺序
      if (currentScenario.value?.id === scenarioId && currentScenario.value.worldInfoEntries) {
        const orderedEntries = entryIds.map(id =>
          currentScenario.value!.worldInfoEntries!.find(e => e.id === id)!
        ).filter(Boolean)

        currentScenario.value.worldInfoEntries = orderedEntries
        updateEntryGroups()
      }

      console.log('条目顺序已更新')
    } catch (err: any) {
      error.value = err.message || '更新条目顺序失败'
      console.error(error.value)
      console.error('Error reordering entries:', err)
      throw err
    }
  }

  // ===== 分组管理方法 =====

  /**
   * 初始化条目分组
   */
  const initializeEntryGroups = () => {
    if (!currentScenario.value || !currentScenario.value.worldInfoEntries) return

    const groupMap = new Map<string, WorldInfoEntry[]>()

    currentScenario.value.worldInfoEntries.forEach(entry => {
      const groupName = entry.group || '未分组'
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, [])
      }
      groupMap.get(groupName)!.push(entry)
    })

    entryGroups.value = Array.from(groupMap.entries()).map(([name, entries]) => ({
      name,
      entries: entries.sort((a, b) => (a.order || 0) - (b.order || 0)),
      collapsed: false
    }))
  }

  /**
   * 更新条目分组
   */
  const updateEntryGroups = () => {
    initializeEntryGroups()
  }

  // ===== 选择管理方法 =====

  /**
   * 切换条目选中状态
   */
  const toggleEntrySelection = (entryId: string) => {
    const index = selectedEntryIds.value.indexOf(entryId)
    if (index === -1) {
      selectedEntryIds.value.push(entryId)
    } else {
      selectedEntryIds.value.splice(index, 1)
    }
  }

  /**
   * 全选/取消全选条目
   */
  const toggleSelectAll = () => {
    if (selectedEntryIds.value.length === currentScenarioEntries.value.length) {
      selectedEntryIds.value = []
    } else {
      selectedEntryIds.value = currentScenarioEntries.value.map(entry => entry.id)
    }
  }

  /**
   * 清除选中状态
   */
  const clearSelection = () => {
    selectedEntryIds.value = []
  }

  // ===== 筛选和搜索方法 =====

  /**
   * 搜索剧本
   */
  const searchScenarios = async (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
    await fetchScenarios()
  }

  /**
   * 按分类筛选
   */
  const filterByCategory = async (category: string) => {
    selectedCategory.value = category
    currentPage.value = 1
    await fetchScenarios()
  }

  /**
   * 按标签筛选
   */
  const filterByTags = async (tags: string[]) => {
    selectedTags.value = tags
    currentPage.value = 1
    await fetchScenarios()
  }

  /**
   * 排序
   */
  const sortScenarios = async (sort: SortBy) => {
    sortBy.value = sort
    currentPage.value = 1
    await fetchScenarios()
  }

  /**
   * 翻页
   */
  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      await fetchScenarios()
    }
  }

  /**
   * 重置筛选
   */
  const resetFilters = () => {
    searchQuery.value = ''
    selectedCategory.value = ''
    selectedTags.value = []
    sortBy.value = 'created'
    showPublicOnly.value = false
    currentPage.value = 1
  }

  // ===== 数据获取方法 =====

  /**
   * 获取分类列表
   */
  const fetchCategories = async () => {
    try {
      categories.value = await scenarioApi.getCategories()
    } catch (err: any) {
      console.error('Error fetching categories:', err)
    }
  }

  /**
   * 获取标签列表
   */
  const fetchTags = async () => {
    try {
      tags.value = await scenarioApi.getTags()
    } catch (err: any) {
      console.error('Error fetching tags:', err)
    }
  }

  return {
    // 状态
    scenarios,
    currentScenario,
    isLoading,
    error,

    // 分页
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasMore,

    // 筛选
    searchQuery,
    selectedCategory,
    selectedTags,
    sortBy,
    showPublicOnly,

    // 条目管理
    selectedEntryIds,
    entryGroups,
    draggedEntry,

    // 测试
    testResults,
    isTestingMatch,

    // 分类和标签
    categories,
    tags,

    // 计算属性
    filteredScenarios,
    currentScenarioEntries,
    selectedEntries,

    // 剧本 CRUD 方法
    fetchScenarios,
    fetchScenario,
    createScenario,
    updateScenario,
    deleteScenario,

    // 世界信息条目方法
    createWorldInfoEntry,
    updateWorldInfoEntry,
    deleteWorldInfoEntry,

    // 高级功能方法
    testMatching,
    reorderEntries,

    // 分组管理方法
    initializeEntryGroups,
    updateEntryGroups,

    // 选择管理方法
    toggleEntrySelection,
    toggleSelectAll,
    clearSelection,

    // 筛选和搜索方法
    searchScenarios,
    filterByCategory,
    filterByTags,
    sortScenarios,
    goToPage,
    resetFilters,

    // 数据获取方法
    fetchCategories,
    fetchTags
  }
})