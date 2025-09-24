<template>
  <div class="login-page">
    <div class="login-container">
      <TavernCard variant="glass" class="login-card">
        <div class="login-header">
          <h2 class="gradient-title">
            登录您的账户
          </h2>
          <p class="subtitle">
            或者
            <router-link to="/register" class="register-link">
              注册新账户
            </router-link>
          </p>
        </div>
        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-fields">
            <div class="field-group">
              <label for="email" class="field-label">邮箱地址</label>
              <TavernInput
                id="email"
                v-model="formData.email"
                type="email"
                placeholder="请输入邮箱地址"
                required
                class="login-input"
              />
            </div>
            <div class="field-group">
              <label for="password" class="field-label">密码</label>
              <TavernInput
                id="password"
                v-model="formData.password"
                type="password"
                placeholder="请输入密码"
                required
                class="login-input"
              />
            </div>
          </div>

          <div class="form-options">
            <div class="remember-me">
              <input
                id="remember-me"
                v-model="rememberMe"
                type="checkbox"
                class="remember-checkbox"
              />
              <label for="remember-me" class="remember-label">
                记住我
              </label>
            </div>

            <div class="forgot-password">
              <a href="#" class="forgot-link">
                忘记密码？
              </a>
            </div>
          </div>

          <div v-if="errorMessage" class="error-message">
            <TavernIcon name="exclamation-triangle" class="error-icon" />
            <div class="error-content">
              <h3 class="error-title">登录失败</h3>
              <p class="error-text">{{ errorMessage }}</p>
            </div>
          </div>

          <div class="submit-section">
            <TavernButton
              type="submit"
              variant="primary"
              size="lg"
              :loading="isLoading"
              :disabled="isLoading"
              class="login-button"
            >
              <TavernIcon v-if="isLoading" name="arrow-path" class="animate-spin mr-2" />
              {{ isLoading ? '登录中...' : '登录' }}
            </TavernButton>
          </div>

          <div class="social-login">
            <div class="divider">
              <div class="divider-line"></div>
              <span class="divider-text">或使用以下方式登录</span>
              <div class="divider-line"></div>
            </div>

            <div class="social-buttons">
              <TavernButton
                variant="secondary"
                size="md"
                @click="handleGoogleLogin"
                class="social-button google-button"
              >
                <svg class="social-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </TavernButton>

              <TavernButton
                variant="secondary"
                size="md"
                @click="handleGithubLogin"
                class="social-button github-button"
              >
                <svg class="social-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"/>
                </svg>
                GitHub
              </TavernButton>
            </div>
          </div>
        </form>
      </TavernCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formData = reactive({
  email: '',
  password: ''
})

const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await userStore.login({
      email: formData.email,
      password: formData.password
    })

    const redirectPath = route.query.redirect as string || '/'
    await router.push(redirectPath)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || '登录失败，请检查邮箱和密码'
  } finally {
    isLoading.value = false
  }
}

const handleGoogleLogin = async () => {
  try {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`
  } catch (error) {
    errorMessage.value = 'Google登录失败'
  }
}

const handleGithubLogin = async () => {
  try {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/github`
  } catch (error) {
    errorMessage.value = 'GitHub登录失败'
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/design-tokens.scss';

.login-page {
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

.login-container {
  width: 100%;
  max-width: 480px;
}

.login-card {
  padding: var(--dt-spacing-3xl);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(168, 85, 247, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.login-header {
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

    .register-link {
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

.login-form {
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

  .login-input {
    width: 100%;
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: var(--dt-spacing-md) 0;

  .remember-me {
    display: flex;
    align-items: center;
    gap: var(--dt-spacing-sm);

    .remember-checkbox {
      width: 18px;
      height: 18px;
      accent-color: var(--dt-color-primary);
      border-radius: var(--dt-radius-sm);
    }

    .remember-label {
      font-size: var(--dt-font-size-sm);
      color: var(--dt-color-text-primary);
      opacity: 0.8;
      cursor: pointer;
    }
  }

  .forgot-password {
    .forgot-link {
      font-size: var(--dt-font-size-sm);
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

.submit-section {
  margin: var(--dt-spacing-lg) 0;

  .login-button {
    width: 100%;
    height: 52px;
    font-size: var(--dt-font-size-md);
    font-weight: var(--dt-font-weight-semibold);
  }
}

.social-login {
  margin-top: var(--dt-spacing-xl);

  .divider {
    display: flex;
    align-items: center;
    margin-bottom: var(--dt-spacing-lg);

    .divider-line {
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
    }

    .divider-text {
      padding: 0 var(--dt-spacing-lg);
      font-size: var(--dt-font-size-sm);
      color: var(--dt-color-text-secondary);
      opacity: 0.7;
    }
  }

  .social-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--dt-spacing-md);

    .social-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--dt-spacing-sm);
      height: 48px;
      font-size: var(--dt-font-size-sm);
      font-weight: var(--dt-font-weight-medium);
      transition: all 0.3s ease;

      .social-icon {
        width: 20px;
        height: 20px;
      }

      &.google-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(66, 133, 244, 0.2);
      }

      &.github-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(36, 41, 47, 0.2);
      }
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
  .login-page {
    padding: var(--dt-spacing-md);
  }

  .login-card {
    padding: var(--dt-spacing-2xl);
  }

  .login-header {
    .gradient-title {
      font-size: var(--dt-font-size-2xl);
    }
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--dt-spacing-md);
  }

  .social-buttons {
    grid-template-columns: 1fr;
    gap: var(--dt-spacing-sm);
  }
}
</style>
