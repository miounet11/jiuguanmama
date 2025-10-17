<template>
  <div class="basic-info-step">
    <div class="form-grid">
      <!-- 角色名称 -->
      <TavernInput
        v-model="modelValue.name"
        label="角色名称"
        placeholder="为你的AI角色起个名字"
        :maxlength="50"
        :show-char-count="true"
        :error-message="validation?.name"
        required
        @blur="validateName"
      />

      <!-- 角色头像 -->
      <div class="avatar-section">
        <label class="form-label">角色头像</label>
        <div class="avatar-upload">
          <div class="current-avatar" @click="uploadAvatar">
            <img
              v-if="modelValue.avatar"
              :src="modelValue.avatar"
              alt="角色头像"
              class="avatar-preview"
            />
            <div v-else class="avatar-placeholder">
              <TavernIcon name="photo" size="xl" />
              <span>点击上传头像</span>
            </div>
          </div>

          <div class="avatar-actions">
            <TavernButton variant="secondary" @click="uploadAvatar">
              <template #icon-left>
                <TavernIcon name="upload" />
              </template>
              上传图片
            </TavernButton>

            <TavernButton
              variant="ghost"
              @click="generateAvatar"
              :loading="isGeneratingAvatar"
            >
              <template #icon-left>
                <TavernIcon name="sparkles" />
              </template>
              AI生成
            </TavernButton>
          </div>
        </div>
      </div>

      <!-- 一句话描述 -->
      <TavernInput
        v-model="modelValue.shortDescription"
        type="textarea"
        label="一句话描述"
        placeholder="用一句话描述这个角色的特点"
        :maxlength="100"
        :show-char-count="true"
        :rows="2"
        :error-message="validation?.shortDescription"
      />

      <!-- 角色分类 -->
      <div class="category-section">
        <label class="form-label">角色分类</label>
        <div class="category-grid">
          <TavernCard
            v-for="category in categories"
            :key="category.id"
            variant="outlined"
            size="sm"
            clickable
            :selected="modelValue.category === category.id"
            @click="selectCategory(category.id)"
          >
            <div class="category-item">
              <TavernIcon :name="category.icon" size="lg" />
              <span>{{ category.name }}</span>
            </div>
          </TavernCard>
        </div>
      </div>

      <!-- 标签选择 -->
      <div class="tags-section">
        <label class="form-label">角色标签</label>
        <div class="tags-input">
          <div class="selected-tags">
            <TavernBadge
              v-for="tag in modelValue.tags"
              :key="tag"
              variant="secondary"
              closable
              @close="removeTag(tag)"
            >
              {{ tag }}
            </TavernBadge>
          </div>

          <TavernInput
            v-model="newTag"
            placeholder="添加标签，按回车确认"
            @keydown.enter="addTag"
          />
        </div>

        <div class="popular-tags">
          <span class="tags-label">热门标签：</span>
          <TavernBadge
            v-for="tag in popularTags"
            :key="tag"
            variant="ghost"
            size="sm"
            clickable
            @click="addTag(tag)"
          >
            {{ tag }}
          </TavernBadge>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import TavernInput from '@/components/design-system/TavernInput.vue'
import TavernButton from '@/components/design-system/TavernButton.vue'
import TavernCard from '@/components/design-system/TavernCard.vue'
import TavernIcon from '@/components/design-system/TavernIcon.vue'
import TavernBadge from '@/components/design-system/TavernBadge.vue'
import { characterService } from '@/services/character'

// Types
interface CharacterData {
  name: string
  avatar: string
  shortDescription: string
  category: string
  tags: string[]
}

interface Category {
  id: string
  name: string
  icon: string
}

// Props & Emits
const props = defineProps<{
  modelValue: CharacterData
  validation?: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CharacterData]
  validate: [stepId: string, errors: Record<string, string>]
}>()

// State
const newTag = ref('')
const isGeneratingAvatar = ref(false)
const fileInput = ref<HTMLInputElement>()

// Data
const categories: Category[] = [
  { id: 'anime', name: '动漫角色', icon: 'star' },
  { id: 'game', name: '游戏角色', icon: 'gamepad' },
  { id: 'movie', name: '影视角色', icon: 'film' },
  { id: 'book', name: '文学角色', icon: 'book' },
  { id: 'original', name: '原创角色', icon: 'lightbulb' },
  { id: 'historical', name: '历史人物', icon: 'clock' },
  { id: 'vtuber', name:'VTuber', icon: 'video' },
  { id: 'assistant', name: 'AI助手', icon: 'robot' }
]

