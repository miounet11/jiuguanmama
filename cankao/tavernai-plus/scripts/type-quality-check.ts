#!/usr/bin/env ts-node

/**
 * TypeScript 质量检查脚本
 *
 * 功能：
 * 1. 运行TypeScript编译检查
 * 2. 计算类型覆盖率
 * 3. 分析类型复杂度
 * 4. 生成质量报告
 * 5. 检查类型安全性
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface QualityMetrics {
  typeErrors: number;
  typeCoverage: number;
  totalFiles: number;
  checkedFiles: number;
  complexityScore: number;
  executionTime: number;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

interface TypeCoverageResult {
  percentage: number;
  total: number;
  correct: number;
  incorrect: number;
  unchecked: number;
}

class TypeScriptQualityChecker {
  private workspaceRoot: string;
  private reportDir: string;
  private metrics: QualityMetrics;

  constructor() {
    this.workspaceRoot = process.cwd();
    this.reportDir = path.join(this.workspaceRoot, 'reports', 'typescript');
    this.metrics = {
      typeErrors: 0,
      typeCoverage: 0,
      totalFiles: 0,
      checkedFiles: 0,
      complexityScore: 0,
      executionTime: 0,
      warnings: [],
      errors: [],
      suggestions: []
    };

    this.ensureReportDirectory();
  }

  private ensureReportDirectory(): void {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  private execCommand(command: string, cwd?: string): string {
    try {
      return execSync(command, {
        cwd: cwd || this.workspaceRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (error: any) {
      return error.stdout || error.stderr || '';
    }
  }

  private async checkTypeScriptCompilation(): Promise<void> {
    console.log('🔍 检查 TypeScript 编译...');

    const apps = ['apps/api', 'apps/web'];
    let totalErrors = 0;

    for (const app of apps) {
      const appPath = path.join(this.workspaceRoot, app);
      if (!fs.existsSync(path.join(appPath, 'tsconfig.json'))) {
        this.metrics.warnings.push(`${app} 缺少 tsconfig.json`);
        continue;
      }

      console.log(`  检查 ${app}...`);

      const command = app.includes('web')
        ? 'npx vue-tsc --noEmit --project tsconfig.json'
        : 'npx tsc --noEmit --project tsconfig.json';

      const result = this.execCommand(command, appPath);

      // 解析错误数量
      const errorMatch = result.match(/Found (\d+) error/);
      if (errorMatch) {
        const errors = parseInt(errorMatch[1]);
        totalErrors += errors;
        console.log(`    发现 ${errors} 个类型错误`);

        if (errors > 0) {
          this.metrics.errors.push(`${app}: ${errors} 个类型错误`);
        }
      } else if (result.includes('error TS')) {
        // 如果没有汇总但有错误信息
        const errorLines = result.split('\n').filter(line => line.includes('error TS'));
        totalErrors += errorLines.length;
        this.metrics.errors.push(`${app}: ${errorLines.length} 个类型错误`);
      }
    }

    this.metrics.typeErrors = totalErrors;

    if (totalErrors === 0) {
      console.log('✅ TypeScript 编译检查通过');
    } else {
      console.log(`❌ 发现 ${totalErrors} 个类型错误`);
    }
  }

  private async checkTypeCoverage(): Promise<void> {
    console.log('📊 检查类型覆盖率...');

    try {
      const result = this.execCommand('npx type-coverage --detail --strict --json');
      const coverage: TypeCoverageResult = JSON.parse(result);

      this.metrics.typeCoverage = coverage.percentage;
      this.metrics.totalFiles = coverage.total;
      this.metrics.checkedFiles = coverage.correct;

      console.log(`  类型覆盖率: ${coverage.percentage.toFixed(2)}%`);
      console.log(`  已检查文件: ${coverage.correct}/${coverage.total}`);

      if (coverage.percentage < 95) {
        this.metrics.warnings.push(`类型覆盖率 ${coverage.percentage.toFixed(2)}% 低于推荐的 95%`);
      }

      if (coverage.percentage < 90) {
        this.metrics.errors.push(`类型覆盖率 ${coverage.percentage.toFixed(2)}% 低于最低要求的 90%`);
      }

    } catch (error) {
      this.metrics.warnings.push('无法计算类型覆盖率，请确保安装了 type-coverage');
      console.log('⚠️  无法计算类型覆盖率');
    }
  }

  private async analyzeComplexity(): Promise<void> {
    console.log('🧮 分析类型复杂度...');

    // 简单的复杂度分析
    const tsFiles = this.findTypeScriptFiles();
    let complexitySum = 0;

    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const complexity = this.calculateFileComplexity(content);
      complexitySum += complexity;
    }

    this.metrics.complexityScore = tsFiles.length > 0 ? complexitySum / tsFiles.length : 0;

    console.log(`  平均类型复杂度: ${this.metrics.complexityScore.toFixed(2)}`);

    if (this.metrics.complexityScore > 10) {
      this.metrics.warnings.push(`平均类型复杂度 ${this.metrics.complexityScore.toFixed(2)} 较高，建议简化复杂类型`);
    }
  }

  private findTypeScriptFiles(): string[] {
    const files: string[] = [];
    const searchDirs = ['apps/api/src', 'apps/web/src', 'packages'];

    const findFiles = (dir: string): void => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && item !== 'node_modules' && item !== 'dist') {
          findFiles(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.vue')) {
          files.push(fullPath);
        }
      }
    };

    for (const dir of searchDirs) {
      findFiles(path.join(this.workspaceRoot, dir));
    }

    return files;
  }

  private calculateFileComplexity(content: string): number {
    let complexity = 0;

    // 统计复杂类型构造
    complexity += (content.match(/\b(extends|keyof|typeof|infer)\b/g) || []).length;
    complexity += (content.match(/\?:/g) || []).length; // 条件类型
    complexity += (content.match(/\[K in/g) || []).length; // 映射类型
    complexity += (content.match(/<.*>/g) || []).length * 0.5; // 泛型
    complexity += (content.match(/\|/g) || []).length * 0.3; // 联合类型
    complexity += (content.match(/&/g) || []).length * 0.3; // 交叉类型

    return complexity;
  }

  private async generateSuggestions(): Promise<void> {
    console.log('💡 生成改进建议...');

    // 基于指标生成建议
    if (this.metrics.typeErrors > 0) {
      this.metrics.suggestions.push('优先修复所有 TypeScript 类型错误');
    }

    if (this.metrics.typeCoverage < 95) {
      this.metrics.suggestions.push('提高类型覆盖率至 95% 以上');
      this.metrics.suggestions.push('为未类型化的代码添加类型注解');
    }

    if (this.metrics.complexityScore > 8) {
      this.metrics.suggestions.push('考虑重构复杂的类型定义');
      this.metrics.suggestions.push('使用工具类型简化复杂类型');
    }

    if (this.metrics.warnings.length > 5) {
      this.metrics.suggestions.push('定期处理警告，避免技术债务积累');
    }

    // 通用建议
    this.metrics.suggestions.push('定期更新 TypeScript 到最新稳定版本');
    this.metrics.suggestions.push('使用 ESLint TypeScript 规则确保代码质量');
    this.metrics.suggestions.push('在 CI/CD 中集成类型检查');
  }

  private generateReport(): void {
    console.log('📝 生成质量报告...');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        typeErrors: this.metrics.typeErrors,
        typeCoverage: this.metrics.typeCoverage,
        complexityScore: this.metrics.complexityScore,
        executionTime: this.metrics.executionTime,
        status: this.getOverallStatus()
      },
      details: {
        totalFiles: this.metrics.totalFiles,
        checkedFiles: this.metrics.checkedFiles,
        warnings: this.metrics.warnings,
        errors: this.metrics.errors,
        suggestions: this.metrics.suggestions
      },
      recommendations: this.generateRecommendations()
    };

    // 保存 JSON 报告
    const jsonPath = path.join(this.reportDir, `quality-report-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // 保存 Markdown 报告
    const mdPath = path.join(this.reportDir, 'latest-report.md');
    fs.writeFileSync(mdPath, this.generateMarkdownReport(report));

    console.log(`📊 报告已生成: ${jsonPath}`);
    console.log(`📄 Markdown 报告: ${mdPath}`);
  }

  private getOverallStatus(): 'excellent' | 'good' | 'warning' | 'critical' {
    if (this.metrics.typeErrors > 0) return 'critical';
    if (this.metrics.typeCoverage < 90) return 'critical';
    if (this.metrics.typeCoverage < 95 || this.metrics.complexityScore > 10) return 'warning';
    if (this.metrics.typeCoverage >= 98 && this.metrics.complexityScore <= 5) return 'excellent';
    return 'good';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const status = this.getOverallStatus();

    switch (status) {
      case 'critical':
        recommendations.push('立即修复所有类型错误');
        recommendations.push('暂停新功能开发，专注于类型安全修复');
        break;
      case 'warning':
        recommendations.push('制定类型改进计划');
        recommendations.push('逐步提升类型覆盖率');
        break;
      case 'good':
        recommendations.push('继续保持良好的类型安全实践');
        recommendations.push('考虑更严格的类型检查规则');
        break;
      case 'excellent':
        recommendations.push('类型安全状况优秀，可以分享最佳实践');
        recommendations.push('考虑贡献类型定义给开源社区');
        break;
    }

    return recommendations;
  }

  private generateMarkdownReport(report: any): string {
    return `# TypeScript 质量检查报告

## 📋 概要

- **检查时间**: ${new Date(report.timestamp).toLocaleString('zh-CN')}
- **整体状态**: ${this.getStatusEmoji(report.summary.status)} ${report.summary.status.toUpperCase()}
- **执行时间**: ${report.summary.executionTime.toFixed(2)}ms

## 📊 核心指标

| 指标 | 值 | 状态 |
|------|-----|------|
| 类型错误 | ${report.summary.typeErrors} | ${report.summary.typeErrors === 0 ? '✅' : '❌'} |
| 类型覆盖率 | ${report.summary.typeCoverage.toFixed(2)}% | ${report.summary.typeCoverage >= 95 ? '✅' : report.summary.typeCoverage >= 90 ? '⚠️' : '❌'} |
| 复杂度评分 | ${report.summary.complexityScore.toFixed(2)} | ${report.summary.complexityScore <= 5 ? '✅' : report.summary.complexityScore <= 10 ? '⚠️' : '❌'} |
| 检查文件数 | ${report.details.checkedFiles}/${report.details.totalFiles} | ${report.details.checkedFiles === report.details.totalFiles ? '✅' : '⚠️'} |

## ⚠️ 警告 (${report.details.warnings.length})

${report.details.warnings.map((w: string) => `- ${w}`).join('\n')}

## ❌ 错误 (${report.details.errors.length})

${report.details.errors.map((e: string) => `- ${e}`).join('\n')}

## 💡 改进建议

${report.details.suggestions.map((s: string) => `- ${s}`).join('\n')}

## 🎯 推荐行动

${report.recommendations.map((r: string) => `- ${r}`).join('\n')}

---
*报告由 TypeScript 质量检查工具自动生成*
`;
  }

  private getStatusEmoji(status: string): string {
    const emojis = {
      excellent: '🏆',
      good: '✅',
      warning: '⚠️',
      critical: '🚨'
    };
    return emojis[status as keyof typeof emojis] || '❓';
  }

  public async run(): Promise<void> {
    console.log('🚀 启动 TypeScript 质量检查...\n');

    const startTime = performance.now();

    try {
      await this.checkTypeScriptCompilation();
      await this.checkTypeCoverage();
      await this.analyzeComplexity();
      await this.generateSuggestions();

      this.metrics.executionTime = performance.now() - startTime;

      this.generateReport();

      console.log('\n📈 质量检查完成!');
      console.log(`整体状态: ${this.getStatusEmoji(this.getOverallStatus())} ${this.getOverallStatus().toUpperCase()}`);

      // 根据状态设置退出码
      const status = this.getOverallStatus();
      if (status === 'critical') {
        process.exit(1);
      } else if (status === 'warning') {
        process.exit(2);
      }

    } catch (error) {
      console.error('❌ 质量检查失败:', error);
      process.exit(1);
    }
  }
}

// 运行质量检查
if (require.main === module) {
  const checker = new TypeScriptQualityChecker();
  checker.run().catch(console.error);
}

export { TypeScriptQualityChecker };
