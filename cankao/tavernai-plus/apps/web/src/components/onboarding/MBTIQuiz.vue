<template>
  <div class="mbti-quiz">
    <div v-if="!showResult" class="quiz-container">
      <h2 class="quiz-title">发现你的性格类型</h2>
      <p class="quiz-subtitle">回答以下8个问题,了解最适合你的角色推荐</p>

      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <p class="progress-text">问题 {{ currentQuestionIndex + 1 }} / {{ questions.length }}</p>

      <div class="question-card">
        <h3 class="question-text">{{ currentQuestion.question }}</h3>
        <div class="answer-options">
          <button
            v-for="(answer, index) in currentQuestion.answers"
            :key="index"
            class="answer-button"
            @click="selectAnswer(answer.value)"
          >
            <span class="answer-label">{{ String.fromCharCode(65 + index) }}</span>
            <span class="answer-text">{{ answer.text }}</span>
          </button>
        </div>
      </div>

      <div class="navigation-buttons">
        <el-button v-if="currentQuestionIndex > 0" @click="previousQuestion">
          上一题
        </el-button>
        <el-button type="primary" :disabled="!canProceed" @click="nextQuestion">
          {{ currentQuestionIndex === questions.length - 1 ? '查看结果' : '下一题' }}
        </el-button>
      </div>
    </div>

    <div v-else class="result-container">
      <div class="result-header">
        <el-icon :size="64" color="#67C23A"><SuccessFilled /></el-icon>
        <h2 class="result-title">你的性格类型是: {{ mbtiType }}</h2>
      </div>

      <div class="result-description">
        <h3>{{ mbtiDescription.name }}</h3>
        <p>{{ mbtiDescription.description }}</p>
        <div class="traits">
          <el-tag v-for="trait in mbtiDescription.traits" :key="trait" type="info">
            {{ trait }}
          </el-tag>
        </div>
      </div>

      <div class="result-actions">
        <el-button @click="retakeQuiz">重新测试</el-button>
        <el-button type="primary" @click="confirmResult">确认并继续</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { SuccessFilled } from '@element-plus/icons-vue';

// MBTI Questions (2 per dimension: E/I, S/N, T/F, J/P)
const questions = [
  {
    dimension: 'EI',
    question: '在社交场合中,你更倾向于?',
    answers: [
      { text: '主动与他人交谈,享受热闹氛围', value: 'E' },
      { text: '倾听他人,喜欢小范围深入交流', value: 'I' },
    ],
  },
  {
    dimension: 'EI',
    question: '长时间独处后,你会?',
    answers: [
      { text: '感到孤独,想要出去找朋友', value: 'E' },
      { text: '感到充电完成,精力恢复', value: 'I' },
    ],
  },
  {
    dimension: 'SN',
    question: '在学习新事物时,你更关注?',
    answers: [
      { text: '具体的事实、细节和实际应用', value: 'S' },
      { text: '概念、理论和未来可能性', value: 'N' },
    ],
  },
  {
    dimension: 'SN',
    question: '面对问题时,你倾向于?',
    answers: [
      { text: '依靠过往经验和已验证的方法', value: 'S' },
      { text: '寻找创新思路和新的解决方案', value: 'N' },
    ],
  },
  {
    dimension: 'TF',
    question: '做决定时,你更看重?',
    answers: [
      { text: '逻辑分析、客观标准和公平性', value: 'T' },
      { text: '人际和谐、他人感受和价值观', value: 'F' },
    ],
  },
  {
    dimension: 'TF',
    question: '别人批评你时,你会?',
    answers: [
      { text: '理性分析批评是否合理客观', value: 'T' },
      { text: '首先关注批评背后的情感态度', value: 'F' },
    ],
  },
  {
    dimension: 'JP',
    question: '计划旅行时,你更喜欢?',
    answers: [
      { text: '提前制定详细计划和日程表', value: 'J' },
      { text: '保持灵活,随机应变走走看', value: 'P' },
    ],
  },
  {
    dimension: 'JP',
    question: '工作方式上,你倾向于?',
    answers: [
      { text: '有条理地完成,按部就班执行', value: 'J' },
      { text: '适应变化,根据情况调整方向', value: 'P' },
    ],
  },
];

