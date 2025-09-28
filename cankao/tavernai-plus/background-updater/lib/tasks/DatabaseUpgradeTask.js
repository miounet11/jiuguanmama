const BaseTask = require('../BaseTask');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * 数据库升级任务
 */
class DatabaseUpgradeTask extends BaseTask {
  constructor(taskId, data = {}) {
    super(taskId, data);
    this.dbPath = path.join(__dirname, '../../../apps/api/prisma/dev.db');
  }

  async execute() {
    const { migrationScript, backupBeforeUpgrade = true, validateAfterUpgrade = true } = this.data;

    if (!migrationScript) {
      throw new Error('需要提供迁移脚本路径或SQL内容');
    }

    const db = new Database(this.dbPath);

    try {
      this.updateProgress(5, '开始数据库升级任务');

      // 1. 备份数据库
      if (backupBeforeUpgrade) {
        await this.backupDatabase();
        this.updateProgress(20, '数据库备份完成');
      }

      // 2. 执行升级脚本
      await this.executeMigration(db, migrationScript);
      this.updateProgress(70, '迁移脚本执行完成');

      // 3. 验证升级结果
      if (validateAfterUpgrade) {
        const validationResult = await this.validateUpgrade(db);
        this.updateProgress(90, '数据库升级验证完成');

        return {
          success: true,
          message: '数据库升级成功完成',
          backup: backupBeforeUpgrade ? this.getBackupInfo() : null,
          validation: validationResult
        };
      }

      return {
        success: true,
        message: '数据库升级完成',
        backup: backupBeforeUpgrade ? this.getBackupInfo() : null
      };

    } catch (error) {
      // 升级失败，尝试恢复备份
      if (backupBeforeUpgrade) {
        this.updateProgress(95, '升级失败，正在恢复备份...');
        await this.restoreBackup();
      }
      throw error;
    } finally {
      db.close();
    }
  }

  async backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../../../backups');
    const backupPath = path.join(backupDir, `dev-backup-${timestamp}.db`);

    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 复制数据库文件
    fs.copyFileSync(this.dbPath, backupPath);

    this.backupPath = backupPath;
    this.backupTimestamp = timestamp;

