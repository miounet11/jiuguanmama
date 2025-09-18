<template>
  <div class="app-layout">
    <!-- 全局导航栏 -->
    <AppNavigation
      v-if="!hideNavigation"
      @notification-click="handleNotificationClick"
    />

    <!-- 主要内容区域 -->
    <main
      :class="[
        'main-content',
        { 'no-nav': hideNavigation }
      ]"
    >
      <router-view />
    </main>

    <!-- 通知浮层 -->
    <NotificationFloater
      v-model="showNotifications"
      @close="showNotifications = false"
    />

    <!-- 全局加载遮罩 -->
    <LoadingOverlay v-if="globalLoading" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCommunityStore } from '@/stores/community'
import AppNavigation from './AppNavigation.vue'
import NotificationFloater from '@/components/community/NotificationFloater.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'

const route = useRoute()
const userStore = useUserStore()
const communityStore = useCommunityStore()

// 响应式数据
const showNotifications = ref(false)
const globalLoading = ref(false)

// 计算属性
const hideNavigation = computed(() => {
  return route.meta.hideLayout === true
})

// 方法
const handleNotificationClick = () => {
  showNotifications.value = !showNotifications.value
}

// 监听路由变化，在页面切换时可以执行相关操作
watch(route, (to) => {
  // 页面切换时关闭通知浮层
  showNotifications.value = false

  // 如果切换到社区相关页面，可以预加载数据
  if (to.path.startsWith('/community') && userStore.isAuthenticated) {
    // 预加载未读通知数量
    communityStore.getUnreadNotificationCount()
  }
}, { immediate: true })
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 70px; /* 为固定导航栏留出空间 */
  transition: padding-top 0.3s ease;
}

.main-content.no-nav {
  padding-top: 0;
}

/* 确保页面内容不被遮挡 */
@media (max-width: 768px) {
  .main-content {
    padding-top: 60px;
  }
}
</style>
