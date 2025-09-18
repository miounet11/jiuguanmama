<template>
  <div class="notifications-page min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
    <!-- 页面标题区 -->
    <div class="relative">
      <!-- 背景装饰 -->
      <div class="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-3xl"></div>

      <div class="relative container mx-auto px-4 py-8">
        <div class="text-center mb-6">
          <h1 class="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-yellow-400 mb-3">
            通知中心
          </h1>
          <p class="text-lg text-gray-300 max-w-2xl mx-auto">
            及时了解你的动态互动，不错过任何重要消息
          </p>
        </div>

        <!-- 快速统计 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-purple-400">{{ stats.total || 0 }}</div>
            <div class="text-sm text-gray-400">总通知</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-red-400">{{ stats.unread || 0 }}</div>
            <div class="text-sm text-gray-400">未读</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-blue-400">{{ stats.today || 0 }}</div>
            <div class="text-sm text-gray-400">今日新增</div>
          </div>
          <div class="glass-card p-4 text-center">
            <div class="text-2xl font-bold text-green-400">{{ stats.thisWeek || 0 }}</div>
            <div class="text-sm text-gray-400">本周新增</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知内容区域 -->
    <div class="container mx-auto px-4 pb-12">
      <div class="max-w-4xl mx-auto">
        <!-- 通知设置 -->
        <div class="glass-card p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-white">通知设置</h3>
            <el-button @click="showSettingsDialog = true" size="small">
              <el-icon><Setting /></el-icon>
              设置
            </el-button>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <el-switch
                v-model="notificationSettings.likes"
                @change="updateNotificationSettings"
              />
              <div class="text-sm text-gray-300 mt-2">点赞通知</div>
            </div>
            <div class="text-center">
              <el-switch
                v-model="notificationSettings.comments"
                @change="updateNotificationSettings"
              />
              <div class="text-sm text-gray-300 mt-2">评论通知</div>
            </div>
            <div class="text-center">
              <el-switch
                v-model="notificationSettings.follows"
                @change="updateNotificationSettings"
              />
              <div class="text-sm text-gray-300 mt-2">关注通知</div>
            </div>
            <div class="text-center">
              <el-switch
                v-model="notificationSettings.mentions"
                @change="updateNotificationSettings"
              />
              <div class="text-sm text-gray-300 mt-2">提及通知</div>
            </div>
          </div>
        </div>

        <!-- 通知中心组件 -->
        <div class="glass-card p-6">
          <NotificationCenter ref="notificationCenterRef" />
        </div>
      </div>
    </div>

    <!-- 通知设置对话框 -->
    <el-dialog
      v-model="showSettingsDialog"
      title="通知设置"
      width="500px"
    >
      <div class="space-y-6">
        <!-- 基础通知设置 -->
        <div>
          <h4 class="text-lg font-medium text-white mb-4">基础通知</h4>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div class="font-medium text-white">点赞通知</div>
                <div class="text-sm text-gray-400">有人点赞你的动态时通知</div>
              </div>
              <el-switch v-model="notificationSettings.likes" />
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div class="font-medium text-white">评论通知</div>
                <div class="text-sm text-gray-400">有人评论你的动态时通知</div>
              </div>
              <el-switch v-model="notificationSettings.comments" />
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div class="font-medium text-white">关注通知</div>
                <div class="text-sm text-gray-400">有人关注你时通知</div>
              </div>
              <el-switch v-model="notificationSettings.follows" />
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div class="font-medium text-white">提及通知</div>
                <div class="text-sm text-gray-400">有人在动态中提及你时通知</div>
              </div>
              <el-switch v-model="notificationSettings.mentions" />
            </div>
          </div>
        </div>

        <!-- 推送设置 -->
        <div>
          <h4 class="text-lg font-medium text-white mb-4">推送设置</h4>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div class="font-medium text-white">浏览器推送</div>
                <div class="text-sm text-gray-400">在浏览器中显示通知</div>
              </div>
              <el-switch v-model="notificationSettings.browserPush" />
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div class="font-medium text-white">邮件通知</div>
                <div class="text-sm text-gray-400">发送重要通知到邮箱</div>
              </div>
              <el-switch v-model="notificationSettings.emailNotify" />
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div class="font-medium text-white">免打扰模式</div>
                <div class="text-sm text-gray-400">暂停所有推送通知</div>
              </div>
              <el-switch v-model="notificationSettings.doNotDisturb" />
            </div>
          </div>
        </div>

        <!-- 通知频率 -->
        <div>
          <h4 class="text-lg font-medium text-white mb-4">通知频率</h4>
          <el-radio-group v-model="notificationSettings.frequency" class="space-y-2">
            <el-radio value="instant" class="block">
              <div class="flex flex-col">
                <span class="font-medium">即时通知</span>
                <span class="text-xs text-gray-500">立即推送所有通知</span>
              </div>
            </el-radio>
            <el-radio value="hourly" class="block">
              <div class="flex flex-col">
                <span class="font-medium">每小时汇总</span>
                <span class="text-xs text-gray-500">每小时汇总一次通知</span>
              </div>
            </el-radio>
            <el-radio value="daily" class="block">
              <div class="flex flex-col">
                <span class="font-medium">每日汇总</span>
                <span class="text-xs text-gray-500">每天汇总一次通知</span>
              </div>
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end space-x-3">
          <el-button @click="showSettingsDialog = false">取消</el-button>
          <el-button
            type="primary"
            @click="saveSettings"
            :loading="savingSettings"
          >
            保存设置
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useCommunityStore } from '@/stores/community'
import NotificationCenter from '@/components/community/NotificationCenter.vue'
import { Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const communityStore = useCommunityStore()

// 响应式数据
const showSettingsDialog = ref(false)
const savingSettings = ref(false)
const notificationCenterRef = ref()

// 统计数据
const stats = reactive({
  total: 0,
  unread: 0,
  today: 0,
  thisWeek: 0
})

// 通知设置
const notificationSettings = reactive({
  likes: true,
  comments: true,
  follows: true,
  mentions: true,
  browserPush: true,
  emailNotify: false,
  doNotDisturb: false,
  frequency: 'instant'
})

// 方法
const loadStats = async () => {
  try {
    // 获取未读通知数量
    const unreadResponse = await communityStore.getUnreadNotificationCount()
    if (unreadResponse.success && unreadResponse.data) {
      stats.unread = unreadResponse.data.count
    }

    // 获取所有通知数量（这里应该有专门的API）
    const allResponse = await communityStore.getNotifications(1, 1, false)
    if (allResponse.success && allResponse.data) {
      stats.total = allResponse.data.total
    }

    // 模拟今日和本周数据
    stats.today = Math.floor(Math.random() * 10)
    stats.thisWeek = Math.floor(Math.random() * 50)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadNotificationSettings = () => {
  // 从本地存储或API加载通知设置
  const saved = localStorage.getItem('notificationSettings')
  if (saved) {
    try {
      Object.assign(notificationSettings, JSON.parse(saved))
    } catch (error) {
      console.error('加载通知设置失败:', error)
    }
  }
}

const updateNotificationSettings = () => {
  // 保存到本地存储
  localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
}

const saveSettings = async () => {
  try {
    savingSettings.value = true

    // 这里应该调用API保存设置到服务器
    updateNotificationSettings()

    // 如果启用了浏览器推送，请求权限
    if (notificationSettings.browserPush && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    }

    showSettingsDialog.value = false
    ElMessage.success('设置保存成功!')
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  } finally {
    savingSettings.value = false
  }
}

// 刷新通知中心
const refreshNotifications = () => {
  if (notificationCenterRef.value) {
    notificationCenterRef.value.refresh()
  }
  loadStats()
}

// 生命周期
onMounted(() => {
  loadStats()
  loadNotificationSettings()
})

// 暴露方法给父组件
defineExpose({
  refreshNotifications
})
</script>

<style scoped>
.glass-card {
  @apply bg-white/5 backdrop-blur-md border border-white/10 rounded-xl;
}

/* 自定义单选框样式 */
:deep(.el-radio) {
  @apply w-full p-3 rounded-lg border border-gray-600 bg-gray-800/30 hover:bg-gray-700/30 transition-all mb-2;
}

:deep(.el-radio.is-checked) {
  @apply border-purple-500 bg-purple-500/10;
}

:deep(.el-radio__input) {
  @apply hidden;
}

:deep(.el-radio__label) {
  @apply text-white pl-0;
}

/* 开关样式 */
:deep(.el-switch.is-checked .el-switch__core) {
  @apply bg-purple-600;
}
</style>
