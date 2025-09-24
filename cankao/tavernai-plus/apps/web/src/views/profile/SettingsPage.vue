<template>
  <div class="settings-page">
    <div class="settings-container">
      <!-- 页面标题 -->
      <div class="settings-header">
        <h1 class="page-title">
          <TavernIcon name="cog-6-tooth" class="title-icon" />
          系统设置
        </h1>
        <p class="page-subtitle">管理你的账户、偏好和应用配置</p>
      </div>

      <div class="settings-sections">
        <!-- 个人信息设置 -->
        <TavernCard variant="glass" class="settings-section">
          <div class="section-header">
            <TavernIcon name="user" class="section-icon" />
            <h2 class="section-title">个人信息</h2>
          </div>
          <form class="settings-form" @submit.prevent="savePersonalInfo">
            <div class="form-fields">
              <div class="field-group">
                <label class="field-label">用户名</label>
                <TavernInput
                  v-model="settings.username"
                  type="text"
                  placeholder="请输入用户名"
                  icon-left="user"
                  class="settings-input"
                />
              </div>
              <div class="field-group">
                <label class="field-label">邮箱地址</label>
                <TavernInput
                  v-model="settings.email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  icon-left="envelope"
                  class="settings-input"
                />
              </div>
            </div>
            <TavernButton
              type="submit"
              variant="primary"
              size="md"
              class="save-button"
            >
              <TavernIcon name="check" class="button-icon" />
              保存更改
            </TavernButton>
          </form>
        </TavernCard>

        <!-- 偏好设置 -->
        <TavernCard variant="glass" class="settings-section">
          <div class="section-header">
            <TavernIcon name="adjustments-horizontal" class="section-icon" />
            <h2 class="section-title">偏好设置</h2>
          </div>
          <div class="preferences-content">
            <div class="preference-item">
              <div class="preference-info">
                <TavernIcon name="envelope" class="preference-icon" />
                <div class="preference-text">
                  <h3 class="preference-title">邮件通知</h3>
                  <p class="preference-description">接收重要更新和系统通知</p>
                </div>
              </div>
              <label class="toggle-switch">
                <input
                  v-model="settings.emailNotifications"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <TavernIcon name="moon" class="preference-icon" />
                <div class="preference-text">
                  <h3 class="preference-title">深色模式</h3>
                  <p class="preference-description">启用深色主题界面</p>
                </div>
              </div>
              <label class="toggle-switch">
                <input
                  v-model="settings.darkMode"
                  type="checkbox"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="field-group">
              <label class="field-label">
                <TavernIcon name="language" class="label-icon" />
                界面语言
              </label>
              <select v-model="settings.language" class="language-select">
                <option value="zh-CN">🇨🇳 简体中文</option>
                <option value="en-US">🇺🇸 English</option>
                <option value="ja-JP">🇯🇵 日本語</option>
              </select>
            </div>
          </div>
        </TavernCard>

        <!-- API密钥管理 -->
        <TavernCard variant="glass" class="settings-section">
          <div class="section-header">
            <TavernIcon name="key" class="section-icon" />
            <h2 class="section-title">API 密钥配置</h2>
          </div>
          <div class="api-keys-content">
            <div class="api-info-notice">
              <TavernIcon name="information-circle" class="notice-icon" />
              <p class="notice-text">
                API密钥仅存储在本地，用于直接调用AI服务。请妥善保管您的密钥。
              </p>
            </div>

            <div class="api-keys-fields">
              <div class="field-group">
                <label class="field-label">
                  <TavernIcon name="cpu-chip" class="label-icon" />
                  OpenAI API Key
                </label>
                <TavernInput
                  v-model="settings.openaiKey"
                  type="password"
                  placeholder="sk-proj-..."
                  icon-left="key"
                  class="api-key-input"
                />
              </div>

              <div class="field-group">
                <label class="field-label">
                  <TavernIcon name="cpu-chip" class="label-icon" />
                  Anthropic API Key
                </label>
                <TavernInput
                  v-model="settings.anthropicKey"
                  type="password"
                  placeholder="sk-ant-api03-..."
                  icon-left="key"
                  class="api-key-input"
                />
              </div>
            </div>
          </div>
        </TavernCard>

        <!-- 危险区域 -->
        <TavernCard variant="glass" class="settings-section danger-section">
          <div class="section-header danger-header">
            <TavernIcon name="exclamation-triangle" class="section-icon danger-icon" />
            <h2 class="section-title danger-title">危险操作</h2>
          </div>
          <div class="danger-content">
            <div class="danger-notice">
              <p class="danger-text">
                以下操作将永久删除数据且无法恢复，请谨慎操作。
              </p>
            </div>

            <div class="danger-actions">
              <TavernButton
                variant="warning"
                size="md"
                @click="clearAllData"
                class="danger-button"
              >
                <TavernIcon name="trash" class="button-icon" />
                清除所有数据
              </TavernButton>

              <TavernButton
                variant="danger"
                size="md"
                @click="deleteAccount"
                class="danger-button delete-button"
              >
                <TavernIcon name="x-mark" class="button-icon" />
                删除账户
              </TavernButton>
            </div>
          </div>
        </TavernCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const settings = reactive({
  username: userStore.user?.username || '',
  email: userStore.user?.email || '',
  emailNotifications: true,
  darkMode: false,
  language: 'zh-CN',
  openaiKey: '',
  anthropicKey: ''
})

