<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold mb-6">编辑角色</h1>
      <!-- 复用CreateCharacter的表单结构，只是加载现有数据 -->
      <div class="bg-white rounded-lg shadow p-6">
        <p>编辑角色功能，与创建角色类似</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

onMounted(() => {
  // 加载角色数据
  const characterId = route.params.id
  console.log('编辑角色:', characterId)
})
</script>
