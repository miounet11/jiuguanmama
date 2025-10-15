export interface SillyTavernConfig {
    textgenerationwebui_settings: {
        max_new_tokens: number;
        temperature: number;
        top_p: number;
        top_k: number;
        repetition_penalty: number;
        encoder_repetition_penalty: number;
        typical_p: number;
        min_length: number;
        no_repeat_ngram_size: number;
        penalty_alpha: number;
        num_beams: number;
        length_penalty: number;
        early_stopping: boolean;
        mirostat_mode: number;
        mirostat_tau: number;
        mirostat_eta: number;
        guidance_scale: number;
        negative_prompt: string;
        grammar_string: string;
        banned_tokens: string;
        sampler_order: number[];
        stopping_strings: string[];
    };
    openai_setting: {
        openai_key: string;
        openai_model: string;
        openai_reverse_proxy: string;
        openai_temperature: number;
        openai_frequency_penalty: number;
        openai_presence_penalty: number;
        openai_top_p: number;
        openai_max_tokens: number;
        wrap_in_quotes: boolean;
        names_in_completion: boolean;
        openai_logit_bias: Record<string, number>;
        send_if_empty: string;
        impersonation_prompt: string;
        new_chat_prompt: string;
        new_group_chat_prompt: string;
        continue_nudge_prompt: string;
        bias_preset_selected: string;
        reverse_proxy_chat_completions: string;
    };
    claude_setting: {
        claude_key: string;
        claude_model: string;
        claude_temperature: number;
        claude_top_p: number;
        claude_top_k: number;
        claude_max_tokens: number;
    };
    prompts: {
        main: string;
        nsfw: string;
        jailbreak: string;
        impersonation: string;
        bias: string;
        [key: string]: string;
    };
    ui_mode: number;
    power_user: {
        tokenizer: number;
        token_padding: number;
        context_length: number;
        truncation_length: number;
        activation_regex: string;
        instruct: {
            enabled: boolean;
            preset: string;
            system_prompt: string;
            input_sequence: string;
            output_sequence: string;
            separator_sequence: string;
            wrap: boolean;
            macro: boolean;
            names: boolean;
        };
        sysprompt: {
            story: string;
            nsfw: string;
            roleplay: string;
        };
    };
    extension_settings: Record<string, any>;
}
export interface ImportResult {
    success: boolean;
    importedKeys: string[];
    skippedKeys: string[];
    errors: Array<{
        key: string;
        error: string;
    }>;
    conflictResolution?: 'overwrite' | 'skip' | 'merge';
}
export interface ExportOptions {
    categories?: string[];
    includeSecrets?: boolean;
    format?: 'json' | 'yaml';
    minify?: boolean;
}
export interface CompatibilityCheck {
    compatible: boolean;
    version: string;
    missingFeatures: string[];
    deprecatedSettings: string[];
    migrationRequired: boolean;
    recommendations: string[];
}
export declare class SillyTavernService {
    private readonly formatMappings;
    /**
     * Import SillyTavern configuration
     */
    importConfig(userId: string, sillyTavernConfig: Partial<SillyTavernConfig>, options?: {
        conflictResolution?: 'overwrite' | 'skip' | 'merge';
        validateCompatibility?: boolean;
        createBackup?: boolean;
    }): Promise<ImportResult>;
    /**
     * Export configuration to SillyTavern format
     */
    exportConfig(userId: string, options?: ExportOptions): Promise<Partial<SillyTavernConfig>>;
    /**
     * Import character from SillyTavern format
     */
    importCharacter(userId: string, characterData: any): Promise<{
        success: boolean;
        characterId?: string;
        error?: string;
    }>;
    /**
     * Export character to SillyTavern format
     */
    exportCharacter(characterId: string): Promise<any>;
    /**
     * Check compatibility with SillyTavern configuration
     */
    checkCompatibility(sillyTavernConfig: Partial<SillyTavernConfig>): Promise<CompatibilityCheck>;
    private convertFromSillyTavern;
    private convertToSillyTavern;
    private flattenObject;
    private getNestedValue;
    private setNestedValue;
    private hasNestedKey;
    private isObject;
    private removeSecrets;
    private isSupportedExtension;
    private createConfigBackup;
}
export declare const sillyTavernService: SillyTavernService;
//# sourceMappingURL=SillyTavernService.d.ts.map