// MBTI Type Descriptions
const mbtiDescriptions: Record<string, { name: string; description: string; traits: string[] }> = {
  INTJ: {
    name: '建筑师',
    description: '富有想象力和战略性的思想家,有计划地实现目标。适合深度策略类角色、智者导师。',
    traits: ['理性', '独立', '创新', '目标导向'],
  },
  INTP: {
    name: '逻辑学家',
    description: '创新的发明家,对知识有着止不住的渴望。适合学者、炼金术士、神秘主义者角色。',
    traits: ['分析', '好奇', '灵活', '逻辑思维'],
  },
  ENTJ: {
    name: '指挥官',
    description: '大胆、有想象力且意志强大的领导者。适合指挥官、CEO、王国统治者角色。',
    traits: ['果断', '领导力', '高效', '自信'],
  },
  ENTP: {
    name: '辩论家',
    description: '聪明好奇的思想家,喜欢挑战和创新。适合冒险家、革新者、诡辩师角色。',
    traits: ['机智', '外向', '创意', '灵活'],
  },
  INFJ: {
    name: '提倡者',
    description: '安静而神秘,有着理想主义和道德感。适合治疗师、先知、精神导师角色。',
    traits: ['理想主义', '洞察力', '坚定', '同理心'],
  },
  INFP: {
    name: '调停者',
    description: '诗意、善良的利他主义者,愿意帮助他人。适合诗人、艺术家、自由战士角色。',
    traits: ['理想主义', '善良', '创造力', '灵活'],
  },
  ENFJ: {
    name: '主人公',
    description: '有魅力、有感召力的领袖,能激励他人。适合导师、演说家、外交官角色。',
    traits: ['有魅力', '利他', '领导力', '善解人意'],
  },
  ENFP: {
    name: '竞选者',
    description: '热情、富有创造力和社交能力的自由精神。适合艺人、旅行家、社交达人角色。',
    traits: ['热情', '创造力', '外向', '好奇'],
  },
  ISTJ: {
    name: '物流师',
    description: '实际、注重事实的可靠者,重视传统和责任。适合守卫、管家、执法者角色。',
    traits: ['可靠', '务实', '负责', '有条理'],
  },
  ISFJ: {
    name: '守卫者',
    description: '非常专注、温暖的守护者,愿意保护亲人。适合医护者、保镖、家政管家角色。',
    traits: ['热心', '负责', '细心', '忠诚'],
  },
  ESTJ: {
    name: '总经理',
    description: '出色的管理者,善于管理事物和人。适合将军、企业家、行政官员角色。',
    traits: ['有条理', '直接', '传统', '忠诚'],
  },
  ESFJ: {
    name: '执政官',
    description: '极有爱心、乐于助人,受欢迎的社交者。适合宴会主持、社交名流、公关角色。',
    traits: ['外向', '责任心', '协作', '热心'],
  },
  ISTP: {
    name: '鉴赏家',
    description: '大胆而实际的实验家,擅长工具和技术。适合工匠、发明家、机械师角色。',
    traits: ['灵活', '务实', '好奇', '独立'],
  },
  ISFP: {
    name: '探险家',
    description: '灵活迷人的艺术家,随时准备探索和体验新事物。适合艺术家、音乐家、探险者角色。',
    traits: ['艺术', '灵活', '敏感', '友善'],
  },
  ESTP: {
    name: '企业家',
    description: '聪明、精力充沛、善于感知的冒险家。适合赏金猎人、竞技选手、商人角色。',
    traits: ['大胆', '理性', '直接', '善于交际'],
  },
  ESFP: {
    name: '表演者',
    description: '自发的、精力充沛的娱乐者,享受当下。适合吟游诗人、演员、舞者角色。',
    traits: ['外向', '友善', '自发', '热情'],
  },
};

