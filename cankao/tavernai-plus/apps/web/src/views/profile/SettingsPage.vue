<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold mb-6">设置</h1>

      <div class="space-y-6">
        <!-- 个人信息设置 -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">个人信息</h2>
          <form class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                v-model="settings.username"
                type="text"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input
                v-model="settings.email"
                type="email"
                class="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              保存更改
            </button>
          </form>
        </div>

        <!-- 偏好设置 -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">偏好设置</h2>
          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="settings.emailNotifications"
                type="checkbox"
                class="mr-2"
              />
              <span>接收邮件通知</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="settings.darkMode"
                type="checkbox"
                class="mr-2"
              />
              <span>深色模式</span>
            </label>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">语言</label>
              <select v-model="settings.language" class="w-full px-3 py-2 border rounded-lg">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
                <option value="ja-JP">日本語</option>
              </select>
            </div>
          </div>
        </div>

        <!-- API密钥管理 -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">API密钥</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
              <input
                v-model="settings.openaiKey"
                type="password"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="sk-..."
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Anthropic API Key</label>
              <input
                v-model="settings.anthropicKey"
                type="password"
                class="w-full px-3 py-2 border rounded-lg"
                placeholder="sk-ant-..."
              />
            </div>
          </div>
        </div>

        <!-- 危险区域 -->
        <div class="bg-white rounded-lg shadow p-6 border-2 border-red-200">
          <h2 class="text-lg font-semibold mb-4 text-red-600">危险区域</h2>
          <div class="space-y-4">
            <button class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
              清除所有数据
            </button>
            <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              删除账户
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

const settings = reactive({
  username: '',
  email: '',
  emailNotifications: true,
  darkMode: false,
  language: 'zh-CN',
  openaiKey: '',
  anthropicKey: ''
})
</script>
