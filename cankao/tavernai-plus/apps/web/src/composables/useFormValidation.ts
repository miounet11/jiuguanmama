import { ref, computed } from 'vue'
import type { CharacterData } from './useCharacterCreation'

// Types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface StepValidation {
  [stepId: string]: {
    [fieldId: string]: string // error message
  }
}

// 验证规则定义
const validationRules: Record<string, ValidationRules> = {
  'basic-info': {
    name: {
      required: true,
      minLength: 1,
      maxLength: 50
    },
    shortDescription: {
      required: true,
      minLength: 10,
      maxLength: 100
    },
    category: {
      required: true
    },
    tags: {
      custom: (tags: string[]) => {
        if (tags.length > 10) {
          return '标签数量不能超过10个'
        }
        return null
      }
    }
  },
  'appearance': {
    physicalDescription: {
      minLength: 20,
      maxLength: 500
    },
    outfit: {
      maxLength: 300
    }
  },
  'personality': {
    personality: {
      custom: (traits: string[]) => {
        if (traits.length === 0) {
          return '请至少添加一个性格特征'
        }
        if (traits.length > 15) {
          return '性格特征不能超过15个'
        }
        return null
      }
    }
  },
  'backstory': {
    firstMessage: {
      required: true,
      minLength: 5,
      maxLength: 200
    },
    background: {
      minLength: 50,
      maxLength: 1000
    },
    scenario: {
      maxLength: 500
    }
  }
}

// 错误消息模板
const errorMessages = {
  required: '这是必填项',
  minLength: (min: number) => `至少需要${min}个字符`,
  maxLength: (max: number) => `不能超过${max}个字符`,
  pattern: '格式不正确',
  email: '请输入有效的邮箱地址',
  url: '请输入有效的网址',
  number: '请输入有效的数字'
}

export function useFormValidation() {
  // State
  const validation = ref<StepValidation>({})
  const isValidating = ref(false)

  // Methods
  const validateField = (value: any, rules: ValidationRule): string | null => {
    // Required validation
    if (rules.required) {
      if (value === null || value === undefined || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
        return errorMessages.required
      }
    }

    // Skip other validations if value is empty and not required
    if (!rules.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return null
    }

    // String length validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return errorMessages.minLength(rules.minLength)
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return errorMessages.maxLength(rules.maxLength)
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string') {
      if (!rules.pattern.test(value)) {
        return errorMessages.pattern
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value)
    }

    return null
  }

  const validateStep = async (stepId: string, data: CharacterData): Promise<boolean> => {
    isValidating.value = true

    try {
      const stepRules = validationRules[stepId]
      if (!stepRules) {
        // 没有验证规则的步骤认为总是有效
        return true
      }

      const errors: Record<string, string> = {}

      // 验证每个字段
      for (const [fieldPath, rules] of Object.entries(stepRules)) {
        const value = getNestedValue(data, fieldPath)
        const error = validateField(value, rules)

        if (error) {
          errors[fieldPath] = error
        }
      }

      // 更新验证状态
      validation.value = {
        ...validation.value,
        [stepId]: errors
      }

      return Object.keys(errors).length === 0
    } finally {
      isValidating.value = false
    }
  }

  const validateAllSteps = async (data: CharacterData): Promise<boolean> => {
    isValidating.value = true

    try {
      const allStepIds = Object.keys(validationRules)
      const validationResults = await Promise.all(
        allStepIds.map(stepId => validateStep(stepId, data))
      )

      return validationResults.every(result => result)
    } finally {
      isValidating.value = false
    }
  }

  const isStepValid = (stepId: string): boolean => {
    const stepValidation = validation.value[stepId]
    if (!stepValidation) return true

    return Object.keys(stepValidation).length === 0
  }

  const getStepErrors = (stepId: string): Record<string, string> => {
    return validation.value[stepId] || {}
  }

  const getFieldError = (stepId: string, fieldId: string): string | null => {
    return validation.value[stepId]?.[fieldId] || null
  }

  const clearStepValidation = (stepId: string) => {
    if (validation.value[stepId]) {
      delete validation.value[stepId]
      validation.value = { ...validation.value }
    }
  }

  const clearFieldValidation = (stepId: string, fieldId: string) => {
    if (validation.value[stepId]?.[fieldId]) {
      delete validation.value[stepId][fieldId]
      validation.value = {
        ...validation.value,
        [stepId]: { ...validation.value[stepId] }
      }
    }
  }

  const clearAllValidation = () => {
    validation.value = {}
  }

  // Helper functions
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current?.[key]
    }, obj)
  }

  const hasAnyErrors = computed(() => {
    return Object.values(validation.value).some(stepErrors =>
      Object.keys(stepErrors).length > 0
    )
  })

  const getAllErrors = computed(() => {
    const allErrors: string[] = []

    Object.values(validation.value).forEach(stepErrors => {
      Object.values(stepErrors).forEach(error => {
        if (error && !allErrors.includes(error)) {
          allErrors.push(error)
        }
      })
    })

    return allErrors
  })

  const getValidationSummary = computed(() => {
    const summary = {
      totalSteps: Object.keys(validationRules).length,
      validSteps: 0,
      totalErrors: 0,
      errorsByStep: {} as Record<string, number>
    }

    Object.keys(validationRules).forEach(stepId => {
      const stepErrors = validation.value[stepId] || {}
      const errorCount = Object.keys(stepErrors).length

      summary.errorsByStep[stepId] = errorCount
      summary.totalErrors += errorCount

      if (errorCount === 0) {
        summary.validSteps++
      }
    })

    return summary
  })

  // 预定义的常用验证函数
  const validators = {
    email: (value: string) => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailPattern.test(value) ? null : errorMessages.email
    },

    url: (value: string) => {
      try {
        new URL(value)
        return null
      } catch {
        return errorMessages.url
      }
    },

    number: (value: any) => {
      const num = Number(value)
      return !isNaN(num) && isFinite(num) ? null : errorMessages.number
    },

    positiveNumber: (value: any) => {
      const num = Number(value)
      if (isNaN(num) || !isFinite(num)) {
        return errorMessages.number
      }
      return num > 0 ? null : '必须是正数'
    },

    integer: (value: any) => {
      const num = Number(value)
      if (isNaN(num) || !isFinite(num)) {
        return errorMessages.number
      }
      return Number.isInteger(num) ? null : '必须是整数'
    },

    range: (min: number, max: number) => (value: any) => {
      const num = Number(value)
      if (isNaN(num) || !isFinite(num)) {
        return errorMessages.number
      }
      if (num < min || num > max) {
        return `值必须在${min}到${max}之间`
      }
      return null
    },

    oneOf: (options: any[]) => (value: any) => {
      return options.includes(value) ? null : `值必须是以下之一：${options.join(', ')}`
    },

    arrayMinLength: (min: number) => (value: any[]) => {
      if (!Array.isArray(value)) {
        return '必须是数组'
      }
      return value.length >= min ? null : `至少需要${min}个项目`
    },

    arrayMaxLength: (max: number) => (value: any[]) => {
      if (!Array.isArray(value)) {
        return '必须是数组'
      }
      return value.length <= max ? null : `最多只能有${max}个项目`
    }
  }

  return {
    // State
    validation,
    isValidating,

    // Methods
    validateField,
    validateStep,
    validateAllSteps,
    isStepValid,
    getStepErrors,
    getFieldError,
    clearStepValidation,
    clearFieldValidation,
    clearAllValidation,

    // Computed
    hasAnyErrors,
    getAllErrors,
    getValidationSummary,

    // Validators
    validators
  }
}