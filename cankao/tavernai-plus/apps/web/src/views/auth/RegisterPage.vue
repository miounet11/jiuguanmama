<template>
  <div class="register-page">
    <div class="register-container">
      <TavernCard variant="glass" class="register-card">
        <div class="register-header">
          <h2 class="gradient-title">创建新账户</h2>
          <p class="subtitle">
            或者
            <router-link to="/login" class="login-link">
              使用已有账户登录
            </router-link>
          </p>
        </div>

        <form class="register-form" @submit.prevent="handleRegister">
          <div class="form-fields">
            <div class="field-group">
              <label for="username" class="field-label">用户名</label>
              <TavernInput
                id="username"
                v-model="formData.username"
                type="text"
                placeholder="选择一个用户名"
                required
                class="register-input"
              />
            </div>

            <div class="field-group">
              <label for="email" class="field-label">邮箱地址</label>
              <TavernInput
                id="email"
                v-model="formData.email"
                type="email"
                placeholder="your@email.com"
                required
                class="register-input"
              />
            </div>

            <div class="field-group">
              <label for="password" class="field-label">密码</label>
              <TavernInput
                id="password"
                v-model="formData.password"
                type="password"
                placeholder="至少8个字符"
                required
                class="register-input"
                @input="checkPasswordStrength"
              />
              <div v-if="formData.password" class="password-strength">
                <div class="strength-bar">
                  <div class="strength-progress" :class="passwordStrengthClass" :style="{ width: passwordStrengthPercent + '%' }"></div>
                </div>
                <span :class="passwordStrengthTextClass" class="strength-text">
                  {{ passwordStrengthText }}
                </span>
              </div>
            </div>

            <div class="field-group">
              <label for="confirmPassword" class="field-label">确认密码</label>
              <TavernInput
                id="confirmPassword"
                v-model="formData.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                required
                class="register-input"
              />
              <p v-if="formData.confirmPassword && formData.password !== formData.confirmPassword" class="password-mismatch">
                密码不匹配
              </p>
            </div>
          </div>

          <div class="terms-agreement">
            <input
              id="agree-terms"
              v-model="agreeToTerms"
              type="checkbox"
              required
              class="terms-checkbox"
            />
            <label for="agree-terms" class="terms-label">
              我同意
              <a href="#" class="terms-link">服务条款</a>
              和
              <a href="#" class="terms-link">隐私政策</a>
            </label>
          </div>

          <div v-if="errorMessage" class="error-message">
            <TavernIcon name="exclamation-triangle" class="error-icon" />
            <div class="error-content">
              <h3 class="error-title">注册失败</h3>
              <p class="error-text">{{ errorMessage }}</p>
            </div>
          </div>

          <div v-if="successMessage" class="success-message">
            <TavernIcon name="check-circle" class="success-icon" />
            <div class="success-content">
              <h3 class="success-title">注册成功</h3>
              <p class="success-text">{{ successMessage }}</p>
            </div>
          </div>

          <div class="submit-section">
            <TavernButton
              type="submit"
              variant="primary"
              size="lg"
              :loading="isLoading"
              :disabled="isLoading || !isFormValid"
              class="register-button"
            >
              <TavernIcon v-if="isLoading" name="arrow-path" class="animate-spin mr-2" />
              {{ isLoading ? '注册中...' : '创建账户' }}
            </TavernButton>
          </div>
        </form>
      </TavernCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const agreeToTerms = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const passwordStrength = ref(0)

const isFormValid = computed(() => {
  return (
    formData.username &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    formData.password.length >= 8 &&
    agreeToTerms.value
  )
})

const passwordStrengthPercent = computed(() => {
  return passwordStrength.value * 25
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'strength-weak'
  if (strength <= 2) return 'strength-fair'
  if (strength <= 3) return 'strength-good'
  return 'strength-strong'
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return '弱'
  if (strength <= 2) return '一般'
  if (strength <= 3) return '强'
  return '很强'
})

const passwordStrengthTextClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'text-weak'
  if (strength <= 2) return 'text-fair'
  if (strength <= 3) return 'text-good'
  return 'text-strong'
})

const checkPasswordStrength = () => {
  let strength = 0
  const password = formData.password

  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  passwordStrength.value = Math.min(strength, 4)
}

const handleRegister = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await userStore.register({
      username: formData.username,
      email: formData.email,
      password: formData.password
    })

    successMessage.value = '🎉 欢迎来到时空酒馆！正在准备您的专属时空体验...'

    // 延迟跳转，让用户看到成功信息
    setTimeout(async () => {
      // 自动登录
      await userStore.login({
        email: formData.email,
        password: formData.password
      })

      // 新用户直接跳转到时空酒馆，开启游戏化体验
      await router.push('/tavern')
    }, 2000)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || '注册失败，请稍后再试'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/design-tokens.scss';

.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg,
    var(--dt-color-background-primary) 0%,
    var(--dt-color-background-secondary) 50%,
    var(--dt-color-background-tertiary) 100%);
  padding: var(--dt-spacing-lg);
}

