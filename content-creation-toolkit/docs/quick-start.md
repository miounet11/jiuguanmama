# 九馆爸爸内容创作工具 - 快速开始指南

## 🚀 5分钟快速上手

### 步骤1: 环境准备
```bash
# 进入工具目录
cd content-creation-toolkit

# 安装依赖（如果需要）
npm install ajv ajv-formats

# 确保九馆爸爸主项目已运行
cd ../cankao/tavernai-plus
npm run db:generate  # 生成Prisma客户端
```

### 步骤2: 创建你的第一个角色卡
```bash
# 回到工具目录
cd ../../content-creation-toolkit

# 启动交互式创建工具
node tools/creator.js

# 或者直接指定类型
node tools/creator.js --type character
```

**交互示例**:
```
🎭 创建新角色卡
📋 角色卡分类选择
============================
1. 武侠仙侠
2. 现代都市  
3. 时空酒馆
4. 奇幻冒险
5. 科幻未来
============================
请选择分类 (1-5): 1

角色名称: 剑圣独孤
角色描述: 剑道宗师，一生求败而不得，孤独求剑的绝世高手
角色性格: 高傲孤独、剑道痴迷、内心寂寞
开场对话: *独孤求败立于山巅，长剑在手，目光如电* "又是一个挑战者？可惜，你不是我的对手。"
出现场景: 华山之巅，剑圣独孤求败的隐居之地
AI提示词: 你是剑圣独孤求败，武林神话般的存在...
```

### 步骤3: 验证内容质量
```bash
# 验证刚创建的角色卡
node tools/validator.js --file examples/characters/剑圣独孤.json
```

**输出示例**:
```
🔍 验证文件: examples/characters/剑圣独孤.json
📋 文件类型: 角色卡
✅ Schema验证通过

⚠️  建议改进:
   - 建议添加更多对话示例分支
   - 可以增加触发器设置

✅ 验证通过！建议处理上述改进建议以提升质量
```

### 步骤4: 导入到数据库
```bash
# 导入角色卡到数据库
node tools/importer.js --file examples/characters/剑圣独孤.json
```

**输出示例**:
```
🚀 九馆爸爸内容导入工具启动...

📂 导入文件: examples/characters/剑圣独孤.json
✅ 成功导入角色: 剑圣独孤 (武侠仙侠)
```

### 步骤5: 验证导入结果
```bash
# 在九馆爸爸项目中验证
cd ../cankao/tavernai-plus
curl http://localhost:3007/api/characters | jq '.characters[0]'
```

## 🎨 创建世界剧本示例

### 创建奇幻世界
```bash
node tools/creator.js --type scenario

# 交互填写
场景名称: 魔法学院
场景描述: 古老的魔法学院，培养年轻法师的神圣殿堂
世界信息条目数量: 3

# 世界信息 1/3
信息标题: 学院历史
信息内容: 阿卡迪亚魔法学院建立于一千年前...
关键词: 学院,历史,阿卡迪亚
优先级: 1000

# 继续填写其他世界信息...
```

## 📋 常用命令参考

### 创建工具 (creator.js)
```bash
# 交互式创建
node tools/creator.js

# 直接创建角色卡
node tools/creator.js --type character

# 直接创建世界剧本  
node tools/creator.js --type scenario

# 指定分类创建
node tools/creator.js --type character --category 武侠仙侠
```

### 验证工具 (validator.js)
```bash
# 验证单个文件
node tools/validator.js --file examples/characters/角色名.json

# 批量验证目录
node tools/validator.js --dir examples/characters/

# 显示帮助
node tools/validator.js --help
```

### 导入工具 (importer.js)
```bash
# 导入单个文件
node tools/importer.js --file examples/characters/角色名.json

# 批量导入目录
node tools/importer.js --dir examples/characters/

# 显示帮助
node tools/importer.js --help
```

## 🎯 最佳实践工作流

### 1. 标准创作流程
```bash
# 第一步：创建内容
node tools/creator.js --type character

# 第二步：验证质量  
node tools/validator.js --file examples/characters/新角色.json

# 第三步：手动编辑优化
# 使用你喜欢的编辑器完善内容

# 第四步：再次验证
node tools/validator.js --file examples/characters/新角色.json

# 第五步：导入数据库
node tools/importer.js --file examples/characters/新角色.json
```

### 2. 批量创作流程
```bash
# 创建多个内容后批量验证
node tools/validator.js --dir examples/characters/

# 修复验证失败的文件后批量导入
node tools/importer.js --dir examples/characters/
```

### 3. 团队协作流程
```bash
# 团队成员A创建角色
node tools/creator.js --type character --name "角色A"

# 团队成员B创建场景  
node tools/creator.js --type scenario --name "场景B"

# 统一验证所有内容
node tools/validator.js --dir examples/

# 统一导入通过验证的内容
node tools/importer.js --dir examples/
```

## 🔧 高级技巧

### 1. 模板定制
```bash
# 复制现有模板进行定制
cp templates/character/武侠仙侠.json templates/character/我的模板.json

# 编辑模板文件
# 修改 templates/character/我的模板.json

# 在creator.js中添加新模板支持
```

### 2. 批量生成
```bash
# 创建批量生成脚本
cat > batch-create.sh << 'EOF'
#!/bin/bash
for name in "角色1" "角色2" "角色3"; do
  echo "创建角色: $name"
  node tools/creator.js --type character --name "$name"
done
EOF

chmod +x batch-create.sh
./batch-create.sh
```

### 3. 自动化验证
```bash
# 创建Git pre-commit钩子自动验证
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "验证内容格式..."
node tools/validator.js --dir examples/
if [ $? -ne 0 ]; then
  echo "验证失败，提交被阻止"
  exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

## ⚠️ 常见问题解决

### 问题1: Prisma客户端连接失败
```bash
# 确保主项目已生成客户端
cd ../cankao/tavernai-plus
npm run db:generate

# 确保数据库服务运行
npm run dev
```

### 问题2: 验证失败
```bash
# 检查JSON格式
node -c examples/characters/角色名.json

# 查看详细错误信息
node tools/validator.js --file examples/characters/角色名.json
```

### 问题3: 导入重复内容
```bash
# 导入工具会自动跳过重复内容
# 如需强制覆盖，请先删除数据库中的现有数据
```

### 问题4: 中文字符显示问题
```bash
# 确保终端支持UTF-8编码
export LANG=zh_CN.UTF-8

# Windows用户使用chcp 65001
```

## 🎉 成功案例

### 案例1: 创建武侠角色系列
```bash
# 创建一个武侠门派的完整角色系列
node tools/creator.js --type character --category 武侠仙侠
# 重复创建掌门、长老、弟子等角色

# 批量验证
node tools/validator.js --dir examples/characters/

# 批量导入
node tools/importer.js --dir examples/characters/
```

### 案例2: 创建时空酒馆场景
```bash
# 创建时空酒馆主场景
node tools/creator.js --type scenario --category 时空酒馆

# 创建配套的时空角色
node tools/creator.js --type character --category 时空酒馆

# 验证和导入
node tools/validator.js --dir examples/
node tools/importer.js --dir examples/
```

## 📈 下一步学习

1. **深入学习**: 阅读 `docs/character-guide.md` 和 `docs/scenario-guide.md`
2. **查看示例**: 研究 `examples/` 目录下的完整示例
3. **自定义模板**: 根据需求修改 `templates/` 目录下的模板
4. **贡献内容**: 创建优质内容并分享给社区

---

**🎯 现在你已经掌握了基础操作，开始创作属于你的精彩角色和世界吧！**