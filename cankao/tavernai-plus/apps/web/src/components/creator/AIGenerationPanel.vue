<template>
  <el-card class="ai-generation-panel" shadow="hover">
    <template #header>
      <div class="card-header">
        <h3>AI 内容生成</h3>
        <el-tag type="info" size="small">
          今日已用: {{ usageStats.tokensUsed || 0 }} / {{ usageStats.tokensLimit || 10000 }} tokens
        </el-tag>
      </div>
    </template>

    <div class="panel-content">
      <el-tabs v-model="activeTab" class="generation-tabs">
        <!-- Character Generation Tab -->
        <el-tab-pane label="角色生成" name="character">
          <el-form :model="characterForm" label-position="top">
            <el-form-item label="描述你想要的角色">
              <el-input
                v-model="characterForm.prompt"
                type="textarea"
                :rows="4"
                placeholder="例如：创建一个神秘的炼金术师，擅长制作魔法药水，性格古怪但心地善良..."
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="生成选项">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-select v-model="characterForm.style" placeholder="风格">
                    <el-option label="奇幻" value="fantasy" />
                    <el-option label="科幻" value="scifi" />
                    <el-option label="现代" value="modern" />
                    <el-option label="历史" value="historical" />
                  </el-select>
                </el-col>
                <el-col :span="12">
                  <el-select v-model="characterForm.complexity" placeholder="复杂度">
                    <el-option label="简单" value="simple" />
                    <el-option label="标准" value="standard" />
                    <el-option label="详细" value="detailed" />
                  </el-select>
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="generating"
                :disabled="!characterForm.prompt"
                @click="generateCharacter"
              >
                生成角色
              </el-button>
              <el-button
                v-if="generatedCharacter"
                @click="resetCharacterForm"
              >
                重置
              </el-button>
            </el-form-item>
          </el-form>

          <!-- Character Preview -->
          <div v-if="generatedCharacter" class="generation-result">
            <el-divider content-position="left">生成结果</el-divider>
            <div class="result-preview">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="名称">
                  <el-input v-model="generatedCharacter.name" />
                </el-descriptions-item>
                <el-descriptions-item label="性别">
                  <el-select v-model="generatedCharacter.gender">
                    <el-option label="男" value="male" />
                    <el-option label="女" value="female" />
                    <el-option label="其他" value="other" />
                  </el-select>
                </el-descriptions-item>
                <el-descriptions-item label="简介">
                  <el-input
                    v-model="generatedCharacter.description"
                    type="textarea"
                    :rows="3"
                  />
                </el-descriptions-item>
                <el-descriptions-item label="人格">
                  <el-input
                    v-model="generatedCharacter.personality"
                    type="textarea"
                    :rows="2"
                  />
                </el-descriptions-item>
                <el-descriptions-item label="背景故事">
                  <el-input
                    v-model="generatedCharacter.backstory"
                    type="textarea"
                    :rows="3"
                  />
                </el-descriptions-item>
              </el-descriptions>

              <div class="result-actions">
                <el-button type="primary" @click="saveCharacter">
                  保存角色
                </el-button>
                <el-button @click="regenerateCharacter">
                  重新生成
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- Scenario Generation Tab -->
        <el-tab-pane label="剧本生成" name="scenario">
          <el-form :model="scenarioForm" label-position="top">
            <el-form-item label="描述你想要的剧本">
              <el-input
                v-model="scenarioForm.prompt"
                type="textarea"
                :rows="4"
                placeholder="例如：创建一个中世纪城堡的探险剧本，充满谜题和危险..."
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="生成选项">
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-select v-model="scenarioForm.genre" placeholder="类型">
                    <el-option label="冒险" value="adventure" />
                    <el-option label="恐怖" value="horror" />
                    <el-option label="浪漫" value="romance" />
                    <el-option label="悬疑" value="mystery" />
                  </el-select>
                </el-col>
                <el-col :span="12">
                  <el-select v-model="scenarioForm.length" placeholder="长度">
                    <el-option label="短篇" value="short" />
                    <el-option label="中篇" value="medium" />
                    <el-option label="长篇" value="long" />
                  </el-select>
                </el-col>
              </el-row>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="generating"
                :disabled="!scenarioForm.prompt"
                @click="generateScenario"
              >
                生成剧本
              </el-button>
              <el-button
                v-if="generatedScenario"
                @click="resetScenarioForm"
              >
                重置
              </el-button>
            </el-form-item>
          </el-form>

          <!-- Scenario Preview -->
          <div v-if="generatedScenario" class="generation-result">
            <el-divider content-position="left">生成结果</el-divider>
            <div class="result-preview">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="标题">
                  <el-input v-model="generatedScenario.title" />
                </el-descriptions-item>
                <el-descriptions-item label="简介">
                  <el-input
                    v-model="generatedScenario.description"
                    type="textarea"
                    :rows="3"
                  />
                </el-descriptions-item>
                <el-descriptions-item label="背景设定">
                  <el-input
                    v-model="generatedScenario.setting"
                    type="textarea"
                    :rows="3"
                  />
                </el-descriptions-item>
                <el-descriptions-item label="主要情节">
                  <el-input
                    v-model="generatedScenario.plot"
                    type="textarea"
                    :rows="4"
                  />
                </el-descriptions-item>
              </el-descriptions>

              <div class="result-actions">
                <el-button type="primary" @click="saveScenario">
                  保存剧本
                </el-button>
                <el-button @click="regenerateScenario">
                  重新生成
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- Generation History -->
      <div v-if="recentGenerations.length > 0" class="generation-history">
        <el-divider content-position="left">最近生成</el-divider>
        <div class="history-list">
          <div
            v-for="item in recentGenerations"
            :key="item.timestamp"
            class="history-item"
          >
            <div class="history-icon">
              <el-icon :size="20">
                <User v-if="item.type === 'character'" />
                <Document v-else />
              </el-icon>
            </div>
            <div class="history-content">
              <p class="history-prompt">{{ item.prompt }}</p>
              <p class="history-meta">
                <el-tag size="small">{{ item.type === 'character' ? '角色' : '剧本' }}</el-tag>
                <span class="history-time">{{ formatTime(item.timestamp) }}</span>
                <span class="history-cost">{{ item.tokensUsed }} tokens</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { User, Document } from '@element-plus/icons-vue';
