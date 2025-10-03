/**
 * 导入数据验证器
 * 提供全面的数据验证和完整性检查
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    metadata: ValidationMetadata;
}
export interface ValidationError {
    type: 'format' | 'structure' | 'content' | 'security';
    code: string;
    message: string;
    path?: string;
    details?: any;
}
export interface ValidationWarning {
    type: 'compatibility' | 'data_loss' | 'performance' | 'recommendation';
    code: string;
    message: string;
    path?: string;
    suggestion?: string;
}
export interface ValidationMetadata {
    format: string;
    totalItems: number;
    validItems: number;
    errorCount: number;
    warningCount: number;
    dataSize: number;
    validationTime: number;
    securityChecks: {
        maliciousContent: boolean;
        excessiveSize: boolean;
        suspiciousPatterns: boolean;
    };
}
export interface ConflictDetection {
    duplicateNames: ConflictItem[];
    similarContent: ConflictItem[];
    keywordOverlaps: ConflictItem[];
}
export interface ConflictItem {
    name: string;
    type: 'duplicate' | 'similar' | 'overlap';
    severity: 'low' | 'medium' | 'high';
    description: string;
    existingId?: string;
    suggestions: string[];
}
declare class ImportValidators {
    private readonly MAX_FILE_SIZE;
    private readonly MAX_ENTRIES_PER_SCENARIO;
    private readonly MAX_SCENARIOS_PER_IMPORT;
    /**
     * 验证导入数据
     */
    validateImportData(data: any, format: string): Promise<ValidationResult>;
    /**
     * 检测导入冲突
     */
    detectConflicts(existingScenarios: any[], importScenarios: any[]): Promise<ConflictDetection>;
    /**
     * 内容清理和安全检查
     */
    sanitizeContent(content: string): string;
    /**
     * 验证SillyTavern格式
     */
    private validateSillyTavernFormat;
    /**
     * 验证SillyTavern条目
     */
    private validateSillyTavernEntry;
    /**
     * 验证JSON格式
     */
    private validateJSONFormat;
    /**
     * 验证YAML格式
     */
    private validateYAMLFormat;
    /**
     * 验证增强格式
     */
    private validateEnhancedFormat;
    /**
     * 执行安全检查
     */
    private performSecurityChecks;
    /**
     * 计算数据大小
     */
    private calculateDataSize;
    /**
     * 计算总条目数
     */
    private countTotalItems;
    /**
     * 计算内容相似度
     */
    private calculateContentSimilarity;
    /**
     * 计算关键词重叠
     */
    private calculateKeywordOverlap;
    /**
     * 创建验证结果
     */
    private createValidationResult;
}
export declare const importValidators: ImportValidators;
export {};
//# sourceMappingURL=importValidators.d.ts.map