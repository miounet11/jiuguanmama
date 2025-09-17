<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          创建新账户
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          或者
          <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
            使用已有账户登录
          </router-link>
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              用户名
            </label>
            <input
              id="username"
              v-model="formData.username"
              name="username"
              type="text"
              autocomplete="username"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="选择一个用户名"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              邮箱地址
            </label>
            <input
              id="email"
              v-model="formData.email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              id="password"
              v-model="formData.password"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="至少8个字符"
              @input="checkPasswordStrength"
            />
            <div v-if="formData.password" class="mt-2">
              <div class="flex items-center">
                <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                  <div
                    :class="passwordStrengthClass"
                    :style="{ width: passwordStrengthPercent + '%' }"
                    class="h-2 rounded-full transition-all"
                  ></div>
                </div>
                <span :class="passwordStrengthTextClass" class="text-xs">
                  {{ passwordStrengthText }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              确认密码
            </label>
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="再次输入密码"
            />
            <p v-if="formData.confirmPassword && formData.password !== formData.confirmPassword" class="mt-1 text-sm text-red-600">
              密码不匹配
            </p>
          </div>
        </div>

        <div class="flex items-center">
          <input
            id="agree-terms"
            v-model="agreeToTerms"
            name="agree-terms"
            type="checkbox"
            required
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label for="agree-terms" class="ml-2 block text-sm text-gray-900">
            我同意
            <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">服务条款</a>
            和
            <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">隐私政策</a>
          </label>
        </div>

        <div v-if="errorMessage" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                注册失败
              </h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{{ errorMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="successMessage" class="rounded-md bg-green-50 p-4">
          <div class="flex">
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                注册成功
              </h3>
              <div class="mt-2 text-sm text-green-700">
                <p>{{ successMessage }}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading || !isFormValid"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ isLoading ? '注册中...' : '创建账户' }}
          </button>
        </div>
      </form>
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
  if (strength <= 1) return 'bg-red-500'
  if (strength <= 2) return 'bg-yellow-500'
  if (strength <= 3) return 'bg-blue-500'
  return 'bg-green-500'
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
  if (strength <= 1) return 'text-red-600'
  if (strength <= 2) return 'text-yellow-600'
  if (strength <= 3) return 'text-blue-600'
  return 'text-green-600'
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

    successMessage.value = '注册成功！正在跳转到登录页面...'

    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || '注册失败，请稍后再试'
  } finally {
    isLoading.value = false
  }
}
</script>