.register-container {
  width: 100%;
  max-width: 520px;
}

.register-card {
  padding: var(--dt-spacing-3xl);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.register-header {
  text-align: center;
  margin-bottom: var(--dt-spacing-2xl);

  .gradient-title {
    font-size: var(--dt-font-size-3xl);
    font-weight: var(--dt-font-weight-bold);
    background: var(--dt-gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: var(--dt-spacing-md);
    animation: glow 2s ease-in-out infinite alternate;
  }

  .subtitle {
    font-size: var(--dt-font-size-md);
    color: var(--dt-color-text-secondary);
    opacity: 0.8;

    .login-link {
      color: var(--dt-color-primary);
      text-decoration: none;
      font-weight: var(--dt-font-weight-medium);
      transition: all 0.3s ease;

      &:hover {
        color: var(--dt-color-primary-light);
        text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
      }
    }
  }
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: var(--dt-spacing-lg);
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

  .field-label {
    font-size: var(--dt-font-size-sm);
    font-weight: var(--dt-font-weight-medium);
    color: var(--dt-color-text-primary);
    opacity: 0.9;
  }

  .register-input {
    width: 100%;
  }
}

.password-strength {
  display: flex;
  align-items: center;
  gap: var(--dt-spacing-md);
  margin-top: var(--dt-spacing-sm);

  .strength-bar {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--dt-radius-full);
    overflow: hidden;

    .strength-progress {
      height: 100%;
      border-radius: var(--dt-radius-full);
      transition: all 0.3s ease;

      &.strength-weak {
        background: linear-gradient(90deg, #ef4444, #fca5a5);
      }
      &.strength-fair {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
      }
      &.strength-good {
        background: linear-gradient(90deg, #3b82f6, #60a5fa);
      }
      &.strength-strong {
        background: linear-gradient(90deg, #10b981, #34d399);
      }
    }
  }

  .strength-text {
    font-size: var(--dt-font-size-xs);
    font-weight: var(--dt-font-weight-medium);
    min-width: 40px;

    &.text-weak { color: #ef4444; }
    &.text-fair { color: #f59e0b; }
    &.text-good { color: #3b82f6; }
    &.text-strong { color: #10b981; }
  }
}

.password-mismatch {
  font-size: var(--dt-font-size-sm);
  color: #ef4444;
  margin: var(--dt-spacing-xs) 0 0;
}

.terms-agreement {
  display: flex;
  align-items: flex-start;
  gap: var(--dt-spacing-sm);
  margin: var(--dt-spacing-md) 0;

  .terms-checkbox {
    width: 18px;
    height: 18px;
    accent-color: var(--dt-color-primary);
    border-radius: var(--dt-radius-sm);
    margin-top: 2px;
  }

  .terms-label {
    font-size: var(--dt-font-size-sm);
    color: var(--dt-color-text-primary);
    opacity: 0.8;
    line-height: 1.5;
    cursor: pointer;

    .terms-link {
      color: var(--dt-color-primary);
      text-decoration: none;
      font-weight: var(--dt-font-weight-medium);
      transition: all 0.3s ease;

      &:hover {
        color: var(--dt-color-primary-light);
        text-shadow: 0 0 8px rgba(168, 85, 247, 0.4);
      }
    }
  }
}

.error-message {
  display: flex;
  align-items: flex-start;
  gap: var(--dt-spacing-md);
  padding: var(--dt-spacing-lg);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--dt-radius-lg);
  margin: var(--dt-spacing-md) 0;

  .error-icon {
    color: #ef4444;
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .error-content {
    flex: 1;

    .error-title {
      font-size: var(--dt-font-size-sm);
      font-weight: var(--dt-font-weight-semibold);
      color: #ef4444;
      margin-bottom: var(--dt-spacing-xs);
    }

    .error-text {
      font-size: var(--dt-font-size-sm);
      color: #fca5a5;
      margin: 0;
    }
  }
}

.success-message {
  display: flex;
  align-items: flex-start;
  gap: var(--dt-spacing-md);
  padding: var(--dt-spacing-lg);
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--dt-radius-lg);
  margin: var(--dt-spacing-md) 0;

  .success-icon {
    color: #10b981;
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .success-content {
    flex: 1;

    .success-title {
      font-size: var(--dt-font-size-sm);
      font-weight: var(--dt-font-weight-semibold);
      color: #10b981;
      margin-bottom: var(--dt-spacing-xs);
    }

    .success-text {
      font-size: var(--dt-font-size-sm);
      color: #6ee7b7;
      margin: 0;
    }
  }
}

.submit-section {
  margin: var(--dt-spacing-lg) 0;

  .register-button {
    width: 100%;
    height: 52px;
    font-size: var(--dt-font-size-md);
    font-weight: var(--dt-font-weight-semibold);
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
  .register-page {
    padding: var(--dt-spacing-md);
  }

  .register-card {
    padding: var(--dt-spacing-2xl);
  }

  .register-header {
    .gradient-title {
      font-size: var(--dt-font-size-2xl);
    }
  }

  .terms-agreement {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--dt-spacing-sm);
  }
}
</style>