const savePersonalInfo = async () => {
  try {
    // 这里添加保存个人信息的逻辑
    console.log('Saving personal info:', settings)
    // await userStore.updateProfile({
    //   username: settings.username,
    //   email: settings.email
    // })
  } catch (error) {
    console.error('Failed to save personal info:', error)
  }
}

const clearAllData = () => {
  if (confirm('确定要清除所有数据吗？此操作无法撤销。')) {
    // 清除数据逻辑
    console.log('Clearing all data')
  }
}

const deleteAccount = () => {
  if (confirm('确定要删除账户吗？此操作将永久删除您的所有数据且无法恢复。')) {
    // 删除账户逻辑
    console.log('Deleting account')
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/design-tokens.scss';

.settings-page {
  min-height: 100vh;
  background: linear-gradient(135deg,
    var(--dt-color-background-primary) 0%,
    var(--dt-color-background-secondary) 50%,
    var(--dt-color-background-tertiary) 100%);
  padding: var(--dt-spacing-lg);
}

.settings-container {
  max-width: 1000px;
  margin: 0 auto;
}

// 页面标题
.settings-header {
  text-align: center;
  margin-bottom: var(--dt-spacing-3xl);
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--dt-spacing-md);
  font-size: var(--dt-font-size-3xl);
  font-weight: var(--dt-font-weight-bold);
  background: var(--dt-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--dt-spacing-md);
  animation: glow 2s ease-in-out infinite alternate;
}

.title-icon {
  width: 32px;
  height: 32px;
  color: var(--dt-color-primary);
}

.page-subtitle {
  font-size: var(--dt-font-size-lg);
  color: var(--dt-color-text-secondary);
  opacity: 0.8;
}

// 设置区域
.settings-sections {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-2xl);
}

.settings-section {
  padding: var(--dt-spacing-2xl);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 50px rgba(168, 85, 247, 0.3);
  }

  &.danger-section {
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.02);

    &:hover {
      box-shadow: 0 20px 50px rgba(239, 68, 68, 0.2);
    }
  }
}

// 区域标题
.section-header {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
  margin-bottom: var(--dt-spacing-xl);
  padding-bottom: var(--dt-spacing-lg);
  border-bottom: 1px solid rgba(168, 85, 247, 0.2);

  &.danger-header {
    border-bottom-color: rgba(239, 68, 68, 0.3);
  }
}

.section-icon {
  width: 24px;
  height: 24px;
  color: var(--dt-color-primary);

  &.danger-icon {
    color: #ef4444;
  }
}

