export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    targetElement?: string;
    action?: string;
    validation?: string;
    skippable: boolean;
}
export interface TutorialConfig {
    id: string;
    name: string;
    description: string;
    steps: TutorialStep[];
    category: string;
    estimatedTime: number;
    requiredLevel?: number;
}
export interface TutorialProgressData {
    id: string;
    tutorialId: string;
    currentStep: number;
    totalSteps: number;
    completed: boolean;
    skipped: boolean;
    startedAt: Date;
    completedAt?: Date;
}
/**
 * TutorialService
 *
 * Manages in-app tutorial system and progress tracking.
 * Supports the onboarding and help system features.
 */
export declare class TutorialService {
    private tutorials;
    /**
     * Get available tutorials for a user
     */
    getTutorials(userId: string): Promise<TutorialConfig[]>;
    /**
     * Start a tutorial
     */
    startTutorial(userId: string, tutorialId: string): Promise<TutorialProgressData | null>;
    /**
     * Update tutorial progress
     */
    updateProgress(userId: string, tutorialId: string, step: number): Promise<TutorialProgressData | null>;
    /**
     * Complete a tutorial
     */
    completeTutorial(userId: string, tutorialId: string): Promise<boolean>;
    /**
     * Skip a tutorial
     */
    skipTutorial(userId: string, tutorialId: string): Promise<boolean>;
    /**
     * Get tutorial by ID
     */
    getTutorialById(tutorialId: string): TutorialConfig | null;
}
export declare const tutorialService: TutorialService;
//# sourceMappingURL=tutorial.service.d.ts.map