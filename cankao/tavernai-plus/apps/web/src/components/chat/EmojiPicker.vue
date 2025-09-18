<template>
  <div class="emoji-picker-overlay" @click="$emit('close')">
    <div class="emoji-picker" @click.stop>
      <div class="emoji-header">
        <div class="emoji-categories">
          <button
            v-for="category in categories"
            :key="category.key"
            :class="['category-btn', { active: activeCategory === category.key }]"
            @click="activeCategory = category.key"
            :title="category.name"
          >
            {{ category.icon }}
          </button>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <el-icon><Close /></el-icon>
        </button>
      </div>

      <div class="emoji-content">
        <div class="emoji-search" v-if="showSearch">
          <el-input
            v-model="searchQuery"
            placeholder="搜索表情..."
            size="small"
            prefix-icon="Search"
            clearable
          />
        </div>

        <div class="emoji-grid-container" ref="emojiContainer">
          <div class="emoji-grid">
            <button
              v-for="emoji in filteredEmojis"
              :key="emoji.code"
              class="emoji-btn"
              @click="selectEmoji(emoji)"
              :title="emoji.name"
            >
              {{ emoji.emoji }}
            </button>
          </div>
        </div>

        <!-- 最近使用 -->
        <div v-if="recentEmojis.length > 0 && !searchQuery" class="recent-section">
          <div class="section-title">最近使用</div>
          <div class="emoji-grid">
            <button
              v-for="emoji in recentEmojis"
              :key="'recent-' + emoji.code"
              class="emoji-btn"
              @click="selectEmoji(emoji)"
              :title="emoji.name"
            >
              {{ emoji.emoji }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Close } from '@element-plus/icons-vue'

interface Emoji {
  emoji: string
  code: string
  name: string
  category: string
}