.section-title {
  font-size: var(--dt-font-size-xl);
  font-weight: var(--dt-font-weight-semibold);
  color: var(--dt-color-text-primary);

  &.danger-title {
    color: #ef4444;
  }
}

// 表单样式
.settings-form {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xl);
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-sm);
}

.field-label {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-sm);
  font-size: var(--dt-font-size-sm);
  font-weight: var(--dt-font-weight-medium);
  color: var(--dt-color-text-primary);
  opacity: 0.9;
}

.label-icon {
  width: 16px;
  height: 16px;
  color: var(--dt-color-primary);
}

.settings-input,
.api-key-input {
  width: 100%;
}

.save-button {
  align-self: flex-start;

  .button-icon {
    margin-right: var(--dt-spacing-sm);
  }
}

// 偏好设置
.preferences-content {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xl);
}

.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--dt-spacing-lg);
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.1);
  border-radius: var(--dt-radius-lg);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(168, 85, 247, 0.08);
    border-color: rgba(168, 85, 247, 0.2);
  }
}

.preference-info {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
}

.preference-icon {
  width: 20px;
  height: 20px;
  color: var(--dt-color-primary);
}

.preference-text {
  .preference-title {
    font-size: var(--dt-font-size-md);
    font-weight: var(--dt-font-weight-medium);
    color: var(--dt-color-text-primary);
    margin-bottom: var(--dt-spacing-xs);
  }

  .preference-description {
    font-size: var(--dt-font-size-sm);
    color: var(--dt-color-text-secondary);
    opacity: 0.8;
  }
}

// 切换开关
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  cursor: pointer;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + .toggle-slider {
    background: var(--dt-color-primary);

    &:before {
      transform: translateX(26px);
    }
  }
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  transition: all 0.3s ease;

  &:before {
    content: '';
    position: absolute;
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background: white;
    border-radius: 50%;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

// 语言选择
.language-select {
  width: 100%;
  padding: var(--dt-spacing-md);
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: var(--dt-radius-lg);
  color: var(--dt-color-text-primary);
  font-size: var(--dt-font-size-md);
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--dt-color-primary);
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
  }
}

// API密钥区域
.api-keys-content {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xl);
}

.api-info-notice {
  display: flex;
  align-items: flex-start;
  gap: var(--dt-spacing-md);
  padding: var(--dt-spacing-lg);
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--dt-radius-lg);
}

.notice-icon {
  width: 20px;
  height: 20px;
  color: #3b82f6;
  margin-top: 2px;
}

.notice-text {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-secondary);
  line-height: 1.5;
}

.api-keys-fields {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
}

// 危险区域
.danger-content {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-xl);
}

.danger-notice {
  padding: var(--dt-spacing-lg);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--dt-radius-lg);
}

.danger-text {
  font-size: var(--dt-font-size-sm);
  color: #ef4444;
  font-weight: var(--dt-font-weight-medium);
}

.danger-actions {
  display: flex;
  gap: var(--dt-spacing-md);
  flex-wrap: wrap;
}

.danger-button {
  .button-icon {
    margin-right: var(--dt-spacing-sm);
  }

  &.delete-button {
    background: #dc2626;
    border-color: #dc2626;

    &:hover {
      background: #b91c1c;
      border-color: #b91c1c;
    }
  }
}

@keyframes glow {
  from {
    text-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
  }
  to {
    text-shadow: 0 0 30px rgba(168, 85, 247, 0.8);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .settings-page {
    padding: var(--dt-spacing-md);
  }

  .settings-section {
    padding: var(--dt-spacing-lg);
  }

  .page-title {
    font-size: var(--dt-font-size-2xl);
    flex-direction: column;
  }

  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--dt-spacing-md);
  }

  .toggle-switch {
    align-self: flex-end;
  }

  .danger-actions {
    flex-direction: column;
  }

  .danger-button {
    width: 100%;
    justify-content: center;
  }
}
</style>