const popularTags = [
  '可爱', '温柔', '活泼', '神秘', '聪明', '幽默',
  '冷酷', '优雅', '热情', '内向', '外向', '治愈'
]

// Computed
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Methods
const validateName = () => {
  const errors: Record<string, string> = {}

  if (!modelValue.value.name.trim()) {
    errors.name = '角色名称不能为空'
  } else if (modelValue.value.name.length > 50) {
    errors.name = '角色名称不能超过50个字符'
  }

  emit('validate', 'basic-info', errors)
}

const selectCategory = (categoryId: string) => {
  modelValue.value = {
    ...modelValue.value,
    category: categoryId
  }
}

const addTag = (tag?: string) => {
  const tagToAdd = tag || newTag.value.trim()

  if (tagToAdd && !modelValue.value.tags.includes(tagToAdd)) {
    modelValue.value = {
      ...modelValue.value,
      tags: [...modelValue.value.tags, tagToAdd]
    }

    if (!tag) {
      newTag.value = ''
    }
  }
}

const removeTag = (tag: string) => {
  modelValue.value = {
    ...modelValue.value,
    tags: modelValue.value.tags.filter(t => t !== tag)
  }
}

const uploadAvatar = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = handleFileSelect
  input.click()
}

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      modelValue.value = {
        ...modelValue.value,
        avatar: e.target?.result as string
      }
    }
    reader.readAsDataURL(file)
  }
}

const generateAvatar = async () => {
  if (!modelValue.value.name.trim()) {
    alert('请先填写角色名称')
    return
  }

  isGeneratingAvatar.value = true
  try {
    console.log('开始生成头像...', {
      name: modelValue.value.name,
      description: modelValue.value.shortDescription
    })

    const result = await characterService.generateAvatarFromData({
      name: modelValue.value.name,
      description: modelValue.value.shortDescription,
      style: 'anime' // 可以根据用户选择的分类来定
    })

    console.log('头像生成成功:', result)

    if (result.avatar) {
      modelValue.value = {
        ...modelValue.value,
        avatar: result.avatar
      }
    }
  } catch (error: any) {
    console.error('Avatar generation failed:', error)
    const errorMessage = error.response?.data?.error || error.message || '头像生成失败，请稍后重试'
    alert(errorMessage)
  } finally {
    isGeneratingAvatar.value = false
  }
}

// Watch for validation
watch(
  () => [modelValue.value.name, modelValue.value.shortDescription, modelValue.value.category],
  () => {
    // 实时验证
    const errors: Record<string, string> = {}

    if (!modelValue.value.name.trim()) {
      errors.name = '角色名称不能为空'
    }

    if (!modelValue.value.shortDescription.trim()) {
      errors.shortDescription = '请添加角色描述'
    }

    if (!modelValue.value.category) {
      errors.category = '请选择角色分类'
    }

    emit('validate', 'basic-info', errors)
  },
  { deep: true }
)
</script>

<style lang="scss">
.basic-info-step {
  .form-grid {
    display: grid;
    gap: var(--space-6);

    .form-label {
      display: block;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: var(--text-secondary);
      margin-bottom: var(--space-2);
    }

    .avatar-section {
      .avatar-upload {
        display: flex;
        gap: var(--space-4);
        align-items: flex-start;

        @media (max-width: 640px) {
          flex-direction: column;
          align-items: center;
        }

        .current-avatar {
          width: 120px;
          height: 120px;
          border-radius: var(--radius-lg);
          border: var(--space-px-2) dashed var(--border-secondary);
          overflow: hidden;
          cursor: pointer;
          transition: border-color var(--duration-fast) ease;

          &:hover {
            border-color: var(--brand-primary-400);
          }

          .avatar-preview {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .avatar-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--space-2);
            color: var(--text-tertiary);

            span {
              font-size: var(--text-sm);
            }
          }
        }

        .avatar-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);

          @media (max-width: 640px) {
            flex-direction: row;
          }
        }
      }
    }

    .category-section {
      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--space-3);

        @media (max-width: 640px) {
          grid-template-columns: repeat(2, 1fr);
        }

        .category-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3);
          text-align: center;

          span {
            font-size: var(--text-sm);
            color: var(--text-secondary);
          }
        }
      }
    }

    .tags-section {
      .tags-input {
        .selected-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }
      }

      .popular-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        align-items: center;
        margin-top: var(--space-3);

        .tags-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          margin-right: var(--space-2);
        }
      }
    }
  }
}
</style>