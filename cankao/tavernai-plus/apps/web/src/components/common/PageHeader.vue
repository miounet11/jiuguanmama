<template>
  <div class="page-header">
    <div class="header-content">
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-subtitle" v-if="subtitle">{{ subtitle }}</p>
    </div>
    <div class="header-actions" v-if="$slots.actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.header-content {
  flex: 1;
}

.page-title {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #f3f4f6 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  margin: 8px 0 0;
  font-size: 16px;
  color: #9ca3af;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>