import { useCreatorStudioStore } from '@/stores';
import { ElMessage } from 'element-plus';

const creatorStore = useCreatorStudioStore();

const activeTab = ref('character');
const generating = ref(false);

// Character Generation
const characterForm = ref({
  prompt: '',
  style: 'fantasy',
  complexity: 'standard',
});

const generatedCharacter = ref<any>(null);

// Scenario Generation
const scenarioForm = ref({
  prompt: '',
  genre: 'adventure',
  length: 'medium',
});

const generatedScenario = ref<any>(null);

// Usage Stats
const usageStats = computed(() => ({
  tokensUsed: creatorStore.overview?.tokensUsed || 0,
  tokensLimit: 10000,
  cost: creatorStore.overview?.cost || 0,
}));

const recentGenerations = computed(() => creatorStore.recentGenerations || []);

// Character Generation Methods
async function generateCharacter() {
  generating.value = true;
  try {
    const result = await creatorStore.generateCharacter(
      characterForm.value.prompt,
      {
        style: characterForm.value.style,
        complexity: characterForm.value.complexity,
      }
    );

    if (result && result.success) {
      generatedCharacter.value = result.data;
      ElMessage.success('角色生成成功！');
    } else {
      ElMessage.error('角色生成失败，请重试');
    }
  } catch (error: any) {
    console.error('Character generation error:', error);
    ElMessage.error(error.message || '生成失败');
  } finally {
    generating.value = false;
  }
}

async function regenerateCharacter() {
  await generateCharacter();
}

function resetCharacterForm() {
  characterForm.value = {
    prompt: '',
    style: 'fantasy',
    complexity: 'standard',
  };
  generatedCharacter.value = null;
}

async function saveCharacter() {
  try {
    // Call API to save character
    // await characterApi.create(generatedCharacter.value);
    ElMessage.success('角色已保存到你的作品库');
    generatedCharacter.value = null;
    characterForm.value.prompt = '';
  } catch (error: any) {
    ElMessage.error('保存失败：' + error.message);
  }
}

// Scenario Generation Methods
async function generateScenario() {
  generating.value = true;
  try {
    const result = await creatorStore.generateScenario(
      scenarioForm.value.prompt,
      {
        genre: scenarioForm.value.genre,
        length: scenarioForm.value.length,
      }
    );

    if (result && result.success) {
      generatedScenario.value = result.data;
      ElMessage.success('剧本生成成功！');
    } else {
      ElMessage.error('剧本生成失败，请重试');
    }
  } catch (error: any) {
    console.error('Scenario generation error:', error);
    ElMessage.error(error.message || '生成失败');
  } finally {
    generating.value = false;
  }
}

async function regenerateScenario() {
  await generateScenario();
}

function resetScenarioForm() {
  scenarioForm.value = {
    prompt: '',
    genre: 'adventure',
    length: 'medium',
  };
  generatedScenario.value = null;
}

async function saveScenario() {
  try {
    // Call API to save scenario
    // await scenarioApi.create(generatedScenario.value);
    ElMessage.success('剧本已保存到你的作品库');
    generatedScenario.value = null;
    scenarioForm.value.prompt = '';
  } catch (error: any) {
    ElMessage.error('保存失败：' + error.message);
  }
}

function formatTime(timestamp: Date | string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  // Fetch creator overview to get usage stats
  creatorStore.fetchOverview();
});
</script>

<style scoped>
.ai-generation-panel {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.panel-content {
  min-height: 400px;
}

.generation-tabs {
  margin-bottom: 24px;
}

.generation-result {
  margin-top: 24px;
}

.result-preview {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
}

.result-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.generation-history {
  margin-top: 32px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f4f4f5;
  border-radius: 8px;
  transition: background 0.2s;
}

.history-item:hover {
  background: #e9e9eb;
}

.history-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
  color: #409eff;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-prompt {
  font-size: 14px;
  color: #303133;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.history-time,
.history-cost {
  color: #909399;
}

@media (max-width: 768px) {
  .result-preview {
    padding: 12px;
  }

  .history-item {
    flex-direction: column;
    gap: 8px;
  }

  .history-prompt {
    white-space: normal;
  }
}
</style>
