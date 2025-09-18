interface VoiceConfig {
    provider: 'openai' | 'elevenlabs' | 'azure';
    voice: string;
    speed: number;
    pitch: number;
    stability?: number;
}
interface ImageConfig {
    provider: 'openai' | 'midjourney' | 'stablediffusion';
    style: string;
    quality: 'standard' | 'hd';
    size: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    steps?: number;
}
declare class MultimodalAIService {
    private openai;
    private providers;
    constructor();
    private loadProviders;
    generateText(prompt: string, options: {
        characterId?: string;
        userId: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
        systemPrompt?: string;
    }): Promise<{
        content: string;
        usage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
        cost: number;
    }>;
    synthesizeSpeech(text: string, options: {
        userId: string;
        characterId?: string;
        voiceConfig?: VoiceConfig;
    }): Promise<{
        audioUrl: string;
        duration: number;
        cost: number;
    }>;
    transcribeAudio(audioFilePath: string, options: {
        userId: string;
        language?: string;
    }): Promise<{
        text: string;
        language: string;
        confidence: number;
        cost: number;
    }>;
    generateImage(prompt: string, options: {
        userId: string;
        characterId?: string;
        imageConfig?: ImageConfig;
    }): Promise<{
        imageUrl: string;
        cost: number;
        revisedPrompt?: string;
    }>;
    analyzeImage(imageUrl: string, prompt: string, options: {
        userId: string;
        characterId?: string;
    }): Promise<{
        analysis: string;
        cost: number;
    }>;
    getAvailableModels(): Promise<{
        text: string[];
        image: string[];
        speech: string[];
    }>;
    getUsageStats(userId: string, timeRange: {
        startDate: Date;
        endDate: Date;
    }): Promise<{
        totalRequests: number;
        totalCost: number;
        breakdown: {
            text: {
                requests: number;
                cost: number;
            };
            image: {
                requests: number;
                cost: number;
            };
            speech: {
                requests: number;
                cost: number;
            };
        };
    }>;
    private buildCharacterSystemPrompt;
    private calculateCost;
    private logAIRequest;
    private getAudioDuration;
}
declare const _default: MultimodalAIService;
export default _default;
//# sourceMappingURL=multimodalAI.d.ts.map