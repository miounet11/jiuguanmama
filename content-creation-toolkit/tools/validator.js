#!/usr/bin/env node
/**
 * 九馆爸爸内容验证工具
 * 验证角色卡和世界剧本的格式和完整性
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// 初始化JSON Schema验证器
const ajv = new Ajv();
addFormats(ajv);

// Schema文件路径
const SCHEMAS = {
  character: path.join(__dirname, '../schemas/character-schema.json'),
  scenario: path.join(__dirname, '../schemas/scenario-schema.json')
};

// 加载Schema
function loadSchema(type) {
  try {
    const schemaPath = SCHEMAS[type];
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    return ajv.compile(schema);
  } catch (error) {
    throw new Error(`无法加载${type}的Schema: ${error.message}`);
  }
}

// 检测文件类型
function detectFileType(data) {
  if (data.名称 && data.描述 && data.性格) {
    return 'character';
  } else if (data.name && data.description && data.worldInfos) {
    return 'scenario';
  }
  return null;
}

// 验证JSON格式
function validateJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `JSON格式错误: ${error.message}`
    };
  }
}

// 验证Schema
function validateSchema(data, type) {
  const validate = loadSchema(type);
  const valid = validate(data);

  if (!valid) {
    return {
      success: false,
      errors: validate.errors
    };
  }

  return { success: true };
}

// 验证角色卡内容
function validateCharacterContent(data) {
  const issues = [];
  const warnings = [];

  // 检查必需字段的质量
  if (data.名称.length < 2) {
    issues.push('角色名称过短，建议至少2个字符');
  }

  if (data.描述.length < 50) {
    issues.push('角色描述过短，建议至少50个字符');
  }

  if (data.开场对话.length < 20) {
    issues.push('开场对话过短，建议至少20个字符');
  }

  if (!data.对话示例 || data.对话示例.length === 0) {
    issues.push('缺少对话示例');
  } else {
    // 检查对话示例的完整性
    const example = data.对话示例[0];
    const requiredKeys = ['好感度_高于80', '好感度_50至80', '好感度_20至50', '好感度_低于20'];
    const missingKeys = requiredKeys.filter(key => !example[key]);
    if (missingKeys.length > 0) {
      warnings.push(`对话示例缺少以下好感度分支: ${missingKeys.join(', ')}`);
    }
  }

  if (!data.触发器 || data.触发器.length === 0) {
    warnings.push('建议添加至少一个触发器');
  }

  if (!data.变量 || typeof data.变量.好感度 !== 'number') {
    issues.push('缺少好感度变量或格式错误');
  }

  if (!data.提示词 || data.提示词.length < 50) {
    issues.push('AI提示词过短或缺失，建议至少50个字符');
  }

  return { issues, warnings };
}

// 验证世界剧本内容
function validateScenarioContent(data) {
  const issues = [];
  const warnings = [];

  // 检查基本信息
  if (data.name.length < 4) {
    issues.push('场景名称过短，建议至少4个字符');
  }

  if (data.description.length < 100) {
    issues.push('场景描述过短，建议至少100个字符');
  }

  if (!data.tags || data.tags.length === 0) {
    warnings.push('建议添加场景标签');
  }

  // 检查世界信息
  if (!data.worldInfos || data.worldInfos.length === 0) {
    issues.push('缺少世界信息条目');
  } else {
    data.worldInfos.forEach((info, index) => {
      if (!info.title || info.title.length < 2) {
        issues.push(`世界信息${index + 1}的标题过短或缺失`);
      }

      if (!info.content || info.content.length < 20) {
        issues.push(`世界信息${index + 1}的内容过短或缺失`);
      }

      if (!info.keywords || info.keywords.length === 0) {
        issues.push(`世界信息${index + 1}缺少关键词`);
      }

      if (typeof info.priority !== 'number' || info.priority < 0 || info.priority > 1000) {
        warnings.push(`世界信息${index + 1}的优先级设置可能不合理`);
      }
    });

    // 检查优先级重复
    const priorities = data.worldInfos.map(info => info.priority);
    const duplicates = priorities.filter((item, index) => priorities.indexOf(item) !== index);
    if (duplicates.length > 0) {
      warnings.push('存在重复的优先级设置，建议使用不同的优先级');
    }
  }

  return { issues, warnings };
}

// 主验证函数
function validateFile(filePath) {
  console.log(`🔍 验证文件: ${filePath}`);

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.log('❌ 文件不存在');
    return false;
  }

  // 验证JSON格式
  const jsonResult = validateJSON(filePath);
  if (!jsonResult.success) {
    console.log(`❌ ${jsonResult.error}`);
    return false;
  }

  const data = jsonResult.data;

  // 检测文件类型
  const fileType = detectFileType(data);
  if (!fileType) {
    console.log('❌ 无法识别文件类型，请确认这是有效的角色卡或世界剧本文件');
    return false;
  }

  console.log(`📋 文件类型: ${fileType === 'character' ? '角色卡' : '世界剧本'}`);

  // 验证Schema
  const schemaResult = validateSchema(data, fileType);
  if (!schemaResult.success) {
    console.log('❌ Schema验证失败:');
    schemaResult.errors.forEach(error => {
      console.log(`   - ${error.instancePath || 'root'}: ${error.message}`);
    });
    return false;
  }

  console.log('✅ Schema验证通过');

  // 验证内容质量
  let contentResult;
  if (fileType === 'character') {
    contentResult = validateCharacterContent(data);
  } else {
    contentResult = validateScenarioContent(data);
  }

  // 显示问题
  if (contentResult.issues.length > 0) {
    console.log('\n❌ 发现以下问题:');
    contentResult.issues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }

  // 显示警告
  if (contentResult.warnings.length > 0) {
    console.log('\n⚠️  建议改进:');
    contentResult.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }

  // 总结
  const hasIssues = contentResult.issues.length > 0;
  const hasWarnings = contentResult.warnings.length > 0;

  if (!hasIssues && !hasWarnings) {
    console.log('\n🎉 验证完全通过！文件格式和内容都符合标准');
  } else if (!hasIssues) {
    console.log('\n✅ 验证通过！建议处理上述改进建议以提升质量');
  } else {
    console.log('\n❌ 验证失败！请修复上述问题后重新验证');
  }

  return !hasIssues;
}

// 批量验证
function validateDirectory(dirPath) {
  console.log(`📁 批量验证目录: ${dirPath}`);

  if (!fs.existsSync(dirPath)) {
    console.log('❌ 目录不存在');
    return;
  }

  const files = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(dirPath, file));

  if (files.length === 0) {
    console.log('📭 目录中没有JSON文件');
    return;
  }

  console.log(`📋 找到 ${files.length} 个JSON文件\n`);

  let passed = 0;
  let failed = 0;

  files.forEach(file => {
    const result = validateFile(file);
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log('─'.repeat(50));
  });

  console.log(`\n📊 验证统计:`);
  console.log(`   ✅ 通过: ${passed} 个文件`);
  console.log(`   ❌ 失败: ${failed} 个文件`);
  console.log(`   📈 通过率: ${Math.round(passed / (passed + failed) * 100)}%`);
}

// 显示帮助
function showHelp() {
  console.log('\n📖 九馆爸爸内容验证工具帮助');
  console.log('============================');
  console.log('');
  console.log('🎯 功能说明:');
  console.log('- 验证角色卡和世界剧本的JSON格式');
  console.log('- 检查数据结构是否符合Schema规范');
  console.log('- 分析内容质量并提供改进建议');
  console.log('- 支持单文件和批量验证');
  console.log('');
  console.log('🔧 命令行参数:');
  console.log('--file <文件路径>     验证单个文件');
  console.log('--dir <目录路径>      批量验证目录下所有JSON文件');
  console.log('--help              显示帮助');
  console.log('');
  console.log('📝 使用示例:');
  console.log('node validator.js --file examples/characters/柳烟儿.json');
  console.log('node validator.js --dir examples/characters/');
  console.log('');
  console.log('✅ 验证内容:');
  console.log('- JSON格式正确性');
  console.log('- 数据结构完整性');
  console.log('- 必填字段存在性');
  console.log('- 字段内容质量');
  console.log('- 逻辑一致性');
  console.log('');
}

// 解析命令行参数
function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[key] = value;
      if (value !== true) i++;
    }
  }

  return args;
}

// 主函数
function main() {
  const args = parseArgs();

  // 显示帮助
  if (args.help || Object.keys(args).length === 0) {
    showHelp();
    return;
  }

  // 验证单个文件
  if (args.file) {
    validateFile(args.file);
    return;
  }

  // 批量验证目录
  if (args.dir) {
    validateDirectory(args.dir);
    return;
  }

  console.log('❌ 请指定要验证的文件或目录');
  showHelp();
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  validateFile,
  validateDirectory,
  detectFileType,
  validateCharacterContent,
  validateScenarioContent
};
