<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">选择您的订阅计划</h1>
        <p class="mt-2 text-gray-600">解锁更多功能，享受极致体验</p>
      </div>

      <!-- 订阅计划卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 免费版 -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <div class="px-6 py-8">
            <h2 class="text-xl font-semibold text-gray-900">免费版</h2>
            <div class="mt-4">
              <span class="text-4xl font-bold">¥0</span>
              <span class="text-gray-500">/月</span>
            </div>
            <ul class="mt-6 space-y-3">
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>每月100条消息</span>
              </li>
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>创建最多3个角色</span>
              </li>
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>基础AI模型</span>
              </li>
            </ul>
            <button
              class="mt-8 w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg cursor-not-allowed"
              disabled
            >
              当前计划
            </button>
          </div>
        </div>

        <!-- 专业版 -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-indigo-600 relative">
          <div class="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-sm">
            推荐
          </div>
          <div class="px-6 py-8">
            <h2 class="text-xl font-semibold text-gray-900">专业版</h2>
            <div class="mt-4">
              <span class="text-4xl font-bold">¥99</span>
              <span class="text-gray-500">/月</span>
            </div>
            <ul class="mt-6 space-y-3">
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>每月5000条消息</span>
              </li>
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>创建无限角色</span>
              </li>
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>GPT-4 / Claude 2</span>
              </li>
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>优先支持</span>
              </li>
            </ul>
            <button
              @click="subscribe('pro')"
              class="mt-8 w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              升级到专业版
            </button>
          </div>
        </div>

        <!-- 企业版 -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <div class="px-6 py-8">
            <h2 class="text-xl font-semibold text-gray-900">企业版</h2>
            <div class="mt-4">
              <span class="text-4xl font-bold">¥299</span>
              <span class="text-gray-500">/月</span>
            </div>
            <ul class="mt-6 space-y-3">
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>无限消息</span>
              </li>
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>所有AI模型</span>
              </li>
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>API访问权限</span>
              </li>
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>专属客服</span>
              </li>
              <li class="flex items-center">
                <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>团队协作功能</span>
              </li>
            </ul>
            <button
              @click="subscribe('enterprise')"
              class="mt-8 w-full py-2 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              升级到企业版
            </button>
          </div>
        </div>
      </div>

      <!-- FAQ部分 -->
      <div class="mt-12 bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-semibold mb-4">常见问题</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-semibold">可以随时取消订阅吗？</h3>
            <p class="text-gray-600 mt-1">是的，您可以随时取消订阅，当前周期结束前仍可使用付费功能。</p>
          </div>
          <div>
            <h3 class="font-semibold">支持哪些支付方式？</h3>
            <p class="text-gray-600 mt-1">我们支持支付宝、微信支付和信用卡支付。</p>
          </div>
          <div>
            <h3 class="font-semibold">可以更换套餐吗？</h3>
            <p class="text-gray-600 mt-1">可以随时升级或降级套餐，费用将按比例调整。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const subscribe = (plan: string) => {
  console.log('订阅计划:', plan)
  // 实现订阅逻辑
}
</script>
