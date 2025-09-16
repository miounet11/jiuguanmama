<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <!-- Logo 和标题 -->
        <div class="auth-header">
          <div class="logo-wrapper">
            <img src="/logo.svg" alt="TavernAI Plus" class="logo" />
          </div>
          <h1 class="title gradient-text">TavernAI Plus</h1>
          <p class="subtitle">欢迎回到神秘酒馆</p>
        </div>
        
        <!-- 登录表单 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="auth-form"
          @submit.prevent="handleSubmit"
        >
          <el-form-item prop="email">
            <el-input
              v-model="loginForm.email"
              size="large"
              placeholder="邮箱地址"
              prefix-icon="Message"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              size="large"
              placeholder="密码"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <router-link to="/forgot-password" class="link">
                忘记密码？
              </router-link>
            </div>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-button"
              :loading="loading"
              @click="handleSubmit"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
        
        <!-- 分隔线 -->
        <div class="divider">
          <span>或</span>
        </div>
        
        <!-- 第三方登录 -->
        <div class="oauth-buttons">
          <el-button size="large" class="oauth-button" @click="handleOAuthLogin('google')">
            <img src="/icons/google.svg" alt="Google" class="oauth-icon" />
            使用 Google 登录
          </el-button>
          
          <el-button size="large" class="oauth-button" @click="handleOAuthLogin('discord')">
            <img src="/icons/discord.svg" alt="Discord" class="oauth-icon" />
            使用 Discord 登录
          </el-button>
        </div>
        
        <!-- 注册链接 -->
        <div class="auth-footer">
          <span>还没有账号？</span>
          <router-link to="/register" class="link">立即注册</router-link>
        </div>
      </div>
      
      <!-- 装饰背景 -->
      <div class="auth-decoration">
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElForm, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单引用
const loginFormRef = ref<FormInstance>()

// 表单数据
const loginForm = reactive({
  email: '',
  password: ''
})

// 其他状态
const rememberMe = ref(false)
const loading = ref(false)

// 表单验证规则
const loginRules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ]
})

// 处理登录
const handleSubmit = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    
    try {
      const success = await userStore.login(loginForm)
      
      if (success) {
        // 记住我功能
        if (rememberMe.value) {
          localStorage.setItem('rememberEmail', loginForm.email)
        } else {
          localStorage.removeItem('rememberEmail')
        }
        
        // 跳转到目标页面或首页
        const redirect = route.query.redirect as string || '/'
        router.push(redirect)
      }
    } finally {
      loading.value = false
    }
  })
}

// OAuth 登录
const handleOAuthLogin = (provider: 'google' | 'discord') => {
  // 跳转到 OAuth 授权页面
  const oauthUrl = `${import.meta.env.VITE_API_URL}/auth/oauth/${provider}`
  window.location.href = oauthUrl
}

// 初始化
onMounted(() => {
  // 恢复记住的邮箱
  const rememberedEmail = localStorage.getItem('rememberEmail')
  if (rememberedEmail) {
    loginForm.email = rememberedEmail
    rememberMe.value = true
  }
})
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $bg-primary 0%, darken($bg-primary, 5%) 100%);
  position: relative;
  overflow: hidden;
}

.auth-container {
  width: 100%;
  max-width: 420px;
  padding: $spacing-4;
  position: relative;
  z-index: 1;
}

.auth-card {
  background: rgba($bg-card, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba($bg-tertiary, 0.5);
  border-radius: $border-radius-xl;
  padding: $spacing-10 $spacing-8;
  box-shadow: $shadow-xl;
}

.auth-header {
  text-align: center;
  margin-bottom: $spacing-8;
  
  .logo-wrapper {
    width: 80px;
    height: 80px;
    margin: 0 auto $spacing-4;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $primary-color, $secondary-color);
    border-radius: $border-radius-lg;
    box-shadow: $glow-primary;
    
    .logo {
      width: 50px;
      height: 50px;
      filter: brightness(0) invert(1);
    }
  }
  
  .title {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    margin: 0 0 $spacing-2;
    font-family: $font-family-serif;
  }
  
  .subtitle {
    color: $text-secondary;
    font-size: $font-size-base;
    margin: 0;
  }
}

.auth-form {
  .el-input {
    :deep(.el-input__wrapper) {
      background: rgba($bg-secondary, 0.5);
      border-color: $bg-tertiary;
      box-shadow: none;
      
      &:hover {
        border-color: rgba($primary-color, 0.3);
      }
      
      &.is-focus {
        border-color: $primary-color;
      }
    }
    
    :deep(.el-input__inner) {
      color: $text-primary;
      
      &::placeholder {
        color: $text-muted;
      }
    }
  }
  
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .el-checkbox {
      :deep(.el-checkbox__label) {
        color: $text-secondary;
      }
    }
    
    .link {
      color: $primary-color;
      font-size: $font-size-sm;
      text-decoration: none;
      transition: color $transition-fast;
      
      &:hover {
        color: $primary-light;
      }
    }
  }
  
  .submit-button {
    width: 100%;
    height: 44px;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    background: linear-gradient(135deg, $primary-color, $primary-dark);
    border: none;
    
    &:hover {
      background: linear-gradient(135deg, $primary-light, $primary-color);
    }
  }
}

.divider {
  text-align: center;
  margin: $spacing-6 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: $bg-tertiary;
  }
  
  span {
    position: relative;
    background: $bg-card;
    padding: 0 $spacing-4;
    color: $text-tertiary;
    font-size: $font-size-sm;
  }
}

.oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: $spacing-3;
  
  .oauth-button {
    width: 100%;
    height: 44px;
    background: rgba($bg-secondary, 0.5);
    border: 1px solid $bg-tertiary;
    color: $text-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-2;
    transition: all $transition-base;
    
    &:hover {
      background: rgba($bg-secondary, 0.8);
      border-color: rgba($primary-color, 0.3);
      transform: translateY(-1px);
    }
    
    .oauth-icon {
      width: 20px;
      height: 20px;
    }
  }
}

.auth-footer {
  text-align: center;
  margin-top: $spacing-6;
  color: $text-secondary;
  font-size: $font-size-sm;
  
  .link {
    color: $primary-color;
    text-decoration: none;
    margin-left: $spacing-1;
    font-weight: $font-weight-medium;
    
    &:hover {
      color: $primary-light;
    }
  }
}

.auth-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 20s ease-in-out infinite;
  
  &.shape-1 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, $primary-color, $secondary-color);
    top: -150px;
    left: -150px;
    animation-duration: 25s;
  }
  
  &.shape-2 {
    width: 200px;
    height: 200px;
    background: linear-gradient(135deg, $secondary-color, $primary-color);
    bottom: -100px;
    right: -100px;
    animation-duration: 20s;
    animation-delay: -5s;
  }
  
  &.shape-3 {
    width: 150px;
    height: 150px;
    background: linear-gradient(135deg, $primary-light, $secondary-light);
    top: 50%;
    right: -75px;
    animation-duration: 22s;
    animation-delay: -10s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(30px, -30px) rotate(90deg);
  }
  50% {
    transform: translate(-20px, 20px) rotate(180deg);
  }
  75% {
    transform: translate(-30px, -10px) rotate(270deg);
  }
}

// 响应式设计
@include respond-below($breakpoint-sm) {
  .auth-container {
    padding: $spacing-2;
  }
  
  .auth-card {
    padding: $spacing-6 $spacing-4;
  }
  
  .auth-header {
    .title {
      font-size: $font-size-2xl;
    }
  }
}
</style>