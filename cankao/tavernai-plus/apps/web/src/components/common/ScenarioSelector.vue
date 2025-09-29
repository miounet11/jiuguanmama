<template>
  <div class="scenario-selector">
    <div class="selector-header">
      <h3>选择时空剧本开启冒险</h3>
      <p>每个剧本都有独特的时空背景和故事发展，选择您感兴趣的剧本开始探索</p>
    </div>

    <div class="scenario-grid">
      <div
        v-for="scenario in scenarios"
        :key="scenario.id"
        :class="[
          'scenario-card',
          { 'selected': selectedScenario?.id === scenario.id }
        ]"
        @click="selectScenario(scenario)"
      >
        <div class="scenario-cover">
          <div class="scenario-icon">
            📖
          </div>
          <div class="scenario-badge">
            <el-tag
              :type="getGenreType(scenario.genre)"
              size="small"
            >
              {{ scenario.genre || '奇幻' }}
            </el-tag>
          </div>
        </div>

        <div class="scenario-content">
          <h4 class="scenario-title">{{ scenario.name }}</h4>
          <p class="scenario-description">{{ scenario.description }}</p>

          <div class="scenario-meta">
            <div class="meta-item">
              <el-icon size="14">
                <User />
              </el-icon>
              <span>{{ scenario.playerCount || 1 }}人</span>
            </div>
            <div class="meta-item">
              <el-icon size="14">
                <Clock />
              </el-icon>
              <span>{{ formatDuration(scenario.estimatedDuration) }}</span>
            </div>
            <div class="meta-item">
              <el-icon size="14">
                <Star />
              </el-icon>
              <span>{{ (scenario.ratingAverage || 0).toFixed(1) }}</span>
            </div>
          </div>

          <div class="scenario-tags">
            <el-tag
              v-for="tag in scenario.tags?.slice(0, 2)"
              :key="tag"
              size="small"
              type="info"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <div class="selector-actions">
      <el-button @click="$emit('cancel')" size="large">
        稍后再选
      </el-button>
      <el-button
        type="primary"
        size="large"
        :disabled="!selectedScenario"
        @click="confirmSelection"
      >
        开始这个剧本
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { User, Clock, Star } from '@element-plus/icons-vue'

interface Scenario {
  id: string
  name: string
  description?: string
  genre?: string
  playerCount?: number
  estimatedDuration?: number
  ratingAverage?: number
  tags?: string[]
}

interface Props {
  initialScenarios?: Scenario[]
}

const props = withDefaults(defineProps<Props>(), {
  initialScenarios: () => []
})

const emit = defineEmits<{
  select: [scenario: Scenario]
  cancel: []
}>()

const scenarios = ref<Scenario[]>(props.initialScenarios)
const selectedScenario = ref<Scenario | null>(null)

// 示例剧本数据
const sampleScenarios = [
  {
    id: 'scenario-1',
    name: '时空裂隙的守护者',
    description: '时空裂隙正在吞噬现实世界，你是唯一能修复裂隙的守护者。在这个充满未知危险的旅程中，你将遇到各种时空旅行者，与他们建立羁绊，共同拯救世界。',
    genre: '奇幻',
    playerCount: 1,
    estimatedDuration: 120,
    ratingAverage: 4.8,
    tags: ['时空旅行', '拯救世界', '多人互动']
  },
  {
    id: 'scenario-2',
    name: '魔法学院的秘密',
    description: '进入神秘的魔法学院学习魔法知识。在这里，你不仅要掌握强大的魔法，还要处理复杂的学院政治，与同学和老师建立各种关系。',
    genre: '魔法',
    playerCount: 1,
    estimatedDuration: 90,
    ratingAverage: 4.6,
    tags: ['魔法学习', '校园生活', '人际关系']
  },
  {
    id: 'scenario-3',
    name: '未来都市的地下世界',
    description: '在高度发达的未来都市中，你发现了隐藏在表象之下的地下世界。这里有黑客、赏金猎人、神秘组织，你需要在错综复杂的关系网中生存。',
    genre: '科幻',
    playerCount: 1,
    estimatedDuration: 150,
    ratingAverage: 4.9,
    tags: ['未来科技', '地下世界', '阴谋诡计']
  },
  {
    id: 'scenario-4',
    name: '古代王朝的复活',
    description: '穿越到古代王朝，成为一位王室成员。你需要处理朝政、外交、后宫斗争，同时寻找回到现代的方法。这个剧本充满宫廷斗争和历史谜团。',
    genre: '历史',
    playerCount: 1,
    estimatedDuration: 180,
    ratingAverage: 4.7,
    tags: ['古代王朝', '宫廷斗争', '历史穿越']
  }
]

const selectScenario = (scenario: Scenario) => {
  selectedScenario.value = scenario
}

const confirmSelection = () => {
  if (selectedScenario.value) {
    emit('select', selectedScenario.value)
  }
}

const getGenreType = (genre?: string): string => {
  const typeMap: Record<string, string> = {
    奇幻: 'success',
    魔法: 'primary',
    科幻: 'warning',
    历史: 'info',
    现代: '',
    恐怖: 'danger'
  }
  return typeMap[genre || ''] || ''
}

const formatDuration = (minutes?: number): string => {
  if (!minutes) return '未知'
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
}

onMounted(() => {
  if (scenarios.value.length === 0) {
    scenarios.value = sampleScenarios
  }
})
</script>

<style scoped lang="scss">
.scenario-selector {
  padding: var(--space-6);
}

.selector-header {
  text-align: center;
  margin-bottom: var(--space-6);

  h3 {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  p {
    margin: 0;
    font-size: var(--text-base);
    color: var(--text-secondary);
  }
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.scenario-card {
  background: var(--surface-2);
  border: 2px solid var(--border-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--brand-primary-400);
  }

  &.selected {
    border-color: var(--brand-primary-500);
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), var(--surface-2));
    box-shadow: var(--shadow-primary);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      var(--brand-primary-500),
      var(--brand-secondary-500)
    );
  }
}

.scenario-cover {
  position: relative;
  margin-bottom: var(--space-3);

  .scenario-icon {
    width: 100%;
    height: 120px;
    background: linear-gradient(135deg, var(--brand-primary-500), var(--brand-secondary-500));
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    color: white;
  }

  .scenario-badge {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
  }
}

.scenario-content {
  .scenario-title {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .scenario-description {
    margin: 0 0 var(--space-3) 0;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: var(--leading-snug);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .scenario-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--space-3);

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
      color: var(--text-tertiary);

      .el-icon {
        color: var(--brand-primary-500);
      }
    }
  }

  .scenario-tags {
    display: flex;
    gap: var(--space-1);
    flex-wrap: wrap;
  }
}

.selector-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
}

// 响应式设计
@media (max-width: 768px) {
  .scenario-grid {
    grid-template-columns: 1fr;
  }

  .selector-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
