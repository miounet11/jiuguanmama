/**
 * 角色剧本关联服务
 * Character-Scenario Association Service
 */
interface CharacterScenarioAssociation {
    id: string;
    characterId: string;
    scenarioId: string;
    isDefault: boolean;
    isActive: boolean;
    customSettings: Record<string, any>;
    character?: Character;
    scenario?: Scenario;
    worldSetting?: CharacterWorldSetting;
    createdAt: Date;
    updatedAt: Date;
}
interface CharacterWorldSetting {
    id: string;
    characterId: string;
    scenarioId: string;
    backgroundOverride?: string;
    relationships: Record<string, any>;
    specialAbilities: Array<{
        name: string;
        description: string;
        type: string;
        scope: string;
        limitations?: string[];
    }>;
    restrictions: Array<{
        type: string;
        description: string;
        severity: string;
        conditions?: string[];
    }>;
    startingLocationId?: string;
    startingItems: string[];
    reputation: Record<string, any>;
    secretsKnown: Array<{
        secret: string;
        importance: number;
        source: string;
        consequences_if_revealed?: string;
    }>;
    personalGoals?: Array<{
        description: string;
        motivation: string;
        obstacles: string[];
        progress: number;
    }>;
    isActive: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
interface Character {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    personality?: string;
    background?: string;
    tags: string[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface Scenario {
    id: string;
    name: string;
    description?: string;
    category: string;
    tags: string[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface ScenarioRecommendation {
    scenario: Scenario;
    matchScore: number;
    reasons: string[];
    compatibility: {
        thematic: number;
        genre: number;
        complexity: number;
        overall: number;
    };
}
interface CharacterRecommendation {
    character: Character;
    matchScore: number;
    reasons: string[];
    suggestedRole: string;
    compatibility: {
        personality: number;
        background: number;
        abilities: number;
        overall: number;
    };
}
export declare class CharacterScenarioService {
    private prisma;
    private cache;
    constructor(prisma: PrismaClient, cache: CacheManager);
    /**
     * 获取角色关联的所有剧本
     */
    getCharacterScenarios(characterId: string, userId: string, includeInactive?: boolean): Promise<CharacterScenarioAssociation[]>;
    /**
     * 获取剧本关联的所有角色
     */
    getScenarioCharacters(scenarioId: string, userId: string, includeInactive?: boolean): Promise<CharacterScenarioAssociation[]>;
    /**
     * 创建角色剧本关联
     */
    associateCharacterWithScenario(characterId: string, scenarioId: string, userId: string, options?: {
        isDefault?: boolean;
        isActive?: boolean;
        customSettings?: Record<string, any>;
        worldSetting?: Partial<CharacterWorldSetting>;
    }): Promise<CharacterScenarioAssociation>;
    /**
     * 更新角色剧本关联
     */
    updateCharacterScenarioAssociation(characterId: string, scenarioId: string, userId: string, updates: {
        isDefault?: boolean;
        isActive?: boolean;
        customSettings?: Record<string, any>;
    }): Promise<CharacterScenarioAssociation>;
    /**
     * 删除角色剧本关联
     */
    removeCharacterScenarioAssociation(characterId: string, scenarioId: string, userId: string): Promise<void>;
    /**
     * 获取角色的世界设定
     */
    getCharacterWorldSetting(characterId: string, scenarioId: string): Promise<CharacterWorldSetting | null>;
    /**
     * 创建或更新角色世界设定
     */
    createOrUpdateCharacterWorldSetting(characterId: string, scenarioId: string, userId: string, data: Partial<CharacterWorldSetting>): Promise<CharacterWorldSetting>;
    /**
     * 为角色推荐适合的剧本
     */
    recommendScenariosForCharacter(characterId: string, userId: string, limit?: number): Promise<ScenarioRecommendation[]>;
    /**
     * 为剧本推荐适合的角色
     */
    recommendCharactersForScenario(scenarioId: string, userId: string, limit?: number): Promise<CharacterRecommendation[]>;
    /**
     * 批量导入角色到剧本
     */
    bulkImportCharactersToScenario(scenarioId: string, characterIds: string[], userId: string, options?: {
        createWorldSettings?: boolean;
        defaultSettings?: Record<string, any>;
    }): Promise<CharacterScenarioAssociation[]>;
    /**
     * 私有方法：计算剧本匹配分数
     */
    private calculateScenarioMatchScore;
    /**
     * 私有方法：计算角色匹配分数
     */
    private calculateCharacterMatchScore;
    /**
     * 私有方法：生成剧本匹配原因
     */
    private generateScenarioMatchReasons;
    /**
     * 私有方法：生成角色匹配原因
     */
    private generateCharacterMatchReasons;
    /**
     * 私有方法：建议角色职能
     */
    private suggestCharacterRole;
    /**
     * 私有方法：计算剧本兼容性
     */
    private calculateScenarioCompatibility;
    /**
     * 私有方法：计算角色兼容性
     */
    private calculateCharacterCompatibility;
    /**
     * 私有方法：估算角色复杂度
     */
    private estimateCharacterComplexity;
    /**
     * 私有方法：检查背景兼容性
     */
    private checkBackgroundCompatibility;
    /**
     * 私有方法：计算主题兼容性
     */
    private calculateThematicCompatibility;
    /**
     * 私有方法：计算类型兼容性
     */
    private calculateGenreCompatibility;
    /**
     * 私有方法：计算复杂度兼容性
     */
    private calculateComplexityCompatibility;
    /**
     * 私有方法：计算性格兼容性
     */
    private calculatePersonalityCompatibility;
    /**
     * 私有方法：计算背景兼容性
     */
    private calculateBackgroundCompatibility;
    /**
     * 私有方法：计算能力兼容性
     */
    private calculateAbilitiesCompatibility;
    /**
     * 私有方法：转换关联数据
     */
    private transformAssociation;
    /**
     * 私有方法：转换世界设定数据
     */
    private transformWorldSetting;
    /**
     * 私有方法：转换角色数据
     */
    private transformCharacter;
    /**
     * 私有方法：转换剧本数据
     */
    private transformScenario;
    /**
     * 私有方法：清除缓存
     */
    private invalidateCache;
}
export default CharacterScenarioService;
//# sourceMappingURL=characterScenarioService.d.ts.map