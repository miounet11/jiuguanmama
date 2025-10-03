export interface OnboardingStatus {
    completed: boolean;
    currentStep: number;
    totalSteps: number;
    selectedRole?: string;
    interests?: string[];
    mbtiType?: string;
}
export interface OnboardingStepData {
    stepId: string;
    data: Record<string, any>;
}
export interface CharacterRecommendation {
    characterId: string;
    name: string;
    description: string;
    matchScore: number;
    matchReason: string;
}
/**
 * OnboardingService
 *
 * Manages user onboarding flow, role selection, and personalized recommendations.
 * Implements F3 (Intelligent Onboarding) feature.
 */
export declare class OnboardingService {
    private readonly ONBOARDING_TUTORIAL_ID;
    private readonly TOTAL_STEPS;
    private mbtiCharacterMappings;
    /**
     * Start onboarding for a user
     */
    startOnboarding(userId: string): Promise<OnboardingStatus>;
    /**
     * Complete an onboarding step
     */
    completeStep(userId: string, stepData: OnboardingStepData): Promise<OnboardingStatus>;
    /**
     * Get personalized recommendations based on interests and MBTI
     */
    getRecommendations(userId: string, interests: string[], mbtiType?: string): Promise<CharacterRecommendation[]>;
    /**
     * Skip onboarding
     */
    skipOnboarding(userId: string): Promise<boolean>;
    /**
     * Store step data in user preferences
     */
    private storeStepData;
    /**
     * Complete onboarding and unlock achievement
     */
    private completeOnboarding;
}
export declare const onboardingService: OnboardingService;
//# sourceMappingURL=onboarding.service.d.ts.map