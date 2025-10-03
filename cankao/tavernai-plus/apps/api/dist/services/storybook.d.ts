export interface StorybookEntry {
    id: string;
    trigger: {
        type: 'keyword' | 'emotion' | 'action' | 'random';
        keywords?: string[];
        emotion?: 'happy' | 'sad' | 'angry' | 'surprised' | 'romantic';
        action?: string;
        probability?: number;
    };
    content: {
        type: 'dialogue' | 'action' | 'narration' | 'thought';
        text: string;
        speaker?: string;
        emotion?: string;
        effects?: {
            sound?: string;
            visual?: string;
            transition?: string;
        };
    };
    conditions?: {
        minAffection?: number;
        maxAffection?: number;
        requiresFlags?: string[];
        excludeFlags?: string[];
        timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
        location?: string;
    };
    outcomes?: {
        affectionChange?: number;
        setFlags?: string[];
        removeFlags?: string[];
        nextEntry?: string;
    };
    priority: number;
    repeatLimit?: number;
    cooldown?: number;
}
export interface Storybook {
    id: string;
    name: string;
    description: string;
    characterId: string;
    entries: StorybookEntry[];
    settings: {
        enabled: boolean;
        activationRate: number;
        narrativeStyle: 'first-person' | 'third-person' | 'mixed';
        emotionalDepth: 'light' | 'moderate' | 'deep';
        allowBranching: boolean;
    };
    metadata: {
        author?: string;
        version?: string;
        tags?: string[];
        createdAt: Date;
        updatedAt: Date;
    };
}
interface StoryContext {
    sessionId: string;
    characterId: string;
    affection: number;
    flags: Set<string>;
    messageHistory: Array<{
        role: string;
        content: string;
    }>;
    lastActivation?: Date;
    activationCount: Map<string, number>;
}
declare class StorybookService {
    /**
     * 创建故事书
     */
    createStorybook(characterId: string, data: Partial<Storybook>): Promise<Storybook>;
    /**
     * 检查并激活故事条目
     */
    checkAndActivate(context: StoryContext): Promise<StorybookEntry | null>;
    /**
     * 检查触发条件
     */
    private checkTrigger;
    /**
     * 检查条件
     */
    private checkConditions;
    /**
     * 应用故事效果
     */
    private applyOutcomes;
    /**
     * 格式化故事条目为消息
     */
    formatEntryAsMessage(entry: StorybookEntry): string;
    /**
     * 生成分支剧情选项
     */
    generateBranchingOptions(entry: StorybookEntry, context: StoryContext): Promise<Array<{
        id: string;
        text: string;
        preview: string;
    }>>;
    /**
     * 导入故事书（支持 JSON 格式）
     */
    importStorybook(characterId: string, data: string): Promise<Storybook>;
    /**
     * 获取故事书模板
     */
    getTemplates(): {
        romance: {
            name: string;
            entries: {
                id: string;
                trigger: {
                    type: "keyword";
                    keywords: string[];
                };
                content: {
                    type: "dialogue";
                    text: string;
                    emotion: string;
                };
                conditions: {
                    minAffection: number;
                };
                outcomes: {
                    affectionChange: number;
                    setFlags: string[];
                };
                priority: number;
            }[];
        };
        adventure: {
            name: string;
            entries: {
                id: string;
                trigger: {
                    type: "keyword";
                    keywords: string[];
                };
                content: {
                    type: "action";
                    text: string;
                    effects: {
                        visual: string;
                    };
                };
                priority: number;
            }[];
        };
    };
    /**
     * 情感检测（简单实现）
     */
    private detectEmotion;
    /**
     * 获取角色故事书（模拟）
     */
    private getCharacterStorybook;
    private getMockEntries;
    private generateId;
}
export declare const storybookService: StorybookService;
export {};
//# sourceMappingURL=storybook.d.ts.map