    // 清理旧备份（保留最近10个）
    await this.cleanupOldBackups(backupDir);
  }

  async cleanupOldBackups(backupDir) {
    try {
      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('dev-backup-') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          mtime: fs.statSync(path.join(backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime); // 按修改时间降序排列

      // 保留最近10个备份，删除其余的
      if (files.length > 10) {
        const filesToDelete = files.slice(10);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.warn('清理旧备份时出错:', error.message);
    }
  }

  async executeMigration(db, migrationScript) {
    let sql;

    // 判断是文件路径还是SQL内容
    if (fs.existsSync(migrationScript)) {
      // 是文件路径，读取文件内容
      sql = fs.readFileSync(migrationScript, 'utf8');
    } else {
      // 是SQL内容
      sql = migrationScript;
    }

    // 分割SQL语句（以分号分隔）
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // 在事务中执行所有语句
    const transaction = db.transaction(() => {
      statements.forEach((statement, index) => {
        try {
          db.exec(statement);
        } catch (error) {
          throw new Error(`执行第 ${index + 1} 条SQL语句失败: ${error.message}\nSQL: ${statement}`);
        }
      });
    });

    transaction();
  }

  async validateUpgrade(db) {
    const validation = {
      tableCount: 0,
      characterCount: 0,
      newColumns: [],
      indexCount: 0,
      errors: []
    };

    try {
      // 检查表数量
      const tables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();
      validation.tableCount = tables.length;

      // 检查Character表结构
      const characterTableInfo = db.prepare(`PRAGMA table_info(Character)`).all();
      const columnNames = characterTableInfo.map(col => col.name);

      // 检查是否包含新添加的列
      const expectedNewColumns = ['backgroundImage', 'mbtiType', 'avatarStatus', 'backgroundStatus'];
      expectedNewColumns.forEach(colName => {
        if (columnNames.includes(colName)) {
          validation.newColumns.push(colName);
        }
      });

      // 检查角色数量
      const charCount = db.prepare(`SELECT COUNT(*) as count FROM Character`).get();
      validation.characterCount = charCount.count;

      // 检查索引数量
      const indexes = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
      `).all();
      validation.indexCount = indexes.length;

      // 验证数据完整性
      await this.validateDataIntegrity(db, validation);

    } catch (error) {
      validation.errors.push(`验证过程出错: ${error.message}`);
    }

    return validation;
  }

  async validateDataIntegrity(db, validation) {
    try {
      // 检查是否有空的必需字段
      const emptyNames = db.prepare(`
        SELECT COUNT(*) as count FROM Character
        WHERE name IS NULL OR name = ''
      `).get();

      if (emptyNames.count > 0) {
        validation.errors.push(`发现 ${emptyNames.count} 个角色名称为空`);
      }

      // 检查MBTI类型的有效性
      const invalidMBTI = db.prepare(`
        SELECT COUNT(*) as count FROM Character
        WHERE mbtiType IS NOT NULL
        AND mbtiType NOT IN (
          'INTJ', 'INTP', 'ENTJ', 'ENTP',
          'INFJ', 'INFP', 'ENFJ', 'ENFP',
          'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
          'ISTP', 'ISFP', 'ESTP', 'ESFP'
        )
      `).get();

      if (invalidMBTI.count > 0) {
        validation.errors.push(`发现 ${invalidMBTI.count} 个无效的MBTI类型`);
      }

      // 检查头像状态的有效性
      const invalidAvatarStatus = db.prepare(`
        SELECT COUNT(*) as count FROM Character
        WHERE avatarStatus IS NOT NULL
        AND avatarStatus NOT IN ('PENDING', 'COMPLETED', 'FAILED')
      `).get();

      if (invalidAvatarStatus.count > 0) {
        validation.errors.push(`发现 ${invalidAvatarStatus.count} 个无效的头像状态`);
      }

    } catch (error) {
      validation.errors.push(`数据完整性检查失败: ${error.message}`);
    }
  }

  async restoreBackup() {
    if (!this.backupPath || !fs.existsSync(this.backupPath)) {
      throw new Error('备份文件不存在，无法恢复');
    }

    fs.copyFileSync(this.backupPath, this.dbPath);
  }

  getBackupInfo() {
    return {
      path: this.backupPath,
      timestamp: this.backupTimestamp,
      size: fs.existsSync(this.backupPath) ? fs.statSync(this.backupPath).size : 0
    };
  }

  // 静态方法：获取常用的升级脚本
  static getCommonMigrations() {
    return {
      addImageFields: `
        ALTER TABLE Character ADD COLUMN backgroundImage TEXT;
        ALTER TABLE Character ADD COLUMN mbtiType TEXT;
        ALTER TABLE Character ADD COLUMN avatarStatus TEXT DEFAULT 'PENDING';
        ALTER TABLE Character ADD COLUMN backgroundStatus TEXT DEFAULT 'PENDING';
      `,

      addIndexes: `
        CREATE INDEX IF NOT EXISTS idx_character_mbti ON Character(mbtiType);
        CREATE INDEX IF NOT EXISTS idx_character_avatar_status ON Character(avatarStatus);
        CREATE INDEX IF NOT EXISTS idx_character_created_at ON Character(createdAt);
      `,

      addChatEnhancements: `
        ALTER TABLE Chat ADD COLUMN metadata TEXT;
        ALTER TABLE Chat ADD COLUMN tags TEXT;
        ALTER TABLE ChatMessage ADD COLUMN messageType TEXT DEFAULT 'text';
        ALTER TABLE ChatMessage ADD COLUMN attachments TEXT;
      `,

      addUserEnhancements: `
        ALTER TABLE User ADD COLUMN preferences TEXT;
        ALTER TABLE User ADD COLUMN lastLoginAt DATETIME;
        ALTER TABLE User ADD COLUMN isActive BOOLEAN DEFAULT 1;
      `
    };
  }

  // 静态方法：创建数据库升级任务的便捷方法
  static createImageFieldsUpgrade() {
    return {
      migrationScript: this.getCommonMigrations().addImageFields,
      backupBeforeUpgrade: true,
      validateAfterUpgrade: true
    };
  }

  static createIndexUpgrade() {
    return {
      migrationScript: this.getCommonMigrations().addIndexes,
      backupBeforeUpgrade: true,
      validateAfterUpgrade: true
    };
  }
}

module.exports = DatabaseUpgradeTask;
