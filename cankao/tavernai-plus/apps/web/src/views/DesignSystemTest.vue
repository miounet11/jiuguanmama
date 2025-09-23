<template>
  <div class="bg-surface-0 min-h-screen p-8">
    <div class="max-w-6xl mx-auto">
      <!-- 页面标题 -->
      <header class="mb-12">
        <h1 class="text-4xl font-bold text-primary mb-4 bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
          TavernAI Plus 设计系统 v2.0
        </h1>
        <p class="text-secondary text-lg leading-relaxed">
          深色主题优先的现代化设计语言 - 神秘科技感的品牌调性
        </p>
      </header>

      <!-- 颜色系统展示 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-primary mb-6">颜色系统</h2>

        <!-- 主品牌色 -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-secondary mb-4">主品牌色 - 神秘紫色</h3>
          <div class="grid grid-cols-11 gap-2">
            <div v-for="(shade, index) in primaryShades" :key="shade"
                 :class="getColorClass('primary', shade)"
                 class="h-16 rounded-base flex items-end p-2">
              <span :class="index < 5 ? 'text-neutral-900' : 'text-white'" class="text-xs font-mono">
                {{ shade }}
              </span>
            </div>
          </div>
        </div>

        <!-- 辅助品牌色 -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-secondary mb-4">辅助品牌色 - 赛博蓝</h3>
          <div class="grid grid-cols-11 gap-2">
            <div v-for="(shade, index) in secondaryShades" :key="shade"
                 :class="getColorClass('secondary', shade)"
                 class="h-16 rounded-base flex items-end p-2">
              <span :class="index < 5 ? 'text-neutral-900' : 'text-white'" class="text-xs font-mono">
                {{ shade }}
              </span>
            </div>
          </div>
        </div>

        <!-- 强调色 -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-secondary mb-4">强调色 - 霓虹绿</h3>
          <div class="grid grid-cols-11 gap-2">
            <div v-for="(shade, index) in accentShades" :key="shade"
                 :class="getColorClass('accent', shade)"
                 class="h-16 rounded-base flex items-end p-2">
              <span :class="index < 5 ? 'text-neutral-900' : 'text-white'" class="text-xs font-mono">
                {{ shade }}
              </span>
            </div>
          </div>
        </div>

        <!-- 背景层级 -->
        <div class="mb-8">
          <h3 class="text-lg font-medium text-secondary mb-4">背景层级系统</h3>
          <div class="grid grid-cols-5 gap-4">
            <div v-for="level in surfaceLevels" :key="level"
                 :class="`bg-surface-${level}`"
                 class="h-20 rounded-lg border border-neutral-700 flex items-center justify-center">
              <span class="text-primary text-sm font-mono">surface-{{ level }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 排版系统展示 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-primary mb-6">排版系统</h2>

        <div class="bg-surface-2 rounded-lg p-6 border border-neutral-700">
          <h1 class="text-7xl font-black text-primary mb-2">7XL - 超大标题</h1>
          <h1 class="text-6xl font-bold text-primary mb-2">6XL - 英雄标题</h1>
          <h1 class="text-5xl font-bold text-primary mb-2">5XL - 显示标题</h1>
          <h2 class="text-4xl font-semibold text-primary mb-2">4XL - 特大标题</h2>
          <h2 class="text-3xl font-semibold text-primary mb-2">3XL - 大标题</h2>
          <h3 class="text-2xl font-medium text-primary mb-2">2XL - 中标题</h3>
          <h4 class="text-xl font-medium text-secondary mb-2">XL - 小标题</h4>
          <h5 class="text-lg font-medium text-secondary mb-2">LG - 强调文本</h5>
          <p class="text-base text-secondary mb-2">Base - 正文基准 (16px)</p>
          <p class="text-sm text-tertiary mb-2">SM - 次要文本 (14px)</p>
          <p class="text-xs text-tertiary mb-2">XS - 小标签 (12px)</p>
          <p class="text-2xs text-quaternary">2XS - 微小标签 (10px)</p>
        </div>
      </section>

      <!-- 组件展示 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-primary mb-6">组件样式</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- 角色卡片示例 -->
          <div class="bg-surface-3 border border-neutral-700 rounded-lg p-6 shadow-base hover:shadow-lg transition-all duration-normal hover:transform hover:-translate-y-1">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                司
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-semibold text-primary">司夜</h3>
                <p class="text-sm text-tertiary">神秘夜之女王</p>
              </div>
            </div>
            <p class="text-secondary text-sm leading-relaxed mb-4">
              冷漠高贵的外表下隐藏着柔软的内心，掌控着夜晚的神秘力量...
            </p>
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="inline-block bg-primary-500/10 text-primary-400 px-2 py-1 rounded-base text-xs font-medium">
                神秘
              </span>
              <span class="inline-block bg-secondary-500/10 text-secondary-400 px-2 py-1 rounded-base text-xs font-medium">
                高贵
              </span>
            </div>
            <div class="flex gap-2">
              <button class="bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-base font-medium transition-colors duration-fast shadow-primary hover:shadow-lg flex-1">
                开始对话
              </button>
              <button class="bg-surface-4 hover:bg-neutral-700 text-secondary hover:text-primary px-3 py-2 rounded-base transition-all duration-fast">
                ♡
              </button>
            </div>
          </div>

          <!-- 消息气泡示例 -->
          <div class="bg-surface-3 border border-neutral-700 rounded-lg p-6">
            <h4 class="text-lg font-medium text-primary mb-4">聊天消息样式</h4>

            <!-- 用户消息 -->
            <div class="mb-4 flex justify-end">
              <div class="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-3 rounded-lg max-w-xs shadow-primary">
                <p class="text-sm">你好，司夜。今晚的月色很美呢。</p>
              </div>
            </div>

            <!-- AI回复 -->
            <div class="mb-4 flex justify-start">
              <div class="bg-surface-4 text-primary px-4 py-3 rounded-lg max-w-xs border border-neutral-600">
                <p class="text-sm">*轻抬眼眸，银色的瞳孔中闪过一丝波澜* 是的...今夜的月亮格外明亮。</p>
              </div>
            </div>
          </div>

          <!-- 表单元素示例 -->
          <div class="bg-surface-3 border border-neutral-700 rounded-lg p-6">
            <h4 class="text-lg font-medium text-primary mb-4">表单元素</h4>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-secondary mb-2">角色名称</label>
                <input type="text"
                       placeholder="输入角色名称..."
                       class="w-full bg-surface-1 border border-neutral-600 rounded-base px-3 py-2 text-primary placeholder-quaternary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors">
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary mb-2">角色描述</label>
                <textarea placeholder="描述你的角色..."
                          rows="3"
                          class="w-full bg-surface-1 border border-neutral-600 rounded-base px-3 py-2 text-primary placeholder-quaternary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none"></textarea>
              </div>

              <button class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-400 hover:to-secondary-400 text-white py-2 rounded-base font-medium transition-all duration-normal shadow-primary hover:shadow-lg">
                创建角色
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 阴影和动画效果 -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold text-primary mb-6">阴影与动画效果</h2>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div class="bg-surface-2 rounded-lg p-4 shadow-sm border border-neutral-700">
            <p class="text-center text-sm text-secondary">shadow-sm</p>
          </div>
          <div class="bg-surface-2 rounded-lg p-4 shadow-base border border-neutral-700">
            <p class="text-center text-sm text-secondary">shadow-base</p>
          </div>
          <div class="bg-surface-2 rounded-lg p-4 shadow-lg border border-neutral-700">
            <p class="text-center text-sm text-secondary">shadow-lg</p>
          </div>
          <div class="bg-surface-2 rounded-lg p-4 shadow-xl border border-neutral-700">
            <p class="text-center text-sm text-secondary">shadow-xl</p>
          </div>
        </div>

        <div class="mt-8 grid grid-cols-2 md:grid-cols-3 gap-6">
          <div class="bg-surface-2 rounded-lg p-4 shadow-primary border border-primary-500/20 hover:shadow-glow transition-all duration-normal cursor-pointer">
            <p class="text-center text-sm text-primary">彩色阴影 + 发光效果</p>
          </div>
          <div class="bg-surface-2 rounded-lg p-4 border border-neutral-700 hover:scale-105 transition-transform duration-normal cursor-pointer">
            <p class="text-center text-sm text-secondary">悬浮缩放动画</p>
          </div>
          <div class="bg-surface-2 rounded-lg p-4 border border-neutral-700 hover:-translate-y-2 hover:shadow-lg transition-all duration-normal cursor-pointer">
            <p class="text-center text-sm text-secondary">悬浮上升动画</p>
          </div>
        </div>
      </section>

      <!-- 页脚 -->
      <footer class="mt-16 pt-8 border-t border-neutral-700">
        <p class="text-center text-tertiary text-sm">
          TavernAI Plus 设计系统 v2.0 - 为AI角色扮演而生的现代化界面语言
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 颜色档位
const primaryShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
const secondaryShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
const accentShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
const surfaceLevels = ['0', '1', '2', '3', '4']

// 获取颜色类名
const getColorClass = (color: string, shade: string) => {
  return `bg-${color}-${shade}`
}
</script>

<style scoped>
/* 自定义样式补充 */
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-primary-400 {
  --tw-gradient-from: var(--brand-primary-400);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, transparent);
}

.to-secondary-400 {
  --tw-gradient-to: var(--brand-secondary-400);
}

.bg-clip-text {
  background-clip: text;
  -webkit-background-clip: text;
}

.text-transparent {
  color: transparent;
}
</style>