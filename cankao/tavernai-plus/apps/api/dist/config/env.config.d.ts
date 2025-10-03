import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    HOST: z.ZodDefault<z.ZodString>;
    DATABASE_URL: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_REFRESH_SECRET: z.ZodString;
    CLIENT_URL: z.ZodDefault<z.ZodString>;
    NEWAPI_KEY: z.ZodString;
    NEWAPI_BASE_URL: z.ZodDefault<z.ZodString>;
    DEFAULT_MODEL: z.ZodDefault<z.ZodString>;
    NEWAPI_MAX_TOKENS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    NEWAPI_TEMPERATURE: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    GOOGLE_CLIENT_ID: z.ZodOptional<z.ZodString>;
    GOOGLE_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    DISCORD_CLIENT_ID: z.ZodOptional<z.ZodString>;
    DISCORD_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    SMTP_HOST: z.ZodOptional<z.ZodString>;
    SMTP_PORT: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
    SMTP_USER: z.ZodOptional<z.ZodString>;
    SMTP_PASS: z.ZodOptional<z.ZodString>;
    REDIS_URL: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV?: "test" | "development" | "production";
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    JWT_REFRESH_SECRET?: string;
    PORT?: number;
    HOST?: string;
    CLIENT_URL?: string;
    NEWAPI_KEY?: string;
    NEWAPI_BASE_URL?: string;
    DEFAULT_MODEL?: string;
    NEWAPI_MAX_TOKENS?: number;
    NEWAPI_TEMPERATURE?: number;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    DISCORD_CLIENT_ID?: string;
    DISCORD_CLIENT_SECRET?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: number;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    REDIS_URL?: string;
}, {
    NODE_ENV?: "test" | "development" | "production";
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    JWT_REFRESH_SECRET?: string;
    PORT?: string;
    HOST?: string;
    CLIENT_URL?: string;
    NEWAPI_KEY?: string;
    NEWAPI_BASE_URL?: string;
    DEFAULT_MODEL?: string;
    NEWAPI_MAX_TOKENS?: string;
    NEWAPI_TEMPERATURE?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    DISCORD_CLIENT_ID?: string;
    DISCORD_CLIENT_SECRET?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    REDIS_URL?: string;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
export declare class ConfigValidator {
    private static instance;
    private config;
    private constructor();
    static getInstance(): ConfigValidator;
    /**
     * 验证和加载环境配置
     */
    validateAndLoad(): EnvConfig;
    /**
     * 获取已验证的配置
     */
    getConfig(): EnvConfig;
    /**
     * 检查 AI 服务配置
     */
    checkAIConfig(): boolean;
    /**
     * 检查数据库配置
     */
    checkDatabaseConfig(): boolean;
    /**
     * 检查可选服务配置
     */
    private checkOptionalServices;
    /**
     * 获取AI服务健康状态
     */
    getAIHealthStatus(): Promise<{
        configured: boolean;
        reachable?: boolean;
        error?: string;
    }>;
}
export declare const configValidator: ConfigValidator;
export declare const getEnvConfig: () => {
    NODE_ENV?: "test" | "development" | "production";
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    JWT_REFRESH_SECRET?: string;
    PORT?: number;
    HOST?: string;
    CLIENT_URL?: string;
    NEWAPI_KEY?: string;
    NEWAPI_BASE_URL?: string;
    DEFAULT_MODEL?: string;
    NEWAPI_MAX_TOKENS?: number;
    NEWAPI_TEMPERATURE?: number;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    DISCORD_CLIENT_ID?: string;
    DISCORD_CLIENT_SECRET?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: number;
    SMTP_USER?: string;
    SMTP_PASS?: string;
    REDIS_URL?: string;
};
export {};
//# sourceMappingURL=env.config.d.ts.map