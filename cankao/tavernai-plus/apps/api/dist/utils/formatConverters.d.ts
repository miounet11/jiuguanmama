/**
 * 格式转换器
 * 支持多种格式的相互转换，包括SillyTavern World Info、JSON、YAML等
 */
import { ApiScenarioDetail } from '../types/api';
export interface SillyTavernWorldInfo {
    entries: SillyTavernEntry[];
    name?: string;
    description?: string;
    version?: string;
}
export interface SillyTavernEntry {
    uid?: number | string;
    key: string[];
    keysecondary?: string[];
    comment?: string;
    content: string;
    constant?: boolean;
    selective?: boolean;
    order?: number;
    position?: 'before_char' | 'after_char';
    disable?: boolean;
    addMemo?: boolean;
    excludeRecursion?: boolean;
    delayUntilRecursion?: boolean;
    displayIndex?: number;
    probability?: number;
    group?: string;
    groupOverride?: boolean;
    groupWeight?: number;
    scanDepth?: number;
    caseSensitive?: boolean;
    matchWholeWords?: boolean;
    useGroupScoring?: boolean;
    automation_id?: string;
    role?: number;
    sticky?: number;
    cooldown?: number;
    delay?: number;
}
export interface TavernAIPlusEnhanced extends ApiScenarioDetail {
    enhanced: {
        exportVersion: string;
        exportedAt: string;
        metadata: {
            originalFormat?: string;
            conversionNotes?: string[];
            dataIntegrity: boolean;
        };
        extendedFields: {
            customProperties?: Record<string, any>;
            advancedSettings?: Record<string, any>;
        };
    };
}
export interface ConversionOptions {
    includeWorldInfo?: boolean;
    includeMetadata?: boolean;
    preserveIds?: boolean;
    targetVersion?: string;
}
export interface ConversionResult {
    success: boolean;
    data?: any;
    scenarios?: any[];
    error?: string;
    warnings?: string[];
    metadata?: {
        originalFormat: string;
        targetFormat: string;
        conversionTime: number;
        dataLoss: string[];
        fieldsIgnored: string[];
    };
}
declare class FormatConverters {
    /**
     * 转换为TavernAI Plus内部格式
     */
    convertToTavernAIFormat(data: any, sourceFormat: string): Promise<ConversionResult>;
    /**
     * 从TavernAI Plus格式转换到目标格式
     */
    convertFromTavernAIFormat(scenarios: ApiScenarioDetail[], targetFormat: string, options?: ConversionOptions): Promise<ConversionResult>;
    /**
     * 从SillyTavern World Info格式转换
     */
    private convertFromSillyTavern;
    /**
     * 转换SillyTavern条目
     */
    private convertSillyTavernEntry;
    /**
     * 转换为SillyTavern格式
     */
    private convertToSillyTavern;
    /**
     * 转换为SillyTavern条目
     */
    private convertToSillyTavernEntry;
    /**
     * 从JSON格式转换
     */
    private convertFromJSON;
    /**
     * 从YAML格式转换
     */
    private convertFromYAML;
    /**
     * 从增强格式转换
     */
    private convertFromEnhanced;
    /**
     * 转换为JSON格式
     */
    private convertToJSON;
    /**
     * 转换为YAML格式
     */
    private convertToYAML;
    /**
     * 转换为增强格式
     */
    private convertToEnhanced;
    /**
     * 验证和转换剧本对象
     */
    private validateAndConvertScenario;
}
export declare const formatConverters: FormatConverters;
export {};
//# sourceMappingURL=formatConverters.d.ts.map