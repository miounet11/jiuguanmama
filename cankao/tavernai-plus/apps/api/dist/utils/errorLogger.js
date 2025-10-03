"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const date_fns_1 = require("date-fns");
const logsDir = path_1.default.join(process.cwd(), 'logs');
// 确保日志目录存在
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
class ErrorLogger {
    logFile;
    currentDate;
    constructor() {
        this.currentDate = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        this.logFile = path_1.default.join(logsDir, `api-errors-${this.currentDate}.log`);
    }
    checkDateAndRotate() {
        const today = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        if (today !== this.currentDate) {
            this.currentDate = today;
            this.logFile = path_1.default.join(logsDir, `api-errors-${this.currentDate}.log`);
        }
    }
    formatLog(log) {
        const parts = [
            `[${log.timestamp}]`,
            `[${log.level}]`,
            log.endpoint ? `[${log.method} ${log.endpoint}]` : '',
            log.statusCode ? `[${log.statusCode}]` : '',
            log.userId ? `[User: ${log.userId}]` : '',
            log.message
        ].filter(Boolean);
        return parts.join(' ');
    }
    log(log) {
        this.checkDateAndRotate();
        const fullLog = {
            timestamp: new Date().toISOString(),
            level: log.level || 'ERROR',
            ...log
        };
        const logLine = this.formatLog(fullLog) + '\n';
        // 写入文件
        fs_1.default.appendFileSync(this.logFile, logLine);
        // 在开发环境也打印到控制台
        if (process.env.NODE_ENV === 'development') {
            if (fullLog.level === 'ERROR') {
                console.error(logLine);
            }
            else if (fullLog.level === 'WARN') {
                console.warn(logLine);
            }
            else {
                console.log(logLine);
            }
        }
    }
    error(message, details) {
        this.log({
            level: 'ERROR',
            message,
            ...details
        });
    }
    warn(message, details) {
        this.log({
            level: 'WARN',
            message,
            ...details
        });
    }
    info(message, details) {
        this.log({
            level: 'INFO',
            message,
            ...details
        });
    }
    // 获取最近的错误日志
    getRecentLogs(lines = 100) {
        this.checkDateAndRotate();
        if (!fs_1.default.existsSync(this.logFile)) {
            return [];
        }
        const content = fs_1.default.readFileSync(this.logFile, 'utf-8');
        const allLines = content.split('\n').filter(line => line.trim());
        return allLines.slice(-lines);
    }
    // 清理旧日志（保留最近7天）
    cleanOldLogs() {
        const files = fs_1.default.readdirSync(logsDir);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        files.forEach(file => {
            if (file.startsWith('api-errors-') && file.endsWith('.log')) {
                const filePath = path_1.default.join(logsDir, file);
                const stats = fs_1.default.statSync(filePath);
                if (stats.mtime < sevenDaysAgo) {
                    fs_1.default.unlinkSync(filePath);
                    console.log(`Deleted old log file: ${file}`);
                }
            }
        });
    }
}
exports.errorLogger = new ErrorLogger();
exports.default = exports.errorLogger;
//# sourceMappingURL=errorLogger.js.map