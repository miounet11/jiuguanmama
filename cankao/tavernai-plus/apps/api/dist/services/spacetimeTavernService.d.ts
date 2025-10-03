export declare class SpacetimeTavernService {
    static getCharacterMbti(characterId: string): Promise<any>;
    static updateCharacterMbti(characterId: string, mbtiData: {
        mbtiType?: string;
        mbtiDescription?: string;
        mbtiTraits?: string[];
        mbtiCompatibility?: string[];
        mbtiWeaknesses?: string[];
    }): Promise<any>;
    static getCharacterRelations(characterId: string): Promise<{
        outgoing: any;
        incoming: any;
    }>;
    static createCharacterRelation(fromCharacterId: string, toCharacterId: string, relationData: {
        relationType: string;
        description: string;
        interactionTriggers?: string[];
        compatibilityScore?: number;
        importance?: number;
    }): Promise<any>;
    static updateScenarioSpacetimeHub(scenarioId: string, spacetimeData: {
        spacetimeHubEnabled?: boolean;
        spacetimeAttributes?: string[];
        spacetimeLayout?: string;
        fusionMechanisms?: string;
        plotPhases?: string;
    }): Promise<any>;
    static updateWorldInfoSpacetime(worldInfoId: string, spacetimeData: {
        spacetimeAttributes?: string[];
        relationTriggers?: any[];
        culturalContext?: any;
        plotPhases?: any[];
        dynamicWeight?: any;
    }): Promise<any>;
    static addSpacetimeEventToMessage(messageId: string, spacetimeEvent: {
        type: string;
        title: string;
        description: string;
        effects?: string[];
        triggeredBy?: string;
    }): Promise<{
        timestamp: string;
        type: string;
        title: string;
        description: string;
        effects?: string[];
        triggeredBy?: string;
        id: string;
    }>;
    static addRelationTriggerToMessage(messageId: string, relationTrigger: {
        characterId: string;
        characterName: string;
        relationType: string;
        description: string;
        compatibilityScore?: number;
    }): Promise<{
        timestamp: string;
        characterId: string;
        characterName: string;
        relationType: string;
        description: string;
        compatibilityScore?: number;
        id: string;
    }>;
    static calculateMbtiCompatibility(type1: string, type2: string): number;
}
//# sourceMappingURL=spacetimeTavernService.d.ts.map