"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorLogger_1 = require("../utils/errorLogger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// 获取最近的错误日志
router.get('/errors', async (req, res) => {
    try {
        const lines = parseInt(req.query.lines) || 100;
        const logs = errorLogger_1.errorLogger.getRecentLogs(lines);
        res.json({
            success: true,
            logs,
            count: logs.length
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch error logs'
        });
    }
});
// 获取所有日志文件列表
router.get('/files', async (req, res) => {
    try {
        const logsDir = path_1.default.join(process.cwd(), 'logs');
        if (!fs_1.default.existsSync(logsDir)) {
            return res.json({
                success: true,
                files: []
            });
        }
        const files = fs_1.default.readdirSync(logsDir)
            .filter(file => file.endsWith('.log'))
            .map(file => {
            const filePath = path_1.default.join(logsDir, file);
            const stats = fs_1.default.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                modified: stats.mtime
            };
        })
            .sort((a, b) => b.modified.getTime() - a.modified.getTime());
        res.json({
            success: true,
            files
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch log files'
        });
    }
});
// 清理旧日志
router.delete('/clean', async (req, res) => {
    try {
        errorLogger_1.errorLogger.cleanOldLogs();
        res.json({
            success: true,
            message: 'Old logs cleaned successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clean old logs'
        });
    }
});
exports.default = router;
//# sourceMappingURL=logs.js.map