"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvConfig = exports.configValidator = exports.ConfigValidator = void 0;
const zod_1 = require("zod");
// 环境变量验证模式
const envSchema = zod_1.z.object({
    // 基础配置
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3001'),
    HOST: zod_1.z.string().default('localhost'),
    // 数据库配置
    DATABASE_URL: zod_1.z.string().min(1, 'Database URL is required'),
    // JWT 配置
    JWT_SECRET: zod_1.z.string().min(32, 'JWT secret must be at least 32 characters'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
    // 前端配置
    CLIENT_URL: zod_1.z.string().url('Client URL must be a valid URL').default('http://localhost:3000'),
    // Grok-3 LLM 配置 - 必需的
    NEWAPI_KEY: zod_1.z.string().min(1, 'NEWAPI_KEY is required for AI functionality'),
    NEWAPI_BASE_URL: zod_1.z.string().url('NEWAPI_BASE_URL must be a valid URL').default('https://ttkk.inping.com/v1'),
    DEFAULT_MODEL: zod_1.z.string().default('grok-3'),
    NEWAPI_MAX_TOKENS: zod_1.z.string().transform(Number).default('4000'),
    NEWAPI_TEMPERATURE: zod_1.z.string().transform(val => {
        const num = Number(val);
        if (isNaN(num) || num < 0 || num > 2) {
            throw new Error('Temperature must be a number between 0 and 2');
        }
        return num;
    }).default('0.7'),
    // 可选的第三方服务配置
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    DISCORD_CLIENT_ID: zod_1.z.string().optional(),
    DISCORD_CLIENT_SECRET: zod_1.z.string().optional(),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().transform(Number).optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    REDIS_URL: zod_1.z.string().optional(),
});
class ConfigValidator {
    static instance;
    config = null;
    constructor() { }
    static getInstance() {
        if (!ConfigValidator.instance) {
            ConfigValidator.instance = new ConfigValidator();
        }
        return ConfigValidator.instance;
    }
    /**
     * 验证和加载环境配置
     */
    validateAndLoad() {
        if (this.config) {
            return this.config;
        }
        try {
            console.log('🔍 验证环境配置...');
            // 验证环境变量
            const result = envSchema.safeParse(process.env);
            if (!result.success) {
                console.error('❌ 环境配置验证失败:');
                result.error.errors.forEach(error => {
                    console.error(`   ${error.path.join('.')}: ${error.message}`);
                });
                throw new Error('环境配置验证失败');
            }
            this.config = result.data;
            console.log('✅ 环境配置验证通过');
            console.log(`   Environment: ${this.config.NODE_ENV}`);
            console.log(`   Port: ${this.config.PORT}`);
            console.log(`   AI Model: ${this.config.DEFAULT_MODEL}`);
            // 检查可选服务配置
            this.checkOptionalServices();
            return this.config;
        }
        catch (error) {
            console.error('❌ 配置加载失败:', error);
            process.exit(1);
        }
    }
    /**
     * 获取已验证的配置
     */
    getConfig() {
        if (!this.config) {
            throw new Error('配置尚未初始化，请先调用 validateAndLoad()');
        }
        return this.config;
    }
    /**
     * 检查 AI 服务配置
     */
    checkAIConfig() {
        const config = this.getConfig();
        return !!(config.NEWAPI_KEY && config.NEWAPI_BASE_URL);
    }
    /**
     * 检查数据库配置
     */
    checkDatabaseConfig() {
        const config = this.getConfig();
        return !!config.DATABASE_URL;
    }
    /**
     * 检查可选服务配置
     */
    checkOptionalServices() {
        const config = this.config;
        // OAuth 服务
        if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
            console.log('✅ Google OAuth 已配置');
        }
        else {
            console.log('⚠️  Google OAuth 未配置 (可选)');
        }
        if (config.DISCORD_CLIENT_ID && config.DISCORD_CLIENT_SECRET) {
            console.log('✅ Discord OAuth 已配置');
        }
        else {
            console.log('⚠️  Discord OAuth 未配置 (可选)');
        }
        // 邮件服务
        if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
            console.log('✅ SMTP 邮件服务已配置');
        }
        else {
            console.log('⚠️  SMTP 邮件服务未配置 (可选)');
        }
        // Redis
        if (config.REDIS_URL) {
            console.log('✅ Redis 已配置');
        }
        else {
            console.log('⚠️  Redis 未配置 (可选)');
        }
    }
    /**
     * 获取AI服务健康状态
     */
    async getAIHealthStatus() {
        const config = this.getConfig();
        if (!config.NEWAPI_KEY) {
            return {
                configured: false,
                error: 'NEWAPI_KEY not configured'
            };
        }
        try {
            const axios = require('axios');
            const response = await axios.get(`${config.NEWAPI_BASE_URL}/models`, {
                headers: {
                    'Authorization': `Bearer ${config.NEWAPI_KEY}`
                },
                timeout: 10000
            });
            return {
                configured: true,
                reachable: response.status === 200
            };
        }
        catch (error) {
            return {
                configured: true,
                reachable: false,
                error: error.message
            };
        }
    }
}
exports.ConfigValidator = ConfigValidator;
// 导出单例实例
exports.configValidator = ConfigValidator.getInstance();
// 环境变量类型安全访问
const getEnvConfig = () => exports.configValidator.getConfig();
exports.getEnvConfig = getEnvConfig;
//# sourceMappingURL=env.config.js.map