// Component State
const currentQuestionIndex = ref(0);
const answers = ref<Record<string, string>>({});
const showResult = ref(false);
const mbtiType = ref('');

// Computed
const currentQuestion = computed(() => questions[currentQuestionIndex.value]);
const progress = computed(() => ((currentQuestionIndex.value + 1) / questions.length) * 100);
const canProceed = computed(() => answers.value[currentQuestion.value.dimension] !== undefined);

const mbtiDescription = computed(() => {
  if (!mbtiType.value || !mbtiDescriptions[mbtiType.value]) {
    return {
      name: '未知类型',
      description: '请完成测试获取结果',
      traits: [],
    };
  }
  return mbtiDescriptions[mbtiType.value];
});

// Methods
function selectAnswer(value: string) {
  answers.value[currentQuestion.value.dimension] = value;
}

function nextQuestion() {
  if (!canProceed.value) return;

  if (currentQuestionIndex.value < questions.length - 1) {
    currentQuestionIndex.value++;
  } else {
    calculateMBTI();
    showResult.value = true;
  }
}

function previousQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
}

function calculateMBTI() {
  // Count answers for each dimension
  const ei = countDimension('EI');
  const sn = countDimension('SN');
  const tf = countDimension('TF');
  const jp = countDimension('JP');

  mbtiType.value = ei + sn + tf + jp;
}

function countDimension(dimension: string): string {
  const dimensionAnswers = Object.entries(answers.value)
    .filter(([key]) => key === dimension)
    .map(([_, value]) => value);

  const counts: Record<string, number> = {};
  dimensionAnswers.forEach((answer) => {
    counts[answer] = (counts[answer] || 0) + 1;
  });

  // Return the letter with higher count, or first letter if tie
  const letters = dimension.split('');
  const count0 = counts[letters[0]] || 0;
  const count1 = counts[letters[1]] || 0;
  return count0 >= count1 ? letters[0] : letters[1];
}

function retakeQuiz() {
  currentQuestionIndex.value = 0;
  answers.value = {};
  showResult.value = false;
  mbtiType.value = '';
}

// Emit
const emit = defineEmits<{
  (e: 'result', mbti: string): void;
}>();

function confirmResult() {
  emit('result', mbtiType.value);
}
</script>

<style scoped>
.mbti-quiz {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.quiz-container,
.result-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quiz-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
}

.quiz-subtitle {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 2rem;
}

.question-card {
  margin-bottom: 2rem;
}

.question-text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #303133;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.answer-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 1rem;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.answer-button:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.answer-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 1rem;
  border-radius: 50%;
  background: #f4f4f5;
  font-weight: bold;
  color: #606266;
}

.answer-button:hover .answer-label {
  background: #409eff;
  color: white;
}

.answer-text {
  flex: 1;
  font-size: 16px;
  color: #303133;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.result-header {
  text-align: center;
  margin-bottom: 2rem;
}

.result-title {
  font-size: 28px;
  font-weight: bold;
  margin-top: 1rem;
  color: #303133;
}

.result-description {
  padding: 1.5rem;
  background: #f4f4f5;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.result-description h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #409eff;
}

.result-description p {
  font-size: 16px;
  line-height: 1.6;
  color: #606266;
  margin-bottom: 1rem;
}

.traits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

@media (max-width: 768px) {
  .mbti-quiz {
    padding: 1rem;
  }

  .quiz-container,
  .result-container {
    padding: 1rem;
  }

  .quiz-title {
    font-size: 20px;
  }

  .question-text {
    font-size: 16px;
  }

  .answer-text {
    font-size: 14px;
  }
}
</style>