interface Emits {
  (e: 'select', emoji: string): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const activeCategory = ref('smileys')
const searchQuery = ref('')
const showSearch = ref(true)
const emojiContainer = ref<HTMLElement>()
const recentEmojis = ref<Emoji[]>([])

// 表情分类
const categories = [
  { key: 'smileys', name: '笑脸', icon: '😀' },
  { key: 'people', name: '人物', icon: '👤' },
  { key: 'nature', name: '自然', icon: '🌿' },
  { key: 'food', name: '食物', icon: '🍎' },
  { key: 'activities', name: '活动', icon: '⚽' },
  { key: 'travel', name: '旅行', icon: '✈️' },
  { key: 'objects', name: '物品', icon: '💡' },
  { key: 'symbols', name: '符号', icon: '❤️' },
  { key: 'flags', name: '旗帜', icon: '🏁' }
]

// 表情数据
const emojiData: Record<string, Emoji[]> = {
  smileys: [
    { emoji: '😀', code: 'grinning', name: '咧嘴笑', category: 'smileys' },
    { emoji: '😃', code: 'smiley', name: '笑脸', category: 'smileys' },
    { emoji: '😄', code: 'smile', name: '大笑', category: 'smileys' },
    { emoji: '😁', code: 'grin', name: '露齿笑', category: 'smileys' },
    { emoji: '😆', code: 'laughing', name: '哈哈', category: 'smileys' },
    { emoji: '😅', code: 'sweat_smile', name: '汗笑', category: 'smileys' },
    { emoji: '😂', code: 'joy', name: '笑哭', category: 'smileys' },
    { emoji: '🤣', code: 'rofl', name: '滚地笑', category: 'smileys' },
    { emoji: '😊', code: 'blush', name: '害羞', category: 'smileys' },
    { emoji: '😇', code: 'innocent', name: '天使', category: 'smileys' },
    { emoji: '🙂', code: 'slightly_smiling', name: '微笑', category: 'smileys' },
    { emoji: '🙃', code: 'upside_down', name: '倒脸', category: 'smileys' },
    { emoji: '😉', code: 'wink', name: '眨眼', category: 'smileys' },
    { emoji: '😌', code: 'relieved', name: '放松', category: 'smileys' },
    { emoji: '😍', code: 'heart_eyes', name: '爱心眼', category: 'smileys' },
    { emoji: '🥰', code: 'smiling_face_with_hearts', name: '心动', category: 'smileys' },
    { emoji: '😘', code: 'kissing_heart', name: '飞吻', category: 'smileys' },
    { emoji: '😗', code: 'kissing', name: '亲吻', category: 'smileys' },
    { emoji: '🤔', code: 'thinking', name: '思考', category: 'smileys' },
    { emoji: '🤨', code: 'raised_eyebrow', name: '挑眉', category: 'smileys' },
    { emoji: '😐', code: 'neutral', name: '面无表情', category: 'smileys' },
    { emoji: '😑', code: 'expressionless', name: '无语', category: 'smileys' },
    { emoji: '🙄', code: 'eye_roll', name: '翻白眼', category: 'smileys' },
    { emoji: '😏', code: 'smirk', name: '得意', category: 'smileys' },
    { emoji: '😣', code: 'persevere', name: '坚持', category: 'smileys' },
    { emoji: '😥', code: 'disappointed_relieved', name: '失望', category: 'smileys' },
    { emoji: '😮', code: 'open_mouth', name: '惊讶', category: 'smileys' },
    { emoji: '🤐', code: 'zipper_mouth', name: '拉链嘴', category: 'smileys' },
    { emoji: '😯', code: 'hushed', name: '安静', category: 'smileys' },
    { emoji: '😪', code: 'sleepy', name: '困倦', category: 'smileys' },
    { emoji: '😫', code: 'tired', name: '疲倦', category: 'smileys' },
    { emoji: '🥱', code: 'yawning', name: '打哈欠', category: 'smileys' },
    { emoji: '😴', code: 'sleeping', name: '睡觉', category: 'smileys' },
    { emoji: '😷', code: 'mask', name: '口罩', category: 'smileys' },
    { emoji: '🤒', code: 'thermometer', name: '发烧', category: 'smileys' },
    { emoji: '🤕', code: 'head_bandage', name: '受伤', category: 'smileys' },
    { emoji: '🤢', code: 'nauseated', name: '恶心', category: 'smileys' },
    { emoji: '🤮', code: 'vomiting', name: '呕吐', category: 'smileys' },
    { emoji: '🤧', code: 'sneezing', name: '打喷嚏', category: 'smileys' },
    { emoji: '🥵', code: 'hot', name: '热', category: 'smileys' },
    { emoji: '🥶', code: 'cold', name: '冷', category: 'smileys' },
    { emoji: '😎', code: 'sunglasses', name: '酷', category: 'smileys' },
    { emoji: '🤓', code: 'nerd', name: '书呆子', category: 'smileys' },
    { emoji: '🧐', code: 'monocle', name: '单片眼镜', category: 'smileys' }
  ],
  people: [
    { emoji: '👶', code: 'baby', name: '婴儿', category: 'people' },
    { emoji: '🧒', code: 'child', name: '小孩', category: 'people' },
    { emoji: '👦', code: 'boy', name: '男孩', category: 'people' },
    { emoji: '👧', code: 'girl', name: '女孩', category: 'people' },
    { emoji: '🧑', code: 'person', name: '人', category: 'people' },
    { emoji: '👨', code: 'man', name: '男人', category: 'people' },
    { emoji: '👩', code: 'woman', name: '女人', category: 'people' },
    { emoji: '🧓', code: 'older_person', name: '老人', category: 'people' },
    { emoji: '👴', code: 'older_man', name: '老爷爷', category: 'people' },
    { emoji: '👵', code: 'older_woman', name: '老奶奶', category: 'people' },
    { emoji: '👮', code: 'police', name: '警察', category: 'people' },
    { emoji: '🕵️', code: 'detective', name: '侦探', category: 'people' },
    { emoji: '💂', code: 'guard', name: '卫兵', category: 'people' },
    { emoji: '👷', code: 'construction_worker', name: '工人', category: 'people' },
    { emoji: '🤴', code: 'prince', name: '王子', category: 'people' },
    { emoji: '👸', code: 'princess', name: '公主', category: 'people' },
    { emoji: '👳', code: 'person_with_turban', name: '戴头巾的人', category: 'people' },
    { emoji: '👲', code: 'man_with_chinese_cap', name: '戴帽子的人', category: 'people' },
    { emoji: '🧕', code: 'woman_with_headscarf', name: '戴头巾的女人', category: 'people' },
    { emoji: '🤵', code: 'person_in_tuxedo', name: '穿燕尾服的人', category: 'people' },
    { emoji: '👰', code: 'bride_with_veil', name: '新娘', category: 'people' },
    { emoji: '🤰', code: 'pregnant_woman', name: '孕妇', category: 'people' },
    { emoji: '🤱', code: 'breast_feeding', name: '哺乳', category: 'people' },
    { emoji: '👼', code: 'angel', name: '天使', category: 'people' },
    { emoji: '🎅', code: 'santa', name: '圣诞老人', category: 'people' },
    { emoji: '🤶', code: 'mrs_claus', name: '圣诞老婆婆', category: 'people' },
    { emoji: '🦸', code: 'superhero', name: '超级英雄', category: 'people' },
    { emoji: '🦹', code: 'supervillain', name: '超级反派', category: 'people' },
    { emoji: '🧙', code: 'mage', name: '法师', category: 'people' },
    { emoji: '🧚', code: 'fairy', name: '仙女', category: 'people' },
    { emoji: '🧛', code: 'vampire', name: '吸血鬼', category: 'people' },
    { emoji: '🧜', code: 'merperson', name: '人鱼', category: 'people' },
    { emoji: '🧝', code: 'elf', name: '精灵', category: 'people' },
    { emoji: '🧞', code: 'genie', name: '精灵', category: 'people' },
    { emoji: '🧟', code: 'zombie', name: '僵尸', category: 'people' },
    { emoji: '💆', code: 'massage', name: '按摩', category: 'people' },
    { emoji: '💇', code: 'haircut', name: '理发', category: 'people' },
    { emoji: '🚶', code: 'walking', name: '走路', category: 'people' },
    { emoji: '🧍', code: 'standing', name: '站立', category: 'people' },
    { emoji: '🧎', code: 'kneeling', name: '跪下', category: 'people' },
    { emoji: '🏃', code: 'running', name: '跑步', category: 'people' },
    { emoji: '💃', code: 'dancing', name: '跳舞', category: 'people' },
    { emoji: '🕺', code: 'man_dancing', name: '男人跳舞', category: 'people' }
  ],
  nature: [
    { emoji: '🐶', code: 'dog', name: '狗', category: 'nature' },
    { emoji: '🐱', code: 'cat', name: '猫', category: 'nature' },
    { emoji: '🐭', code: 'mouse', name: '老鼠', category: 'nature' },
    { emoji: '🐹', code: 'hamster', name: '仓鼠', category: 'nature' },
    { emoji: '🐰', code: 'rabbit', name: '兔子', category: 'nature' },
    { emoji: '🦊', code: 'fox', name: '狐狸', category: 'nature' },
    { emoji: '🐻', code: 'bear', name: '熊', category: 'nature' },
    { emoji: '🐼', code: 'panda', name: '熊猫', category: 'nature' },
    { emoji: '🐨', code: 'koala', name: '考拉', category: 'nature' },
    { emoji: '🐯', code: 'tiger', name: '老虎', category: 'nature' },
    { emoji: '🦁', code: 'lion', name: '狮子', category: 'nature' },
    { emoji: '🐮', code: 'cow', name: '牛', category: 'nature' },
    { emoji: '🐷', code: 'pig', name: '猪', category: 'nature' },
    { emoji: '🐸', code: 'frog', name: '青蛙', category: 'nature' },
    { emoji: '🐵', code: 'monkey', name: '猴子', category: 'nature' },
    { emoji: '🙈', code: 'see_no_evil', name: '非礼勿视', category: 'nature' },
    { emoji: '🙉', code: 'hear_no_evil', name: '非礼勿听', category: 'nature' },
    { emoji: '🙊', code: 'speak_no_evil', name: '非礼勿言', category: 'nature' },
    { emoji: '🐒', code: 'monkey2', name: '猴子2', category: 'nature' },
    { emoji: '🐔', code: 'chicken', name: '鸡', category: 'nature' },
    { emoji: '🐧', code: 'penguin', name: '企鹅', category: 'nature' },
    { emoji: '🐦', code: 'bird', name: '鸟', category: 'nature' },
    { emoji: '🐤', code: 'baby_chick', name: '小鸡', category: 'nature' },
    { emoji: '🐣', code: 'hatching_chick', name: '孵化小鸡', category: 'nature' },
    { emoji: '🐥', code: 'front_facing_baby_chick', name: '正面小鸡', category: 'nature' },
    { emoji: '🦆', code: 'duck', name: '鸭子', category: 'nature' },
    { emoji: '🦅', code: 'eagle', name: '老鹰', category: 'nature' },
    { emoji: '🦉', code: 'owl', name: '猫头鹰', category: 'nature' },
    { emoji: '🦇', code: 'bat', name: '蝙蝠', category: 'nature' },
    { emoji: '🐺', code: 'wolf', name: '狼', category: 'nature' },
    { emoji: '🐗', code: 'boar', name: '野猪', category: 'nature' },
    { emoji: '🐴', code: 'horse', name: '马', category: 'nature' },
    { emoji: '🦄', code: 'unicorn', name: '独角兽', category: 'nature' },
    { emoji: '🐝', code: 'bee', name: '蜜蜂', category: 'nature' },
    { emoji: '🐛', code: 'bug', name: '虫子', category: 'nature' },
    { emoji: '🦋', code: 'butterfly', name: '蝴蝶', category: 'nature' },
    { emoji: '🐌', code: 'snail', name: '蜗牛', category: 'nature' },
    { emoji: '🐞', code: 'ladybug', name: '瓢虫', category: 'nature' },
    { emoji: '🐜', code: 'ant', name: '蚂蚁', category: 'nature' },
    { emoji: '🦟', code: 'mosquito', name: '蚊子', category: 'nature' },
    { emoji: '🦗', code: 'cricket', name: '蟋蟀', category: 'nature' },
    { emoji: '🕷️', code: 'spider', name: '蜘蛛', category: 'nature' },
    { emoji: '🕸️', code: 'spider_web', name: '蜘蛛网', category: 'nature' },
    { emoji: '🦂', code: 'scorpion', name: '蝎子', category: 'nature' }
  ],
  food: [
    { emoji: '🍎', code: 'apple', name: '苹果', category: 'food' },
    { emoji: '🍊', code: 'orange', name: '橙子', category: 'food' },
    { emoji: '🍋', code: 'lemon', name: '柠檬', category: 'food' },
    { emoji: '🍌', code: 'banana', name: '香蕉', category: 'food' },
    { emoji: '🍉', code: 'watermelon', name: '西瓜', category: 'food' },
    { emoji: '🍇', code: 'grapes', name: '葡萄', category: 'food' },
    { emoji: '🍓', code: 'strawberry', name: '草莓', category: 'food' },
    { emoji: '🫐', code: 'blueberries', name: '蓝莓', category: 'food' },
    { emoji: '🍈', code: 'melon', name: '甜瓜', category: 'food' },
    { emoji: '🍒', code: 'cherries', name: '樱桃', category: 'food' },
    { emoji: '🍑', code: 'peach', name: '桃子', category: 'food' },
    { emoji: '🥭', code: 'mango', name: '芒果', category: 'food' },
    { emoji: '🍍', code: 'pineapple', name: '菠萝', category: 'food' },
    { emoji: '🥥', code: 'coconut', name: '椰子', category: 'food' },
    { emoji: '🥝', code: 'kiwi', name: '猕猴桃', category: 'food' },
    { emoji: '🍅', code: 'tomato', name: '番茄', category: 'food' },
    { emoji: '🍆', code: 'eggplant', name: '茄子', category: 'food' },
    { emoji: '🥑', code: 'avocado', name: '牛油果', category: 'food' },
    { emoji: '🥦', code: 'broccoli', name: '西兰花', category: 'food' },
    { emoji: '🥬', code: 'leafy_greens', name: '绿叶菜', category: 'food' },
    { emoji: '🥒', code: 'cucumber', name: '黄瓜', category: 'food' },
    { emoji: '🌶️', code: 'hot_pepper', name: '辣椒', category: 'food' },
    { emoji: '🫒', code: 'olive', name: '橄榄', category: 'food' },
    { emoji: '🧄', code: 'garlic', name: '大蒜', category: 'food' },
    { emoji: '🧅', code: 'onion', name: '洋葱', category: 'food' },
    { emoji: '🥕', code: 'carrot', name: '胡萝卜', category: 'food' },
    { emoji: '🌽', code: 'corn', name: '玉米', category: 'food' },
    { emoji: '🌭', code: 'hot_dog', name: '热狗', category: 'food' },
    { emoji: '🍕', code: 'pizza', name: '披萨', category: 'food' },
    { emoji: '🍔', code: 'hamburger', name: '汉堡', category: 'food' },
    { emoji: '🍟', code: 'fries', name: '薯条', category: 'food' },
    { emoji: '🥙', code: 'stuffed_flatbread', name: '卷饼', category: 'food' },
    { emoji: '🌮', code: 'taco', name: '墨西哥卷', category: 'food' },
    { emoji: '🌯', code: 'burrito', name: '卷饼', category: 'food' },
    { emoji: '🥗', code: 'salad', name: '沙拉', category: 'food' },
    { emoji: '🥘', code: 'shallow_pan_of_food', name: '炖菜', category: 'food' },
    { emoji: '🍝', code: 'spaghetti', name: '意面', category: 'food' },
    { emoji: '🍜', code: 'ramen', name: '拉面', category: 'food' },
    { emoji: '🍲', code: 'stew', name: '炖汤', category: 'food' },
    { emoji: '🍛', code: 'curry', name: '咖喱', category: 'food' },
    { emoji: '🍣', code: 'sushi', name: '寿司', category: 'food' },
    { emoji: '🍱', code: 'bento', name: '便当', category: 'food' },
    { emoji: '🥟', code: 'dumpling', name: '饺子', category: 'food' },
    { emoji: '🦪', code: 'oyster', name: '牡蛎', category: 'food' }
  ],
  activities: [
    { emoji: '⚽', code: 'soccer', name: '足球', category: 'activities' },
    { emoji: '🏀', code: 'basketball', name: '篮球', category: 'activities' },
    { emoji: '🏈', code: 'football', name: '橄榄球', category: 'activities' },
    { emoji: '⚾', code: 'baseball', name: '棒球', category: 'activities' },
    { emoji: '🥎', code: 'softball', name: '垒球', category: 'activities' },
    { emoji: '🎾', code: 'tennis', name: '网球', category: 'activities' },
    { emoji: '🏐', code: 'volleyball', name: '排球', category: 'activities' },
    { emoji: '🏉', code: 'rugby_football', name: '橄榄球', category: 'activities' },
    { emoji: '🥏', code: 'flying_disc', name: '飞盘', category: 'activities' },
    { emoji: '🎱', code: 'pool_8_ball', name: '台球', category: 'activities' },
    { emoji: '🪀', code: 'yo_yo', name: '悠悠球', category: 'activities' },
    { emoji: '🏓', code: 'ping_pong', name: '乒乓球', category: 'activities' },
    { emoji: '🏸', code: 'badminton', name: '羽毛球', category: 'activities' },
    { emoji: '🏒', code: 'ice_hockey', name: '冰球', category: 'activities' },
    { emoji: '🏑', code: 'field_hockey', name: '曲棍球', category: 'activities' },
    { emoji: '🥍', code: 'lacrosse', name: '长曲棍球', category: 'activities' },
    { emoji: '🏹', code: 'bow_and_arrow', name: '弓箭', category: 'activities' },
    { emoji: '🎣', code: 'fishing_pole', name: '钓鱼', category: 'activities' },
    { emoji: '🤿', code: 'diving_mask', name: '潜水', category: 'activities' },
    { emoji: '🥊', code: 'boxing_glove', name: '拳击', category: 'activities' },
    { emoji: '🥋', code: 'martial_arts_uniform', name: '武术', category: 'activities' },
    { emoji: '🎽', code: 'running_shirt', name: '跑步', category: 'activities' },
    { emoji: '🛹', code: 'skateboard', name: '滑板', category: 'activities' },
    { emoji: '🛼', code: 'roller_skate', name: '轮滑', category: 'activities' },
    { emoji: '🛷', code: 'sled', name: '雪橇', category: 'activities' },
    { emoji: '⛸️', code: 'ice_skate', name: '冰鞋', category: 'activities' },
    { emoji: '🥌', code: 'curling_stone', name: '冰壶', category: 'activities' },
    { emoji: '🎿', code: 'ski', name: '滑雪', category: 'activities' },
    { emoji: '⛷️', code: 'skier', name: '滑雪者', category: 'activities' },
    { emoji: '🏂', code: 'snowboarder', name: '滑雪板', category: 'activities' },
    { emoji: '🪂', code: 'parachute', name: '降落伞', category: 'activities' },
    { emoji: '🏋️', code: 'weightlifter', name: '举重', category: 'activities' },
    { emoji: '🤼', code: 'wrestlers', name: '摔跤', category: 'activities' },
    { emoji: '🤸', code: 'cartwheel', name: '侧手翻', category: 'activities' },
    { emoji: '⛹️', code: 'basketball_player', name: '篮球运动员', category: 'activities' },
    { emoji: '🤺', code: 'fencer', name: '击剑', category: 'activities' },
    { emoji: '🏇', code: 'horse_racing', name: '赛马', category: 'activities' },
    { emoji: '🧘', code: 'yoga', name: '瑜伽', category: 'activities' },
    { emoji: '🏄', code: 'surfer', name: '冲浪', category: 'activities' },
    { emoji: '🏊', code: 'swimmer', name: '游泳', category: 'activities' },
    { emoji: '🤽', code: 'water_polo', name: '水球', category: 'activities' },
    { emoji: '🚣', code: 'rowboat', name: '划船', category: 'activities' },
    { emoji: '🧗', code: 'climbing', name: '攀岩', category: 'activities' },
    { emoji: '🚵', code: 'mountain_biking', name: '山地自行车', category: 'activities' }
  ],
  travel: [
    { emoji: '🚗', code: 'car', name: '汽车', category: 'travel' },
    { emoji: '🚕', code: 'taxi', name: '出租车', category: 'travel' },
    { emoji: '🚙', code: 'suv', name: 'SUV', category: 'travel' },
    { emoji: '🚌', code: 'bus', name: '公交车', category: 'travel' },
    { emoji: '🚎', code: 'trolleybus', name: '无轨电车', category: 'travel' },
    { emoji: '🏎️', code: 'race_car', name: '赛车', category: 'travel' },
    { emoji: '🚓', code: 'police_car', name: '警车', category: 'travel' },
    { emoji: '🚑', code: 'ambulance', name: '救护车', category: 'travel' },
    { emoji: '🚒', code: 'fire_engine', name: '消防车', category: 'travel' },
    { emoji: '🚐', code: 'minibus', name: '小巴', category: 'travel' },
    { emoji: '🛻', code: 'pickup_truck', name: '皮卡', category: 'travel' },
    { emoji: '🚚', code: 'delivery_truck', name: '货车', category: 'travel' },
    { emoji: '🚛', code: 'articulated_lorry', name: '卡车', category: 'travel' },
    { emoji: '🚜', code: 'tractor', name: '拖拉机', category: 'travel' },
    { emoji: '🏍️', code: 'motorcycle', name: '摩托车', category: 'travel' },
    { emoji: '🛵', code: 'motor_scooter', name: '踏板车', category: 'travel' },
    { emoji: '🚲', code: 'bicycle', name: '自行车', category: 'travel' },
    { emoji: '🛴', code: 'kick_scooter', name: '滑板车', category: 'travel' },
    { emoji: '🚁', code: 'helicopter', name: '直升机', category: 'travel' },
    { emoji: '✈️', code: 'airplane', name: '飞机', category: 'travel' },
    { emoji: '🛩️', code: 'small_airplane', name: '小飞机', category: 'travel' },
    { emoji: '🛫', code: 'airplane_departure', name: '起飞', category: 'travel' },
    { emoji: '🛬', code: 'airplane_arrival', name: '降落', category: 'travel' },
    { emoji: '🪂', code: 'parachute', name: '降落伞', category: 'travel' },
    { emoji: '💺', code: 'seat', name: '座位', category: 'travel' },
    { emoji: '🚀', code: 'rocket', name: '火箭', category: 'travel' },
    { emoji: '🛸', code: 'flying_saucer', name: '飞碟', category: 'travel' },
    { emoji: '🚉', code: 'station', name: '车站', category: 'travel' },
    { emoji: '🚇', code: 'metro', name: '地铁', category: 'travel' },
    { emoji: '🚝', code: 'monorail', name: '单轨', category: 'travel' },
    { emoji: '🚄', code: 'high_speed_train', name: '高铁', category: 'travel' },
    { emoji: '🚅', code: 'bullet_train', name: '子弹头列车', category: 'travel' },
    { emoji: '🚈', code: 'light_rail', name: '轻轨', category: 'travel' },
    { emoji: '🚂', code: 'steam_locomotive', name: '蒸汽火车', category: 'travel' },
    { emoji: '🚆', code: 'train', name: '火车', category: 'travel' },
    { emoji: '🚄', code: 'high_speed_train2', name: '高速列车', category: 'travel' },
    { emoji: '🚊', code: 'tram', name: '有轨电车', category: 'travel' },
    { emoji: '🚍', code: 'bus2', name: '公共汽车', category: 'travel' },
    { emoji: '🚘', code: 'automobile', name: '汽车', category: 'travel' },
    { emoji: '🚖', code: 'taxi2', name: '出租车', category: 'travel' },
    { emoji: '🚡', code: 'aerial_tramway', name: '空中缆车', category: 'travel' },
    { emoji: '🚠', code: 'mountain_cableway', name: '山地缆车', category: 'travel' },
    { emoji: '🚟', code: 'suspension_railway', name: '悬挂式铁路', category: 'travel' },
    { emoji: '🎡', code: 'ferris_wheel', name: '摩天轮', category: 'travel' },
    { emoji: '🎢', code: 'roller_coaster', name: '过山车', category: 'travel' }
  ],
  objects: [
    { emoji: '⌚', code: 'watch', name: '手表', category: 'objects' },
    { emoji: '📱', code: 'mobile_phone', name: '手机', category: 'objects' },
    { emoji: '📲', code: 'mobile_phone_with_arrow', name: '手机呼叫', category: 'objects' },
    { emoji: '💻', code: 'laptop', name: '笔记本电脑', category: 'objects' },
    { emoji: '⌨️', code: 'keyboard', name: '键盘', category: 'objects' },
    { emoji: '🖥️', code: 'desktop_computer', name: '台式电脑', category: 'objects' },
    { emoji: '🖨️', code: 'printer', name: '打印机', category: 'objects' },
    { emoji: '🖱️', code: 'computer_mouse', name: '鼠标', category: 'objects' },
    { emoji: '🖲️', code: 'trackball', name: '轨迹球', category: 'objects' },
    { emoji: '🕹️', code: 'joystick', name: '游戏手柄', category: 'objects' },
    { emoji: '💽', code: 'computer_disk', name: '计算机磁盘', category: 'objects' },
    { emoji: '💾', code: 'floppy_disk', name: '软盘', category: 'objects' },
    { emoji: '💿', code: 'optical_disk', name: '光盘', category: 'objects' },
    { emoji: '📀', code: 'dvd', name: 'DVD', category: 'objects' },
    { emoji: '🧮', code: 'abacus', name: '算盘', category: 'objects' },
    { emoji: '🎥', code: 'movie_camera', name: '摄影机', category: 'objects' },
    { emoji: '🎞️', code: 'film_strip', name: '胶片', category: 'objects' },
    { emoji: '📽️', code: 'film_projector', name: '投影仪', category: 'objects' },
    { emoji: '🎬', code: 'clapper_board', name: '场记板', category: 'objects' },
    { emoji: '📺', code: 'television', name: '电视', category: 'objects' },
    { emoji: '📷', code: 'camera', name: '相机', category: 'objects' },
    { emoji: '📸', code: 'camera_flash', name: '相机闪光', category: 'objects' },
    { emoji: '📹', code: 'video_camera', name: '摄像机', category: 'objects' },
    { emoji: '📼', code: 'videocassette', name: '录像带', category: 'objects' },
    { emoji: '🔍', code: 'magnifying_glass_left', name: '放大镜', category: 'objects' },
    { emoji: '🔎', code: 'magnifying_glass_right', name: '放大镜右', category: 'objects' },
    { emoji: '🕯️', code: 'candle', name: '蜡烛', category: 'objects' },
    { emoji: '💡', code: 'light_bulb', name: '灯泡', category: 'objects' },
    { emoji: '🔦', code: 'flashlight', name: '手电筒', category: 'objects' },
    { emoji: '🏮', code: 'red_paper_lantern', name: '红灯笼', category: 'objects' },
    { emoji: '🪔', code: 'diya_lamp', name: '油灯', category: 'objects' },
    { emoji: '📔', code: 'notebook_with_decorative_cover', name: '笔记本', category: 'objects' },
    { emoji: '📕', code: 'closed_book', name: '合上的书', category: 'objects' },
    { emoji: '📖', code: 'open_book', name: '打开的书', category: 'objects' },
    { emoji: '📗', code: 'green_book', name: '绿书', category: 'objects' },
    { emoji: '📘', code: 'blue_book', name: '蓝书', category: 'objects' },
    { emoji: '📙', code: 'orange_book', name: '橙书', category: 'objects' },
    { emoji: '📚', code: 'books', name: '书籍', category: 'objects' },
    { emoji: '📓', code: 'notebook', name: '笔记本', category: 'objects' },
    { emoji: '📒', code: 'ledger', name: '账本', category: 'objects' },
    { emoji: '📃', code: 'page_with_curl', name: '卷页', category: 'objects' },
    { emoji: '📜', code: 'scroll', name: '卷轴', category: 'objects' },
    { emoji: '📄', code: 'page_facing_up', name: '向上的页面', category: 'objects' },
    { emoji: '📰', code: 'newspaper', name: '报纸', category: 'objects' },
    { emoji: '🗞️', code: 'rolled_up_newspaper', name: '卷报纸', category: 'objects' }
  ],
  symbols: [
    { emoji: '❤️', code: 'red_heart', name: '红心', category: 'symbols' },
    { emoji: '🧡', code: 'orange_heart', name: '橙心', category: 'symbols' },
    { emoji: '💛', code: 'yellow_heart', name: '黄心', category: 'symbols' },
    { emoji: '💚', code: 'green_heart', name: '绿心', category: 'symbols' },
    { emoji: '💙', code: 'blue_heart', name: '蓝心', category: 'symbols' },
    { emoji: '💜', code: 'purple_heart', name: '紫心', category: 'symbols' },
    { emoji: '🖤', code: 'black_heart', name: '黑心', category: 'symbols' },
    { emoji: '🤍', code: 'white_heart', name: '白心', category: 'symbols' },
    { emoji: '🤎', code: 'brown_heart', name: '棕心', category: 'symbols' },
    { emoji: '💔', code: 'broken_heart', name: '破碎的心', category: 'symbols' },
    { emoji: '❣️', code: 'heart_exclamation', name: '心形感叹号', category: 'symbols' },
    { emoji: '💕', code: 'two_hearts', name: '两颗心', category: 'symbols' },
    { emoji: '💞', code: 'revolving_hearts', name: '旋转的心', category: 'symbols' },
    { emoji: '💓', code: 'beating_heart', name: '跳动的心', category: 'symbols' },
    { emoji: '💗', code: 'growing_heart', name: '增长的心', category: 'symbols' },
    { emoji: '💖', code: 'sparkling_heart', name: '闪亮的心', category: 'symbols' },
    { emoji: '💘', code: 'heart_with_arrow', name: '带箭头的心', category: 'symbols' },
    { emoji: '💝', code: 'heart_with_ribbon', name: '带丝带的心', category: 'symbols' },
    { emoji: '💟', code: 'heart_decoration', name: '心形装饰', category: 'symbols' },
    { emoji: '☮️', code: 'peace_symbol', name: '和平符号', category: 'symbols' },
    { emoji: '✝️', code: 'latin_cross', name: '拉丁十字', category: 'symbols' },
    { emoji: '☪️', code: 'star_and_crescent', name: '星月', category: 'symbols' },
    { emoji: '🕉️', code: 'om', name: '唵', category: 'symbols' },
    { emoji: '☸️', code: 'wheel_of_dharma', name: '法轮', category: 'symbols' },
    { emoji: '✡️', code: 'star_of_david', name: '大卫之星', category: 'symbols' },
    { emoji: '🔯', code: 'dotted_six_pointed_star', name: '六角星', category: 'symbols' },
    { emoji: '🕎', code: 'menorah', name: '烛台', category: 'symbols' },
    { emoji: '☯️', code: 'yin_yang', name: '阴阳', category: 'symbols' },
    { emoji: '☦️', code: 'orthodox_cross', name: '正教十字', category: 'symbols' },
    { emoji: '🛐', code: 'place_of_worship', name: '宗教场所', category: 'symbols' },
    { emoji: '⛎', code: 'ophiuchus', name: '蛇夫座', category: 'symbols' },
    { emoji: '♈', code: 'aries', name: '白羊座', category: 'symbols' },
    { emoji: '♉', code: 'taurus', name: '金牛座', category: 'symbols' },
    { emoji: '♊', code: 'gemini', name: '双子座', category: 'symbols' },
    { emoji: '♋', code: 'cancer', name: '巨蟹座', category: 'symbols' },
    { emoji: '♌', code: 'leo', name: '狮子座', category: 'symbols' },
    { emoji: '♍', code: 'virgo', name: '处女座', category: 'symbols' },
    { emoji: '♎', code: 'libra', name: '天秤座', category: 'symbols' },
    { emoji: '♏', code: 'scorpius', name: '天蝎座', category: 'symbols' },
    { emoji: '♐', code: 'sagittarius', name: '射手座', category: 'symbols' },
    { emoji: '♑', code: 'capricorn', name: '摩羯座', category: 'symbols' },
    { emoji: '♒', code: 'aquarius', name: '水瓶座', category: 'symbols' },
    { emoji: '♓', code: 'pisces', name: '双鱼座', category: 'symbols' },
    { emoji: '🆔', code: 'id', name: 'ID', category: 'symbols' }
  ],
  flags: [
    { emoji: '🏁', code: 'checkered_flag', name: '方格旗', category: 'flags' },
    { emoji: '🚩', code: 'triangular_flag', name: '三角旗', category: 'flags' },
    { emoji: '🎌', code: 'crossed_flags', name: '交叉旗', category: 'flags' },
    { emoji: '🏴', code: 'black_flag', name: '黑旗', category: 'flags' },
    { emoji: '🏳️', code: 'white_flag', name: '白旗', category: 'flags' },
    { emoji: '🏳️‍🌈', code: 'rainbow_flag', name: '彩虹旗', category: 'flags' },
    { emoji: '🏳️‍⚧️', code: 'transgender_flag', name: '跨性别旗', category: 'flags' },
    { emoji: '🏴‍☠️', code: 'pirate_flag', name: '海盗旗', category: 'flags' },
    { emoji: '🇦🇫', code: 'flag_afghanistan', name: '阿富汗', category: 'flags' },
    { emoji: '🇦🇽', code: 'flag_aland_islands', name: '奥兰群岛', category: 'flags' },
    { emoji: '🇦🇱', code: 'flag_albania', name: '阿尔巴尼亚', category: 'flags' },
    { emoji: '🇩🇿', code: 'flag_algeria', name: '阿尔及利亚', category: 'flags' },
    { emoji: '🇦🇸', code: 'flag_american_samoa', name: '美属萨摩亚', category: 'flags' },
    { emoji: '🇦🇩', code: 'flag_andorra', name: '安道尔', category: 'flags' },
    { emoji: '🇦🇴', code: 'flag_angola', name: '安哥拉', category: 'flags' },
    { emoji: '🇦🇮', code: 'flag_anguilla', name: '安圭拉', category: 'flags' },
    { emoji: '🇦🇶', code: 'flag_antarctica', name: '南极洲', category: 'flags' },
    { emoji: '🇦🇬', code: 'flag_antigua_barbuda', name: '安提瓜和巴布达', category: 'flags' },
    { emoji: '🇦🇷', code: 'flag_argentina', name: '阿根廷', category: 'flags' },
    { emoji: '🇦🇲', code: 'flag_armenia', name: '亚美尼亚', category: 'flags' },
    { emoji: '🇦🇼', code: 'flag_aruba', name: '阿鲁巴', category: 'flags' },
    { emoji: '🇦🇺', code: 'flag_australia', name: '澳大利亚', category: 'flags' },
    { emoji: '🇦🇹', code: 'flag_austria', name: '奥地利', category: 'flags' },
    { emoji: '🇦🇿', code: 'flag_azerbaijan', name: '阿塞拜疆', category: 'flags' },
    { emoji: '🇧🇸', code: 'flag_bahamas', name: '巴哈马', category: 'flags' },
    { emoji: '🇧🇭', code: 'flag_bahrain', name: '巴林', category: 'flags' },
    { emoji: '🇧🇩', code: 'flag_bangladesh', name: '孟加拉国', category: 'flags' },
    { emoji: '🇧🇧', code: 'flag_barbados', name: '巴巴多斯', category: 'flags' },
    { emoji: '🇧🇾', code: 'flag_belarus', name: '白俄罗斯', category: 'flags' },
    { emoji: '🇧🇪', code: 'flag_belgium', name: '比利时', category: 'flags' },
    { emoji: '🇧🇿', code: 'flag_belize', name: '伯利兹', category: 'flags' },
    { emoji: '🇧🇯', code: 'flag_benin', name: '贝宁', category: 'flags' },
    { emoji: '🇧🇲', code: 'flag_bermuda', name: '百慕大', category: 'flags' },
    { emoji: '🇧🇹', code: 'flag_bhutan', name: '不丹', category: 'flags' },
    { emoji: '🇧🇴', code: 'flag_bolivia', name: '玻利维亚', category: 'flags' },
    { emoji: '🇧🇦', code: 'flag_bosnia_herzegovina', name: '波斯尼亚和黑塞哥维那', category: 'flags' },
    { emoji: '🇧🇼', code: 'flag_botswana', name: '博茨瓦纳', category: 'flags' },
    { emoji: '🇧🇷', code: 'flag_brazil', name: '巴西', category: 'flags' },
    { emoji: '🇮🇴', code: 'flag_british_indian_ocean_territory', name: '英属印度洋领地', category: 'flags' },
    { emoji: '🇻🇬', code: 'flag_british_virgin_islands', name: '英属维尔京群岛', category: 'flags' },
    { emoji: '🇧🇳', code: 'flag_brunei', name: '文莱', category: 'flags' },
    { emoji: '🇧🇬', code: 'flag_bulgaria', name: '保加利亚', category: 'flags' },
    { emoji: '🇧🇫', code: 'flag_burkina_faso', name: '布基纳法索', category: 'flags' },
    { emoji: '🇧🇮', code: 'flag_burundi', name: '布隆迪', category: 'flags' },
    { emoji: '🇰🇭', code: 'flag_cambodia', name: '柬埔寨', category: 'flags' },
    { emoji: '🇨🇲', code: 'flag_cameroon', name: '喀麦隆', category: 'flags' },
    { emoji: '🇨🇦', code: 'flag_canada', name: '加拿大', category: 'flags' },
    { emoji: '🇮🇨', code: 'flag_canary_islands', name: '加那利群岛', category: 'flags' },
    { emoji: '🇨🇻', code: 'flag_cape_verde', name: '佛得角', category: 'flags' },
    { emoji: '🇰🇾', code: 'flag_cayman_islands', name: '开曼群岛', category: 'flags' },
    { emoji: '🇨🇫', code: 'flag_central_african_republic', name: '中非共和国', category: 'flags' },
    { emoji: '🇹🇩', code: 'flag_chad', name: '乍得', category: 'flags' },
    { emoji: '🇨🇱', code: 'flag_chile', name: '智利', category: 'flags' },
    { emoji: '🇨🇳', code: 'flag_china', name: '中国', category: 'flags' }
  ]
}

// 计算属性
const filteredEmojis = computed(() => {
  const currentEmojis = emojiData[activeCategory.value] || []

  if (!searchQuery.value) {
    return currentEmojis
  }

  const query = searchQuery.value.toLowerCase()
  return currentEmojis.filter(emoji =>
    emoji.name.toLowerCase().includes(query) ||
    emoji.code.toLowerCase().includes(query)
  )
})

// 方法
const selectEmoji = (emoji: Emoji) => {
  emit('select', emoji.emoji)

  // 添加到最近使用
  const existingIndex = recentEmojis.value.findIndex(e => e.code === emoji.code)
  if (existingIndex > -1) {
    recentEmojis.value.splice(existingIndex, 1)
  }
  recentEmojis.value.unshift(emoji)
  if (recentEmojis.value.length > 12) {
    recentEmojis.value.pop()
  }

  // 保存到本地存储
  localStorage.setItem('recent-emojis', JSON.stringify(recentEmojis.value))
}

// 加载最近使用的表情
const loadRecentEmojis = () => {
  const saved = localStorage.getItem('recent-emojis')
  if (saved) {
    try {
      recentEmojis.value = JSON.parse(saved)
    } catch (error) {
      console.error('Failed to load recent emojis:', error)
    }
  }
}

onMounted(() => {
  loadRecentEmojis()
})
</script>

<style lang="scss" scoped>
.emoji-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.emoji-picker {
  background: rgba(30, 30, 40, 0.95);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  width: 350px;
  max-width: 90vw;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

  .emoji-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(139, 92, 246, 0.2);

    .emoji-categories {
      display: flex;
      gap: 4px;

      .category-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(139, 92, 246, 0.2);
        }

        &.active {
          background: rgba(139, 92, 246, 0.3);
        }
      }
    }

    .close-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: rgba(139, 92, 246, 0.2);
      border-radius: 6px;
      color: #c084fc;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(139, 92, 246, 0.3);
      }
    }
  }

  .emoji-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .emoji-search {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(139, 92, 246, 0.1);
    }

    .emoji-grid-container {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 4px;

      .emoji-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(139, 92, 246, 0.2);
          transform: scale(1.1);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }

    .recent-section {
      border-top: 1px solid rgba(139, 92, 246, 0.1);
      padding: 12px 8px 8px;

      .section-title {
        font-size: 12px;
        color: #9ca3af;
        margin-bottom: 8px;
        padding: 0 4px;
        font-weight: 500;
      }
    }
  }
}

// 移动端优化
@media (max-width: 480px) {
  .emoji-picker {
    width: 320px;
    max-height: 400px;

    .emoji-header {
      padding: 10px 12px;

      .emoji-categories {
        gap: 2px;

        .category-btn {
          width: 28px;
          height: 28px;
          font-size: 14px;
        }
      }
    }

    .emoji-content {
      .emoji-grid {
        grid-template-columns: repeat(6, 1fr);

        .emoji-btn {
          width: 36px;
          height: 36px;
          font-size: 20px;
        }
      }
    }
  }
}

// 深色主题滚动条
.emoji-grid-container {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(75, 85, 99, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.5);
    border-radius: 3px;

    &:hover {
      background: rgba(139, 92, 246, 0.7);
    }
  }
}

// 深色主题输入框样式
:deep(.el-input__wrapper) {
  background: rgba(30, 30, 40, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

:deep(.el-input__inner) {
  color: #e5e7eb;
  background: transparent;

  &::placeholder {
    color: #9ca3af;
  }
}
</style>
