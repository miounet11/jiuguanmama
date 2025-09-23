<template>
  <div class="create-character-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">创建新角色</h1>
          <p class="page-subtitle">通过步骤化向导轻松创建个性化的AI角色</p>
        </div>

        <div class="header-actions">
          <TavernButton
            v-if="lastSavedDraft"
            variant="ghost"
            size="sm"
            @click="loadDraft"
          >
            <template #icon-left>
              <TavernIcon name="clock" />
            </template>
            加载草稿 ({{ formatTime(lastSavedDraft) }})
          </TavernButton>

          <TavernButton
            variant="ghost"
            size="sm"
            @click="importCharacter"
          >
            <template #icon-left>
              <TavernIcon name="upload" />
            </template>
            导入角色
          </TavernButton>
        </div>
      </div>
    </div>

    <!-- 创建向导 -->
    <CreationWizard />

    <!-- 导入文件对话框 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import CreationWizard from './components/CreationWizard.vue'
import { useCharacterCreation } from '@/composables/useCharacterCreation'

// Composables
const router = useRouter()
const {
  lastSavedDraft,
  loadFromDraft,
  clearDraft,
  importCharacterData
} = useCharacterCreation()

// State
const fileInput = ref<HTMLInputElement>()

// Methods
const loadDraft = () => {
  loadFromDraft()
}

const importCharacter = () => {
  fileInput.value?.click()
}

const handleFileImport = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    await importCharacterData(file)
    // 显示成功消息
    console.log('角色数据导入成功')
  } catch (error: any) {
    console.error('Import failed:', error)
    alert(error.message || '导入失败，请检查文件格式')
  } finally {
    // 清空文件输入
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style lang="scss">
.create-character-page {
  min-height: calc(100vh - var(--header-height));
  background: var(--surface-1);

  .page-header {
    background: var(--surface-2);
    border-bottom: var(--space-px) solid var(--border-secondary);
    padding: var(--space-6) 0;

    .header-content {
      max-width: var(--container-xl);
      margin: 0 auto;
      padding: 0 var(--container-padding);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4);

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .header-info {
        .page-title {
          margin: 0 0 var(--space-2) 0;
          font-size: var(--text-3xl);
          font-weight: var(--font-bold);
          color: var(--text-primary);
          line-height: var(--leading-tight);
        }

        .page-subtitle {
          margin: 0;
          font-size: var(--text-base);
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
        }
      }

      .header-actions {
        display: flex;
        gap: var(--space-3);
        align-items: center;

        @media (max-width: 768px) {
          width: 100%;
          justify-content: flex-start;
        }
      }
    }
  }
}
</style>
