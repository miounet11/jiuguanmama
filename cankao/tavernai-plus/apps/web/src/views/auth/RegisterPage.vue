<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <!-- Logo 和标题 -->
        <div class="auth-header">
          <div class="logo-wrapper">
            <img src="/logo.svg" alt="TavernAI Plus" class="logo" />
          </div>
          <h1 class="title gradient-text">加入 TavernAI Plus</h1>
          <p class="subtitle">开启你的 AI 角色扮演之旅</p>
        </div>
        
        <!-- 注册表单 -->
        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="auth-form"
          @submit.prevent="handleSubmit"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              size="large"
              placeholder="用户名"
              prefix-icon="User"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="email">
            <el-input
              v-model="registerForm.email"
              size="large"
              placeholder="邮箱地址"
              prefix-icon="Message"
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              size="large"
              placeholder="密码（至少6位）"
              prefix-icon="Lock"
              show-password
              clearable
            />
            <div class="password-strength" v-if="registerForm.password">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :style="{ width: passwordStrength.percent + '%' }"
                  :class="passwordStrength.level"
                ></div>
              </div>
              <span class="strength-text">{{ passwordStrength.text }}</span>
            </div>
          </el-form-item>
          
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              size="large"
              placeholder="确认密码"
              prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>
          
          <el-form-item prop="agreement">
            <el-checkbox v-model="registerForm.agreement">
              我已阅读并同意
              <a href="/terms" target="_blank" class="link">服务条款</a>
              和
              <a href="/privacy" target="_blank" class="link">隐私政策</a>
            </el-checkbox>
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-button"
              :loading="loading"
              @click="handleSubmit"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>
        
        <!-- 分隔线 -->
        <div class="divider">
          <span>或</span>
        </div>
        
        <!-- 第三方注册 -->
        <div class="oauth-buttons">
          <el-button size="large" class="oauth-button" @click="handleOAuthLogin('google')">
            <img src="/icons/google.svg" alt="Google" class="oauth-icon" />
            使用 Google 注册
          </el-button>
          
          <el-button size="large" class="oauth-button" @click="handleOAuthLogin('discord')">
            <img src="/icons/discord.svg" alt="Discord" class="oauth-icon" />
            使用 Discord 注册
          </el-button>
        </div>
        
        <!-- 登录链接 -->
        <div class="auth-footer">
          <span>已有账号？</span>
          <router-link to="/login" class="link">立即登录</router-link>
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElForm, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 表单引用
const registerFormRef = ref<FormInstance>()

// 表单数据
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreement: false
})

// 其他状态
const loading = ref(false)

// 密码强度计算
const passwordStrength = computed(() => {
  const password = registerForm.password
  if (!password) return { percent: 0, level: '', text: '' }
  
  let strength = 0
  
  // 长度
  if (password.length >= 6) strength += 20
  if (password.length >= 8) strength += 20
  if (password.length >= 12) strength += 20
  
  // 包含数字
  if (/\d/.test(password)) strength += 20
  
  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20
  
  // 大小写混合
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20
  
  let level = ''
  let text = ''
  
  if (strength <= 40) {
    level = 'weak'
    text = '弱'
  } else if (strength <= 70) {
    level = 'medium'
    text = '中'
  } else {
    level = 'strong'
    text = '强'
  }
  
  return { percent: Math.min(strength, 100), level, text }
})

// 自定义验证规则
const validatePassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度至少为6位'))
  } else {
    if (registerForm.confirmPassword !== '') {
      registerFormRef.value?.validateField('confirmPassword')
    }
    callback()
  }
}

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateAgreement = (rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error('请同意服务条款和隐私政策'))
  } else {
    callback()
  }
}

// 表单验证规则
const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  agreement: [
    { validator: validateAgreement, trigger: 'change' }
  ]
})

// 处理注册
const handleSubmit = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    
    try {
      const success = await userStore.register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password
      })
      
      if (success) {
        ElMessage.success('注册成功，欢迎加入 TavernAI Plus！')
        router.push('/chat')
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
  padding: $spacing-4 0;
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
  padding: $spacing-8 $spacing-8;
  box-shadow: $shadow-xl;
}

.auth-header {
  text-align: center;
  margin-bottom: $spacing-6;
  
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
    font-size: $font-size-2xl;
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
  
  .password-strength {
    margin-top: $spacing-2;
    
    .strength-bar {
      height: 4px;
      background: $bg-tertiary;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: $spacing-1;
      
      .strength-fill {
        height: 100%;
        transition: width $transition-base;
        
        &.weak {
          background: $error-color;
        }
        
        &.medium {
          background: $warning-color;
        }
        
        &.strong {
          background: $success-color;
        }
      }
    }
    
    .strength-text {
      font-size: $font-size-xs;
      color: $text-tertiary;
    }
  }
  
  .el-checkbox {
    :deep(.el-checkbox__label) {
      color: $text-secondary;
      font-size: $font-size-sm;
      
      .link {
        color: $primary-color;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
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
  margin: $spacing-4 0;
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
  margin-top: $spacing-4;
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
  .auth-page {
    padding: $spacing-2 0;
  }
  
  .auth-container {
    padding: $spacing-2;
  }
  
  .auth-card {
    padding: $spacing-6 $spacing-4;
  }
  
  .auth-header {
    .title {
      font-size: $font-size-xl;
    }
  }
}
</style>