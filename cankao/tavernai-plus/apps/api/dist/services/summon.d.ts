export interface SummonOptions {
    sessionId: string;
    characterId: string;
    summonType: 'join' | 'replace' | 'temporary';
    context?: {
        reason?: string;
        introduction?: string;
        relationship?: string;
        duration?: number;
    };
}
export interface MultiCharacterSession {
    sessionId: string;
    mainCharacterId: string;
    activeCharacters: Array<{
        characterId: string;
        joinedAt: Date;
        isActive: boolean;
        lastMessageAt?: Date;
        messageCount: number;
        role: 'main' | 'supporting' | 'guest';
    }>;
}
declare class SummonService {
    /**
     * 召唤新角色加入对话
     */
    summonCharacter(options: SummonOptions): Promise<{
        success: boolean;
        systemMessage: {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            role: string;
            content: string;
            sessionId: string;
            characterId: string | null;
            tokens: number;
            edited: boolean;
            deleted: boolean;
        };
        introMessage: {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            role: string;
            content: string;
            sessionId: string;
            characterId: string | null;
            tokens: number;
            edited: boolean;
            deleted: boolean;
        };
        activeCharacters: any;
    } | {
        success: boolean;
        farewellMessage: {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            role: string;
            content: string;
            sessionId: string;
            characterId: string | null;
            tokens: number;
            edited: boolean;
            deleted: boolean;
        };
        joinMessage: {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            role: string;
            content: string;
            sessionId: string;
            characterId: string | null;
            tokens: number;
            edited: boolean;
            deleted: boolean;
        };
        currentCharacter: any;
    } | {
        success: boolean;
        tempMessage: {
            id: string;
            metadata: string | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string | null;
            role: string;
            content: string;
            sessionId: string;
            characterId: string | null;
            tokens: number;
            edited: boolean;
            deleted: boolean;
        };
        duration: number;
        character: any;
    }>;
    /**
     * 构建召唤消息
     */
    private buildSummonMessage;
    /**
     * 处理加入型召唤（多角色同时在场）
     */
    private handleJoinSummon;
    /**
     * 处理替换型召唤（切换当前对话角色）
     */
    private handleReplaceSummon;
    /**
     * 处理临时召唤（角色短暂出现）
     */
    private handleTemporarySummon;
    /**
     * 获取可召唤的角色列表
     */
    getSummonableCharacters(sessionId: string, userId: string): Promise<{
        description: string;
        id: string;
        name: string;
        avatar: string | null;
        category: string;
        tags: string;
    }[]>;
    /**
     * 管理多角色对话流程
     */
    manageMultiCharacterFlow(sessionId: string, activeCharacters: string[]): Promise<{
        nextSpeaker: string;
        turnOrder: string[];
        suggestion: string;
    }>;
    /**
     * 计算发言顺序
     */
    private calculateTurnOrder;
    /**
     * 自动召唤建议
     */
    getAutoSummonSuggestions(sessionId: string, context: string): Promise<Array<{
        characterId: string;
        reason: string;
    }>>;
}
export declare const summonService: SummonService;
export {};
//# sourceMappingURL=summon.d.ts.map