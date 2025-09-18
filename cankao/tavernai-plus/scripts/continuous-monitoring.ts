#!/usr/bin/env ts-node

/**
 * 持续监控 TypeScript 质量脚本
 *
 * 功能：
 * 1. 监控文件变化
 * 2. 实时类型检查
 * 3. 质量趋势分析
 * 4. 自动告警
 * 5. 性能监控
 */

import { watch } from 'chokidar';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface MonitoringConfig {
  watchPaths: string[];
  excludePatterns: string[];
  checkInterval: number; // 秒
  alertThresholds: {
    typeErrors: number;
    typeCoverage: number;
    buildTime: number; // 毫秒
  };
  enableNotifications: boolean;
  reportRetention: number; // 天
}

interface QualitySnapshot {
  timestamp: string;
  typeErrors: number;
  typeCoverage: number;
  buildTime: number;
  changedFiles: string[];
  alerts: Alert[];
}

interface Alert {
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  file?: string;
}

class TypeScriptContinuousMonitor {
  private config: MonitoringConfig;
  private isRunning = false;
  private lastSnapshot: QualitySnapshot | null = null;
  private snapshots: QualitySnapshot[] = [];
  private alertHistory: Alert[] = [];

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath);
    this.setupGracefulShutdown();
  }

  private loadConfig(configPath?: string): MonitoringConfig {
    const defaultConfig: MonitoringConfig = {
      watchPaths: [
        'apps/api/src/**/*.ts',
        'apps/web/src/**/*.{ts,tsx,vue}',
        'packages/shared/src/**/*.ts'
      ],
      excludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts'
      ],
      checkInterval: 30, // 30秒
      alertThresholds: {
        typeErrors: 0,
        typeCoverage: 90,
        buildTime: 30000 // 30秒
      },
      enableNotifications: true,
      reportRetention: 7 // 7天
    };

    if (configPath && fs.existsSync(configPath)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...userConfig };
      } catch (error) {
        console.warn('配置文件解析失败，使用默认配置:', error);
      }
    }

    return defaultConfig;
  }

  private setupGracefulShutdown(): void {
    process.on('SIGINT', () => {
      console.log('\n📊 正在生成最终报告...');
      this.generateTrendReport();
      console.log('👋 监控已停止');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.stop();
      process.exit(0);
    });
  }

  private async runTypeCheck(): Promise<{ errors: number; time: number }> {
    const startTime = performance.now();

    try {
      // 运行类型检查
      const result = execSync('npm run type-check', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const endTime = performance.now();
      const buildTime = endTime - startTime;

      // 解析错误数量
      const errorMatch = result.match(/Found (\d+) error/);
      const errors = errorMatch ? parseInt(errorMatch[1]) : 0;

      return { errors, time: buildTime };
    } catch (error: any) {
      const endTime = performance.now();
      const buildTime = endTime - startTime;

      // 从错误输出中解析错误数量
      const output = error.stdout || error.stderr || '';
      const errorMatch = output.match(/Found (\d+) error/);
      const errors = errorMatch ? parseInt(errorMatch[1]) : 1;

      return { errors, time: buildTime };
    }
  }

  private async getTypeCoverage(): Promise<number> {
    try {
      const result = execSync('npm run type-coverage -- --json', {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const coverage = JSON.parse(result);
      return coverage.percentage || 0;
    } catch (error) {
      console.warn('无法获取类型覆盖率:', error);
      return 0;
    }
  }

  private async createSnapshot(changedFiles: string[] = []): Promise<QualitySnapshot> {
    console.log('📸 创建质量快照...');

    const typeCheck = await this.runTypeCheck();
    const typeCoverage = await this.getTypeCoverage();

    const snapshot: QualitySnapshot = {
      timestamp: new Date().toISOString(),
      typeErrors: typeCheck.errors,
      typeCoverage,
      buildTime: typeCheck.time,
      changedFiles: changedFiles.slice(), // 复制数组
      alerts: []
    };

    // 生成告警
    snapshot.alerts = this.generateAlerts(snapshot);

    return snapshot;
  }

  private generateAlerts(snapshot: QualitySnapshot): Alert[] {
    const alerts: Alert[] = [];

    // 类型错误告警
    if (snapshot.typeErrors > this.config.alertThresholds.typeErrors) {
      alerts.push({
        type: 'error',
        message: `发现 ${snapshot.typeErrors} 个类型错误，超过阈值 ${this.config.alertThresholds.typeErrors}`,
        timestamp: snapshot.timestamp
      });
    }

    // 类型覆盖率告警
    if (snapshot.typeCoverage < this.config.alertThresholds.typeCoverage) {
      alerts.push({
        type: 'warning',
        message: `类型覆盖率 ${snapshot.typeCoverage.toFixed(2)}% 低于阈值 ${this.config.alertThresholds.typeCoverage}%`,
        timestamp: snapshot.timestamp
      });
    }

    // 构建时间告警
    if (snapshot.buildTime > this.config.alertThresholds.buildTime) {
      alerts.push({
        type: 'warning',
        message: `构建时间 ${(snapshot.buildTime / 1000).toFixed(2)}s 超过阈值 ${this.config.alertThresholds.buildTime / 1000}s`,
        timestamp: snapshot.timestamp
      });
    }

    // 趋势分析告警
    if (this.lastSnapshot) {
      // 类型错误增加
      if (snapshot.typeErrors > this.lastSnapshot.typeErrors) {
        alerts.push({
          type: 'warning',
          message: `类型错误从 ${this.lastSnapshot.typeErrors} 增加到 ${snapshot.typeErrors}`,
          timestamp: snapshot.timestamp
        });
      }

      // 类型覆盖率下降
      const coverageChange = snapshot.typeCoverage - this.lastSnapshot.typeCoverage;
      if (coverageChange < -1) {
        alerts.push({
          type: 'warning',
          message: `类型覆盖率下降 ${Math.abs(coverageChange).toFixed(2)}%`,
          timestamp: snapshot.timestamp
        });
      }

      // 构建时间显著增加
      const timeChange = snapshot.buildTime - this.lastSnapshot.buildTime;
      if (timeChange > 5000) { // 5秒
        alerts.push({
          type: 'info',
          message: `构建时间增加 ${(timeChange / 1000).toFixed(2)}s`,
          timestamp: snapshot.timestamp
        });
      }
    }

    return alerts;
  }

  private logAlerts(alerts: Alert[]): void {
    for (const alert of alerts) {
      const icon = alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️';
      const timestamp = new Date(alert.timestamp).toLocaleTimeString('zh-CN');

      console.log(`${icon} [${timestamp}] ${alert.message}`);

      if (alert.file) {
        console.log(`   📁 文件: ${alert.file}`);
      }
    }

    // 保存到告警历史
    this.alertHistory.push(...alerts);

    // 限制告警历史长度
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
  }

  private saveSnapshot(snapshot: QualitySnapshot): void {
    this.snapshots.push(snapshot);

    // 限制快照数量
    if (this.snapshots.length > 1000) {
      this.snapshots = this.snapshots.slice(-1000);
    }

    // 保存到文件
    const reportsDir = path.join(process.cwd(), 'reports', 'monitoring');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const snapshotFile = path.join(reportsDir, 'latest-snapshot.json');
    fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));

    // 保存历史数据
    const historyFile = path.join(reportsDir, 'snapshots-history.json');
    fs.writeFileSync(historyFile, JSON.stringify(this.snapshots, null, 2));
  }

  private generateTrendReport(): void {
    if (this.snapshots.length === 0) {
      console.log('📊 没有足够的数据生成趋势报告');
      return;
    }

    const reportsDir = path.join(process.cwd(), 'reports', 'monitoring');
    const reportFile = path.join(reportsDir, 'trend-report.md');

    const report = this.createTrendMarkdown();
    fs.writeFileSync(reportFile, report);

    console.log(`📈 趋势报告已生成: ${reportFile}`);
  }

  private createTrendMarkdown(): string {
    const latestSnapshot = this.snapshots[this.snapshots.length - 1];
    const firstSnapshot = this.snapshots[0];

    const duration = new Date(latestSnapshot.timestamp).getTime() - new Date(firstSnapshot.timestamp).getTime();
    const durationHours = Math.round(duration / (1000 * 60 * 60) * 10) / 10;

    // 计算趋势
    const errorTrend = latestSnapshot.typeErrors - firstSnapshot.typeErrors;
    const coverageTrend = latestSnapshot.typeCoverage - firstSnapshot.typeCoverage;
    const timeTrend = latestSnapshot.buildTime - firstSnapshot.buildTime;

    // 统计告警
    const errorAlerts = this.alertHistory.filter(a => a.type === 'error').length;
    const warningAlerts = this.alertHistory.filter(a => a.type === 'warning').length;

    return `# TypeScript 质量监控趋势报告

## 监控概述

- **监控时长**: ${durationHours} 小时
- **快照数量**: ${this.snapshots.length}
- **告警总数**: ${this.alertHistory.length} (错误: ${errorAlerts}, 警告: ${warningAlerts})

## 质量指标趋势

### 类型错误
- **当前**: ${latestSnapshot.typeErrors} 个
- **初始**: ${firstSnapshot.typeErrors} 个
- **变化**: ${errorTrend >= 0 ? '+' : ''}${errorTrend} ${errorTrend === 0 ? '🟢' : errorTrend > 0 ? '🔴' : '🟢'}

### 类型覆盖率
- **当前**: ${latestSnapshot.typeCoverage.toFixed(2)}%
- **初始**: ${firstSnapshot.typeCoverage.toFixed(2)}%
- **变化**: ${coverageTrend >= 0 ? '+' : ''}${coverageTrend.toFixed(2)}% ${coverageTrend >= 0 ? '🟢' : '🔴'}

### 构建时间
- **当前**: ${(latestSnapshot.buildTime / 1000).toFixed(2)}s
- **初始**: ${(firstSnapshot.buildTime / 1000).toFixed(2)}s
- **变化**: ${timeTrend >= 0 ? '+' : ''}${(timeTrend / 1000).toFixed(2)}s ${Math.abs(timeTrend) < 1000 ? '🟢' : timeTrend > 0 ? '🔴' : '🟢'}

## 近期告警

${this.alertHistory.slice(-10).map(alert => {
  const time = new Date(alert.timestamp).toLocaleString('zh-CN');
  const icon = alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️';
  return `${icon} **${time}**: ${alert.message}`;
}).join('\n')}

## 质量状态

${this.getQualityStatus(latestSnapshot)}

---
*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`;
  }

  private getQualityStatus(snapshot: QualitySnapshot): string {
    if (snapshot.typeErrors === 0 && snapshot.typeCoverage >= 95) {
      return '🟢 **优秀** - 类型安全状况良好';
    } else if (snapshot.typeErrors === 0 && snapshot.typeCoverage >= 90) {
      return '🟡 **良好** - 建议提升类型覆盖率';
    } else if (snapshot.typeErrors > 0 && snapshot.typeErrors <= 5) {
      return '🟡 **需要关注** - 存在少量类型错误';
    } else {
      return '🔴 **需要立即处理** - 类型安全问题较多';
    }
  }

  private setupFileWatcher(): void {
    const watcher = watch(this.config.watchPaths, {
      ignored: this.config.excludePatterns,
      persistent: true,
      ignoreInitial: true
    });

    const changedFiles: string[] = [];
    let changeTimer: NodeJS.Timeout | null = null;

    watcher.on('change', (filePath) => {
      console.log(`📝 文件变更: ${filePath}`);
      changedFiles.push(filePath);

      // 防抖：1秒内的多个变更合并处理
      if (changeTimer) {
        clearTimeout(changeTimer);
      }

      changeTimer = setTimeout(async () => {
        const snapshot = await this.createSnapshot([...changedFiles]);
        this.processSnapshot(snapshot);
        changedFiles.length = 0; // 清空数组
      }, 1000);
    });

    console.log('👀 正在监控文件变更...');
    console.log(`📁 监控路径: ${this.config.watchPaths.join(', ')}`);
  }

  private setupPeriodicCheck(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      console.log('⏰ 执行定期质量检查...');
      const snapshot = await this.createSnapshot();
      this.processSnapshot(snapshot);
    }, this.config.checkInterval * 1000);
  }

  private processSnapshot(snapshot: QualitySnapshot): void {
    // 显示快照信息
    const time = new Date(snapshot.timestamp).toLocaleTimeString('zh-CN');
    console.log(`\n📊 [${time}] 质量快照:`);
    console.log(`   类型错误: ${snapshot.typeErrors}`);
    console.log(`   类型覆盖率: ${snapshot.typeCoverage.toFixed(2)}%`);
    console.log(`   构建时间: ${(snapshot.buildTime / 1000).toFixed(2)}s`);

    if (snapshot.changedFiles.length > 0) {
      console.log(`   变更文件: ${snapshot.changedFiles.length} 个`);
    }

    // 处理告警
    if (snapshot.alerts.length > 0) {
      console.log(`\n📢 告警 (${snapshot.alerts.length} 个):`);
      this.logAlerts(snapshot.alerts);
    }

    // 保存快照
    this.saveSnapshot(snapshot);
    this.lastSnapshot = snapshot;

    console.log(''); // 空行分隔
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ 监控已在运行中');
      return;
    }

    this.isRunning = true;

    console.log('🚀 启动 TypeScript 持续质量监控...');
    console.log(`⚙️ 检查间隔: ${this.config.checkInterval}秒`);
    console.log(`📊 告警阈值:`);
    console.log(`   类型错误: ${this.config.alertThresholds.typeErrors}`);
    console.log(`   类型覆盖率: ${this.config.alertThresholds.typeCoverage}%`);
    console.log(`   构建时间: ${this.config.alertThresholds.buildTime / 1000}s`);
    console.log('');

    // 初始检查
    const initialSnapshot = await this.createSnapshot();
    this.processSnapshot(initialSnapshot);

    // 设置文件监控
    this.setupFileWatcher();

    // 设置定期检查
    this.setupPeriodicCheck();

    console.log('✅ 监控已启动，按 Ctrl+C 停止');
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.generateTrendReport();
    console.log('⏹️ 监控已停止');
  }
}

// CLI 入口
if (require.main === module) {
  const configPath = process.argv[2];
  const monitor = new TypeScriptContinuousMonitor(configPath);
  monitor.start().catch(console.error);
}

export { TypeScriptContinuousMonitor };
